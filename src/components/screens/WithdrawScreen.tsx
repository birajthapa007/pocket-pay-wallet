import { useState } from 'react';
import { ArrowLeft, Building2, ChevronRight, CheckCircle2, Loader2, Zap, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WalletBalance } from '@/types/wallet';

interface WithdrawScreenProps {
  balance: WalletBalance;
  onWithdraw: (amount: number, speed: 'standard' | 'instant', bankName: string) => Promise<{ fee: number; total: number }>;
  onBack: () => void;
  isLoading?: boolean;
}

const BANKS = [
  { id: 'chase', name: 'Chase', icon: '🏦' },
  { id: 'bofa', name: 'Bank of America', icon: '🏛️' },
  { id: 'wells', name: 'Wells Fargo', icon: '🏦' },
  { id: 'citi', name: 'Citibank', icon: '🏛️' },
];

const INSTANT_FEE_PERCENTAGE = 0.015;

const WithdrawScreen = ({ balance, onWithdraw, onBack, isLoading }: WithdrawScreenProps) => {
  const [step, setStep] = useState<'bank' | 'amount' | 'speed' | 'success'>('bank');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedSpeed, setSelectedSpeed] = useState<'standard' | 'instant'>('standard');
  const [withdrawnAmount, setWithdrawnAmount] = useState<number>(0);
  const [feeCharged, setFeeCharged] = useState<number>(0);

  const numAmount = parseFloat(amount) || 0;
  const instantFee = Math.round(numAmount * INSTANT_FEE_PERCENTAGE * 100) / 100;
  const totalWithInstant = numAmount + instantFee;

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
    setStep('amount');
  };

  const handleContinueToSpeed = () => {
    if (numAmount > 0 && numAmount <= balance.available) {
      setStep('speed');
    }
  };

  const handleWithdraw = async () => {
    const bankName = BANKS.find(b => b.id === selectedBank)?.name || 'Bank';
    const result = await onWithdraw(numAmount, selectedSpeed, bankName);
    setWithdrawnAmount(numAmount);
    setFeeCharged(result.fee);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="screen-container animate-fade-in safe-top flex flex-col items-center justify-center min-h-screen">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6 animate-scale-in">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {selectedSpeed === 'instant' ? 'Withdrawal Complete!' : 'Withdrawal Initiated!'}
        </h1>
        <p className="text-muted-foreground text-center mb-2">
          ${withdrawnAmount.toFixed(2)} sent to your bank
        </p>
        {feeCharged > 0 && (
          <p className="text-sm text-warning mb-2">
            Instant fee: ${feeCharged.toFixed(2)}
          </p>
        )}
        <p className="text-sm text-muted-foreground mb-8">
          {selectedSpeed === 'instant' ? 'Available instantly' : 'Arrives in 1-3 business days'}
        </p>
        <Button onClick={onBack} className="w-full max-w-xs">
          Done
        </Button>
      </div>
    );
  }

  if (step === 'speed') {
    const canAffordInstant = balance.available >= totalWithInstant;

    return (
      <div className="screen-container animate-fade-in safe-top">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setStep('amount')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Withdrawal Speed</h1>
            <p className="text-sm text-muted-foreground">Choose how fast to receive</p>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-muted-foreground text-sm">Withdrawing</p>
          <p className="text-4xl font-bold">${numAmount.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            To {BANKS.find(b => b.id === selectedBank)?.name}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {/* Standard Option */}
          <button
            onClick={() => setSelectedSpeed('standard')}
            className={`w-full p-4 rounded-2xl border-2 transition-all ${
              selectedSpeed === 'standard'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-muted-foreground/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedSpeed === 'standard' ? 'bg-primary/20' : 'bg-secondary'
              }`}>
                <Clock className={`w-6 h-6 ${selectedSpeed === 'standard' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">Standard</p>
                  <span className="px-2 py-0.5 rounded-full bg-success-soft text-success text-xs font-medium">Free</span>
                </div>
                <p className="text-sm text-muted-foreground">1-3 business days</p>
                <p className="text-lg font-bold mt-2">${numAmount.toFixed(2)}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedSpeed === 'standard' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}>
                {selectedSpeed === 'standard' && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
              </div>
            </div>
          </button>

          {/* Instant Option */}
          <button
            onClick={() => canAffordInstant && setSelectedSpeed('instant')}
            disabled={!canAffordInstant}
            className={`w-full p-4 rounded-2xl border-2 transition-all ${
              selectedSpeed === 'instant'
                ? 'border-warning bg-warning/5'
                : canAffordInstant
                  ? 'border-border bg-card hover:border-muted-foreground/50'
                  : 'border-border bg-card opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedSpeed === 'instant' ? 'bg-warning/20' : 'bg-secondary'
              }`}>
                <Zap className={`w-6 h-6 ${selectedSpeed === 'instant' ? 'text-warning' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">Instant</p>
                  <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium">
                    1.5% fee
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Available immediately</p>
                <div className="mt-2">
                  <p className="text-lg font-bold">${totalWithInstant.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    ${numAmount.toFixed(2)} + ${instantFee.toFixed(2)} fee
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedSpeed === 'instant' ? 'border-warning bg-warning' : 'border-muted-foreground'
              }`}>
                {selectedSpeed === 'instant' && <CheckCircle2 className="w-4 h-4 text-warning-foreground" />}
              </div>
            </div>
            {!canAffordInstant && (
              <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Insufficient funds for instant (need ${totalWithInstant.toFixed(2)})</span>
              </div>
            )}
          </button>
        </div>

        <Button
          onClick={handleWithdraw}
          disabled={isLoading}
          className="w-full h-14 text-lg"
          variant={selectedSpeed === 'instant' ? 'default' : 'send'}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            `Withdraw ${selectedSpeed === 'instant' ? 'Instantly' : ''} $${
              selectedSpeed === 'instant' ? totalWithInstant.toFixed(2) : numAmount.toFixed(2)
            }`
          )}
        </Button>
      </div>
    );
  }

  if (step === 'amount') {
    const isValid = numAmount > 0 && numAmount <= balance.available;

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
            <h1 className="text-xl font-bold">Withdraw</h1>
            <p className="text-sm text-muted-foreground">
              To {BANKS.find(b => b.id === selectedBank)?.name}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-sm text-muted-foreground mb-2">Amount to withdraw</p>
          <div className="flex items-center justify-center gap-1 mb-4">
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

          <p className="text-sm text-muted-foreground mb-6">
            Available: ${balance.available.toFixed(2)}
          </p>

          <button
            onClick={() => setAmount(balance.available.toString())}
            className="px-4 py-2 rounded-full bg-secondary text-sm font-medium hover:bg-muted transition-colors"
          >
            Withdraw All
          </button>

          {numAmount > balance.available && (
            <p className="text-destructive text-sm mt-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Amount exceeds available balance
            </p>
          )}
        </div>

        <div className="mt-auto pt-6">
          <Button
            onClick={handleContinueToSpeed}
            disabled={!isValid}
            className="w-full h-14 text-lg"
          >
            Continue
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
          <h1 className="text-xl font-bold">Withdraw</h1>
          <p className="text-sm text-muted-foreground">Select destination bank</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 mb-6">
        <p className="text-sm text-muted-foreground">Available to withdraw</p>
        <p className="text-2xl font-bold">${balance.available.toFixed(2)}</p>
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

export default WithdrawScreen;
