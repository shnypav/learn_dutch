/**
 * AI service for generating example sentences using Perplexity Search API
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

class AIHintService {
  private apiKey: string | null = null;
  private cache = new Map<string, string>();
  private readonly searchUrl = 'https://api.perplexity.ai/search';
  private readonly chatUrl = 'https://api.perplexity.ai/chat/completions';

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('AI Hint: API key set, length:', apiKey.length, 'starts with:', apiKey.substring(0, 10) + '...');
  }

  private getCacheKey(word: string, targetLang: 'dutch' | 'english'): string {
    return `${word}_${targetLang}`;
  }

  private cleanMarkdownFormatting(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')      // Remove *italic*
      .replace(/^["']|["']$/g, '')      // Remove surrounding quotes
      .trim();
  }

  private async searchForExamples(word: string, targetLang: 'dutch' | 'english'): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const searchQuery = targetLang === 'dutch' 
      ? `"${word}" Dutch sentence examples language learning`
      : `"${word}" English sentence examples usage`;

    console.log('AI Hint: Searching for examples with query:', searchQuery);

    try {
      const response = await fetch(this.searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          max_results: 3,
          max_tokens_per_page: 512,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search API Error Response:', errorText);
        throw new Error(`Search API request failed: ${response.status} ${response.statusText}`);
      }

      const data: PerplexitySearchResponse = await response.json();
      console.log('AI Hint: Search results received:', data);

      // Extract sentences that contain the word from search results
      const examples: string[] = [];
      for (const result of data.results) {
        const snippetSentences = result.snippet.split(/[.!?]+/).filter(sentence => 
          sentence.toLowerCase().includes(word.toLowerCase()) && sentence.length > 10
        ).map(sentence => this.cleanMarkdownFormatting(sentence));
        examples.push(...snippetSentences.slice(0, 2)); // Max 2 sentences per result
      }

      return examples.slice(0, 3); // Return max 3 examples
    } catch (error) {
      console.error('Search API error:', error);
      return [];
    }
  }

  async generateExampleSentence(
    word: string, 
    translation: string,
    targetLang: 'dutch' | 'english'
  ): Promise<string> {
    console.log('AI Hint: Generating example for word:', word, 'translation:', translation, 'targetLang:', targetLang);
    
    if (!this.apiKey) {
      console.error('AI Hint: No API key configured');
      throw new Error('API key not configured');
    }

    const cacheKey = this.getCacheKey(word, targetLang);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('AI Hint: Found in cache:', this.cache.get(cacheKey));
      return this.cache.get(cacheKey)!;
    }

    console.log('AI Hint: Not in cache, trying search API first...');

    try {
      // First try to find real-world examples using the search API
      const searchExamples = await this.searchForExamples(word, targetLang);
      
      if (searchExamples.length > 0) {
        // Clean up the first example and use it
        const bestExample = this.cleanMarkdownFormatting(searchExamples[0]);
        console.log('AI Hint: Found example from search:', bestExample);
        
        // Cache the result
        this.cache.set(cacheKey, bestExample);
        return bestExample;
      }

      console.log('AI Hint: No good examples found in search, falling back to chat completions...');
      
      // Fallback to chat completions API for generated examples
      const prompt = targetLang === 'dutch' 
        ? `Create a simple Dutch sentence using the word "${word}" (which means "${translation}" in English). Return only the sentence, nothing else. Make it beginner-friendly and practical.`
        : `Create a simple English sentence using the word "${word}" (which is "${translation}" in Dutch). Return only the sentence, nothing else. Make it beginner-friendly and practical.`;

      console.log('AI Hint: Using prompt:', prompt);

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
      console.log('AI Hint: Chat API Response received:', data);
      
      if (!data.choices || data.choices.length === 0) {
        console.error('AI Hint: No choices in response');
        throw new Error('No response from AI service');
      }

      const sentence = this.cleanMarkdownFormatting(data.choices[0].message.content);
      console.log('AI Hint: Generated sentence:', sentence);
      
      // Cache the result
      this.cache.set(cacheKey, sentence);
      
      return sentence;
    } catch (error) {
      console.error('AI service error:', error);
      // Return a simple fallback message without translation
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