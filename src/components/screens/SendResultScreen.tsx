import { Check, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';

interface SendResultScreenProps {
  recipient: User;
  amount: number;
  status: 'COMPLETED' | 'PENDING_CONFIRMATION' | 'BLOCKED';
  onDone: () => void;
}

const SendResultScreen = ({ recipient, amount, status, onDone }: SendResultScreenProps) => {
  const getConfig = () => {
    switch (status) {
      case 'COMPLETED':
        return {
          icon: Check,
          iconBg: 'bg-primary',
          iconColor: 'text-primary-foreground',
          title: 'Sent!',
          subtitle: `${formatCurrency(amount)} to ${recipient.name}`,
        };
      case 'PENDING_CONFIRMATION':
        return {
          icon: Clock,
          iconBg: 'bg-warning-soft',
          iconColor: 'text-warning',
          title: 'Processing',
          subtitle: "We're reviewing this transfer. You'll be notified once it's complete.",
        };
      case 'BLOCKED':
        return {
          icon: X,
          iconBg: 'bg-secondary',
          iconColor: 'text-muted-foreground',
          title: 'Transfer paused',
          subtitle: "We couldn't complete this transfer. Your money is safe — please try again or contact support.",
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className="screen-container flex flex-col min-h-screen items-center justify-center text-center animate-fade-in">
      {/* Icon */}
      <div className={`w-24 h-24 rounded-full ${config.iconBg} flex items-center justify-center mb-8 animate-check-pop`}>
        <Icon className={`w-12 h-12 ${config.iconColor}`} strokeWidth={3} />
      </div>

      <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
      <p className="text-muted-foreground max-w-[280px] text-balance mb-12">
        {config.subtitle}
      </p>

      <Button variant="secondary" size="full" onClick={onDone} className="max-w-xs">
        Done
      </Button>
    </div>
  );
};

export default SendResultScreen;
