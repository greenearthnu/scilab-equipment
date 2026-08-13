import { getScoreSettings } from "@/lib/score-settings";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";

/** เปิดเผยการตั้งค่า (เช่น เกณฑ์คะแนน) ให้ mobile ใช้แสดงผลได้ตรงกับเว็บ */
export const GET = withApiError(async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorized();
  const settings = await getScoreSettings();
  return Response.json({ settings });
});
