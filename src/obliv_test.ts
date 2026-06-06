import { Obliv8, ObliviousBool } from "./obliv8.js";
import { revealByte as _revealByte } from "./obliv_crypto.js";
import type { OblivU16 } from "./obliv_u16.js";

export { revealByte } from "./obliv_crypto.js";

/** Test-only: check if an ObliviousBool is true (1). */
export function isOblivTrue(b: ObliviousBool): boolean {
  return _revealByte(b as unknown as Obliv8) === 1;
}

/** Test-only: check if an ObliviousBool is false (0). */
export function isOblivFalse(b: ObliviousBool): boolean {
  return _revealByte(b as unknown as Obliv8) === 0;
}

/** Test-only: reveal the plaintext value of an OblivU16 (0-65535). */
export function revealU16(x: OblivU16): number {
  const bytes = (x as unknown as { _bytes: [Obliv8, Obliv8] })._bytes;
  return (_revealByte(bytes[0]) << 8) | _revealByte(bytes[1]);
}
