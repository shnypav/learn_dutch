# AI Hint Service Improvements

## Overview
Enhanced the Perplexity Search API integration with modern best practices from the official documentation.

## Changes Implemented

### 1. **Domain Filtering for Higher Quality Examples** ⚠️ NOT YET AVAILABLE
- Prepared curated lists of authoritative language learning sites for future use
- **Dutch domains**: vandale.nl, taalunie.org, dutchgrammar.com, learndutch.org, etc.
- **English domains**: oxfordlearnersdictionaries.com, cambridge.org, merriam-webster.com, etc.
- **Note**: `search_domain_filter` is documented but returns 400 error "not yet supported"
- Will automatically work once Perplexity enables this feature

### 2. **Recency Filtering** ⚠️ NOT YET AVAILABLE
- Prepared `search_recency_filter: 'month'` parameter for future use
- **Note**: Feature is documented but returns 400 error "not yet supported"
- Waiting for Perplexity to enable this API feature

### 3. **Enhanced Retry Logic with Exponential Backoff**
- Implemented `withRetry<T>()` method for handling rate limits
- Exponential backoff: 1s → 2s → 4s delays
- Added jitter (random delay) to prevent thundering herd
- Automatically retries up to 3 times on rate limit errors

### 4. **Improved Sentence Extraction**
- Added quality filters:
  - Length checks (10-200 characters)
  - Noise filtering (removes "cookie", "privacy", "subscribe" sentences)
  - Better relevance scoring
- Extracts max 2 sentences per search result
- Returns top 3 most relevant examples

### 5. **Better Error Handling**
- Graceful fallbacks at each stage:
  1. Domain-filtered search
  2. Broader search (without domain filter)
  3. AI-generated sentence (chat completions)
  4. Friendly error message
- Proper TypeScript error typing with `unknown` type

### 6. **Code Quality Improvements**
- Fixed unused imports in `App.tsx`, `AIHintPopup.tsx`, and `storage.ts`
- Added comprehensive JSDoc comments
- Improved logging for debugging
- Better type safety throughout

## API Parameters Used

```typescript
{
  query: searchQuery,
  max_results: 5,                      // Increased from 3
  max_tokens_per_page: 512,
  // Note: search_domain_filter - documented but not yet available (400 error)
  // Note: search_recency_filter - documented but not yet available (400 error)
  // Note: return_snippets - not needed, snippets returned by default
}
```

## ⚠️ Documentation vs Reality

The Perplexity documentation shows these advanced filters, but the API currently returns:
```json
{
  "error": {
    "message": "The following filters are not yet supported: search_domain_filter, search_recency_filter",
    "type": "forbidden_filters",
    "code": 400
  }
}
```

Domain lists are prepared in the code for future use when Perplexity enables these features.

## Benefits

1. **Better Quality**: Examples come from authoritative sources
2. **Modern Language**: Recent content reflects current usage
3. **More Reliable**: Retry logic handles rate limits gracefully
4. **Cleaner Results**: Filters out irrelevant content
5. **Fallback Strategy**: Multiple layers ensure users always get something useful

## Testing Recommendations

1. Test with various Dutch words (common and rare)
2. Verify domain-filtered results are higher quality
3. Test fallback behavior when domain search returns nothing
4. Verify rate limiting with rapid consecutive requests
5. Check cache effectiveness

## Future Enhancements (Optional)

- Multi-query search for better coverage
- Consider Perplexity's Grounded LLM API (when available in TypeScript)
- A/B test different domain lists
- Add user feedback mechanism for example quality
- Implement example voting/rating system

## References

- [Perplexity Search API Docs](https://docs.perplexity.ai/guides/search-guide)
- [Best Practices](https://docs.perplexity.ai/guides/search-best-practices)
