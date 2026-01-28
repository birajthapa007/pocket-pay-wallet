import React from 'react';
import { Check, ShieldCheck, Clock, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, Transaction } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';
import { useConfirmTransfer, useCancelTransfer } from '@/hooks/useWallet';

interface SendSuccessScreenProps {
  recipient: User;
  amount: number;
  note: string;
  transaction?: Transaction | null;
  onDone: () => void;
}

const SendSuccessScreen = React.forwardRef<HTMLDivElement, SendSuccessScreenProps>(
  ({ recipient, amount, note, transaction, onDone }, ref) => {
    const confirmTransfer = useConfirmTransfer();
    const cancelTransfer = useCancelTransfer();

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    const status = transaction?.status || 'completed';
    const isRisky = transaction?.isRisky || false;
    const isPending = status === 'pending_confirmation';

    const handleConfirm = async () => {
      if (transaction?.id) {
        await confirmTransfer.mutateAsync(transaction.id);
        onDone();
      }
    };

    const handleCancel = async () => {
      if (transaction?.id) {
        await cancelTransfer.mutateAsync(transaction.id);
        onDone();
      }
    };

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
          {isPending && (
            <div className="w-24 h-24 rounded-full bg-warning flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-12 h-12 text-warning-foreground" strokeWidth={2} />
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
          {status === 'completed' ? 'Sent!' : isPending ? 'Review Required' : 'Blocked'}
        </h1>
        <p className="text-muted-foreground text-center mb-4 px-6">
          {status === 'completed' 
            ? 'Your payment was successful' 
            : isPending
            ? 'This transfer needs your confirmation'
            : 'This transfer was blocked for your protection'}
        </p>

        {/* Risk reason for pending */}
        {isPending && isRisky && (
          <div className="bg-warning-soft border border-warning/30 rounded-xl px-4 py-3 mb-6 mx-6 max-w-xs">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning">Security Check</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This is your first transfer to this recipient. Please confirm you want to proceed.
                </p>
              </div>
            </div>
          </div>
        )}

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
          isPending ? 'bg-warning-soft' : 'bg-destructive-soft'
        }`}>
          <ShieldCheck className={`w-4 h-4 ${
            status === 'completed' ? 'text-success' : 
            isPending ? 'text-warning' : 'text-destructive'
          }`} />
          <span className={`text-xs font-medium ${
            status === 'completed' ? 'text-success' : 
            isPending ? 'text-warning' : 'text-destructive'
          }`}>
            {status === 'completed' 
              ? 'Secure transaction complete' 
              : isPending
              ? 'Awaiting your confirmation'
              : 'Transfer blocked for safety'}
          </span>
        </div>

        {/* Buttons */}
        <div className="w-full max-w-xs safe-bottom pb-4 space-y-3">
          {isPending ? (
            <>
              <Button 
                size="full" 
                onClick={handleConfirm}
                disabled={confirmTransfer.isPending}
              >
                {confirmTransfer.isPending ? 'Confirming...' : 'Confirm & Send'}
              </Button>
              <Button 
                size="full" 
                variant="outline" 
                onClick={handleCancel}
                disabled={cancelTransfer.isPending}
              >
                {cancelTransfer.isPending ? 'Cancelling...' : 'Cancel Transfer'}
              </Button>
            </>
          ) : (
            <Button size="full" onClick={onDone}>
              Done
            </Button>
          )}
        </div>
      </div>
    );
  }
);

SendSuccessScreen.displayName = 'SendSuccessScreen';

export default SendSuccessScreen;
