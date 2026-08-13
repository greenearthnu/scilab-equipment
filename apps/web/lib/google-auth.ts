import 'server-only'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'

export interface GoogleProfile {
  aud: string
  sub: string
  email: string
  emailVerified: boolean
  name: string
  picture: string | null
}

export function allowedGoogleDomain(): string {
  return process.env.GOOGLE_ALLOWED_DOMAIN || "school.ac.th";
}

export function isAllowedGoogleEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${allowedGoogleDomain()}`);
}

export function googleClientConfig(): {
  clientId: string
  clientSecret: string
} | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

export function allowedGoogleAudiences(): string[] {
  return [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
  ].filter((v): v is string => Boolean(v))
}

/**
 * ดึง origin ที่ใช้สร้าง URL redirect:
 * 1. ถ้าตั้ง APP_PUBLIC_URL ไว้ → ใช้ค่านั้นเสมอ (URL คงที่เดียวที่ทุกเครื่องเข้าผ่านกัน
 *    เช่น https://scilab.example.com — ไม่ต้องแก้ Google Console ทุกครั้งที่ IP เปลี่ยน)
 * 2. ไม่ได้ตั้ง → ใช้ Host / X-Forwarded-Host header จริงของคำขอ
 *    (แทน request.url เพราะ Next dev server normalize request.url เป็น localhost เสมอ)
 */
export function appOrigin(request: Request): string {
  const configured = process.env.APP_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * สร้าง redirect URI จาก host จริงของคำขอ (Host / X-Forwarded-Host header)
 * แทน request.url เพราะ Next dev server normalize request.url เป็น localhost เสมอ
 * ทำให้ล็อกอินจากเครื่องอื่นใน LAN ได้ (redirect กลับมาที่ IP จริงของเครื่อง server)
 */
export function buildRedirectUri(
  request: Request,
  path = "/api/auth/google/callback"
): string {
  return `${appOrigin(request)}${path}`;
}

export function buildGoogleAuthUrl(state: string, redirectUri: string): string {
  const config = googleClientConfig()
  if (!config) throw new Error('google not configured')
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForIdToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const config = googleClientConfig()
  if (!config) throw new Error('google not configured')
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })
  if (!res.ok) throw new Error('google token exchange failed')
  const data = await res.json()
  if (!data?.id_token) throw new Error('google token exchange failed')
  return data.id_token as string
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const url = `${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('google token invalid')
  const data = await res.json()
  return {
    aud: data.aud,
    sub: data.sub,
    email: data.email,
    // tokeninfo returns email_verified as a string "true"/"false"
    emailVerified: data.email_verified === true || data.email_verified === 'true',
    name: data.name || '',
    picture: data.picture || null,
  }
}
