import React, { useState } from 'react';
import { ArrowLeft, Delete, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, WalletBalance } from '@/types/wallet';

interface SendAmountScreenProps {
  recipient: User;
  balance: WalletBalance;
  onSetAmount: (amount: number, note: string) => void;
  onBack: () => void;
}

const SendAmountScreen = React.forwardRef<HTMLDivElement, SendAmountScreenProps>(
  ({ recipient, balance, onSetAmount, onBack }, ref) => {
    const [amount, setAmount] = useState('0');
    const [note, setNote] = useState('');

    const handleKeyPress = (key: string) => {
      if (key === 'delete') {
        setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
        return;
      }
      if (key === '.' && amount.includes('.')) return;
      if (amount === '0' && key !== '.') {
        setAmount(key);
      } else {
        if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
        setAmount((prev) => prev + key);
      }
    };

    const handleContinue = () => {
      const numAmount = parseFloat(amount);
      if (numAmount > 0 && note.trim()) {
        onSetAmount(numAmount, note.trim());
      }
    };

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    const numAmount = parseFloat(amount) || 0;
    const isOverBalance = numAmount > balance.available;
    const isValid = numAmount > 0 && !isOverBalance && note.trim().length > 0;

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'];

    return (
      <div ref={ref} className="screen-container flex flex-col animate-fade-in min-h-screen safe-top">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold">
              {getInitials(recipient.name)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{recipient.name}</p>
              <p className="text-sm text-muted-foreground">@{recipient.username}</p>
            </div>
          </div>
        </div>

        {/* Amount Display */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-bold text-muted-foreground">$</span>
              <span className={`text-5xl font-bold tabular-nums ${isOverBalance ? 'text-destructive' : 'text-foreground'}`}>
                {parseFloat(amount).toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            {isOverBalance && (
              <p className="text-sm text-destructive mt-2 animate-fade-in">Exceeds available balance</p>
            )}
          </div>

          {/* Reason Input - Required */}
          <div className="w-full max-w-xs">
            <div className="relative">
              <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="What's this for? (required)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-secondary/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                maxLength={50}
              />
            </div>
            {note.length === 0 && numAmount > 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Please add a reason for this payment
              </p>
            )}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-1 mb-4 max-w-xs mx-auto w-full">
          {keys.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className="keypad-button"
            >
              {key === 'delete' ? (
                <Delete className="w-5 h-5" />
              ) : (
                key
              )}
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <div className="safe-bottom pb-4">
          <Button
            size="full"
            onClick={handleContinue}
            disabled={!isValid}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }
);

SendAmountScreen.displayName = 'SendAmountScreen';

export default SendAmountScreen;
