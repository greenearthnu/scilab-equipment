import "server-only";

/**
 * ห่อ route handler เพื่อกันไม่ให้ route crash ด้วย error ที่ไม่ได้จัดการ
 * เปลี่ยนเป็น response JSON 500 แทน HTML error page
 */
export function withApiError<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("[api] unhandled error:", error);
      return Response.json(
        { error: "เกิดข้อผิดพลาด โปรดลองใหม่ภายหลัง" },
        { status: 500 }
      );
    }
  };
}
