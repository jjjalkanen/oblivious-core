/*-----------------------------------------------------------*/
/*  Bitonic Sort - Oblivious sorting network                 */
/*-----------------------------------------------------------*/
import { Obliv8, Nullable } from "./obliv8.js";
import { eq, lt, and, or, xor, cmovSwap, INF8, TRUE8, FALSE8 } from "./obliv_byte.js";

/**
 * Generic sort entry with up to 3 comparison keys.
 * For single-key sorting, set k2 and k3 to INF8.
 */
export interface SortEntry<T> extends Nullable {
  data: T;         // The data being sorted
  k1: Obliv8;      // Primary sort key
  k2: Obliv8;      // Secondary sort key
  k3: Obliv8;      // Tertiary sort key
  oblivIsNull(): Obliv8;
}

/* Create a sort entry with given data and keys */
export function mkSortEntry<T>(data: T, k1: Obliv8, k2: Obliv8 = INF8, k3: Obliv8 = INF8): SortEntry<T> {
  return {
    data,
    k1,
    k2,
    k3,
    oblivIsNull() {
      return eq(this.k1, INF8);
    }
  };
}

/* Create a null sort entry (all keys = 255) */
export function nullSortEntry<T>(nullData: T): SortEntry<T> {
  return mkSortEntry(nullData, INF8, INF8, INF8);
}

/* Lexicographic comparison: returns 1 if a < b, else 0 */
export function isLess<T>(a: SortEntry<T>, b: SortEntry<T>): Obliv8 {
  // a < b if:
  // - a.k1 < b.k1, OR
  // - a.k1 == b.k1 AND a.k2 < b.k2, OR
  // - a.k1 == b.k1 AND a.k2 == b.k2 AND a.k3 < b.k3
  const k1Less = lt(a.k1, b.k1);
  const k1Eq = eq(a.k1, b.k1);
  const k2Less = lt(a.k2, b.k2);
  const k2Eq = eq(a.k2, b.k2);
  const k3Less = lt(a.k3, b.k3);

  return or(
    k1Less,
    or(
      and(k1Eq, k2Less),
      and(and(k1Eq, k2Eq), k3Less)
    )
  );
}

/* Oblivious compare-and-swap */
function obliviousCAS<T>(entries: SortEntry<T>[], i: number, j: number, dir: Obliv8): void {
  // Swap condition: dir XOR isLess(entries[i], entries[j])
  // If dir=1 (ascending), swap if i > j (isLess=0)
  // If dir=0 (descending), swap if i < j (isLess=1)
  const shouldSwap = xor(dir, isLess(entries[i], entries[j]));

  [entries[i], entries[j]] = cmovSwap(shouldSwap, entries[j], entries[i]);
}

/**
 * Bitonic sort - in-place oblivious sorting.
 *
 * @param entries - Array of sort entries (length must be power of 2)
 *
 * Sorts in ascending order by (k1, k2, k3) lexicographically.
 * Null entries (k1 = INF8) will sort to the end.
 *
 * Time complexity: O(n log^2 n) comparisons
 * Space complexity: O(1) - in-place
 */
export function bitonicSort<T>(entries: SortEntry<T>[]): void {
  const N = entries.length;

  // Outer loop: k = 2, 4, 8, ..., N
  for (let k = 2; k <= N; k *= 2) {
    // Middle loop: j = k/2, k/4, ..., 1
    for (let j = k >> 1; j > 0; j >>= 1) {
      // Inner loop: compare-and-swap pairs
      for (let i = 0; i < N; i++) {
        const partner = i ^ j;

        // Only swap if i < partner (structural, not data-dependent)
        if (i < partner) {
          // Direction: ascending if (i & k) == 0, descending otherwise
          const dir = ((i & k) === 0) ? TRUE8 : FALSE8;
          obliviousCAS(entries, i, partner, dir);
        }
      }
    }
  }
}
