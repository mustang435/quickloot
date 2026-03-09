import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
// bcrypt hash for password - stored in code because .env has issues with $ characters
// To change password: run `node -e "console.log(require('bcryptjs').hashSync('your_password', 12))"`
const ADMIN_PASSWORD_HASH = '$2b$12$m6X0WFjudnLXpp1p3WFpxOSJn2/iq.9FKHMOnHw4Hcewm9821UKsq';
const SESSION_HOURS = parseInt(process.env.ADMIN_SESSION_HOURS || '24');

// ============================================================
// JWT Utilities
// ============================================================
export function signAdminToken() {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign(
    { role: 'admin', iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: `${SESSION_HOURS}h` }
  );
}

export function verifyAdminToken(token) {
  if (!JWT_SECRET || !token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded?.role === 'admin' ? decoded : null;
  } catch (e) {
    return null;
  }
}

// ============================================================
// Password Verification
// ============================================================
export async function verifyAdminPassword(password) {
  if (!ADMIN_PASSWORD_HASH || !password) return false;
  try {
    return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } catch (e) {
    return false;
  }
}

// ============================================================
// Extract token from request
// ============================================================
export function extractToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// ============================================================
// Rate Limiter (In-memory, server-side)
// ============================================================
const rateLimitStore = new Map();

export function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: maxRequests - entry.count };
}

// ============================================================
// Brute Force Protection (MongoDB-backed for persistence)
// ============================================================
export async function checkBruteForce(db, ip) {
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

  const record = await db.collection('loginAttempts').findOne({ ip });
  const now = Date.now();

  if (record) {
    // Check if still locked
    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingSecs = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        blocked: true,
        remainingSecs,
        message: `Too many failed attempts. Try again in ${Math.ceil(remainingSecs / 60)} minute(s).`,
      };
    }

    // Reset if lockout expired
    if (record.lockedUntil && record.lockedUntil <= now) {
      await db.collection('loginAttempts').deleteOne({ ip });
      return { blocked: false };
    }
  }

  return { blocked: false };
}

export async function recordFailedAttempt(db, ip) {
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_MS = 15 * 60 * 1000;
  const now = Date.now();

  const record = await db.collection('loginAttempts').findOne({ ip });

  if (!record) {
    await db.collection('loginAttempts').insertOne({
      ip,
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
      lockedUntil: null,
    });
    return { attempts: 1, locked: false };
  }

  const newAttempts = record.attempts + 1;
  const shouldLock = newAttempts >= MAX_ATTEMPTS;

  await db.collection('loginAttempts').updateOne(
    { ip },
    {
      $set: {
        attempts: newAttempts,
        lastAttempt: now,
        lockedUntil: shouldLock ? now + LOCKOUT_MS : null,
      },
    }
  );

  return { attempts: newAttempts, locked: shouldLock };
}

export async function clearLoginAttempts(db, ip) {
  await db.collection('loginAttempts').deleteOne({ ip });
}

// ============================================================
// Get client IP from request
// ============================================================
export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

// ============================================================
// Sanitize input (basic XSS prevention)
// ============================================================
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim().substring(0, 10000); // max length
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
