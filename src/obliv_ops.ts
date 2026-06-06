/*-----------------------------------------------------------*/
/*  Core oblivious operations - barrel export                */
/*-----------------------------------------------------------*/

export { lit8, ord, and, or, xor, not, shl, shr, add, sub, mul,
         cmov, cmovSwap, eq, lt, lte, gt, ge,
         INF8, TRUE8, FALSE8,
         nullByte, mkByte,
         createObliviousBool, andBool, orBool, notBool } from "./obliv_byte.js";
export type { OblivSelectable } from "./obliv_byte.js";

export type { Obliv8, Nullable, ObliviousBool } from "./obliv8.js";

export { ObliviousNullableStack } from "./oblivious_stack.js";

export { bitonicSort, mkSortEntry, nullSortEntry, isLess } from "./bitonic_sort.js";
export type { SortEntry } from "./bitonic_sort.js";

export { createObliviousInt, eqInt, gtInt, geInt,
         createObliviousString, eqString, gtString,
         oblivIngest } from "./obliv_higher.js";
export type { ObliviousInt, ObliviousString, ObliviousValue } from "./obliv_higher.js";

export { ObliviousSequence } from "./obliv_sequence.js";

export { createOblivU16, eqU16, addU16, subU16, u16Hi, u16Lo } from "./obliv_u16.js";
export type { OblivU16 } from "./obliv_u16.js";

export { ObliviousByteArray, ObliviousU16Array, ObliviousTable } from "./obliv_array.js";

