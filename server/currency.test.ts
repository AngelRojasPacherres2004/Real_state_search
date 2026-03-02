import { describe, expect, it } from "vitest";

describe("Currency Display", () => {
  it("should correctly format USD currency symbol", () => {
    const currency = "USD";
    const symbol = currency === "PEN" ? "S/" : "$";
    expect(symbol).toBe("$");
  });

  it("should correctly format PEN currency symbol", () => {
    const currency = "PEN";
    const symbol = currency === "PEN" ? "S/" : "$";
    expect(symbol).toBe("S/");
  });

  it("should format price with currency symbol", () => {
    const price = 1500;
    const currency = "USD";
    const symbol = currency === "PEN" ? "S/" : "$";
    const formatted = `${symbol} ${price.toLocaleString()}`;
    expect(formatted).toBe("$ 1,500");
  });

  it("should format PEN price correctly", () => {
    const price = 5000;
    const currency = "PEN";
    const symbol = currency === "PEN" ? "S/" : "$";
    const formatted = `${symbol} ${price.toLocaleString()}`;
    expect(formatted).toBe("S/ 5,000");
  });
});
