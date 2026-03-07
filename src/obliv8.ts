// Nullable interface for oblivious stack operations
export interface Nullable {
  oblivIsNull(): Obliv8;
}

// Encrypted 8-bit value - should only be accessed via helper functions
export interface Obliv8 extends Nullable {
  value: number;       // Encrypted value (0-255) - DO NOT ACCESS DIRECTLY

  // Field-by-field oblivious selection: if cond=1 return this, else return other
  oblivSelect(cond: Obliv8, other: Obliv8): Obliv8;

  // Prevent use in boolean contexts to catch data leaks
  [Symbol.toPrimitive](hint: string): never;
}
