//
//  CSVParser.swift
//  DutchLearner
//
//  CSV data parsing utility
//

import Foundation

public enum CSVParserError: Error {
    case fileNotFound(String)
    case invalidFormat(String)
    case encodingError
}

public class CSVParser {
    /// Parse CSV file and return array of dictionaries with column headers as keys
    public static func parse(fileName: String, bundle: Bundle = .main) throws -> [[String: String]] {
        guard let url = bundle.url(forResource: fileName, withExtension: "csv") else {
            throw CSVParserError.fileNotFound("File \(fileName).csv not found in bundle")
        }

        guard let content = try? String(contentsOf: url, encoding: .utf8) else {
            throw CSVParserError.encodingError
        }

        return try parseString(content)
    }

    /// Parse CSV string content
    public static func parseString(_ content: String) throws -> [[String: String]] {
        let lines = content.components(separatedBy: .newlines).filter { !$0.isEmpty }

        guard !lines.isEmpty else {
            throw CSVParserError.invalidFormat("CSV file is empty")
        }

        // Parse header row
        let headers = parseCSVLine(lines[0])

        guard !headers.isEmpty else {
            throw CSVParserError.invalidFormat("CSV header is empty or invalid")
        }

        // Parse data rows
        var results: [[String: String]] = []

        for i in 1..<lines.count {
            let values = parseCSVLine(lines[i])

            // Skip rows with fewer values than headers
            guard values.count == headers.count else { continue }

            var row: [String: String] = [:]
            for (index, header) in headers.enumerated() {
                row[header] = values[index].trimmingCharacters(in: .whitespaces)
            }
            results.append(row)
        }

        return results
    }

    /// Parse a single CSV line, handling quoted values
    private static func parseCSVLine(_ line: String) -> [String] {
        var result: [String] = []
        var currentField = ""
        var insideQuotes = false

        for char in line {
            if char == "\"" {
                insideQuotes.toggle()
            } else if char == "," && !insideQuotes {
                result.append(currentField)
                currentField = ""
            } else {
                currentField.append(char)
            }
        }

        // Add the last field
        result.append(currentField)

        return result
    }

    /// Load words from CSV file
    public static func loadWords(fileName: String = "dutch_common_words", bundle: Bundle = .main) throws -> [WordPair] {
        let rows = try parse(fileName: fileName, bundle: bundle)
        return rows.compactMap { WordPair.from(csvRow: $0) }
    }

    /// Load verbs from CSV file
    public static func loadVerbs(fileName: String = "dutch_irregular_verbs", bundle: Bundle = .main) throws -> [VerbPair] {
        let rows = try parse(fileName: fileName, bundle: bundle)
        return rows.compactMap { VerbPair.from(csvRow: $0) }
    }
}
