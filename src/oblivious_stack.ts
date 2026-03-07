import { Nullable } from "./obliv8.js";
import { cmovSwap, OblivSelectable } from "./obliv_byte.js";

/**
 * Oblivious stack for Nullable values with null-bubbling behavior.
 *
 * When pushing, performs oblivious swaps to ensure null values sink to the bottom.
 * This maintains stack invariant without data-dependent branching.
 */
export class ObliviousNullableStack<T extends Nullable & OblivSelectable> {
  private arr: T[];
  private sp: number;
  private createNull: () => T;

  constructor(createNull: () => T) {
    this.createNull = createNull;
    this.arr = [createNull()];
    this.sp = 0;
  }

  /**
   * Push an item onto the stack, then bubble null values down.
   *
   * After inserting at the top, performs oblivious swaps on each pair
   * from top to bottom. If the upper element is null, it swaps with
   * the lower element, causing nulls to sink.
   */
  push(item: T): void {
    this.arr[this.sp] = item;
    this.sp++;

    // Oblivious bubble: swap pairs from top down if higher element is null
    for (let i = this.sp - 1; i > 0; i--) {
      const upper = this.arr[i];
      const lower = this.arr[i - 1];

      // Check if upper element is null
      const isUpperNull = upper.oblivIsNull();

      // If upper is null, swap (lower goes to upper position, upper goes to lower)
      // Otherwise keep them as they are
      const [newUpper, newLower] = cmovSwap(isUpperNull, lower, upper);
      this.arr[i] = newUpper;
      this.arr[i - 1] = newLower;
    }
  }

  /**
   * Pop an item from the stack.
   * Returns the element at the current stack pointer and decrements the pointer.
   */
  pop(): T {
    if (this.sp <= 0) {
      return this.createNull();
    }
    this.sp--;
    return this.arr[this.sp];
  }

  /**
   * Get the underlying array (for inspection/debugging).
   */
  getArray(): T[] {
    return this.arr;
  }

  /**
   * Get the current stack size.
   */
  size(): number {
    return this.sp;
  }

  /**
   * Check if the stack is empty.
   */
  isEmpty(): boolean {
    return this.sp === 0;
  }
}
