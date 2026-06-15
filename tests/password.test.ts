import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/password";

describe("password hashing", () => {
  it("verifies the original password and rejects a different one", () => {
    const hash = hashPassword("admin");

    expect(hash).not.toBe("admin");
    expect(verifyPassword("admin", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });
});
