import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';

interface SendConfirmScreenProps {
  recipient: User;
  amount: number;
  note: string;
  onConfirm: () => void;
  onBack: () => void;
}

const SendConfirmScreen = React.forwardRef<HTMLDivElement, SendConfirmScreenProps>(
  ({ recipient, amount, note, onConfirm, onBack }, ref) => {
    const [isConfirming, setIsConfirming] = useState(false);
    const showSecurityPrompt = amount > 500;

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    const handleConfirmClick = () => {
      setIsConfirming(true);
      // Small delay to show the confirming state
      setTimeout(() => {
        onConfirm();
      }, 500);
    };

    return (
      <div ref={ref} className="screen-container flex flex-col animate-fade-in min-h-screen safe-top">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            disabled={isConfirming}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors active:scale-95 disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Confirm Payment</h1>
        </div>

        {/* Confirmation Details */}
        <div className="flex-1">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 mx-auto flex items-center justify-center text-primary-foreground text-2xl font-bold mb-4 shadow-glow">
              {getInitials(recipient.name)}
            </div>
            <p className="text-muted-foreground mb-1">Sending to</p>
            <p className="text-xl font-semibold text-foreground">{recipient.name}</p>
            <p className="text-muted-foreground">@{recipient.username}</p>
          </div>

          {/* Amount Card */}
          <div className="bg-card border border-border/50 rounded-2xl p-5 mb-4">
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-foreground">{formatCurrency(amount)}</p>
            </div>
            <div className="bg-secondary/50 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Payment note</p>
              <p className="text-sm font-medium text-foreground">{note}</p>
            </div>
          </div>

          {/* Security Prompt for large amounts */}
          {showSecurityPrompt ? (
            <div className="bg-warning-soft border border-warning/20 rounded-2xl p-4 animate-fade-in mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">
                    Large transfer
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This is more than your usual amount. We've double-checked this transfer for your security.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Normal security confirmation */
            <div className="bg-success-soft/50 border border-success/20 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">
                    Ready to send
                  </p>
                  <p className="text-sm text-muted-foreground">
                    We've verified this recipient. Your transfer is protected.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">256-bit encrypted transfer</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 safe-bottom pb-4">
          <Button
            variant="confirm"
            size="full"
            onClick={handleConfirmClick}
            disabled={isConfirming}
            className="relative"
          >
            {isConfirming ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Confirm & Send {formatCurrency(amount)}
              </div>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="full"
            onClick={onBack}
            disabled={isConfirming}
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
