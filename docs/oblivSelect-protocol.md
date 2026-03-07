# oblivSelect Protocol

## What it is

`oblivSelect` is a method every type must implement to work with `cmov` and `cmovSwap`.

```typescript
export interface OblivSelectable {
  oblivSelect(cond: Obliv8, other: this): this;
}

export const cmov = <T extends OblivSelectable>(cond: Obliv8, if1: T, if0: T): T =>
  if1.oblivSelect(cond, if0) as T;
```

Semantics: `x.oblivSelect(cond, y)` returns `x` if `cond = 1`, else `y`.

## Why it exists (MPC/FHE safety)

In real MPC or FHE, every encrypted field must be individually selected. A whole-object
swap (e.g. `cond ? objA : objB`) leaks which object was selected, defeating the purpose
of oblivious computation.

`oblivSelect` enforces field-by-field selection at the type level. Without it, a composite
type silently falls back to a plaintext conditional — a correctness bug in real deployments.

The strict `T extends OblivSelectable` constraint on `cmov`/`cmovSwap` turns this into a
**compile-time error** for any type that hasn't opted in to the protocol.

## Implementing oblivSelect for a new composite type

Call `cmov` on each field. The composition is recursive: if a field itself holds a
composite type that implements `oblivSelect`, `cmov` dispatches to that field's method.

### Example: a 2-field struct

```typescript
interface Point extends OblivSelectable {
  x: Obliv8;
  y: Obliv8;
  oblivSelect(cond: Obliv8, other: Point): Point;
}

function mkPoint(x: Obliv8, y: Obliv8): Point {
  return {
    x, y,
    oblivSelect(cond, other) {
      return mkPoint(cmov(cond, this.x, other.x), cmov(cond, this.y, other.y));
    }
  };
}
```

### Example: Obliv8 (scalar base case)

`Obliv8` is the leaf type. Its implementation is a direct byte-level select:

```typescript
oblivSelect(cond: Obliv8, other: Obliv8): Obliv8 {
  return cond.value === 1 ? this : other;
}
```

In real MPC this would be an encrypted multiplexer gate.

### Example: SortEntry<T>

```typescript
oblivSelect(cond: Obliv8, other: SortEntry<T>): SortEntry<T> {
  return mkSortEntry(
    cmov(cond, this.data, other.data),  // dispatches to T.oblivSelect
    cmov(cond, this.k1,   other.k1),
    cmov(cond, this.k2,   other.k2),
    cmov(cond, this.k3,   other.k3)
  );
}
```

## Strict contract: no plaintext fallback

`cmov` and `cmovSwap` have no generic fallback. If you pass a type without
`oblivSelect`, the TypeScript compiler rejects it. This is intentional.

If you encounter a `cmov<number>` call site, convert the numbers to `Obliv8`
using `lit8()` and extract with `.value` only for non-secret structural indices
(e.g. array offsets determined by algorithm structure, not encrypted data).
