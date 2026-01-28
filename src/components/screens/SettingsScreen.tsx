import React from 'react';
import { 
  User as UserIcon, 
  Shield, 
  Bell, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Sparkles,
  CreditCard,
  FileText,
  ExternalLink
} from 'lucide-react';
import { User, Screen } from '@/types/wallet';
import { Button } from '@/components/ui/button';

interface SettingsScreenProps {
  user: User;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

const SettingsScreen = React.forwardRef<HTMLDivElement, SettingsScreenProps>(
  ({ user, onNavigate, onLogout }, ref) => {
    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    const menuItems = [
      { icon: UserIcon, label: 'Profile', description: 'Edit your personal info', screen: 'profile' as Screen },
      { icon: CreditCard, label: 'Cards', description: 'Virtual & physical cards', screen: 'cards' as Screen },
      { icon: Shield, label: 'Security', description: 'Password, 2FA, biometrics', screen: 'security' as Screen },
      { icon: Bell, label: 'Notifications', description: 'Manage your alerts', screen: 'notifications' as Screen },
      { icon: HelpCircle, label: 'Help & Support', description: 'FAQs and contact us', screen: 'help' as Screen },
    ];

    const legalItems = [
      { label: 'Terms of Service', icon: FileText, screen: 'terms' as Screen },
      { label: 'Privacy Policy', icon: FileText, screen: 'privacy' as Screen },
    ];

    return (
      <div ref={ref} className="screen-container animate-fade-in safe-top">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your account</p>
        </div>

        {/* Profile Card */}
        <button 
          onClick={() => onNavigate('profile')}
          className="w-full profile-card flex items-center gap-4 mb-6 text-left hover:border-primary/30 transition-colors active:scale-[0.99]"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xl font-bold shadow-glow-sm">
            {getInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg text-foreground truncate">{user.name}</p>
            <p className="text-muted-foreground truncate">@{user.username}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </button>

        {/* Menu Items */}
        <div className="menu-section mb-6">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => item.screen && onNavigate(item.screen)}
              className="settings-item w-full active:scale-[0.99]"
              disabled={!item.screen}
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground truncate">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Legal */}
        <div className="menu-section mb-6">
          {legalItems.map((item, i) => (
            <button 
              key={i} 
              onClick={() => onNavigate(item.screen)}
              className="settings-item w-full active:scale-[0.99]"
            >
              <item.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-left text-foreground">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <Button
          variant="danger"
          size="full"
          onClick={onLogout}
          className="mb-6"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>

        {/* App Info */}
        <div className="text-center text-muted-foreground pb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium">Pocket Pay</span>
          </div>
          <p className="text-xs">Version 1.0.0</p>
        </div>
      </div>
    );
  }
);

SettingsScreen.displayName = 'SettingsScreen';

export default SettingsScreen;
