import { useState } from 'react';
import { ArrowLeft, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types/wallet';
import { toast } from '@/hooks/use-toast';

interface RequestAmountScreenProps {
  recipient: User;
  onRequest: (amount: number) => void;
  onBack: () => void;
}

const RequestAmountScreen = ({ recipient, onRequest, onBack }: RequestAmountScreenProps) => {
  const [value, setValue] = useState('0');
  const [note, setNote] = useState('');

  const handleKey = (key: string) => {
    if (key === 'del') {
      setValue((v) => (v.length > 1 ? v.slice(0, -1) : '0'));
      return;
    }
    if (key === '.' && value.includes('.')) return;
    if (value === '0' && key !== '.') {
      setValue(key);
    } else {
      if (value.includes('.') && value.split('.')[1]?.length >= 2) return;
      setValue((v) => v + key);
    }
  };

  const numValue = parseFloat(value) || 0;

  const handleRequest = () => {
    onRequest(numValue);
    toast({
      title: "Request sent!",
      description: `Requested $${numValue.toFixed(2)} from ${recipient.name}`,
    });
  };

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  return (
    <div className="screen-container flex flex-col min-h-screen animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold">
          {getInitials(recipient.name)}
        </div>
        <div>
          <p className="font-medium">Request from {recipient.name}</p>
        </div>
      </div>

      {/* Amount */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-baseline justify-center">
            <span className="text-3xl font-bold text-muted-foreground mr-1">$</span>
            <span className="amount-giant">
              {parseFloat(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {keys.map((key) => (
          <button key={key} onClick={() => handleKey(key)} className="keypad-btn">
            {key === 'del' ? <Delete className="w-6 h-6 mx-auto" /> : key}
          </button>
        ))}
      </div>

      <Button
        variant="secondary"
        size="full"
        onClick={handleRequest}
        disabled={numValue <= 0}
      >
        Request
      </Button>
    </div>
  );
};

export default RequestAmountScreen;
