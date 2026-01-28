import React, { useState } from 'react';
import { ArrowLeft, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface RequestAmountScreenProps {
  requestFrom: User;
  onSetAmount: (amount: number, note: string) => void;
  onBack: () => void;
}

const RequestAmountScreen = React.forwardRef<HTMLDivElement, RequestAmountScreenProps>(
  ({ requestFrom, onSetAmount, onBack }, ref) => {
    const [amount, setAmount] = useState('0');
    const [note, setNote] = useState('');

    const handleKeyPress = (key: string) => {
      if (key === 'delete') {
        setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      } else if (key === '.') {
        if (!amount.includes('.')) {
          setAmount((prev) => prev + '.');
        }
      } else {
        if (amount === '0') {
          setAmount(key);
        } else if (amount.includes('.')) {
          const [, decimal] = amount.split('.');
          if (decimal && decimal.length < 2) {
            setAmount((prev) => prev + key);
          }
        } else if (amount.length < 7) {
          setAmount((prev) => prev + key);
        }
      }
    };

    const numericAmount = parseFloat(amount) || 0;

    const getInitials = (name: string) => {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'];

    return (
      <div ref={ref} className="screen-container flex flex-col animate-fade-in safe-top min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-muted-foreground text-sm">Requesting from</p>
            <p className="font-semibold">{requestFrom.name}</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-info to-info/70 flex items-center justify-center text-white font-semibold">
            {getInitials(requestFrom.name)}
          </div>
        </div>

        {/* Amount Display */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-muted-foreground text-sm mb-3">Amount to request</p>
          <div className="flex items-baseline justify-center mb-4">
            <span className="text-3xl text-muted-foreground mr-1">$</span>
            <span className={cn(
              "amount-input",
              numericAmount > 0 ? "text-foreground" : "text-muted-foreground"
            )}>
              {amount}
            </span>
          </div>

          {/* Note Input */}
          <input
            type="text"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full max-w-xs text-center px-4 py-2 bg-secondary/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground border-0 focus:ring-1 focus:ring-primary/50 outline-none mb-6"
          />
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-6 max-w-xs mx-auto w-full">
          {keys.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className="keypad-button"
            >
              {key === 'delete' ? <Delete className="w-6 h-6" /> : key}
            </button>
          ))}
        </div>

        {/* Request Button */}
        <Button
          variant="confirm"
          size="full"
          onClick={() => onSetAmount(numericAmount, note)}
          disabled={numericAmount <= 0}
          className="mb-4"
        >
          Request ${numericAmount.toFixed(2)}
        </Button>
      </div>
    );
  }
);

RequestAmountScreen.displayName = 'RequestAmountScreen';

export default RequestAmountScreen;
