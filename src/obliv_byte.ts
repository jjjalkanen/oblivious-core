/*-----------------------------------------------------------*/
/*  core scalar (byte-level) helpers - used by lexer         */
/*-----------------------------------------------------------*/
import { Obliv8 } from "./obliv8.js";

const mask8 = 0xFF;

/* Helper to create Obliv8 with toPrimitive protection */
const makeObliv8 = (value: number): Obliv8 => ({
  value: value & mask8,
  oblivIsNull() {
    return eq(this as Obliv8, K_NONE);
  },
  [Symbol.toPrimitive](_hint: string): never {
    throw new Error("Obliv8 cannot be converted to primitive - this is a data leak! Use explicit oblivious operations (eq, lt, etc.) instead of if-statements.");
  }
});

/* --- literals ---------------------------------------------*/
export const lit8 = (x: number): Obliv8 => makeObliv8(x);

export const ord = (c: string): Obliv8 => makeObliv8(c.charCodeAt(0));

/* --- bitwise (byte-level) ---------------------------------*/
export const and = (a: Obliv8, b: Obliv8): Obliv8 => makeObliv8(a.value & b.value);

export const or = (a: Obliv8, b: Obliv8): Obliv8 => makeObliv8(a.value | b.value);

export const xor = (a: Obliv8, b: Obliv8): Obliv8 => makeObliv8(a.value ^ b.value);

export const not = (a: Obliv8): Obliv8 => makeObliv8(~a.value);

export const shl = (a: Obliv8, n: number): Obliv8 => makeObliv8(a.value << n);

export const shr = (a: Obliv8, n: number): Obliv8 => makeObliv8(a.value >>> n);

/* --- arithmetic (wrapping, byte-level) --------------------*/
export const add = (a: Obliv8, b: Obliv8): Obliv8 => makeObliv8(a.value + b.value);

export const sub = (a: Obliv8, b: Obliv8): Obliv8 => makeObliv8(a.value - b.value);

export const mul = (a: Obliv8, b: Obliv8): Obliv8 => makeObliv8(a.value * b.value);

/* --- constant-time select (generic) -----------------------
   cond must be 0 or 1
-------------------------------------------------------------*/
export const cmov = <T>(cond: Obliv8, if1: T, if0: T): T =>
  1 == cond.value ? if1 : if0;

/**
 * Variant of cmov that returns both the selected and non-selected values.
 *
 * Returns a pair where:
 * - First element: cmov(cond, if1, if0) - the selected value
 * - Second element: the other value (if0 if cond is true, if1 if cond is false)
 *
 * @example
 * cmovSwap(lit8(1), 'A', 'B')  => ['A', 'B']
 * cmovSwap(lit8(0), 'A', 'B')  => ['B', 'A']
 */
export const cmovSwap = <T>(cond: Obliv8, if1: T, if0: T): [T, T] =>
  1 == cond.value ? [if1, if0] : [if0, if1];

/* --- comparisons (byte-level, return 0 or 1) --------------*/
export const eq = (a: Obliv8, b: Obliv8): Obliv8 =>
  ((a.value ^ b.value) === 0) ? makeObliv8(1) : makeObliv8(0);

export const lt = (a: Obliv8, b: Obliv8): Obliv8 =>
  (a.value < b.value) ? makeObliv8(1) : makeObliv8(0);

export const lte = (a: Obliv8, b: Obliv8): Obliv8 =>
  (a.value <= b.value) ? makeObliv8(1) : makeObliv8(0);

export const gt = (a: Obliv8, b: Obliv8): Obliv8 =>
  (a.value > b.value) ? makeObliv8(1) : makeObliv8(0);

export const ge = (a: Obliv8, b: Obliv8): Obliv8 =>
  (a.value >= b.value) ? makeObliv8(1) : makeObliv8(0);

/*-----------------------------------------------------------*/
/*  Constants                                                */
/*-----------------------------------------------------------*/

/* General-purpose constants */
export const INF8   = lit8(255);   // max byte — infinity / "not found" sentinel
export const TRUE8  = lit8(1);     // oblivious boolean true
export const FALSE8 = lit8(0);     // oblivious boolean false

// Token encoding: [251]=LPAREN, [252]=RPAREN, [253]=PLUS, [254]=TIMES, [255]=NONE, [0-250]=INT value
export const K_INT    = lit8(250);
export const K_LPAREN = lit8(251);
export const K_RPAREN = lit8(252);
export const K_PLUS   = lit8(253);
export const K_TIMES  = lit8(254);
export const K_NONE   = INF8;      // whitespace/no-op token (= infinity by design)

/* Byte factories (consistent with nullToken/mkToken, nullNode/mkNode pattern) */
export const nullByte = (): Obliv8 => makeObliv8(INF8.value);
export const mkByte = (value: number): Obliv8 => makeObliv8(value);
