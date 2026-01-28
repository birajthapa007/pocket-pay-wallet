import { Home, History, BarChart3, Settings } from 'lucide-react';
import { Screen } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const BottomNav = ({ currentScreen, onNavigate }: BottomNavProps) => {
  const navItems = [
    { screen: 'home' as Screen, icon: Home, label: 'Home' },
    { screen: 'history' as Screen, icon: History, label: 'Activity' },
    { screen: 'insights' as Screen, icon: BarChart3, label: 'Insights' },
    { screen: 'settings' as Screen, icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner max-w-md mx-auto">
        {navItems.map(({ screen, icon: Icon, label }) => (
          <button
            key={screen}
            onClick={() => onNavigate(screen)}
            className={cn(
              'nav-item',
              currentScreen === screen && 'active'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
