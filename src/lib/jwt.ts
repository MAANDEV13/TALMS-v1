// JWT utilities using jose library
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-not-for-production';

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

export interface JwtPayload {
  sub: string;       // user id
  email: string;
  name: string;
  role: string;
  region?: string;
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
