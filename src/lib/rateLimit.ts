import { NextRequest } from "next/server";

// Keep track of IP hits in memory
const tracker = new Map<string, { count: number; resetTime: number }>();

/**
 * Extracts the client IP address from request headers.
 * Resolves x-forwarded-for header if present, falling back to 127.0.0.1.
 *
 * @param req - NextRequest to extract client IP from
 * @returns Client IP address string
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}

/**
 * Checks if a client IP address has exceeded the rate limit.
 * Uses an in-memory sliding window check.
 *
 * @param ip - Client IP address to evaluate
 * @param limit - Maximum number of requests allowed in the window (default: 60)
 * @param windowMs - Sliding window duration in milliseconds (default: 60000)
 * @returns True if rate limit is exceeded, false otherwise
 */
export function isRateLimited(ip: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const record = tracker.get(ip);

  if (!record) {
    tracker.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return false;
  }

  record.count += 1;
  return record.count > limit;
}
