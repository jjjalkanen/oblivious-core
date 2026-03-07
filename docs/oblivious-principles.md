# Oblivious Computing Principles

## Core Concept

**Oblivious algorithms** ensure that execution time and memory access patterns are independent of secret data, preventing timing side-channel attacks.

Key requirement: **All branches and loops must be structurally determined** (based on public data like array size), never data-dependent.

---

## 1. The `Obliv8` Type

```typescript
interface Obliv8 {
  value: number;  // 0-255
  oblivIsNull(): Obliv8;
  [Symbol.toPrimitive](): never;  // Throws error - prevents if-statements!
}
```

### Why `toPrimitive` Protection?

```typescript
// ❌ FORBIDDEN - data-dependent branch (timing leak!)
if (secretByte.value === 42) {
  doSomething();
}

// ✅ CORRECT - oblivious selection
const isMatch = eq(secretByte, lit8(42));  // Returns TRUE8 or FALSE8
const result = cmov(isMatch, option1, option2);
```

The `toPrimitive` trap **prevents accidental `if` statements** by throwing an error if you try to use an `Obliv8` in a boolean context.

---

## 2. Constants: Semantic Naming

Always use **named constants** instead of magic numbers:

```typescript
// ✅ CORRECT - semantic meaning
const found = TRUE8;
const notFound = INF8;
const isEmpty = FALSE8;

// ❌ WRONG - unclear intent
const found = lit8(1);
const notFound = lit8(255);
const isEmpty = lit8(0);
```

### Standard Constants

| Constant | Value | Use Case |
|----------|-------|----------|
| `TRUE8` | `lit8(1)` | Boolean true, success flags |
| `FALSE8` | `lit8(0)` | Boolean false, failure flags |
| `INF8` | `lit8(255)` | Infinity, "not found", null sentinel |

**Important**: Use `lit8(0)`, `lit8(1)`, etc. **only** for arithmetic values (counters, indices, numeric data), not for boolean flags or sentinels.

---

## 3. Conditional Operations: `cmov` and `cmovSwap`

### `cmov(cond, if1, if0)`

Constant-time conditional move. **`cond` must be 0 or 1 exactly.**

```typescript
// Returns if1 when cond=1, if0 when cond=0
const result = cmov(isEqual, valueA, valueB);

// ⚠️ IMPORTANT: cond must be TRUE8 (1) or FALSE8 (0)
// Comparison ops (eq, lt, etc.) guarantee this
const cond = eq(x, y);  // ✅ Returns TRUE8 or FALSE8
const result = cmov(cond, a, b);
```

### `cmovSwap(cond, if1, if0)`

Returns both values, swapped based on condition:

```typescript
const [selected, other] = cmovSwap(cond, a, b);

// When cond=1: [a, b]
// When cond=0: [b, a]
```

**Use case**: Update a variable conditionally while keeping both values:

```typescript
let current = initialValue;
for (let i = 0; i < N; i++) {
  const shouldUpdate = eq(lit8(i), targetIndex);
  [current, _] = cmovSwap(shouldUpdate, newValue, current);
  // current is updated only when i === targetIndex
}
```

---

## 4. The `not()` Trap

### ⚠️ Critical: `not()` is Bitwise Complement

```typescript
not(x) = ~x & 0xFF

not(lit8(0)) = lit8(255)  // NOT 1 !!!
not(lit8(1)) = lit8(254)  // NOT 0 !!!
```

### Why This Matters

```typescript
// ❌ WRONG - not() doesn't produce valid boolean!
const isAtTarget = eq(i, target);        // Returns TRUE8 (1) or FALSE8 (0)
const isNotAtTarget = not(isAtTarget);   // Returns 254 or 255 - INVALID for cmov!
const result = cmov(isNotAtTarget, a, b); // ❌ BROKEN - cond must be 0 or 1

// ✅ CORRECT - swap the branches instead
const isAtTarget = eq(i, target);
const result = cmov(isAtTarget, b, a);   // Swap if1 and if0

// ✅ ALSO CORRECT - use not() only with and/or
const isAtTarget = eq(i, target);
const isNotAtTarget = not(isAtTarget);   // 254 or 255
const combined = and(isNotAtTarget, otherCondition);  // Valid in boolean algebra
```

