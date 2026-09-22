import React from 'react';
import Sidebar from "@/components/Sidebar";
import UserMenu from "@/components/UserMenu";
import GlobalSearch from "@/components/GlobalSearch";
import MobileTabBar from "@/components/MobileTabBar";
import LanguageSelector from "@/components/LanguageSelector";
import { getSession } from "@/lib/auth";
import { getSystemLogo } from "@/app/actions/settings";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, logoUrl] = await Promise.all([
    getSession(),
    getSystemLogo()
  ]);

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} logoUrl={logoUrl} />
      <main className="main-content">
        {/* Desktop Top Bar */}
        <header className="top-bar">
          <div className="container flex justify-between items-center">
            <GlobalSearch />
            <div className="flex items-center gap-md">
               <LanguageSelector />
               <UserMenu user={user} />
            </div>
          </div>
        </header>

        {/* Mobile Compact Header */}
        <div className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logoUrl} alt="Logo" width={44} height={44} style={{ borderRadius: '8px', objectFit: 'contain' }} />
            <LanguageSelector />
          </div>
          <div className="flex items-center gap-md">
            <GlobalSearch />
            <UserMenu user={user} />
          </div>
        </div>

        <div className="content-wrapper" style={{ flex: 1, padding: '32px' }}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar user={user} />
      
      {/* Mobile Preview Toggle for Admins */}
      {/* Optional: Global floating components like generic toast notifications can go here */}
    </div>
  );
}
