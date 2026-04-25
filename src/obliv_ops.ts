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

export { createObliviousInt, eqInt, gtInt,
         createObliviousString, eqString, gtString,
         oblivIngest } from "./obliv_higher.js";
export type { ObliviousInt, ObliviousString, ObliviousValue } from "./obliv_higher.js";

