import React from 'react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/ProfileForm';
import { getTranslationServer } from '@/lib/i18n/server';

export default async function ProfilePage() {
  const { t } = await getTranslationServer();
  const user = await getSession();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch full user data including new fields
  const userData = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!userData) return null;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>{t('profile.page_title')}</h1>
        <p>{t('profile.page_subtitle')}</p>
      </header>

      <ProfileForm userData={userData} />
    </div>
  );
}
