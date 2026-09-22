import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user || user.role !== 'ADMIN') {
    redirect('/');
  }

  return <>{children}</>;
}
