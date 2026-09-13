import { describe, expect, it } from "vitest";
import { isValidGameId, parseServerMessage } from "./socketService";

describe("socket message validation", () => {
  it("accepts only canonical Cloudflare game IDs", () => {
    expect(isValidGameId("a".repeat(32))).toBe(true);
    expect(isValidGameId("A".repeat(32))).toBe(false);
    expect(isValidGameId("short-id")).toBe(false);
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
