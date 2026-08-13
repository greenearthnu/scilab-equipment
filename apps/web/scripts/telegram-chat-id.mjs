#!/usr/bin/env node
/**
 * หา Telegram chat_id สำหรับแจ้งเตือนผู้ดูแล (TELEGRAM_CHAT_ID)
 *
 * วิธีใช้:
 *   TELEGRAM_BOT_TOKEN="<token จาก BotFather>" node scripts/telegram-chat-id.mjs
 *   หรือ: node scripts/telegram-chat-id.mjs "<token>"
 *
 * หมายเหตุ: bot ต้องเคยได้รับข้อความอย่างน้อย 1 ข้อความก่อน (คุยกับ bot เอง
 * หรือส่งข้อความในกลุ่มที่แอด bot แล้ว) — ไม่งั้น getUpdates จะคืนค่าว่าง
 */
const token = process.env.TELEGRAM_BOT_TOKEN || process.argv[2];
if (!token) {
  console.error("❌ ไม่พบ token — ใช้: TELEGRAM_BOT_TOKEN=\"...\" node scripts/telegram-chat-id.mjs");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${token}`;

async function main() {
  // 1) ตรวจว่า token ถูกต้อง
  const me = await fetch(`${API}/getMe`).then((r) => r.json());
  if (!me.ok) {
    console.error(`❌ Token ไม่ถูกต้อง (HTTP ${me.error_code}): ${me.description}`);
    console.error("   ตรวจว่า copy token เต็ม (มีเครื่องหมาย : อยู่ตรงกลาง เช่น 123456:ABC-DEF...)");
    process.exit(1);
  }
  console.log(`✅ Bot ถูกต้อง: @${me.result.username}`);

  // 2) ลบ update ค้างเก่า แล้วดูเฉพาะรายการใหม่ (กันสับสนจาก chat เก่า)
  await fetch(`${API}/getUpdates`, { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } });
  console.log("📩 ส่งข้อความไปที่ bot / กลุ่ม ตอนนี้ แล้วกด Enter...");
  await new Promise((r) => process.stdin.once("data", r));

  const updates = await fetch(`${API}/getUpdates`).then((r) => r.json());
  if (!updates.ok) {
    console.error(`❌ getUpdates ล้มเหลว: ${updates.description}`);
    process.exit(1);
  }
  const chats = [];
  for (const u of updates.result || []) {
    const msg = u.message || u.channel_post || u.edited_message;
    if (!msg?.chat) continue;
    const c = msg.chat;
    chats.push({
      id: c.id,
      type: c.type,
      title: c.title || c.username || c.first_name || "(ไม่มีชื่อ)",
    });
  }
  if (chats.length === 0) {
    console.error("❌ ยังไม่พบข้อความจาก bot — เช็ค:");
    console.error("   1. คุยกับ bot เอง: กด Start ที่แชท bot (ถ้าใช้แชทส่วนตัว)");
    console.error("   2. ถ้าใช้กลุ่ม: แอด bot เข้ากลุ่ม แล้วส่งข้อความในกลุ่ม");
    console.error("   3. รอ 2-3 วินาที แล้วรันสคริปต์ใหม่");
    process.exit(1);
  }

  const unique = [...new Map(chats.map((c) => [c.id, c])).values()];
  console.log(`\nพบ ${unique.length} chat:`);
  for (const c of unique) {
    console.log(`  ${c.type === "group" || c.type === "supergroup" ? "👥" : "👤"} ${c.title}  →  chat_id = ${c.id}`);
  }
  const group = unique.find((c) => c.type === "group" || c.type === "supergroup");
  const recommended = group || unique[0];
  console.log(`\n👉 ใช้ค่านี้ใน apps/web/.env:\n   TELEGRAM_CHAT_ID="${recommended.id}"`);
}

main().catch((e) => {
  console.error("❌ เกิดข้อผิดพลาด:", e.message);
  process.exit(1);
});
