/*-----------------------------------------------------------*/
/*  Tests for ObliviousBool, ObliviousInt, ObliviousString   */
/*-----------------------------------------------------------*/
import { describe, it, expect } from "vitest";
import {
  createObliviousBool, andBool, orBool, notBool,
  TRUE8, FALSE8,
  createObliviousInt, eqInt, gtInt,
  createObliviousString, eqString,
  cmov, lit8,
} from "./obliv_ops.js";
import type { ObliviousBool, Obliv8 } from "./obliv_ops.js";
import { revealByte } from "./obliv_crypto.js";
import { isOblivTrue, isOblivFalse } from "./obliv_test.js";

// Helper: unwrap ObliviousBool to 0 or 1
const unwrap = (b: ObliviousBool): number => revealByte(b as unknown as Obliv8);

describe("ObliviousBool", () => {
  it("createObliviousBool(true) gives value 1", () => {
    expect(unwrap(createObliviousBool(true))).toBe(1);
  });

  it("createObliviousBool(false) gives value 0", () => {
    expect(unwrap(createObliviousBool(false))).toBe(0);
  });

  it("TRUE8 has value 1", () => {
    expect(unwrap(TRUE8)).toBe(1);
  });

  it("FALSE8 has value 0", () => {
    expect(unwrap(FALSE8)).toBe(0);
  });

  it("andBool: true AND true = true", () => {
    expect(unwrap(andBool(TRUE8, TRUE8))).toBe(1);
  });

  it("andBool: true AND false = false", () => {
    expect(unwrap(andBool(TRUE8, FALSE8))).toBe(0);
  });

  it("orBool: false OR true = true", () => {
    expect(unwrap(orBool(FALSE8, TRUE8))).toBe(1);
  });

  it("orBool: false OR false = false", () => {
    expect(unwrap(orBool(FALSE8, FALSE8))).toBe(0);
  });

  it("notBool(true) = false", () => {
    expect(unwrap(notBool(TRUE8))).toBe(0);
  });

  it("notBool(false) = true", () => {
    expect(unwrap(notBool(FALSE8))).toBe(1);
  });
});

describe("ObliviousInt", () => {
  it("eqInt: same value is equal", () => {
    const a = createObliviousInt(42);
    const b = createObliviousInt(42);
    expect(unwrap(eqInt(a, b))).toBe(1);
  });

  it("eqInt: different values are not equal", () => {
    const a = createObliviousInt(1);
    const b = createObliviousInt(2);
    expect(unwrap(eqInt(a, b))).toBe(0);
  });

  it("eqInt: zero equals zero", () => {
    expect(unwrap(eqInt(createObliviousInt(0), createObliviousInt(0)))).toBe(1);
  });

  it("gtInt: larger > smaller", () => {
    const a = createObliviousInt(100);
    const b = createObliviousInt(99);
    expect(unwrap(gtInt(a, b))).toBe(1);
  });

  it("gtInt: smaller is not > larger", () => {
    const a = createObliviousInt(5);
    const b = createObliviousInt(10);
    expect(unwrap(gtInt(a, b))).toBe(0);
  });

  it("gtInt: equal values, not greater", () => {
    const a = createObliviousInt(7);
    expect(unwrap(gtInt(a, a))).toBe(0);
  });

  it("gtInt: large 64-bit value", () => {
    const a = createObliviousInt(BigInt("9007199254740993")); // 2^53 + 1
    const b = createObliviousInt(BigInt("9007199254740992")); // 2^53
    expect(unwrap(gtInt(a, b))).toBe(1);
  });

  it("cmov selects correct ObliviousInt", () => {
    const a = createObliviousInt(10);
    const b = createObliviousInt(20);
    const result = cmov(TRUE8, a, b);
    expect(unwrap(eqInt(result, a))).toBe(1);
    const result2 = cmov(FALSE8, a, b);
    expect(unwrap(eqInt(result2, b))).toBe(1);
  });
});

describe("ObliviousString", () => {
  it("eqString: identical strings are equal", () => {
    const a = createObliviousString("hello");
    const b = createObliviousString("hello");
    expect(unwrap(eqString(a, b))).toBe(1);
  });

  it("eqString: different strings are not equal", () => {
    const a = createObliviousString("hello");
    const b = createObliviousString("world");
    expect(unwrap(eqString(a, b))).toBe(0);
  });

  it("eqString: different lengths are not equal", () => {
    const a = createObliviousString("hi");
    const b = createObliviousString("hello");
    expect(unwrap(eqString(a, b))).toBe(0);
  });

  it("eqString: empty strings are equal", () => {
    const a = createObliviousString("");
    const b = createObliviousString("");
    expect(unwrap(eqString(a, b))).toBe(1);
  });

  it("eqString: UTF-8 multi-byte characters", () => {
    const a = createObliviousString("café");
    const b = createObliviousString("café");
    expect(unwrap(eqString(a, b))).toBe(1);
  });

  it("cmov selects correct ObliviousString", () => {
    const a = createObliviousString("alice");
    const b = createObliviousString("bob");
    const result = cmov(TRUE8, a, b);
    expect(unwrap(eqString(result, a))).toBe(1);
    const result2 = cmov(FALSE8, a, b);
    expect(unwrap(eqString(result2, b))).toBe(1);
  });
});

describe("Obliv8 encryption boundary", () => {
  it("Obliv8.value is ciphertext, not plaintext", () => {
    const x = lit8(42);
    expect(x.value).not.toBe(42);
    expect(revealByte(x)).toBe(42);
  });
});

describe("isOblivTrue / isOblivFalse test helpers", () => {
  it("isOblivTrue(TRUE8) is true", () => {
    expect(isOblivTrue(TRUE8)).toBe(true);
  });

  it("isOblivTrue(FALSE8) is false", () => {
    expect(isOblivTrue(FALSE8)).toBe(false);
  });

  it("isOblivFalse(FALSE8) is true", () => {
    expect(isOblivFalse(FALSE8)).toBe(true);
  });

  it("isOblivFalse(TRUE8) is false", () => {
    expect(isOblivFalse(TRUE8)).toBe(false);
  });
});
