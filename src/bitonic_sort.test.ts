import { describe, it, expect } from 'vitest';
import { bitonicSort, mkSortEntry, nullSortEntry } from './bitonic_sort.js';
import { lit8, INF8 } from './obliv_byte.js';

describe('bitonicSort', () => {
  it('sorts two elements - reversed', () => {
    const entries = [
      mkSortEntry(lit8(10), lit8(1), lit8(0), lit8(0)),
      mkSortEntry(lit8(20), lit8(0), lit8(0), lit8(0))
    ];

    bitonicSort(entries);

    expect(entries[0].k1.value).toBe(0);
    expect(entries[1].k1.value).toBe(1);
  });

  it('sorts two elements - already sorted', () => {
    const entries = [
      mkSortEntry(lit8(10), lit8(0), lit8(0), lit8(0)),
      mkSortEntry(lit8(20), lit8(1), lit8(0), lit8(0))
    ];

    bitonicSort(entries);

    expect(entries[0].k1.value).toBe(0);
    expect(entries[1].k1.value).toBe(1);
  });

  it('sorts four elements', () => {
    const entries = [
      mkSortEntry(lit8(10), lit8(3), lit8(0), lit8(0)),
      mkSortEntry(lit8(20), lit8(1), lit8(0), lit8(0)),
      mkSortEntry(lit8(30), lit8(4), lit8(0), lit8(0)),
      mkSortEntry(lit8(40), lit8(2), lit8(0), lit8(0))
    ];

    bitonicSort(entries);

    expect(entries[0].k1.value).toBe(1);
    expect(entries[1].k1.value).toBe(2);
    expect(entries[2].k1.value).toBe(3);
    expect(entries[3].k1.value).toBe(4);
  });

  it('uses K2 for tiebreaking', () => {
    const entries = [
      mkSortEntry(lit8(10), lit8(1), lit8(1), lit8(0)),
      mkSortEntry(lit8(20), lit8(1), lit8(0), lit8(0)),
      nullSortEntry(INF8),
      nullSortEntry(INF8)
    ];

    bitonicSort(entries);

    // k2=0 should come before k2=1
    expect(entries[0].k1.value).toBe(1);
    expect(entries[0].k2.value).toBe(0);
    expect(entries[1].k1.value).toBe(1);
    expect(entries[1].k2.value).toBe(1);
    expect(entries[2].k1.value).toBe(255);
    expect(entries[3].k1.value).toBe(255);
  });

  it('uses K3 for tiebreaking', () => {
    const entries = [
      mkSortEntry(lit8(10), lit8(5), lit8(1), lit8(253)),
      mkSortEntry(lit8(20), lit8(5), lit8(1), lit8(251)),
      nullSortEntry(INF8),
      nullSortEntry(INF8)
    ];

    bitonicSort(entries);

    // k3=251 should come before k3=253
    expect(entries[0].k1.value).toBe(5);
    expect(entries[0].k2.value).toBe(1);
    expect(entries[0].k3.value).toBe(251);
    expect(entries[1].k1.value).toBe(5);
    expect(entries[1].k2.value).toBe(1);
    expect(entries[1].k3.value).toBe(253);
    expect(entries[2].k1.value).toBe(255);
    expect(entries[3].k1.value).toBe(255);
  });

  it('padding (255,255,255) sorts last', () => {
    const entries = [
      mkSortEntry(lit8(20), lit8(2), lit8(0), lit8(0)),
      nullSortEntry(INF8),
      mkSortEntry(lit8(10), lit8(1), lit8(0), lit8(0)),
      nullSortEntry(INF8)
    ];

    bitonicSort(entries);

    expect(entries[0].k1.value).toBe(1);
    expect(entries[1].k1.value).toBe(2);
    expect(entries[2].k1.value).toBe(255);
    expect(entries[3].k1.value).toBe(255);
  });

  it('sorts eight elements - reversed', () => {
    const entries = [
      mkSortEntry(lit8(10), lit8(8), lit8(0), lit8(0)),
      mkSortEntry(lit8(20), lit8(7), lit8(0), lit8(0)),
      mkSortEntry(lit8(30), lit8(6), lit8(0), lit8(0)),
      mkSortEntry(lit8(40), lit8(5), lit8(0), lit8(0)),
      mkSortEntry(lit8(50), lit8(4), lit8(0), lit8(0)),
      mkSortEntry(lit8(60), lit8(3), lit8(0), lit8(0)),
      mkSortEntry(lit8(70), lit8(2), lit8(0), lit8(0)),
      mkSortEntry(lit8(80), lit8(1), lit8(0), lit8(0))
    ];

    bitonicSort(entries);

    for (let i = 0; i < 8; i++) {
      expect(entries[i].k1.value).toBe(i + 1);
    }
  });
});
