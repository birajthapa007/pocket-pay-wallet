import React from 'react';
import { ArrowLeft, Fingerprint, Smartphone, Shield, Key } from 'lucide-react';
import { UserSettings } from '@/types/wallet';

interface SecurityScreenProps {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => void;
  onBack: () => void;
}

const SecurityScreen = React.forwardRef<HTMLDivElement, SecurityScreenProps>(
  ({ settings, onUpdate, onBack }, ref) => {
    const toggleSetting = (category: 'security' | 'privacy', key: string) => {
      const currentCategory = settings[category] as Record<string, boolean>;
      onUpdate({
        [category]: {
          ...currentCategory,
          [key]: !currentCategory[key],
        },
      });
    };

    const securityItems = [
      {
        icon: Fingerprint,
        label: 'Biometric Login',
        description: 'Use Face ID or fingerprint',
        key: 'biometric',
        enabled: settings.security.biometric,
      },
      {
        icon: Smartphone,
        label: 'Two-Factor Auth',
        description: 'Extra security for your account',
        key: 'twoFactor',
        enabled: settings.security.twoFactor,
      },
    ];

    const privacyItems = [
      {
        icon: Shield,
        label: 'Hide Balance',
        description: 'Mask your balance on home screen',
        key: 'hideBalance',
        enabled: settings.privacy.hideBalance,
        category: 'privacy' as const,
      },
      {
        icon: Key,
        label: 'Private Mode',
        description: 'Hide transaction details',
        key: 'privateMode',
        enabled: settings.privacy.privateMode,
        category: 'privacy' as const,
      },
    ];

    return (
      <div ref={ref} className="screen-container animate-fade-in min-h-screen safe-top">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Security</h1>
        </div>

        {/* Security Section */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Authentication</p>
          <div className="menu-section">
            {securityItems.map((item, i) => (
              <div key={i} className="settings-item">
                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                </div>
                <button
                  onClick={() => toggleSetting('security', item.key)}
                  className={`toggle-track flex-shrink-0 ${item.enabled ? 'active' : ''}`}
                >
                  <div className="toggle-thumb ml-1" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Section */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Privacy</p>
          <div className="menu-section">
            {privacyItems.map((item, i) => (
              <div key={i} className="settings-item">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                </div>
                <button
                  onClick={() => toggleSetting('privacy', item.key)}
                  className={`toggle-track flex-shrink-0 ${item.enabled ? 'active' : ''}`}
                >
                  <div className="toggle-thumb ml-1" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-info-soft rounded-2xl border border-info/20">
          <p className="text-sm text-foreground">
            <span className="font-medium">Bank-level security</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Your data is encrypted with 256-bit AES encryption, the same standard used by major banks.
          </p>
        </div>
      </div>
    );
  }
);

SecurityScreen.displayName = 'SecurityScreen';

export default SecurityScreen;
