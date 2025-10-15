// Simple test to verify word loading logic
// Run this in browser console to debug

async function testWordLoading() {
  console.log("🧪 Testing Word Loading Logic...");

  // Test CSV parsing
  const csvPath = "/data/dutch_common_words.csv";
  const response = await fetch(csvPath);
  const csvText = await response.text();
  console.log("📄 Raw CSV first 3 lines:", csvText.split("\n").slice(0, 3));

  // Test Papa Parse
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.toLowerCase().trim(),
  });

  console.log("📊 Parsed CSV headers:", Object.keys(parsed.data[0] || {}));
  console.log("📊 First 5 parsed rows:", parsed.data.slice(0, 5));

  // Test our mapping logic
  const wordPairs = parsed.data
    .map((row) => {
      const knownValue = row.known?.toString().toLowerCase().trim();
      const isKnown = knownValue === "true" || knownValue === "1";

      return {
        dutch: row.dutch?.trim() || "",
        english: row.english?.trim() || "",
        known: isKnown,
      };
    })
    .filter((pair) => pair.dutch && pair.english);

  console.log("🔍 After mapping - first 5:", wordPairs.slice(0, 5));
  console.log("📈 Total words:", wordPairs.length);
  console.log("✅ Known words:", wordPairs.filter((w) => w.known).length);
  console.log("❌ Unknown words:", wordPairs.filter((w) => !w.known).length);

  // Test localStorage
  console.log(
    "💾 LocalStorage known words:",
    JSON.parse(localStorage.getItem("dutch-learning-known-words") || "[]"),
  );

  return {
    totalWords: wordPairs.length,
    knownWords: wordPairs.filter((w) => w.known).length,
    unknownWords: wordPairs.filter((w) => !w.known).length,
    firstFiveWords: wordPairs.slice(0, 5),
  };
}

// Auto-run if Papa is available
if (typeof Papa !== "undefined") {
  testWordLoading()
    .then((result) => {
      console.log("🎯 Test Results:", result);
    })
    .catch((error) => {
      console.error("❌ Test Failed:", error);
    });
} else {
  console.log(
    "⚠️ Papa Parse not loaded. Run testWordLoading() manually after page loads.",
  );
}
