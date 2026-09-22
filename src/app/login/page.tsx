import { getSystemLogo } from '@/app/actions/settings';
import LoginForm from '@/components/LoginForm';
import { getTranslationServer } from '@/lib/i18n/server';
import LanguageSelector from '@/components/LanguageSelector';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const logoUrl = await getSystemLogo();
  const { t } = await getTranslationServer();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: '#f8fafc'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'white', 
            borderRadius: '20px', 
            margin: '0 auto 20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            padding: '10px'
          }}>
            <img 
              src={logoUrl} 
              alt="Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '8px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {t('login.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>{t('login.subtitle')}</p>
        </div>
        
        <LoginForm />
      </div>

      <div style={{ marginTop: '24px' }}>
        <LanguageSelector />
      </div>
    </div>
  );
}
