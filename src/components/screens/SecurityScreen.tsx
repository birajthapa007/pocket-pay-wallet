import { ArrowLeft, Fingerprint, Smartphone } from 'lucide-react';
import { UserSettings } from '@/types/wallet';

interface SecurityScreenProps {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => void;
  onBack: () => void;
}

const SecurityScreen = ({ settings, onUpdate, onBack }: SecurityScreenProps) => {
  const toggle = (key: keyof UserSettings['security']) => {
    onUpdate({
      security: { ...settings.security, [key]: !settings.security[key] },
    });
  };

  const items = [
    { icon: Fingerprint, label: 'Face ID / Touch ID', key: 'biometric' as const, enabled: settings.security.biometric },
    { icon: Smartphone, label: 'Two-factor authentication', key: 'twoFactor' as const, enabled: settings.security.twoFactor },
  ];

  return (
    <div className="screen-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Security</h1>
      </div>

      <div className="menu-list">
        {items.map((item) => (
          <div key={item.key} className="menu-item">
            <item.icon className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 font-medium">{item.label}</span>
            <button
              onClick={() => toggle(item.key)}
              className={`toggle-switch ${item.enabled ? 'on' : ''}`}
            >
              <div className="toggle-knob" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 card-subtle">
        <p className="text-sm text-muted-foreground">
          Your account is protected with bank-level encryption. Enable biometrics for faster, more secure access.
        </p>
      </div>
    </div>
  );
};

export default SecurityScreen;
