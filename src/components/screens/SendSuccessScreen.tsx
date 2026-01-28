import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';

interface SendSuccessScreenProps {
  recipient: User;
  amount: number;
  note: string;
  onDone: () => void;
}

const SendSuccessScreen = React.forwardRef<HTMLDivElement, SendSuccessScreenProps>(
  ({ recipient, amount, note, onDone }, ref) => {
    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    return (
      <div ref={ref} className="screen-container flex flex-col items-center justify-center min-h-screen animate-fade-in safe-top">
        {/* Success Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-success flex items-center justify-center animate-success shadow-lg">
            <Check className="w-12 h-12 text-success-foreground" strokeWidth={3} />
          </div>
          <div className="absolute inset-0 rounded-full bg-success/30 animate-ping" />
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-foreground mb-2">Sent!</h1>
        <p className="text-muted-foreground text-center mb-8">
          Your payment was successful
        </p>

        {/* Details */}
        <div className="w-full max-w-xs bg-card rounded-2xl p-5 border border-border/50 mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold">
              {getInitials(recipient.name)}
            </div>
            <div className="text-left min-w-0">
              <p className="font-semibold text-foreground truncate">{recipient.name}</p>
              <p className="text-sm text-muted-foreground">@{recipient.username}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">For</p>
              <p className="text-sm font-medium text-foreground max-w-[120px] truncate">"{note}"</p>
            </div>
          </div>
        </div>

        {/* Security Microcopy */}
        <div className="flex items-center justify-center gap-2 mb-8 px-4 py-2 bg-success-soft rounded-full">
          <ShieldCheck className="w-4 h-4 text-success" />
          <span className="text-xs font-medium text-success">Secure transaction complete</span>
        </div>

        {/* Done Button */}
        <div className="w-full max-w-xs safe-bottom pb-4">
          <Button size="full" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    );
  }
);

SendSuccessScreen.displayName = 'SendSuccessScreen';

export default SendSuccessScreen;
