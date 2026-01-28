import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';

interface SendConfirmScreenProps {
  recipient: User;
  amount: number;
  onConfirm: () => void;
  onBack: () => void;
}

const SendConfirmScreen = ({ recipient, amount, onConfirm, onBack }: SendConfirmScreenProps) => {
  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');
  const showLargeAmountNote = amount > 500;

  return (
    <div className="screen-container flex flex-col min-h-screen animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Confirmation Card */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold mb-6">
          {getInitials(recipient.name)}
        </div>
        
        <p className="text-muted-foreground mb-1">Sending to</p>
        <p className="text-xl font-semibold mb-8">{recipient.name}</p>
        
        <p className="text-5xl font-bold">{formatCurrency(amount)}</p>

        {showLargeAmountNote && (
          <div className="friendly-alert mt-8 max-w-xs animate-fade-in">
            <p className="text-sm text-foreground">
              Just confirming — this is a larger transfer. Tap below if everything looks good.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button variant="pay" size="full" onClick={onConfirm}>
          Send {formatCurrency(amount)}
        </Button>
        <Button variant="ghost" size="full" onClick={onBack}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default SendConfirmScreen;
