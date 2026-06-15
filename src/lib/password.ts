import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const keyLength = 64;
const scryptOptions = {
  N: 16384,
  r: 8,
  p: 1
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, keyLength, scryptOptions).toString("base64url");
  return `scrypt$${scryptOptions.N}$${scryptOptions.r}$${scryptOptions.p}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [scheme, rawN, rawR, rawP, salt, hash] = storedHash.split("$");
  if (scheme !== "scrypt" || !rawN || !rawR || !rawP || !salt || !hash) {
    return false;
  }

  const options = {
    N: Number(rawN),
    r: Number(rawR),
    p: Number(rawP)
  };

  if (!Number.isFinite(options.N) || !Number.isFinite(options.r) || !Number.isFinite(options.p)) {
    return false;
  }

  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password, salt, expected.length, options);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
