export type CookieOptions = {
  path?: string;
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  maxAge?: number;
};

export type CookieJar = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string, options?: CookieOptions): void;
};

export function secureCookie(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}
