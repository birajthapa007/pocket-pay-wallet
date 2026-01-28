import { useState } from 'react';
import { ArrowLeft, Building2, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DepositScreenProps {
  onDeposit: (amount: number, bankName: string) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

const BANKS = [
  { id: 'chase', name: 'Chase', icon: '🏦' },
  { id: 'bofa', name: 'Bank of America', icon: '🏛️' },
  { id: 'wells', name: 'Wells Fargo', icon: '🏦' },
  { id: 'citi', name: 'Citibank', icon: '🏛️' },
];

const QUICK_AMOUNTS = [50, 100, 250, 500];

const DepositScreen = ({ onDeposit, onBack, isLoading }: DepositScreenProps) => {
  const [step, setStep] = useState<'bank' | 'amount' | 'success'>('bank');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [depositedAmount, setDepositedAmount] = useState<number>(0);

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
    setStep('amount');
  };

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0 && selectedBank) {
      const bankName = BANKS.find(b => b.id === selectedBank)?.name || 'Bank';
      await onDeposit(numAmount, bankName);
      setDepositedAmount(numAmount);
      setStep('success');
    }
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  if (step === 'success') {
    return (
      <div className="screen-container animate-fade-in safe-top flex flex-col items-center justify-center min-h-screen">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6 animate-scale-in">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Deposit Complete!</h1>
        <p className="text-muted-foreground text-center mb-2">
          ${depositedAmount.toFixed(2)} added to your Pocket Pay
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          From {BANKS.find(b => b.id === selectedBank)?.name}
        </p>
        <Button onClick={onBack} className="w-full max-w-xs">
          Done
        </Button>
      </div>
    );
  }

  if (step === 'amount') {
    const numAmount = parseFloat(amount) || 0;
    const isValid = numAmount > 0;

    return (
      <div className="screen-container animate-fade-in safe-top">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setStep('bank')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Add Money</h1>
            <p className="text-sm text-muted-foreground">
              From {BANKS.find(b => b.id === selectedBank)?.name}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-sm text-muted-foreground mb-2">Amount to deposit</p>
          <div className="flex items-center justify-center gap-1 mb-6">
            <span className="text-4xl text-muted-foreground">$</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="text-5xl font-bold bg-transparent border-none text-center w-48 p-0 h-auto focus-visible:ring-0"
              autoFocus
            />
          </div>

          <div className="flex gap-2 mb-8">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                onClick={() => handleQuickAmount(value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  amount === value.toString()
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-muted'
                }`}
              >
                ${value}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6">
          <Button
            onClick={handleDeposit}
            disabled={!isValid || isLoading}
            className="w-full h-14 text-lg"
            variant="send"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              `Deposit $${numAmount.toFixed(2)}`
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container animate-fade-in safe-top">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Add Money</h1>
          <p className="text-sm text-muted-foreground">Select your bank</p>
        </div>
      </div>

      <div className="space-y-2">
        {BANKS.map((bank) => (
          <button
            key={bank.id}
            onClick={() => handleBankSelect(bank.id)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-colors active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl">
              {bank.icon}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">{bank.name}</p>
              <p className="text-sm text-muted-foreground">Connected account</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}

        <button className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-muted hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold">Link new bank</p>
            <p className="text-sm text-muted-foreground">Connect another account</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default DepositScreen;
