# obliv-core Usage Guide

## Installation in a New Project

### Option 1: Copy to your project

```bash
# Copy the obliv-core directory to your new project
cp -r /home/pinkku/obliv-arith/obliv-core /path/to/your/new-project/

# Install dependencies
cd /path/to/your/new-project/obliv-core
npm install
npm run build
```

### Option 2: Use as local npm package

```bash
# In obliv-core directory
npm link

# In your new project
npm link obliv-core
```

Then import in your TypeScript files:

```typescript
import { lit8, cmov, eq, INF8, TRUE8, FALSE8 } from 'obliv-core';
```

### Option 3: Publish to npm (for team sharing)

1. Update `package.json` with your details
2. `npm publish` (requires npm account)
3. `npm install obliv-core` in other projects

---

## Quick Start

### 1. Define Your Domain Types

```typescript
import { Obliv8, Nullable } from 'obliv-core';
import { eq, and, cmov, INF8, TRUE8, FALSE8 } from 'obliv-core';

// Example: Oblivious character
interface OblivChar extends Nullable {
  byte: Obliv8;
  oblivIsNull(): Obliv8 {
    return eq(this.byte, INF8);
  }
}

function nullChar(): OblivChar {
  return { byte: INF8, oblivIsNull() { return TRUE8; } };
}

function mkChar(byte: Obliv8): OblivChar {
  return {
    byte,
    oblivIsNull() { return eq(this.byte, INF8); }
  };
}
```

### 2. Build Oblivious Operations

```typescript
// Oblivious character comparison
function charEq(a: OblivChar, b: OblivChar): Obliv8 {
  return eq(a.byte, b.byte);
}

// Oblivious string search (fixed-length)
function findChar(str: OblivChar[], target: OblivChar): Obliv8 {
  let found = FALSE8;
  let index = INF8;

  for (let i = 0; i < str.length; i++) {
    const matches = and(charEq(str[i], target), not(found));
    index = cmov(matches, lit8(i), index);
    found = cmov(matches, TRUE8, found);
  }

  return index;  // INF8 if not found
}
```

### 3. Use Oblivious Data Structures

```typescript
import { ObliviousNullableStack, bitonicSort, mkSortEntry } from 'obliv-core';

// Oblivious stack of characters
const stack = new ObliviousNullableStack<OblivChar>(nullChar);
stack.push(mkChar(lit8(65)));  // 'A'
stack.push(mkChar(lit8(66)));  // 'B'

// Oblivious sorting
const entries = [
  mkSortEntry('apple', lit8(5)),   // Sort by length
  mkSortEntry('kiwi', lit8(4)),
  mkSortEntry('banana', lit8(6)),
  mkSortEntry('fig', lit8(3))
];

bitonicSort(entries);  // Sorted by k1 (length)
```

---

## Common Patterns for Character/List/JSON Processing

### Fixed-Length Strings

```typescript
interface OblivString extends Nullable {
  chars: OblivChar[];
  length: Obliv8;  // Actual length (rest is padding)
  oblivIsNull(): Obliv8;
}

function mkString(chars: OblivChar[], maxLen: number): OblivString {
  // Pad to maxLen
  const padded = [...chars];
  while (padded.length < maxLen) {
    padded.push(nullChar());
  }

  return {
    chars: padded,
    length: lit8(chars.length),
    oblivIsNull() {
      return eq(this.length, lit8(0));
    }
  };
}
```

### Fixed-Size Lists

```typescript
interface OblivList<T extends Nullable> extends Nullable {
  items: T[];
  size: Obliv8;
  oblivIsNull(): Obliv8;
}

function mkList<T extends Nullable>(
  items: T[],
  maxSize: number,
  nullFactory: () => T
): OblivList<T> {
  const padded = [...items];
  while (padded.length < maxSize) {
    padded.push(nullFactory());
  }

  return {
    items: padded,
    size: lit8(items.length),
    oblivIsNull() { return eq(this.size, lit8(0)); }
  };
}
```

### JSON with Fixed Schema

```typescript
// Example: Person object with fixed fields
interface OblivPerson extends Nullable {
  name: OblivString;
  age: Obliv8;
  active: Obliv8;  // TRUE8 or FALSE8
  oblivIsNull(): Obliv8;
}

function mkPerson(name: string, age: number, active: boolean): OblivPerson {
  return {
    name: mkString([...name].map(c => mkChar(lit8(c.charCodeAt(0)))), 64),
    age: lit8(age),
    active: active ? TRUE8 : FALSE8,
    oblivIsNull() {
      return this.name.oblivIsNull();  // Null if name is null
    }
  };
}
```

---

## Testing Your Oblivious Code

```typescript
import { describe, it, expect } from 'vitest';

describe('OblivChar', () => {
  it('creates non-null char', () => {
    const ch = mkChar(lit8(65));  // 'A'
    expect(ch.oblivIsNull().value).toBe(0);  // FALSE8
    expect(ch.byte.value).toBe(65);
  });

  it('creates null char', () => {
    const ch = nullChar();
    expect(ch.oblivIsNull().value).toBe(1);  // TRUE8
  });

  it('compares chars obliviously', () => {
    const a = mkChar(lit8(65));
    const b = mkChar(lit8(65));
    const c = mkChar(lit8(66));

    expect(charEq(a, b).value).toBe(1);  // TRUE8
    expect(charEq(a, c).value).toBe(0);  // FALSE8
  });
});
```

---

## See Also

- **`docs/oblivious-principles.md`** - Comprehensive guide to oblivious computing patterns
- **`examples/basic-usage.ts`** - Runnable examples
- **`README.md`** - Package overview

---

## Moving obliv-core to a Common Location

```bash
# Option 1: Move to ~/oblivious-libs/ for reuse across projects
mkdir -p ~/oblivious-libs
mv obliv-core ~/oblivious-libs/
cd ~/oblivious-libs/obliv-core
npm link  # Make it available globally

# Then in any new project:
npm link obliv-core

# Option 2: Create a Git repository
cd obliv-core
git init
git add .
git commit -m "Initial commit: oblivious computing core library"
# Push to GitHub/GitLab and clone in new projects
```
