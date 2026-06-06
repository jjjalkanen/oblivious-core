/*-----------------------------------------------------------*/
/*  Platform-side oblivious arrays with O(1) access          */
/*  Stores plaintext internally; encrypts/decrypts at API    */
/*  boundary only.                                           */
/*-----------------------------------------------------------*/
import { Obliv8, ObliviousBool } from "./obliv8.js";
import { decryptByte, getCounter } from "./obliv_crypto.js";
import { lit8 } from "./obliv_byte.js";
import { createOblivU16 } from "./obliv_u16.js";
import type { OblivU16 } from "./obliv_u16.js";

const reveal = (o: Obliv8): number => decryptByte(o.value, getCounter(o));

const revealU16 = (x: OblivU16): number => {
  const bytes = (x as unknown as { _bytes: [Obliv8, Obliv8] })._bytes;
  return (reveal(bytes[0]) << 8) | reveal(bytes[1]);
};

export class ObliviousByteArray {
  private data: number[];

  private constructor(data: number[]) {
    this.data = data;
  }

  static create(length: number): ObliviousByteArray {
    return new ObliviousByteArray(new Array(length).fill(0));
  }

  static fromPlain(values: number[]): ObliviousByteArray {
    return new ObliviousByteArray([...values]);
  }

  static fromEncrypted(values: Obliv8[]): ObliviousByteArray {
    return new ObliviousByteArray(values.map(reveal));
  }

  get length(): number {
    return this.data.length;
  }

  read(index: Obliv8): Obliv8 {
    return lit8(this.data[reveal(index)]);
  }

  write(index: Obliv8, value: Obliv8, mask: ObliviousBool): void {
    const i = reveal(index);
    if (reveal(mask as unknown as Obliv8) === 1) {
      this.data[i] = reveal(value);
    }
  }
}

export class ObliviousU16Array {
  private data: number[];

  private constructor(data: number[]) {
    this.data = data;
  }

  static create(length: number): ObliviousU16Array {
    return new ObliviousU16Array(new Array(length).fill(0));
  }

  static fromPlain(values: number[]): ObliviousU16Array {
    return new ObliviousU16Array([...values]);
  }

  get length(): number {
    return this.data.length;
  }

  read(index: Obliv8): OblivU16 {
    return createOblivU16(this.data[reveal(index)]);
  }

  write(index: Obliv8, value: OblivU16, mask: ObliviousBool): void {
    const i = reveal(index);
    if (reveal(mask as unknown as Obliv8) === 1) {
      this.data[i] = revealU16(value);
    }
  }
}

export class ObliviousTable {
  private flat: number[][];
  private numCols: number;

  constructor(raw: number[][][], numCols: number) {
    this.numCols = numCols;
    this.flat = new Array(raw.length * numCols);
    for (let s = 0; s < raw.length; s++) {
      for (let t = 0; t < numCols; t++) {
        this.flat[s * numCols + t] = raw[s][t];
      }
    }
  }

  lookup(state: OblivU16, symbol: Obliv8): {
    actionType: Obliv8;
    target: OblivU16;
    popCount: Obliv8;
    ruleId: Obliv8;
  } {
    const s = revealU16(state);
    const t = reveal(symbol);
    const cell = this.flat[s * this.numCols + t];
    return {
      actionType: lit8(cell[0]),
      target: createOblivU16(cell[1]),
      popCount: lit8(cell[2]),
      ruleId: lit8(cell[3]),
    };
  }
}
