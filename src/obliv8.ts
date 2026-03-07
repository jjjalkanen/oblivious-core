// Nullable interface for oblivious stack operations
export interface Nullable {
  oblivIsNull(): Obliv8;
}

// Encrypted 8-bit value - should only be accessed via helper functions
export interface Obliv8 extends Nullable {
  value: number;       // Encrypted value (0-255) - DO NOT ACCESS DIRECTLY

  // Prevent use in boolean contexts to catch data leaks
  [Symbol.toPrimitive](hint: string): never;
}
