import { describe, it, expect } from "vitest";
import { createObliviousString, eqString, createObliviousInt } from "./obliv_higher.js";
import { ObliviousSequence } from "./obliv_sequence.js";
import { isOblivTrue } from "./obliv_test.js";

describe("ObliviousSequence", () => {
  const s = (v: string) => createObliviousString(v);
  const idx = (n: number) => createObliviousInt(n);

  it("starts empty", () => {
    const seq = ObliviousSequence.create();
    expect(seq.length).toBe(0);
  });

  it("insertAt into empty sequence", () => {
    const seq = ObliviousSequence.create();
    seq.insertAt(idx(0), s("a"));
    expect(seq.length).toBe(1);
    expect(isOblivTrue(eqString(seq.read(idx(0), s("")), s("a")))).toBe(true);
  });

  it("insertAt appends at end", () => {
    const seq = ObliviousSequence.from([s("a"), s("b")]);
    seq.insertAt(idx(2), s("c"));
    expect(seq.length).toBe(3);
    expect(isOblivTrue(eqString(seq.read(idx(0), s("")), s("a")))).toBe(true);
    expect(isOblivTrue(eqString(seq.read(idx(1), s("")), s("b")))).toBe(true);
    expect(isOblivTrue(eqString(seq.read(idx(2), s("")), s("c")))).toBe(true);
  });

  it("insertAt shifts elements right", () => {
    const seq = ObliviousSequence.from([s("a"), s("c")]);
    seq.insertAt(idx(1), s("b"));
    expect(seq.length).toBe(3);
    expect(isOblivTrue(eqString(seq.read(idx(0), s("")), s("a")))).toBe(true);
    expect(isOblivTrue(eqString(seq.read(idx(1), s("")), s("b")))).toBe(true);
    expect(isOblivTrue(eqString(seq.read(idx(2), s("")), s("c")))).toBe(true);
  });

  it("insertAt at beginning shifts all", () => {
    const seq = ObliviousSequence.from([s("b"), s("c")]);
    seq.insertAt(idx(0), s("a"));
    expect(seq.length).toBe(3);
    expect(isOblivTrue(eqString(seq.read(idx(0), s("")), s("a")))).toBe(true);
    expect(isOblivTrue(eqString(seq.read(idx(1), s("")), s("b")))).toBe(true);
    expect(isOblivTrue(eqString(seq.read(idx(2), s("")), s("c")))).toBe(true);
  });

  it("deleteAt removes element and shifts left", () => {
    const seq = ObliviousSequence.from([s("a"), s("b"), s("c")]);
    seq.deleteAt(idx(1));
    expect(seq.length).toBe(2);
    expect(isOblivTrue(eqString(seq.read(idx(0), s("")), s("a")))).toBe(true);
    expect(isOblivTrue(eqString(seq.read(idx(1), s("")), s("c")))).toBe(true);
  });

  it("deleteAt at beginning", () => {
    const seq = ObliviousSequence.from([s("a"), s("b"), s("c")]);
    seq.deleteAt(idx(0));
    expect(seq.length).toBe(2);
    expect(isOblivTrue(eqString(seq.read(idx(0), s("")), s("b")))).toBe(true);
    expect(isOblivTrue(eqString(seq.read(idx(1), s("")), s("c")))).toBe(true);
  });

  it("deleteAt at end", () => {
    const seq = ObliviousSequence.from([s("a"), s("b"), s("c")]);
    seq.deleteAt(idx(2));
    expect(seq.length).toBe(2);
    expect(isOblivTrue(eqString(seq.read(idx(0), s("")), s("a")))).toBe(true);
    expect(isOblivTrue(eqString(seq.read(idx(1), s("")), s("b")))).toBe(true);
  });

  it("write replaces at index", () => {
    const seq = ObliviousSequence.from([s("a"), s("b"), s("c")]);
    seq.write(idx(1), s("X"));
    expect(isOblivTrue(eqString(seq.read(idx(0), s("")), s("a")))).toBe(true);
    expect(isOblivTrue(eqString(seq.read(idx(1), s("")), s("X")))).toBe(true);
    expect(isOblivTrue(eqString(seq.read(idx(2), s("")), s("c")))).toBe(true);
  });

  it("insert then delete restores original", () => {
    const seq = ObliviousSequence.from([s("a"), s("b")]);
    seq.insertAt(idx(1), s("X"));
    expect(seq.length).toBe(3);
    seq.deleteAt(idx(1));
    expect(seq.length).toBe(2);
    expect(isOblivTrue(eqString(seq.read(idx(0), s("")), s("a")))).toBe(true);
    expect(isOblivTrue(eqString(seq.read(idx(1), s("")), s("b")))).toBe(true);
  });

  it("build string character by character", () => {
    const seq = ObliviousSequence.create();
    const word = "hello";
    for (let i = 0; i < word.length; i++) {
      seq.insertAt(idx(i), s(word[i]));
    }
    expect(seq.length).toBe(5);
    for (let i = 0; i < word.length; i++) {
      expect(isOblivTrue(eqString(seq.read(idx(i), s("")), s(word[i])))).toBe(true);
    }
  });
});
