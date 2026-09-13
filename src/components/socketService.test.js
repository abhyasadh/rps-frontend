import { describe, expect, it } from "vitest";
import { isValidGameId, parseServerMessage } from "./socketService";

describe("socket message validation", () => {
  it("accepts only 6-char lowercase alphanumeric game IDs", () => {
    expect(isValidGameId("a".repeat(6))).toBe(true);
    expect(isValidGameId("abc123")).toBe(true);
    expect(isValidGameId("A".repeat(6))).toBe(false);
    expect(isValidGameId("short")).toBe(false);
    expect(isValidGameId("toolong123")).toBe(false);
    expect(isValidGameId("ab-def")).toBe(false);
  });

  it("rejects malformed and oversized server frames", () => {
    expect(parseServerMessage({ data: "not-json" })).toBeNull();
    expect(parseServerMessage({ data: JSON.stringify({}) })).toBeNull();
    expect(parseServerMessage({ data: `{"type":"error","message":"${"x".repeat(9000)}"}` })).toBeNull();
  });

  it("parses bounded protocol messages", () => {
    expect(parseServerMessage({ data: JSON.stringify({ type: "game_joined" }) })).toEqual({
      type: "game_joined",
    });
  });
});
