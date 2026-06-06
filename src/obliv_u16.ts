/*-----------------------------------------------------------*/
/*  OblivU16 — opaque unsigned 16-bit integer (0-65535)      */
/*  Built from two Obliv8 bytes (big-endian: [hi, lo]).      */
/*-----------------------------------------------------------*/
import { Obliv8, ObliviousBool } from "./obliv8.js";
import { lit8, eq, lt, add, sub, andBool, cmov } from "./obliv_byte.js";
import type { OblivSelectable } from "./obliv_byte.js";
import { decryptByte, getCounter } from "./obliv_crypto.js";

const reveal = (o: Obliv8): number => decryptByte(o.value, getCounter(o));

declare const __oblivU16: unique symbol;

export type OblivU16 = OblivSelectable & { readonly [__oblivU16]: true };

const _u16Bytes = (x: OblivU16): [Obliv8, Obliv8] =>
  (x as unknown as { _bytes: [Obliv8, Obliv8] })._bytes;

const _makeOblivU16 = (hi: Obliv8, lo: Obliv8): OblivU16 => ({
  _bytes: [hi, lo] as [Obliv8, Obliv8],
  oblivSelect(cond: Obliv8, other: OblivU16): OblivU16 {
    return reveal(cond) === 1 ? (this as unknown as OblivU16) : other;
  },
} as unknown as OblivU16);

export const createOblivU16 = (n: number): OblivU16 =>
  _makeOblivU16(lit8((n >> 8) & 0xFF), lit8(n & 0xFF));

export const u16Hi = (x: OblivU16): Obliv8 => _u16Bytes(x)[0];
export const u16Lo = (x: OblivU16): Obliv8 => _u16Bytes(x)[1];

export const eqU16 = (a: OblivU16, b: OblivU16): ObliviousBool => {
  const [ahi, alo] = _u16Bytes(a);
  const [bhi, blo] = _u16Bytes(b);
  return andBool(eq(ahi, bhi), eq(alo, blo));
};

export const addU16 = (a: OblivU16, b: OblivU16): OblivU16 => {
  const [ahi, alo] = _u16Bytes(a);
  const [bhi, blo] = _u16Bytes(b);
  const loSum = add(alo, blo);
  const carry = lt(loSum, alo);
  const hiSum = add(add(ahi, bhi), carry as Obliv8);
  return _makeOblivU16(hiSum, loSum);
};

export const subU16 = (a: OblivU16, b: OblivU16): OblivU16 => {
  const [ahi, alo] = _u16Bytes(a);
  const [bhi, blo] = _u16Bytes(b);
  const loDiff = sub(alo, blo);
  const borrow = lt(alo, blo);
  const hiDiff = sub(sub(ahi, bhi), borrow as Obliv8);
  return _makeOblivU16(hiDiff, loDiff);
};
