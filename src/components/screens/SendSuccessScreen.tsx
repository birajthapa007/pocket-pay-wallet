import React from 'react';
import { Check, ShieldCheck, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, Transaction } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';

interface SendSuccessScreenProps {
  recipient: User;
  amount: number;
  note: string;
  transaction?: Transaction | null;
  onDone: () => void;
}

const SendSuccessScreen = React.forwardRef<HTMLDivElement, SendSuccessScreenProps>(
  ({ recipient, amount, note, transaction, onDone }, ref) => {
    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    const status = transaction?.status || 'completed';
    const isRisky = transaction?.isRisky || false;

    return (
      <div ref={ref} className="screen-container flex flex-col items-center justify-center min-h-screen animate-fade-in safe-top">
        {/* Success/Pending/Blocked Icon */}
        <div className="relative mb-8">
          {status === 'completed' && (
            <>
              <div className="w-24 h-24 rounded-full bg-success flex items-center justify-center animate-success shadow-lg">
                <Check className="w-12 h-12 text-success-foreground" strokeWidth={3} />
              </div>
              <div className="absolute inset-0 rounded-full bg-success/30 animate-ping" />
            </>
          )}
          {status === 'pending' && (
            <div className="w-24 h-24 rounded-full bg-warning flex items-center justify-center shadow-lg">
              <Clock className="w-12 h-12 text-warning-foreground" strokeWidth={2} />
            </div>
          )}
          {status === 'blocked' && (
            <div className="w-24 h-24 rounded-full bg-destructive flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-12 h-12 text-destructive-foreground" strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {status === 'completed' ? 'Sent!' : status === 'pending' ? 'Processing' : 'Blocked'}
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          {status === 'completed' 
            ? 'Your payment was successful' 
            : status === 'pending'
            ? 'Your payment is being verified'
            : 'This transfer was blocked for your protection'}
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
          
          <div className="text-center py-3 border-t border-border/50">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(amount)}</p>
          </div>
          
          <div className="bg-secondary/50 rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Payment note</p>
            <p className="text-sm font-medium text-foreground">{note}</p>
          </div>
        </div>

        {/* Security Microcopy */}
        <div className={`flex items-center justify-center gap-2 mb-8 px-4 py-2 rounded-full ${
          status === 'completed' ? 'bg-success-soft' : 
          status === 'pending' ? 'bg-warning-soft' : 'bg-destructive-soft'
        }`}>
          <ShieldCheck className={`w-4 h-4 ${
            status === 'completed' ? 'text-success' : 
            status === 'pending' ? 'text-warning' : 'text-destructive'
          }`} />
          <span className={`text-xs font-medium ${
            status === 'completed' ? 'text-success' : 
            status === 'pending' ? 'text-warning' : 'text-destructive'
          }`}>
            {status === 'completed' 
              ? 'Secure transaction complete' 
              : status === 'pending'
              ? 'Pending security verification'
              : 'Transfer blocked for safety'}
          </span>
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
