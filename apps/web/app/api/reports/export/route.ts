import { ROLES } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";
import { getReportData, reportToCsv } from "@/lib/stats";

export const GET = withApiError(async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== ROLES.EXECUTIVE && user.role !== ROLES.LAB_ADMIN) {
    return Response.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const data = await getReportData();
  const csv = reportToCsv(data);

  const dateStr = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scilab-report-${dateStr}.csv"`,
    },
  });
});
