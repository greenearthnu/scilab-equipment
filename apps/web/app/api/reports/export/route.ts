import { ROLES, isAdminRole } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";
import { getReportData, reportToCsv } from "@/lib/stats";

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const GET = withApiError(async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== ROLES.EXECUTIVE && !isAdminRole(user.role)) {
    return Response.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));

  const data = await getReportData(from, to);
  const csv = reportToCsv(data);

  const dateStr = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scilab-report-${dateStr}.csv"`,
    },
  });
});
