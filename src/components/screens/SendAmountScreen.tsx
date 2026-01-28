import { useState } from 'react';
import { ArrowLeft, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';

interface SendAmountScreenProps {
  recipient: User;
  onSetAmount: (amount: number) => void;
  onBack: () => void;
}

const SendAmountScreen = ({ recipient, onSetAmount, onBack }: SendAmountScreenProps) => {
  const [amount, setAmount] = useState('0');

  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }
    if (key === '.' && amount.includes('.')) return;
    if (amount === '0' && key !== '.') {
      setAmount(key);
    } else {
      // Limit decimal places to 2
      if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
      setAmount((prev) => prev + key);
    }
  };

  const handleContinue = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      onSetAmount(numAmount);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'];

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            {getInitials(recipient.name)}
          </div>
          <div>
            <p className="font-semibold">{recipient.name}</p>
            <p className="text-sm text-muted-foreground">@{recipient.username}</p>
          </div>
        </div>
      </div>

      {/* Amount Display */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold text-muted-foreground">$</span>
            <span className="text-6xl font-bold tabular-nums">
              {parseFloat(amount).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => handleKeyPress(key)}
            className="keypad-button"
          >
            {key === 'delete' ? (
              <Delete className="w-6 h-6" />
            ) : (
              key
            )}
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <Button
        size="full"
        onClick={handleContinue}
        disabled={parseFloat(amount) <= 0}
      >
        Continue
      </Button>
    </div>
  );
};

export default SendAmountScreen;
