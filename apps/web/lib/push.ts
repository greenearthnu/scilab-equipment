import "server-only";
import { db } from "@scilab/db";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * ส่ง push notification ผ่าน Expo Push Service
 * ในโหมด development (Expo Go) ไม่ต้องใช้ access token
 * สำหรับ production ตั้ง EXPO_ACCESS_TOKEN ใน env
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string
): Promise<void> {
  const devices = await db.device.findMany({
    where: { userId },
    select: { pushToken: true },
  });

  if (devices.length === 0) return;

  const accessToken = process.env.EXPO_ACCESS_TOKEN;

  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        host: "exp.host",
        accept: "application/json",
        "accept-encoding": "gzip, deflate",
        "content-type": "application/json",
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        to: devices.map((d) => d.pushToken),
        title,
        body,
        sound: "default",
      }),
    });
  } catch (e) {
    console.error("Failed to send push notification:", e);
  }
}

export async function sendPushToRole(
  role: string,
  title: string,
  body: string
): Promise<void> {
  const users = await db.user.findMany({
    where: { role: role as never },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  const devices = await db.device.findMany({
    where: { userId: { in: userIds } },
    select: { pushToken: true },
  });

  if (devices.length === 0) return;

  const accessToken = process.env.EXPO_ACCESS_TOKEN;

  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        host: "exp.host",
        accept: "application/json",
        "accept-encoding": "gzip, deflate",
        "content-type": "application/json",
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        to: devices.map((d) => d.pushToken),
        title,
        body,
        sound: "default",
      }),
    });
  } catch (e) {
    console.error("Failed to send push notification:", e);
  }
}
