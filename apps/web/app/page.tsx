import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";

export default async function Home() {
  await getCurrentUser();
  redirect("/dashboard");
}
