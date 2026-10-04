import { describe, expect, it } from "vitest";
import { formatCompact, formatPrice } from "./format";

describe("formatCompact", () => {
  it.each([
    [5, "5"],
    [523, "523"],
    [9_999, "9,999"],
    [10_000, "10,000"],
    [10_001, "10K"],
    [92_985, "93K"],
    [45_678, "45.7K"],
    [1_234_567, "1.2M"],
    [10_000_000, "10M"],
    [2_500_000_000, "2.5B"],
    [3e12 + 1, "3T"],
    [-12_345, "-12.3K"],
  ])("%d → %s", (value, expected) => {
    expect(formatCompact(value)).toBe(expected);
  });
});

describe("formatPrice", () => {
  it.each([
    [1.2345, "1.23"],
    [12, "12.00"],
    [0.01234, "0.01234"],
    [0.000012345678, "0.00001235"],
    [0.1, "0.1"],
    [0, "0"],
    [Number.NaN, "0"],
    [1e-12, "0"],
  ])("%d → %s", (value, expected) => {
    expect(formatPrice(value)).toBe(expected);
  });
});
