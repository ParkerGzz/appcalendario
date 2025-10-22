# TaskClassifier Quick Test Guide

## Purpose

This guide walks you through testing the TaskClassifier to ensure it's working correctly before integrating it into your app.

## Setup

Before testing, make sure you have both files in place:

```
src/classifier/
├── taskClassifier.js
├── keywords.js
├── IMPLEMENTATION-GUIDE.md
└── QUICK-TEST.md (this file)
```

## Test 1: Basic Classifier Instantiation

### In Browser Console:

```javascript
// Create a new classifier instance
const classifier = new TaskClassifier();
console.log('Classifier created:', classifier);
console.log('Has keywords:', !!classifier.keywords);
console.log('Has exclusionWords:', !!classifier.exclusionWords);
```

**Expected Output:**
```
Classifier created: TaskClassifier { keywords: {...}, exclusionWords: [...] }
Has keywords: true
Has exclusionWords: true
```

**Status:** ✅ Pass / ❌ Fail

---

## Test 2: Load External Keywords

### In Browser Console:

```javascript
// Load the comprehensive keywords from keywords.js
const classifier = new TaskClassifier();
const keywordsLoaded = classifier.loadKeywords(CLASSIFIER_KEYWORDS);
console.log('Keywords loaded:', keywordsLoaded);

// Check statistics
const stats = classifier.getStatistics();
console.log('Statistics:', stats);
```

**Expected Output:**
```
Keywords loaded: true
Statistics: {
  totalCategories: 3,
  categories: {
    fitness: 52,
    shopping_lider: 30,
    pharmacy: 40
  },
  totalKeywords: 122
}
```

**Status:** ✅ Pass / ❌ Fail

---

## Test 3: Fitness Task Classification

### Test Case 3.1: Clear Fitness Task

```javascript
const result = taskClassifier.classify('Ir al gimnasio');
console.log('Test 3.1 - "Ir al gimnasio":', result);
```

**Expected:**
- `category`: 'fitness'
- `confidence`: > 0 (should be around 0.04-0.05)
- `matches`: contains 'gym' and/or 'gimnasio'

### Test Case 3.2: Another Fitness Task

```javascript
const result = taskClassifier.classify('Entrenar con pesas');
console.log('Test 3.2 - "Entrenar con pesas":', result);
```

**Expected:**
- `category`: 'fitness'
- `confidence`: > 0.08 (two matches)
- `matches`: contains 'entrenar' and 'pesas'

### Test Case 3.3: Multiple Fitness Keywords

```javascript
const result = taskClassifier.classify('Correr en la mañana para hacer cardio');
console.log('Test 3.3 - "Correr en la mañana para hacer cardio":', result);
```

**Expected:**
- `category`: 'fitness'
- `confidence`: > 0.05
- `matches`: contains 'correr' and 'cardio'

**Status:** ✅ Pass / ❌ Fail

---

## Test 4: Shopping Task Classification

### Test Case 4.1: Clear Shopping Task

```javascript
const result = taskClassifier.classify('Ir de compras al Lider');
console.log('Test 4.1 - "Ir de compras al Lider":', result);
```

**Expected:**
- `category`: 'shopping_lider'
- `confidence`: > 0 (should be around 0.06-0.10)
- `matches`: contains 'compras' and/or 'lider'

### Test Case 4.2: Shopping with Grocery Words

```javascript
const result = taskClassifier.classify('Comprar comida y abarrotes');
console.log('Test 4.2 - "Comprar comida y abarrotes":', result);
```

**Expected:**
- `category`: 'shopping_lider'
- `confidence`: > 0.10
- `matches`: contains multiple shopping keywords

**Status:** ✅ Pass / ❌ Fail

---

## Test 5: Pharmacy Task Classification

### Test Case 5.1: Clear Pharmacy Task

```javascript
const result = taskClassifier.classify('Ir a la farmacia');
console.log('Test 5.1 - "Ir a la farmacia":', result);
```

**Expected:**
- `category`: 'pharmacy'
- `confidence`: > 0
- `matches`: contains 'farmacia'

### Test Case 5.2: Medication Task

```javascript
const result = taskClassifier.classify('Comprar remedio y vitaminas');
console.log('Test 5.2 - "Comprar remedio y vitaminas":', result);
```

**Expected:**
- `category`: 'pharmacy'
- `confidence`: > 0.05
- `matches`: contains 'remedio' and 'vitaminas'

### Test Case 5.3: Specific Medication (Chile-specific)

```javascript
const result = taskClassifier.classify('Comprar Ibupirac en farmacia');
console.log('Test 5.3 - "Comprar Ibupirac en farmacia":', result);
```

**Expected:**
- `category`: 'pharmacy'
- `confidence`: > 0.05
- `matches`: contains 'ibupirac' and 'farmacia'

**Status:** ✅ Pass / ❌ Fail

---

## Test 6: General Task Classification

### Test Case 6.1: Non-Categorized Task

