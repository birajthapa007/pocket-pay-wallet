import React from 'react';
import { ArrowLeft, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';

interface SendConfirmScreenProps {
  recipient: User;
  amount: number;
  onConfirm: () => void;
  onBack: () => void;
}

const SendConfirmScreen = React.forwardRef<HTMLDivElement, SendConfirmScreenProps>(
  ({ recipient, amount, onConfirm, onBack }, ref) => {
    const showSecurityPrompt = amount > 500;

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    return (
      <div ref={ref} className="screen-container flex flex-col animate-fade-in min-h-screen safe-top">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Confirm</h1>
        </div>

        {/* Confirmation Details */}
        <div className="flex-1">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 mx-auto flex items-center justify-center text-primary-foreground text-2xl font-bold mb-4 shadow-glow">
              {getInitials(recipient.name)}
            </div>
            <p className="text-muted-foreground mb-1">Sending to</p>
            <p className="text-xl font-semibold text-foreground">{recipient.name}</p>
            <p className="text-muted-foreground">@{recipient.username}</p>
          </div>

          <div className="text-center py-6 sm:py-8 rounded-2xl bg-card border border-border/50 mb-6">
            <p className="text-muted-foreground text-sm mb-1">Amount</p>
            <p className="text-3xl sm:text-4xl font-bold text-foreground">{formatCurrency(amount)}</p>
          </div>

          {/* Security Prompt */}
          {showSecurityPrompt && (
            <div className="security-prompt animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">
                    Confirm this transfer
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This is a larger amount than usual. Please confirm you want to proceed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm">Protected by Pocket Pay</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-6 safe-bottom pb-4">
          <Button
            variant={showSecurityPrompt ? 'confirm' : 'default'}
            size="full"
            onClick={onConfirm}
          >
            Send {formatCurrency(amount)}
          </Button>
          
          <Button
            variant="ghost"
            size="full"
            onClick={onBack}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }
);

SendConfirmScreen.displayName = 'SendConfirmScreen';

export default SendConfirmScreen;
