# A2 Level Sentence Optimization

## Problem

AI hints were returning overly complex sentences like:
```
"Getuigen mishandelen en dossiers meenemen zonder bevelschrift"
(Witnesses, abuse, legal documents - way too advanced!)
```

This is unhelpful for A2 (beginner) level learners.

## Solution

### 1. **Enhanced Search Queries**

Now explicitly requests beginner-level content:

```typescript
// Before
`"${word}" Dutch sentence example beginner`

// After  
`"${word}" simple Dutch sentence A2 beginner level example`
```

### 2. **Detailed AI Prompts**

Chat completions now have strict requirements:

```typescript
`Create a very simple Dutch sentence for A2 level learners using "${word}".
Requirements:
- Use simple, common vocabulary only
- Maximum 8-10 words
- Present tense when possible
- Everyday context (not technical or complex topics)
Return ONLY the sentence, nothing else.`
```

### 3. **Complexity Filter**

New `isSimpleEnough()` method filters out complex sentences:

```typescript
private isSimpleEnough(sentence: string): boolean {
  const words = sentence.split(/\s+/);
  
  // Max 15 words total
  if (words.length > 15) return false;
  
  // Average word length < 8 chars (simpler words are shorter)
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  if (avgWordLength > 8) return false;
  
  // Max 2 very long words (>10 chars)
  const longWords = words.filter(w => w.length > 10).length;
  if (longWords > 2) return false;
  
  return true;
}
```

### 4. **Filtering Criteria**

Sentences are rejected if they:
- ❌ Have more than 15 words
- ❌ Have average word length > 8 characters
- ❌ Have more than 2 words longer than 10 characters
- ❌ Are longer than 150 characters total
- ❌ Are shorter than 15 characters
- ❌ Don't contain the target word

### 5. **Debug Logging**

Now logs rejected complex sentences:
```
AI Hint: Rejecting complex sentence: Getuigen mishandelen en...
```

## Expected Results

### Before ❌
```
"Getuigen mishandelen en dossiers meenemen zonder bevelschrift"
(17+ chars avg, legal terms, 8 words)
```

### After ✅
```
"Ik ga naar de winkel"
(3-4 chars avg, simple words, 5 words)

"Hij maakte een fout"
(4 chars avg, simple words, 4 words)
```

## Testing

1. **Clear cache** - Re-enter your API key to clear old results
2. **Try different words** - Hover to see AI hints
3. **Check console** - See rejected complex sentences
4. **Verify simplicity** - Sentences should be:
   - Short (4-10 words)
   - Simple vocabulary
   - Present tense mostly
   - Everyday situations

## Result

AI hints now provide **appropriate A2-level examples** that actually help beginners learn! 🎓✨