```javascript
const result = taskClassifier.classify('Llamar a un amigo');
console.log('Test 6.1 - "Llamar a un amigo":', result);
```

**Expected:**
- `category`: 'general'
- `confidence`: 0
- `matches`: [] (empty)

### Test Case 6.2: Ambiguous Task

```javascript
const result = taskClassifier.classify('Ir a la tienda');
console.log('Test 6.2 - "Ir a la tienda":', result);
```

**Expected:**
- `category`: 'shopping_lider' (might match 'tienda')
- OR `category`: 'general' if 'tienda' isn't in keywords

**Status:** ✅ Pass / ❌ Fail

---

## Test 7: Multi-Category Matching

### Test Case 7.1: Task Matching Multiple Categories

```javascript
const result = taskClassifier.classify('Comprar medicinas en Lider');
console.log('Test 7.1 - "Comprar medicinas en Lider":', result);
```

**Expected:**
- `category`: Either 'pharmacy' or 'shopping_lider'
- `confidence`: > 0.05
- The classifier should pick the category with HIGHEST confidence
- In this case: pharmacy (has 2 matches: 'medicinas') vs shopping (has 2 matches: 'comprar', 'lider')
- Should pick 'pharmacy' because it's a more specific match

**Status:** ✅ Pass / ❌ Fail

---

## Test 8: Case Insensitivity

### Test Case 8.1: Uppercase Task

```javascript
const result = taskClassifier.classify('IR AL GIMNASIO');
console.log('Test 8.1 - "IR AL GIMNASIO":', result);
```

**Expected:**
- Same as "Ir al gimnasio"
- `category`: 'fitness'

### Test Case 8.2: Mixed Case

```javascript
const result = taskClassifier.classify('iR aL GiMnAsiO');
console.log('Test 8.2 - "iR aL GiMnAsiO":', result);
```

**Expected:**
- Same classification as Test 8.1

**Status:** ✅ Pass / ❌ Fail

---

## Test 9: Add Custom Keyword

```javascript
// Add a new keyword
const added = taskClassifier.addKeyword('fitness', 'parkour');
console.log('Keyword added:', added); // Should be true

// Try again (should fail - already exists)
const addedAgain = taskClassifier.addKeyword('fitness', 'parkour');
console.log('Keyword added again:', addedAgain); // Should be false

// Now test classification with new keyword
const result = taskClassifier.classify('Hacer parkour');
console.log('Classification with new keyword:', result);
```

**Expected:**
- First add: true
- Second add: false (already exists)
- Classification: category='fitness', matches includes 'parkour'

**Status:** ✅ Pass / ❌ Fail

---

## Test 10: Remove Keyword

```javascript
// Remove a keyword
const removed = taskClassifier.removeKeyword('fitness', 'gym');
console.log('Keyword removed:', removed); // Should be true

// Try again (should fail - already removed)
const removedAgain = taskClassifier.removeKeyword('fitness', 'gym');
console.log('Keyword removed again:', removedAgain); // Should be false

// Verify it's gone
const result = taskClassifier.classify('Ir al gym');
console.log('Classification without "gym":', result);
```

**Expected:**
- First remove: true
- Second remove: false (not found)
- Classification: might not match 'fitness' anymore if 'gym' was the only match

**Status:** ✅ Pass / ❌ Fail

---

## Test 11: Add New Category

```javascript
// Add a new category
const added = taskClassifier.addCategory('work', [
  'trabajo',
  'reunión',
  'proyecto',
  'email'
]);
console.log('Category added:', added); // Should be true

// Try again (should fail - already exists)
const addedAgain = taskClassifier.addCategory('work', []);
console.log('Category added again:', addedAgain); // Should be false

// Test classification with new category
const result = taskClassifier.classify('Reunión de trabajo');
console.log('Classification with new category:', result);

// Check updated statistics
const stats = taskClassifier.getStatistics();
console.log('Updated statistics:', stats);
```

**Expected:**
- First add: true
- Second add: false
- Classification: category='work', confidence > 0, matches includes 'reunión'
- Statistics: totalCategories should be 4 (fitness + shopping_lider + pharmacy + work)

**Status:** ✅ Pass / ❌ Fail

---

## Test 12: Export and Import

```javascript
// Create a classifier with custom keywords
const classifier1 = new TaskClassifier();
classifier1.addKeyword('fitness', 'parkour');
classifier1.addCategory('sports', ['fútbol', 'basketball']);

// Export as JSON
const json = classifier1.toJSON();
console.log('Exported JSON:', json);
console.log('JSON length:', json.length, 'characters');

// Create new classifier and import
const classifier2 = new TaskClassifier();
const imported = classifier2.fromJSON(json);
console.log('Import successful:', imported); // Should be true

// Verify imported keywords work
const result = classifier2.classify('Parkour session');
console.log('Classification after import:', result);
```

**Expected:**
- Export: Should return valid JSON string with keywords and statistics
- Import: Should return true
- Classification: Should match 'parkour' even in new classifier instance

