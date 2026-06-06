/*-----------------------------------------------------------*/
/*  Higher-level oblivious types built on Obliv8             */
/*  These are platform-provided opaque handles — web content */
/*  code cannot access their internals.                      */
/*-----------------------------------------------------------*/
import { Obliv8, ObliviousBool } from "./obliv8.js";
import { lit8, eq, gt, andBool, orBool, TRUE8, FALSE8, createObliviousBool, nullByte } from "./obliv_byte.js";
import type { OblivSelectable } from "./obliv_byte.js";
import { decryptByte, getCounter } from "./obliv_crypto.js";
const reveal = (o: Obliv8): number => decryptByte(o.value, getCounter(o));

/*-----------------------------------------------------------*/
/*  ObliviousInt — opaque 64-bit integer (Lamport clocks)    */
/*-----------------------------------------------------------*/

declare const __oblivInt: unique symbol;

/**
 * Opaque 64-bit integer handle. No fields are accessible to web content code.
 * Implements OblivSelectable so it can be used directly with cmov/cmovSwap.
 */
export type ObliviousInt = OblivSelectable & { readonly [__oblivInt]: true };

const INT_BYTES = 8; // 64-bit

/* Platform-internal accessor — not accessible outside this module */
const _intBytes = (x: ObliviousInt): Obliv8[] =>
  (x as unknown as { _bytes: Obliv8[] })._bytes;

const _makeObliviousInt = (bytes: Obliv8[]): ObliviousInt => ({
  _bytes: bytes,
  // Platform implementation: may look inside cond (simulation only)
  oblivSelect(cond: Obliv8, other: ObliviousInt): ObliviousInt {
    return reveal(cond) === 1
      ? (this as unknown as ObliviousInt)
      : other;
  },
} as unknown as ObliviousInt);

/** Create an ObliviousInt from a JS number or BigInt. */
export const createObliviousInt = (n: bigint | number): ObliviousInt => {
  const val = typeof n === "bigint" ? n : BigInt(n);
  const bytes = Array.from({ length: INT_BYTES }, (_, i) =>
    lit8(Number((val >> BigInt(8 * (INT_BYTES - 1 - i))) & BigInt(0xff)))
  );
  return _makeObliviousInt(bytes);
};

/**
 * Oblivious equality: returns ObliviousBool(1) iff a === b.
 * O(INT_BYTES) constant-time byte-by-byte comparison.
 */
export const eqInt = (a: ObliviousInt, b: ObliviousInt): ObliviousBool => {
  const ab = _intBytes(a);
  const bb = _intBytes(b);
  let result: ObliviousBool = TRUE8;
  for (let i = 0; i < INT_BYTES; i++) {
    result = andBool(result, eq(ab[i], bb[i]));
  }
  return result;
};

/**
 * Oblivious greater-than: returns ObliviousBool(1) iff a > b.
 * Lexicographic big-endian comparison, O(INT_BYTES) constant-time.
 */
export const gtInt = (a: ObliviousInt, b: ObliviousInt): ObliviousBool => {
  const ab = _intBytes(a);
  const bb = _intBytes(b);
  let isGreater: ObliviousBool = FALSE8;
  let allEq: ObliviousBool = TRUE8;
  for (let i = 0; i < INT_BYTES; i++) {
    const byteGt = gt(ab[i], bb[i]);
    const byteEq = eq(ab[i], bb[i]);
    isGreater = orBool(isGreater, andBool(allEq, byteGt));
    allEq = andBool(allEq, byteEq);
  }
  return isGreater;
};

/**
 * Oblivious greater-than-or-equal: returns ObliviousBool(1) iff a >= b.
 */
export const geInt = (a: ObliviousInt, b: ObliviousInt): ObliviousBool =>
  orBool(gtInt(a, b), eqInt(a, b));

/*-----------------------------------------------------------*/
/*  ObliviousString — opaque immutable string handle         */
/*-----------------------------------------------------------*/

