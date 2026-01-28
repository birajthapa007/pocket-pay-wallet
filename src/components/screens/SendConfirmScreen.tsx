import { useState } from 'react';
import { ArrowLeft, AlertTriangle, Check } from 'lucide-react';
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
  const [showSecurityPrompt, setShowSecurityPrompt] = useState(amount > 500);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (showSecurityPrompt && !confirmed) {
      setConfirmed(true);
      setShowSecurityPrompt(false);
    }
    onConfirm();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <div className="screen-container flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Confirm Payment</h1>
      </div>

      {/* Confirmation Details */}
      <div className="flex-1">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary mx-auto flex items-center justify-center text-primary-foreground text-2xl font-bold mb-4">
            {getInitials(recipient.name)}
          </div>
          <p className="text-muted-foreground mb-2">Sending to</p>
          <p className="text-xl font-semibold">{recipient.name}</p>
          <p className="text-muted-foreground">@{recipient.username}</p>
        </div>

        <div className="text-center py-8 border-y border-border">
          <p className="text-muted-foreground text-sm mb-1">Amount</p>
          <p className="text-4xl font-bold">{formatCurrency(amount)}</p>
        </div>

        {/* Security Prompt */}
        {showSecurityPrompt && (
          <div className="security-prompt mt-6 animate-fade-in">
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
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-6">
        <Button
          variant={showSecurityPrompt ? 'confirm' : 'default'}
          size="full"
          onClick={handleConfirm}
        >
          {showSecurityPrompt ? (
            <>
              <Check className="w-5 h-5" />
              Yes, Send {formatCurrency(amount)}
            </>
          ) : (
            <>Send {formatCurrency(amount)}</>
          )}
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
};

export default SendConfirmScreen;
