import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  redirect("/login");
}
