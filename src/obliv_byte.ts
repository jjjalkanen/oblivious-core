/*-----------------------------------------------------------*/
/*  core scalar (byte-level) helpers - used by lexer         */
/*-----------------------------------------------------------*/
import { Obliv8, ObliviousBool } from "./obliv8.js";

const mask8 = 0xFF;

/* Helper to create Obliv8 with toPrimitive protection */
const makeObliv8 = (value: number): Obliv8 => ({
  value: value & mask8,
  oblivIsNull() {
    return eq(this as Obliv8, INF8);
  },
  oblivSelect(cond: Obliv8, other: Obliv8): Obliv8 {
    return cond.value === 1 ? (this as Obliv8) : other;
  },
  [Symbol.toPrimitive](_hint: string): never {
    throw new Error("Obliv8 cannot be converted to primitive - this is a data leak! Use explicit oblivious operations (eq, lt, etc.) instead of if-statements.");
  }
});

/* Helper to create an ObliviousBool (0=false, 1=true) — platform internal only */
const makeOblivBool = (value: number): ObliviousBool =>
  makeObliv8(value & 1) as ObliviousBool;

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

/* --- comparisons (byte-level, return ObliviousBool) -------*/
export const eq = (a: Obliv8, b: Obliv8): ObliviousBool =>
  makeOblivBool((a.value ^ b.value) === 0 ? 1 : 0);

export const lt = (a: Obliv8, b: Obliv8): ObliviousBool =>
  makeOblivBool(a.value < b.value ? 1 : 0);

export const lte = (a: Obliv8, b: Obliv8): ObliviousBool =>
  makeOblivBool(a.value <= b.value ? 1 : 0);

export const gt = (a: Obliv8, b: Obliv8): ObliviousBool =>
  makeOblivBool(a.value > b.value ? 1 : 0);

export const ge = (a: Obliv8, b: Obliv8): ObliviousBool =>
  makeOblivBool(a.value >= b.value ? 1 : 0);

/*-----------------------------------------------------------*/
/*  Constants                                                */
/*-----------------------------------------------------------*/

/* General-purpose constants */
export const INF8   = lit8(255);              // max byte — infinity / "not found" sentinel
export const TRUE8  = makeOblivBool(1);       // oblivious boolean true
export const FALSE8 = makeOblivBool(0);       // oblivious boolean false

/* Byte factories (consistent with nullToken/mkToken, nullNode/mkNode pattern) */
export const nullByte = (): Obliv8 => makeObliv8(INF8.value);
export const mkByte = (value: number): Obliv8 => makeObliv8(value);

/* --- ObliviousBool operations -----------------------------*/

/** Create an ObliviousBool from a plain JS boolean. */
export const createObliviousBool = (b: boolean): ObliviousBool =>
  makeOblivBool(b ? 1 : 0);

/** Logical AND — both inputs must be 0 or 1; result is 0 or 1. */
export const andBool = (a: ObliviousBool, b: ObliviousBool): ObliviousBool =>
  makeOblivBool(a.value & b.value);

/** Logical OR — both inputs must be 0 or 1; result is 0 or 1. */
export const orBool = (a: ObliviousBool, b: ObliviousBool): ObliviousBool =>
  makeOblivBool(a.value | b.value);

/**
 * Logical NOT — safe complement that always returns 0 or 1.
 * Unlike bitwise not(), which returns 254 for TRUE8 and is unsafe as a cmov condition.
 */
export const notBool = (a: ObliviousBool): ObliviousBool =>
  makeOblivBool(1 - a.value);

/*-----------------------------------------------------------*/
/*  OblivSelectable protocol                                 */
/*-----------------------------------------------------------*/

/**
 * Types that support field-by-field oblivious selection.
 *
 * `cmov` and `cmovSwap` require this interface, enforcing that composite
 * types define how each field is selected individually — critical for
 * correctness in MPC/FHE where whole-object selection would leak structure.
 */
export interface OblivSelectable {
  oblivSelect(cond: Obliv8, other: this): this;
}

/* --- constant-time select (generic) -----------------------
   cond must be 0 or 1; T must implement OblivSelectable
-------------------------------------------------------------*/
export const cmov = <T extends OblivSelectable>(cond: Obliv8, if1: T, if0: T): T =>
  if1.oblivSelect(cond, if0) as T;

/**
 * Variant of cmov that returns both the selected and non-selected values.
 *
 * Returns a pair where:
 * - First element: cmov(cond, if1, if0) - the selected value
 * - Second element: the other value (if0 if cond is true, if1 if cond is false)
 *
 * @example
 * cmovSwap(lit8(1), a, b)  => [a, b]
 * cmovSwap(lit8(0), a, b)  => [b, a]
 */
export const cmovSwap = <T extends OblivSelectable>(cond: Obliv8, if1: T, if0: T): [T, T] =>
  [if1.oblivSelect(cond, if0) as T, if0.oblivSelect(cond, if1) as T];
