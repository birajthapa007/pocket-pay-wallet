import { ChevronRight, User as UserIcon, Shield, HelpCircle, LogOut } from 'lucide-react';
import { User, Screen } from '@/types/wallet';
import { Button } from '@/components/ui/button';

interface SettingsScreenProps {
  user: User;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

const SettingsScreen = ({ user, onNavigate, onLogout }: SettingsScreenProps) => {
  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

  const menuItems = [
    { icon: UserIcon, label: 'Personal info', screen: 'profile' as Screen },
    { icon: Shield, label: 'Security', screen: 'security' as Screen },
    { icon: HelpCircle, label: 'Help', screen: 'help' as Screen },
  ];

  return (
    <div className="screen-container animate-fade-in">
      <h1 className="text-2xl font-bold mb-8">Account</h1>

      {/* Profile Header */}
      <button
        onClick={() => onNavigate('profile')}
        className="w-full flex items-center gap-4 p-4 -mx-4 rounded-2xl hover:bg-secondary/50 transition-colors mb-6"
      >
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
          {getInitials(user.name)}
        </div>
        <div className="flex-1 text-left">
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-muted-foreground">${user.username}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Menu */}
      <div className="menu-list">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.screen)}
            className="menu-item w-full"
          >
            <item.icon className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left font-medium">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="mt-8">
        <Button variant="ghost" size="full" onClick={onLogout} className="text-destructive hover:text-destructive">
          <LogOut className="w-5 h-5" />
          Log out
        </Button>
      </div>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground mt-8">
        Pocket Pay v1.0.0
      </p>
    </div>
  );
};

export default SettingsScreen;
