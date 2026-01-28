import { ArrowLeft, Bell, Shield, Megaphone } from 'lucide-react';
import { UserSettings } from '@/types/wallet';

interface NotificationsScreenProps {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => void;
  onBack: () => void;
}

const NotificationsScreen = ({ settings, onUpdate, onBack }: NotificationsScreenProps) => {
  const toggleNotification = (key: keyof UserSettings['notifications']) => {
    onUpdate({
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    });
  };

  const notificationItems = [
    {
      icon: Bell,
      label: 'Transaction Alerts',
      description: 'Get notified for all payments',
      key: 'transactions' as const,
      enabled: settings.notifications.transactions,
    },
    {
      icon: Shield,
      label: 'Security Alerts',
      description: 'Login attempts and suspicious activity',
      key: 'security' as const,
      enabled: settings.notifications.security,
    },
    {
      icon: Megaphone,
      label: 'Marketing',
      description: 'Offers, tips, and news',
      key: 'marketing' as const,
      enabled: settings.notifications.marketing,
    },
  ];

  return (
    <div className="screen-container animate-fade-in min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      {/* Notification Settings */}
      <div className="menu-section">
        {notificationItems.map((item, i) => (
          <div key={i} className="settings-item">
            <div className={`w-10 h-10 rounded-xl ${item.key === 'security' ? 'bg-success-soft' : 'bg-secondary'} flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 ${item.key === 'security' ? 'text-success' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <button
              onClick={() => toggleNotification(item.key)}
              className={`toggle-track ${item.enabled ? 'active' : ''}`}
            >
              <div className="toggle-thumb ml-1" />
            </button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-warning-soft rounded-2xl border border-warning/20">
        <p className="text-sm text-foreground">
          <span className="font-medium">Security alerts are recommended</span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          We strongly recommend keeping security alerts enabled to protect your account.
        </p>
      </div>
    </div>
  );
};

export default NotificationsScreen;
