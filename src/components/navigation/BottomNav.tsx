import { Home, History, BarChart3 } from 'lucide-react';
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
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(({ screen, icon: Icon, label }) => (
        <button
          key={screen}
          onClick={() => onNavigate(screen)}
          className={cn(
            'nav-item',
            currentScreen === screen && 'active'
          )}
        >
          <Icon className="w-6 h-6" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
