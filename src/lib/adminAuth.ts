import { createHmac, timingSafeEqual } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";

export const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME ?? "Esmerelda98";
export const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ?? "Yahihahoo2025";
export const ADMIN_CORRECT_IMAGE = "cat-1.avif";
export const ADMIN_IMAGE_OPTIONS = ["cat-1.avif", "cat-2.avif"] as const;

const SESSION_COOKIE = "halal_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "halal-scanner-dev-session-secret";

function signPayload(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const payload = `admin:${Date.now()}`;
  return `${payload}.${signPayload(payload)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) {
    return false;
  }

  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expected = signPayload(payload);

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function getSessionTokenFromRequest(
  req: IncomingMessage,
): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === SESSION_COOKIE) {
      return valueParts.join("=");
    }
  }

  return undefined;
}

export function isAdminAuthenticated(req: IncomingMessage): boolean {
  return isValidSessionToken(getSessionTokenFromRequest(req));
}

export function setAdminSessionCookie(res: ServerResponse, token: string): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`,
  );
}

export function clearAdminSessionCookie(res: ServerResponse): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
  );
}

export function verifyAdminCredentials(
  username: string,
  image: string,
  password: string,
): boolean {
  return (
    username === ADMIN_USERNAME &&
    image === ADMIN_CORRECT_IMAGE &&
    password === ADMIN_PASSWORD
  );
}
