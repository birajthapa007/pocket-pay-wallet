import { Home, Clock, PieChart, User } from 'lucide-react';
import { Screen } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const BottomNav = ({ currentScreen, onNavigate }: BottomNavProps) => {
  const items = [
    { screen: 'home' as Screen, icon: Home, label: 'Home' },
    { screen: 'history' as Screen, icon: Clock, label: 'Activity' },
    { screen: 'insights' as Screen, icon: PieChart, label: 'Insights' },
    { screen: 'settings' as Screen, icon: User, label: 'Account' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-pill">
        {items.map(({ screen, icon: Icon, label }) => (
          <button
            key={screen}
            onClick={() => onNavigate(screen)}
            className={cn('nav-item', currentScreen === screen && 'active')}
          >
            <Icon className="w-5 h-5" strokeWidth={currentScreen === screen ? 2.5 : 2} />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
