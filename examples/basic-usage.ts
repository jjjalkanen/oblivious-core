/**
 * Basic usage examples for obliv-core
 */

import {
  lit8, cmov, cmovSwap, eq, lt, and, or,
  INF8, TRUE8, FALSE8,
  ObliviousNullableStack,
  bitonicSort, mkSortEntry
} from '../src/obliv_ops.js';

// Example 1: Oblivious conditional selection
function example1_cmov() {
  console.log('\n=== Example 1: Oblivious Conditional Move ===');

  const secret = lit8(42);
  const target = lit8(42);

  const isMatch = eq(secret, target);  // Returns TRUE8
  const result = cmov(isMatch, lit8(100), lit8(200));

  console.log(`Secret matches target: ${result.value}`);  // 100
}

// Example 2: Oblivious search (always scans entire array)
function example2_search() {
  console.log('\n=== Example 2: Oblivious Linear Search ===');

  const array = [lit8(10), lit8(20), lit8(30), lit8(40)];
  const target = lit8(30);

  let found = FALSE8;
  let foundIndex = INF8;  // "not found" sentinel

  for (let i = 0; i < array.length; i++) {
    const matches = eq(array[i], target);
    const shouldUpdate = and(matches, not(found));  // Update only if not yet found

    foundIndex = cmov(shouldUpdate, lit8(i), foundIndex);
    found = cmov(shouldUpdate, TRUE8, found);
  }

  console.log(`Found at index: ${foundIndex.value === 255 ? 'NOT FOUND' : foundIndex.value}`);
}

// Example 3: Oblivious minimum (without early exit)
function example3_minimum() {
  console.log('\n=== Example 3: Oblivious Minimum ===');

  const array = [lit8(30), lit8(10), lit8(50), lit8(20)];

  let min = array[0];

  for (let i = 1; i < array.length; i++) {
    const isSmaller = lt(array[i], min);
    min = cmov(isSmaller, array[i], min);
  }

  console.log(`Minimum value: ${min.value}`);  // 10
}

// Example 4: Oblivious stack
function example4_stack() {
  console.log('\n=== Example 4: Oblivious Stack ===');

  const stack = new ObliviousNullableStack<number>(() => -1);

  stack.push(10);
  stack.push(20);
  stack.push(30);

  console.log(`Top: ${stack.top()}`);  // 30
  console.log(`Size: ${stack.size()}`);  // 3

  stack.pop();
  console.log(`After pop, top: ${stack.top()}`);  // 20
}

// Example 5: Bitonic sort
function example5_sort() {
  console.log('\n=== Example 5: Bitonic Sort ===');

  // Create sort entries (must be power of 2)
  const entries = [
    mkSortEntry('third', lit8(30)),
    mkSortEntry('first', lit8(10)),
    mkSortEntry('fourth', lit8(40)),
    mkSortEntry('second', lit8(20))
  ];

  bitonicSort(entries);

  console.log('Sorted order:');
  entries.forEach((entry, i) => {
    if (entry.k1.value !== 255) {  // Skip null entries
      console.log(`  ${i}: ${entry.data} (key=${entry.k1.value})`);
    }
  });
}

// Run all examples
example1_cmov();
example2_search();
example3_minimum();
example4_stack();
example5_sort();

// Helper for example 2 (not() function)
function not(x: import('../src/obliv8.js').Obliv8) {
  // Bitwise NOT - returns 254 for TRUE8, 255 for FALSE8
  // Only use with and/or, never as cmov condition!
  return { value: (~x.value) & 0xFF } as import('../src/obliv8.js').Obliv8;
}