### When to Use `not()`

1. **Boolean algebra with `and`/`or`** (De Morgan's laws):
   ```typescript
   const notBoth = not(and(a, b));  // !(a && b)
   const neitherOr = not(or(a, b)); // !(a || b)
   ```

2. **Never as a `cmov` condition** — it produces 254/255, not 0/1.

---

## 5. The `Nullable` Pattern

All oblivious types should implement `Nullable`:

```typescript
interface Nullable {
  oblivIsNull(): Obliv8;  // Returns TRUE8 if null, FALSE8 otherwise
}
```

### Example: Oblivious Reference

```typescript
interface OblivRef extends Nullable {
  ref: Node | null;
  oblivIsNull(): Obliv8 {
    // TypeScript null check (control flow) is OK - the reference itself is not secret
    return this.ref === null ? TRUE8 : this.ref.oblivIsNull();
  }
}
```

### Null Checks Must Be Compositional

For composite types, null = all parts are null (logical AND):

```typescript
// Node is null if val AND left AND right are all null
oblivIsNull() {
  return and(
    and(this.val.oblivIsNull(), this.left.oblivIsNull()),
    this.right.oblivIsNull()
  );
}
```

**Why**: A partially-initialized node is not null. Only fully-empty structures are null.

---

## 6. Factory Pattern: `nullX()` and `mkX()`

Every oblivious type should have two factory functions:

```typescript
// Create a null/empty instance (sentinel value)
export const nullByte = (): Obliv8 => makeObliv8(INF8.value);

// Create a valid instance with data
export const mkByte = (value: number): Obliv8 => makeObliv8(value);
```

**Consistency**: `nullX().oblivIsNull() === TRUE8` for all types.

---

## 7. Comparison Operations

All comparison ops return **oblivious booleans** (TRUE8 or FALSE8):

```typescript
eq(a, b)   // a == b ? TRUE8 : FALSE8
lt(a, b)   // a < b  ? TRUE8 : FALSE8
lte(a, b)  // a <= b ? TRUE8 : FALSE8
gt(a, b)   // a > b  ? TRUE8 : FALSE8
ge(a, b)   // a >= b ? TRUE8 : FALSE8
```

These are **safe to use as `cmov` conditions** because they guarantee 0 or 1.

---

## 8. Oblivious Loop Patterns

### Pattern A: Fixed Iteration Count

```typescript
// ✅ GOOD - loop count is structurally determined
for (let i = 0; i < N; i++) {
  const shouldProcess = eq(lit8(i), targetIndex);
  result = cmov(shouldProcess, processedValue, result);
}
```

The loop always runs N times regardless of data. The `cmov` ensures work happens only when needed.

### Pattern B: Avoiding Early Exit

```typescript
// ❌ BAD - data-dependent early exit (timing leak!)
for (let i = 0; i < N; i++) {
  if (found.value === 1) break;  // Leaks when item was found!
  // ...
}

// ✅ GOOD - always run full loop, but stop updating after found
let found = FALSE8;
let result = nullValue;

for (let i = 0; i < N; i++) {
  const matches = eq(array[i], target);
  const shouldUpdate = and(matches, not(found));  // Update only if not yet found
  result = cmov(shouldUpdate, array[i], result);
  found = cmov(shouldUpdate, TRUE8, found);
}
```

### Pattern C: Nested Loops (Oblivious Matrix Access)

```typescript
// Access matrix[row][col] obliviously
let result = nullValue;

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const isTarget = and(eq(lit8(r), targetRow), eq(lit8(c), targetCol));
    result = cmov(isTarget, matrix[r][c], result);
  }
}
```

---

## 9. Testing Oblivious Code

### Test Boolean Results

```typescript
test('eq returns TRUE8 for equal values', () => {
  const result = eq(lit8(5), lit8(5));
  expect(result.value).toBe(1);  // TRUE8
});

test('eq returns FALSE8 for unequal values', () => {
  const result = eq(lit8(5), lit8(7));
  expect(result.value).toBe(0);  // FALSE8
});
```

### Test Null Semantics

```typescript
test('nullX() creates null value', () => {
  const x = nullByte();
  expect(x.oblivIsNull().value).toBe(1);  // TRUE8
});

test('mkX() creates non-null value', () => {
  const x = mkByte(42);
  expect(x.oblivIsNull().value).toBe(0);  // FALSE8
});
```

### Test Data Independence

Run tests with **different secret values** and verify:
1. Same number of operations executed
2. Same memory access patterns
3. Same execution time (within noise threshold)

---

## 10. Common Pitfalls

### ❌ Pitfall 1: Using `not()` as `cmov` condition

```typescript
// WRONG
const notEqual = not(eq(a, b));
result = cmov(notEqual, x, y);  // notEqual is 254/255, not 0/1!

// RIGHT
const isEqual = eq(a, b);
result = cmov(isEqual, y, x);  // Swap the branches
```

### ❌ Pitfall 2: Data-Dependent Loop Bounds

```typescript
// WRONG - loop count depends on secret data
for (let i = 0; i < secretLength.value; i++) { ... }

// RIGHT - pad to maximum length, loop over padded array
const paddedArray = pad(secretArray, MAX_LENGTH);
for (let i = 0; i < MAX_LENGTH; i++) {
  const isValid = lt(lit8(i), secretLength);
  // Process with isValid flag
}
```

### ❌ Pitfall 3: Forgetting `toPrimitive` Protection

```typescript
// This will throw an error (good!):
if (secretByte) { ... }

// Always use oblivious operations:
const isNonZero = not(eq(secretByte, FALSE8));
```

### ❌ Pitfall 4: Null Checks Based on `kind` Field

```typescript
// WRONG - only checking one field
oblivIsNull() {
  return eq(this.kind, K_NONE);  // Other fields might have data!
}

// RIGHT - check all fields
oblivIsNull() {
  return and(
    and(this.val.oblivIsNull(), this.left.oblivIsNull()),
    this.right.oblivIsNull()
  );
}
```

---

## 11. Performance Considerations

### Time Complexity
- **Always O(n)** for scanning an array of size n
- No best/worst/average cases — always the same
- More operations than non-oblivious code, but predictable

### Space Complexity
- **Pad to power of 2** for sorting (bitonic sort requirement)
- **Fixed-size structures** — no dynamic allocation based on secret data
- Pre-allocate maximum needed space

### When to Use Oblivious Algorithms
- Cryptographic operations (AES, RSA, etc.)
- Password checking
- Private database queries
- Secure multi-party computation
- Any scenario where timing leaks are a threat

### When NOT to Use
- Public data processing (no secrets involved)
- Throughput-critical applications where timing is not a threat
- Environments with trusted execution (SGX, etc.)

---

## 12. Design Checklist

Building a new oblivious type? Ensure:

- ✅ Implements `Nullable` interface
- ✅ Has `nullX()` and `mkX()` factory functions
- ✅ `oblivIsNull()` checks all fields (compositional)
- ✅ No `if` statements on secret data (use `cmov` instead)
- ✅ All loops have fixed, structurally-determined bounds
- ✅ Uses named constants (INF8, TRUE8, FALSE8) instead of magic numbers
- ✅ Comparison results (TRUE8/FALSE8) are used as `cmov` conditions
- ✅ `not()` is only used in boolean algebra, never as `cmov` condition
- ✅ All operations are constant-time (no data-dependent branches or memory access)
- ✅ Tests verify both correctness AND data independence

---

## Further Reading

- [Constant-Time Toolkit](https://github.com/pornin/CTTK) - Reference implementation in C
- [BearSSL](https://bearssl.org/) - Production constant-time crypto library
- [Timing Attacks on Implementations of Diffie-Hellman, RSA, DSS, and Other Systems](https://crypto.stanford.edu/~dabo/papers/ssl-timing.pdf) - Seminal paper by Kocher
- [Cache-Timing Attacks on AES](https://cr.yp.to/antiforgery/cachetiming-20050414.pdf) - Bernstein's AES attack

---

**Summary**: Oblivious computing trades performance for security. By ensuring execution is **independent of secret data**, you eliminate an entire class of side-channel attacks. The patterns in this document are your toolkit for building provably timing-safe algorithms.
