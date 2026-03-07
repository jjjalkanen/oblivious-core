# obliv-core

Core oblivious computing primitives for TypeScript.

## Overview

This library provides fundamental building blocks for writing **oblivious algorithms** — algorithms that prevent timing side-channel attacks by ensuring execution time and memory access patterns are independent of secret data.

## Installation

```bash
npm install
npm run build
```

## Usage

```typescript
import { lit8, cmov, eq, INF8, TRUE8, FALSE8 } from 'obliv-core';

// Oblivious conditional move
const secret = lit8(42);
const isEqual = eq(secret, lit8(42));  // Returns TRUE8 (1) or FALSE8 (0)
const result = cmov(isEqual, lit8(100), lit8(200));  // Returns 100 if equal, 200 otherwise
```

## Core Primitives

### Types
- **`Obliv8`**: Oblivious 8-bit value with `toPrimitive` protection

### Constants
- **`INF8`**: `lit8(255)` - Infinity / "not found" sentinel
- **`TRUE8`**: `lit8(1)` - Oblivious boolean true
- **`FALSE8`**: `lit8(0)` - Oblivious boolean false

### Operations
- **Bitwise**: `and`, `or`, `xor`, `not`, `shl`, `shr`
- **Arithmetic**: `add`, `sub`, `mul` (wrapping, byte-level)
- **Comparison**: `eq`, `lt`, `lte`, `gt`, `ge` (return TRUE8 or FALSE8)
- **Conditional**: `cmov(cond, if1, if0)`, `cmovSwap(cond, if1, if0)`

### Data Structures
- **`ObliviousNullableStack<T>`**: Fixed-size oblivious stack with null-safe operations
- **`bitonicSort<T>`**: O(n log² n) oblivious sorting network

## Key Principles

See `docs/oblivious-principles.md` for detailed guidance on:
- Why `not(x)` returns 254 or 255, never 1
- How `cmov` and `cmovSwap` work
- The `Nullable` interface pattern
- Testing strategies

## Building Applications

This library provides primitives only. Build domain-specific types on top:

```typescript
// Example: Oblivious character
interface OblivChar extends Nullable {
  byte: Obliv8;
  oblivIsNull(): Obliv8;
}

// Example: Oblivious string (fixed-length)
interface OblivString extends Nullable {
  chars: OblivChar[];
  oblivIsNull(): Obliv8;
}
```

## License

MIT
