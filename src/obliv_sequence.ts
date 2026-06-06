/*-----------------------------------------------------------*/
/*  ObliviousSequence — dynamic list with oblivious indices  */
/*  All read/write/insert/delete operations use encrypted    */
/*  indices so the access position is never revealed.        */
/*-----------------------------------------------------------*/
import type { Obliv8, ObliviousBool } from "./obliv8.js";
import type { OblivSelectable } from "./obliv_byte.js";
import { cmov } from "./obliv_byte.js";
import type { ObliviousInt } from "./obliv_higher.js";
import { createObliviousInt, eqInt, geInt } from "./obliv_higher.js";

/**
 * A dynamic sequence of OblivSelectable values with oblivious index access.
 *
 * All operations take an encrypted ObliviousInt index so the observer cannot
 * determine which position is being read, written, inserted, or deleted.
 * The sequence length is public (same as array lengths elsewhere in obliv-core).
 *
 * Every operation is O(N) — a full linear scan — to avoid leaking the target
 * position through timing or memory access patterns.
 */
export class ObliviousSequence<T extends OblivSelectable> {
  private data: T[];

  private constructor(data: T[]) {
    this.data = data;
  }

  static create<T extends OblivSelectable>(): ObliviousSequence<T> {
    return new ObliviousSequence<T>([]);
  }

  static from<T extends OblivSelectable>(values: T[]): ObliviousSequence<T> {
    return new ObliviousSequence<T>([...values]);
  }

  get length(): number {
    return this.data.length;
  }

  /**
   * Read the value at an oblivious index. O(N) linear scan.
   * Returns the value at the position matching `index`.
   * Caller must ensure 0 <= reveal(index) < length.
   */
  read(index: ObliviousInt, fallback: T): T {
    let result = fallback;
    for (let i = 0; i < this.data.length; i++) {
      const isMatch = eqInt(index, createObliviousInt(i));
      result = cmov(isMatch, this.data[i], result);
    }
    return result;
  }

  /**
   * Replace the value at an oblivious index. O(N) linear scan.
   * Every slot is visited; only the matching one is updated.
   */
  write(index: ObliviousInt, value: T): void {
    for (let i = 0; i < this.data.length; i++) {
      const isMatch = eqInt(index, createObliviousInt(i));
      this.data[i] = cmov(isMatch, value, this.data[i]);
    }
  }

  /**
   * Insert a value at an oblivious index. O(N) linear scan.
   *
   * Grows the sequence by 1 (publicly observable). All elements at
   * positions >= index are shifted right by one. The observer learns
   * that the length increased but not where the insertion occurred.
   */
  insertAt(index: ObliviousInt, value: T): void {
    if (this.data.length === 0) {
      this.data.push(value);
      return;
    }

    const last = this.data[this.data.length - 1];
    this.data.push(last);

    // Scan from the new last position down to 0.
    // Positions >= index shift right (take from i-1); the target gets the new value.
    for (let i = this.data.length - 1; i >= 0; i--) {
      const shouldShift = geInt(createObliviousInt(i), index);
      if (i > 0) {
        this.data[i] = cmov(shouldShift, this.data[i - 1], this.data[i]);
      }
      const isTarget = eqInt(createObliviousInt(i), index);
      this.data[i] = cmov(isTarget, value, this.data[i]);
    }
  }

  /**
   * Delete the value at an oblivious index. O(N) linear scan.
   *
   * Shrinks the sequence by 1 (publicly observable). All elements at
   * positions > index are shifted left by one. The observer learns
   * that the length decreased but not which position was removed.
   */
  deleteAt(index: ObliviousInt): void {
    if (this.data.length === 0) return;

    for (let i = 0; i < this.data.length - 1; i++) {
      const isAtOrPast = geInt(createObliviousInt(i), index);
      this.data[i] = cmov(isAtOrPast, this.data[i + 1], this.data[i]);
    }

    this.data.pop();
  }

  /** Direct access to the backing array (platform-internal). */
  toArray(): T[] {
    return [...this.data];
  }
}
