/**
 * AI service for generating example sentences using Perplexity Search API
 * Enhanced with retry logic and smart fallback strategies
 * Note: Domain/recency filters documented but not yet available in API
 */

interface PerplexitySearchResult {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

interface PerplexitySearchResponse {
  results: PerplexitySearchResult[];
}

interface PerplexityResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
}

// Curated domain lists for quality language learning content
// Note: search_domain_filter not yet supported by Perplexity API (documented but unavailable)
// Keeping these for future use when the feature becomes available
/*
const DUTCH_LEARNING_DOMAINS = [
  'vandale.nl',           // Dutch dictionary
  'taalunie.org',         // Dutch language union
  'dutchgrammar.com',     // Learning resources
  'learndutch.org',
  'dutchpod101.com',
  'speakdutch.nl',
  'dutchreview.com',
  'dutchweekly.com'
];

const ENGLISH_LEARNING_DOMAINS = [
  'oxfordlearnersdictionaries.com',
  'cambridge.org',
  'merriam-webster.com',
  'vocabulary.com',
  'dictionary.com',
  'englishclub.com',
  'learnersdictionary.com'
];
*/

class AIHintService {
  private apiKey: string | null = null;
  private cache = new Map<string, string>();
  // Use proxy in development, direct URLs in production (requires backend)
  private readonly searchUrl = import.meta.env.DEV 
    ? '/api/perplexity/search' 
    : 'https://api.perplexity.ai/search';
  private readonly chatUrl = import.meta.env.DEV 
    ? '/api/perplexity/chat/completions' 
    : 'https://api.perplexity.ai/chat/completions';

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    // Clear cache when API key changes to get fresh results with new extraction logic
    this.clearCache();
    console.log('AI Hint: API key set, cache cleared for fresh results');
  }

  private getCacheKey(word: string, targetLang: 'dutch' | 'english'): string {
    return `${word}_${targetLang}`;
  }

  private cleanMarkdownFormatting(text: string): string {
    return text
      .replace(/^#+\s+/gm, '')           // Remove markdown headers (##, ###, etc.)
      .replace(/\*\*(.*?)\*\*/g, '$1')   // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')       // Remove *italic*
      .replace(/^["']|["']$/g, '')       // Remove surrounding quotes
      .replace(/^\s*[-*]\s+/gm, '')      // Remove list markers
      .replace(/^[)\]}\s]+/, '')         // Remove leading closing brackets/parens and whitespace
      .replace(/^[:;,.\s]+/, '')         // Remove leading punctuation and whitespace
      .trim();
  }

  /**
   * Extract just the example sentence from a response that might have labels/headers
   */
  private extractPureExample(text: string): string {
    const cleaned = this.cleanMarkdownFormatting(text);
    
    // If text contains "Example:" label, extract what comes after
    const exampleMatch = cleaned.match(/example[:\s]+(.+)/is);
    if (exampleMatch && exampleMatch[1]) {
      return exampleMatch[1].trim();
    }
    
    // Split into lines/sentences and find the first substantial one
    const lines = cleaned
      .split(/[\n.!?]+/)  // Split by newlines and sentence endings
      .map(line => line.trim())
      .filter(line => {
        const lower = line.toLowerCase();
        return (
          line.length > 15 && 
          line.split(' ').length >= 4 &&     // At least 4 words
          !line.match(/^#+/) &&              // Not a markdown header
          !lower.startsWith('example') &&
          !lower.startsWith('usage') &&      // Filter "Usages of..."
          !lower.includes('meaning') &&      // Filter "meanings in..."
          !lower.match(/^\w+\s+of\s+\w+/i)   // Filter "Usages of X" pattern
        );
      });
    
    return lines[0] || cleaned;
  }

  /**
   * Retry logic with exponential backoff for rate limiting
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        const isRateLimit = error instanceof Error && 
          (error.message?.includes('rate limit') || error.message?.includes('429'));
        
        if (isRateLimit && attempt < maxRetries - 1) {
          // Exponential backoff with jitter
          const delay = (2 ** attempt) * 1000 + Math.random() * 1000;
          console.log(`AI Hint: Rate limited, retrying in ${delay.toFixed(0)}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Check if text is actually a proper sentence (not metadata, copyright, etc.)
   */
  private isProperSentence(text: string): boolean {
    const lower = text.toLowerCase();
    
    // Filter out common non-sentence patterns
    if (
      lower.includes('©') ||
      lower.includes('copyright') ||
      lower.match(/^\d{4}[-/]\d{4}/) ||  // Year ranges like "2023-2024"
      lower.match(/issn|doi|isbn/) ||     // Journal identifiers
      lower.includes('all rights reserved') ||
      lower.includes('published by') ||
      lower.match(/^\d+\.\d+\.\d+/) ||    // Version numbers, ISSNs
      lower.match(/vol\.|volume|issue|pp\.|page/) || // Journal metadata
      lower.startsWith('http') ||
      lower.includes('terms of use') ||
      lower.match(/^translate\s+(from|to|the|this|into)/i) || // Translation instructions
      lower.startsWith('translate:') ||
      lower.includes('vertaal') ||        // Dutch for "translate"
      lower.includes('translation:')
    ) {
      console.log('AI Hint: ⛔ Rejecting non-sentence (metadata/instruction):', text);
      return false;
    }
    
    // Must have at least one common verb or sentence structure
    // Common Dutch/English verbs that indicate it's a real sentence
    const hasCommonWords = /\b(is|are|was|were|has|have|had|do|does|did|can|could|will|would|be|been|being|ik|je|hij|zij|het|wij|jullie|ben|bent|zijn|heeft|had|kan|moet|wil|gaan|komt)\b/i.test(lower);
    
    if (!hasCommonWords) {
      console.log('AI Hint: ⛔ Rejecting text without verb/subject structure:', text);
      return false;
    }
    
    return true;
  }

  /**
   * Check if a sentence is simple enough for A2 level learners
   */
  private isSimpleEnough(sentence: string): boolean {
    const words = sentence.split(/\s+/);
    const wordCount = words.length;
    
    // Too many words = too complex
    if (wordCount > 15) return false;
    
    // Check average word length (simpler words are shorter)
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount;
    if (avgWordLength > 8) return false; // Complex/technical words
    
    // Count words that are very long (likely complex)
    const longWords = words.filter(w => w.length > 10).length;
    if (longWords > 2) return false;
    
    return true;
  }

  /**
   * Extract quality sentences from search results
   */
  private extractSentencesFromResults(
    results: PerplexitySearchResult[],
    word: string,
    maxSentences: number = 3
  ): string[] {
    const examples: string[] = [];
    
    for (const result of results) {
      if (!result.snippet) continue;

      // Clean markdown first, then split by sentence endings
      const cleanedSnippet = this.cleanMarkdownFormatting(result.snippet);
      
      const snippetSentences = cleanedSnippet
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(sentence => {
          const lower = sentence.toLowerCase();
          const wordLower = word.toLowerCase();
          const wordCount = sentence.split(/\s+/).length;
          
          // Filter out headers, labels, and noise
          const isNoise = 
            lower.includes('cookie') ||
            lower.includes('privacy') ||
            lower.includes('subscribe') ||
            lower.startsWith('example:') ||
            lower.startsWith('example') ||
            lower.match(/^#+\s/) ||           // Markdown headers
            lower.length < 15 ||              // Too short
            lower.length > 150 ||             // Too long
            !lower.includes(wordLower) ||     // Doesn't contain target word
            wordCount < 4 ||                  // Less than 4 words
            wordCount > 15;                   // Too many words (complex)
          
          // Must be a proper sentence (not metadata/copyright)
          if (!isNoise && !this.isProperSentence(sentence)) {
            return false;
          }
          
          // Check if sentence is simple enough for A2 level
          if (!isNoise && !this.isSimpleEnough(sentence)) {
            console.log('AI Hint: ⚠️ Rejecting complex sentence:', sentence);
            return false;
          }
          
          return !isNoise;
        });

      examples.push(...snippetSentences.slice(0, 2)); // Max 2 per result
      
      if (examples.length >= maxSentences) break;
    }

    return examples.slice(0, maxSentences);
  }

  /**
   * Search for real-world examples using Perplexity Search API
   * Note: Advanced filters (domain, recency) not yet supported despite documentation
   */
  private async searchForExamples(
    word: string, 
    targetLang: 'dutch' | 'english'
  ): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const searchQuery = targetLang === 'dutch' 
      ? `"${word}" simple Dutch sentence A2 beginner level example`
      : `"${word}" simple English sentence beginner A2 level example`;

    console.log('AI Hint: Searching with enhanced filters for:', word);

    try {
      return await this.withRetry(async () => {
        // Primary search - domain and recency filters not yet supported by API
        const response = await fetch(this.searchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            query: searchQuery,
            max_results: 5,
            max_tokens_per_page: 512,
            // Note: search_domain_filter and search_recency_filter documented but not yet available
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Search API Error Response:', errorText);
          throw new Error(`Search API request failed: ${response.status} ${response.statusText}`);
        }

        const data: PerplexitySearchResponse = await response.json();
        console.log('AI Hint: Search API returned', data.results?.length || 0, 'raw results');

        if (!data.results || data.results.length === 0) {
          console.log('AI Hint: No raw results from API, trying broader search...');
          
          // Fallback: retry with alternate query phrasing
          const broaderResponse = await fetch(this.searchUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              query: `${word} simple ${targetLang} sentence A2 beginner example`,
              max_results: 5,
              max_tokens_per_page: 512,
            }),
          });

          if (!broaderResponse.ok) {
            return [];
          }

          const broaderData: PerplexitySearchResponse = await broaderResponse.json();
          console.log('AI Hint: Broader search returned', broaderData.results?.length || 0, 'raw results');
          const broaderExamples = this.extractSentencesFromResults(broaderData.results || [], word);
          console.log('AI Hint: After filtering, extracted', broaderExamples.length, 'A2-level examples');
          return broaderExamples;
        }

        const extractedExamples = this.extractSentencesFromResults(data.results, word);
        console.log('AI Hint: After A2-level filtering, extracted', extractedExamples.length, 'usable examples');
        return extractedExamples;
      });
    } catch (error) {
      console.error('Search API error:', error);
      return [];
    }
  }

  /**
   * Fallback to chat completions for generated examples
   */
  private async generateWithChat(
    word: string,
    translation: string,
    targetLang: 'dutch' | 'english'
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const prompt = targetLang === 'dutch' 
      ? `Create a very simple Dutch sentence for A2 level learners using the word "${word}" (which means "${translation}" in English). 
         Requirements:
         - Use simple, common vocabulary only
         - Maximum 8-10 words
         - Present tense when possible
         - Everyday context (not technical or complex topics)
         Return ONLY the sentence, nothing else.`
      : `Create a very simple English sentence for A2 level learners using the word "${word}" (which is "${translation}" in Dutch).
         Requirements:
         - Use simple, common vocabulary only
         - Maximum 8-10 words
         - Present tense when possible
         - Everyday context (not technical or complex topics)
         Return ONLY the sentence, nothing else.`;

    console.log('AI Hint: Generating with chat completions...');

    return await this.withRetry(async () => {
      const response = await fetch(this.chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat API Error Response:', errorText);
        throw new Error(`Chat API request failed: ${response.status} ${response.statusText}`);
      }

      const data: PerplexityResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI service');
      }

      return this.cleanMarkdownFormatting(data.choices[0].message.content);
    });
  }

  /**
   * Main method: Generate example sentence with hybrid approach
   */
  async generateExampleSentence(
    word: string, 
    translation: string,
    targetLang: 'dutch' | 'english'
  ): Promise<string> {
    console.log('AI Hint: Generating example for word:', word, 'translation:', translation);
    
    if (!this.apiKey) {
      console.error('AI Hint: No API key configured');
      throw new Error('API key not configured');
    }

    const cacheKey = this.getCacheKey(word, targetLang);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('AI Hint: Found in cache');
      return this.cache.get(cacheKey)!;
    }

    try {
      // Strategy 1: Search for real-world examples (preferred)
      const searchExamples = await this.searchForExamples(word, targetLang);
      
      if (searchExamples.length > 0) {
        // Extract pure example from potentially formatted response
        const rawExample = searchExamples[0];
        const cleanedExample = this.extractPureExample(rawExample);
        console.log('AI Hint: ✅ Using search result');
        console.log('  Raw:', rawExample);
        console.log('  Cleaned:', cleanedExample);
        this.cache.set(cacheKey, cleanedExample);
        return cleanedExample;
      }

      console.log('AI Hint: ❌ No A2-level examples found in search results (all too complex)');
      console.log('AI Hint: 🤖 Falling back to AI generation...');
      
      // Strategy 2: Generate with chat completions (fallback)
      const generatedSentence = await this.generateWithChat(word, translation, targetLang);
      const cleanedSentence = this.extractPureExample(generatedSentence);
      console.log('AI Hint: Raw generation:', generatedSentence);
      console.log('AI Hint: Cleaned to:', cleanedSentence);
      
      this.cache.set(cacheKey, cleanedSentence);
      return cleanedSentence;
      
    } catch (error) {
      console.error('AI service error:', error);
      
      // Final fallback: friendly error message
      return targetLang === 'dutch' 
        ? `Helaas, een voorbeeld zin kan niet worden gegenereerd.`
        : `Sorry, unable to generate an example sentence.`;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const aiHintService = new AIHintService();