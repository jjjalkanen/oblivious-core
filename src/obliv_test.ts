import { Obliv8, ObliviousBool } from "./obliv8.js";
import { revealByte } from "./obliv_crypto.js";

/** Test-only: check if an ObliviousBool is true (1). */
export function isOblivTrue(b: ObliviousBool): boolean {
  return revealByte(b as unknown as Obliv8) === 1;
}

/** Test-only: check if an ObliviousBool is false (0). */
export function isOblivFalse(b: ObliviousBool): boolean {
  return revealByte(b as unknown as Obliv8) === 0;
}