declare const __oblivString: unique symbol;

/**
 * Opaque string handle. No length or content is accessible to web content code.
 * Implements OblivSelectable so it can be used directly with cmov/cmovSwap.
 *
 * String lengths are public in this model (same as array lengths), consistent
 * with the rest of the oblivious-core design.
 */
export type ObliviousString = OblivSelectable & { readonly [__oblivString]: true };

/* Platform-internal accessor */
const _strBytes = (x: ObliviousString): Obliv8[] =>
  (x as unknown as { _bytes: Obliv8[] })._bytes;

const _makeObliviousString = (bytes: Obliv8[]): ObliviousString => ({
  _bytes: bytes,
  // Platform implementation: may look inside cond (simulation only)
  oblivSelect(cond: Obliv8, other: ObliviousString): ObliviousString {
    return reveal(cond) === 1
      ? (this as unknown as ObliviousString)
      : other;
  },
} as unknown as ObliviousString);

/** Create an ObliviousString from a plain JS string (UTF-8 encoded). */
export const createObliviousString = (s: string): ObliviousString => {
  const bytes = Array.from(new TextEncoder().encode(s), (b) => lit8(b));
  return _makeObliviousString(bytes);
};

/**
 * Oblivious string greater-than: returns ObliviousBool(1) iff a > b (lexicographic byte order).
 *
 * String lengths are public so the min-length prefix scan and the length-tiebreak
 * are not timing leaks.  The per-byte comparisons are constant-time.
 */
export const gtString = (a: ObliviousString, b: ObliviousString): ObliviousBool => {
  const ab = _strBytes(a);
  const bb = _strBytes(b);
  const len = Math.min(ab.length, bb.length);
  let isGreater: ObliviousBool = FALSE8;
  let allEq: ObliviousBool = TRUE8;
  for (let i = 0; i < len; i++) {
    isGreater = orBool(isGreater, andBool(allEq, gt(ab[i], bb[i])));
    allEq = andBool(allEq, eq(ab[i], bb[i]));
  }
  const lengthGt = createObliviousBool(ab.length > bb.length);
  return orBool(isGreater, andBool(allEq, lengthGt));
};

/**
 * Oblivious string equality: returns ObliviousBool(1) iff a === b.
 *
 * Strings of different byte-lengths are definitely unequal; since lengths are
 * public this early exit is not a timing leak.  Equal-length strings are
 * compared byte-by-byte in constant time.
 */
export const eqString = (
  a: ObliviousString,
  b: ObliviousString
): ObliviousBool => {
  const ab = _strBytes(a);
  const bb = _strBytes(b);
  if (ab.length !== bb.length) return FALSE8;
  let result: ObliviousBool = TRUE8;
  for (let i = 0; i < ab.length; i++) {
    result = andBool(result, eq(ab[i], bb[i]));
  }
  return result;
};

/*-----------------------------------------------------------*/
/*  oblivIngest — client-side convenience entry point        */
/*-----------------------------------------------------------*/

/** Union of all oblivious scalar value types. */
export type ObliviousValue = ObliviousString | ObliviousInt | Obliv8;

/**
 * Convert a plain JS scalar to its oblivious equivalent.
 *
 * This is the single entry point for client/test code that prepares
 * plaintext values before handing them to Automerge.  Automerge itself
 * never calls this function.
 *
 * - string  → ObliviousString (UTF-8 encoded, per-byte encrypted)
 * - number  → ObliviousInt    (64-bit big-endian, per-byte encrypted)
 * - boolean → TRUE8 / FALSE8  (Obliv8 singleton)
 * - null    → nullByte()      (Obliv8 sentinel 0xFF)
 */
export function oblivIngest(value: string | number | boolean | null): ObliviousValue {
  if (typeof value === "string") return createObliviousString(value);
  if (typeof value === "number") return createObliviousInt(value);
  if (typeof value === "boolean") return value ? TRUE8 : FALSE8;
  return nullByte();
}