**Status:** ✅ Pass / ❌ Fail

---

## Test 13: Performance Test

```javascript
// Test classification speed
const iterations = 1000;
const testTasks = [
  'Ir al gimnasio',
  'Compras en Lider',
  'Farmacia',
  'Llamar amigo',
  'Correr 5km'
];

console.time('1000 classifications');

for (let i = 0; i < iterations; i++) {
  const task = testTasks[i % testTasks.length];
  taskClassifier.classify(task);
}

console.timeEnd('1000 classifications');
```

**Expected:**
- Should complete in < 100ms for 1000 classifications
- Typical: 10-30ms for 1000 classifications

**Status:** ✅ Pass / ❌ Fail

---

## Test 14: Edge Cases

### Test Case 14.1: Empty String

```javascript
const result = taskClassifier.classify('');
console.log('Empty string:', result);
```

**Expected:**
- `category`: 'general'
- `confidence`: 0
- `matches`: []

### Test Case 14.2: Null Input

```javascript
const result = taskClassifier.classify(null);
console.log('Null input:', result);
```

**Expected:**
- `category`: 'general'
- `confidence`: 0
- `matches`: []

### Test Case 14.3: Whitespace Only

```javascript
const result = taskClassifier.classify('   ');
console.log('Whitespace only:', result);
```

**Expected:**
- `category`: 'general'
- `confidence`: 0
- `matches`: []

### Test Case 14.4: Very Long Task Name

```javascript
const longName = 'Ir al gimnasio a entrenar con pesas y hacer cardio' + ' más' .repeat(20);
const result = taskClassifier.classify(longName);
console.log('Long task name:', result);
console.log('Matches found:', result.matches.length);
```

**Expected:**
- Should still classify correctly
- `category`: 'fitness'
- Multiple matches from all the fitness keywords

**Status:** ✅ Pass / ❌ Fail

---

## Test 15: Confidence Scoring

```javascript
// Compare confidence scores across different match counts
const tests = [
  'gym',                                // 1 match
  'Ir al gym',                          // 1 match
  'Ir al gimnasio',                     // 2 matches
  'Entrenar gym gimnasio',              // 3 matches
  'Entrenar pesas cardio gym gimnasio'  // 5 matches
];

console.log('Confidence Score Progression:');
tests.forEach(task => {
  const result = taskClassifier.classify(task);
  console.log(`"${task}" → confidence: ${result.confidence}, matches: ${result.matches.length}`);
});
```

**Expected:**
- Confidence should increase as more keywords match
- Score should be proportional to number of matches
- Formula: matches / total_keywords_in_category

**Status:** ✅ Pass / ❌ Fail

---

## Summary Checklist

Copy and paste this to check off all tests:

```markdown
## TaskClassifier Test Results

- [ ] Test 1: Basic instantiation
- [ ] Test 2: Load external keywords
- [ ] Test 3: Fitness classification
- [ ] Test 4: Shopping classification
- [ ] Test 5: Pharmacy classification
- [ ] Test 6: General classification
- [ ] Test 7: Multi-category matching
- [ ] Test 8: Case insensitivity
- [ ] Test 9: Add custom keyword
- [ ] Test 10: Remove keyword
- [ ] Test 11: Add new category
- [ ] Test 12: Export/Import
- [ ] Test 13: Performance
- [ ] Test 14: Edge cases
- [ ] Test 15: Confidence scoring

**Overall Status:** ✅ Pass / ❌ Fail

**Issues Found:**
(List any failures here)

**Next Steps:**
(What to do next)

**Date:** October 22, 2025
**Tested By:** (Your name)
```

---

## Troubleshooting

### Issue: "CLASSIFIER_KEYWORDS is not defined"

**Solution:** Make sure keywords.js is loaded first:
```html
<script src="src/classifier/keywords.js"></script>
<script src="src/classifier/taskClassifier.js"></script>
```

### Issue: Classifier returns "general" for known task

**Possible Causes:**
1. Keywords not loaded: Call `loadKeywords(CLASSIFIER_KEYWORDS)`
2. Keyword doesn't exist: Check spelling in keywords.js
3. Different keyword form: "gimnasio" vs "gym" (both exist, should work)

### Issue: Confidence score is too low

**Explanation:**
Confidence = matches / total_keywords
- Fitness has 52 keywords, so 1 match = 1.9%
- This is by design - only show high confidence when multiple keywords match

### Issue: "TypeError: classifier.classify is not a function"

**Solution:** Make sure classifier is instantiated:
```javascript
const classifier = new TaskClassifier(); // This is required!
```

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Integration in app.js (Add to addTask function)
2. ✅ Add category selector to HTML
3. ✅ Display category badges in task list
4. ✅ Create Decision Assistant (next phase)

---

**Status:** Ready for browser testing
**Date:** October 22, 2025
**Expected Time:** 20-30 minutes to complete all tests
