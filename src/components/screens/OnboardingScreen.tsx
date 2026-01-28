import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wallet } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [step, setStep] = useState<'welcome' | 'signup'>('welcome');
  const [inputValue, setInputValue] = useState('');

  if (step === 'welcome') {
    return (
      <div className="screen-container flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Logo */}
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-8 glow-green animate-scale-up">
            <Wallet className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl font-bold mb-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Pocket Pay
          </h1>
          
          <p className="text-muted-foreground text-lg max-w-[260px] animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Send and receive money instantly with people you trust.
          </p>
        </div>

        <div className="pb-10 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <Button variant="pay" size="full" onClick={() => setStep('signup')}>
            Get started
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container flex flex-col min-h-screen animate-fade-in">
      <div className="pt-8 mb-12">
        <h1 className="text-3xl font-bold mb-2">What's your number?</h1>
        <p className="text-muted-foreground">
          We'll text you a code to verify it's you.
        </p>
      </div>

      <input
        type="tel"
        placeholder="+1 (555) 000-0000"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="input-clean text-2xl font-medium"
        autoFocus
      />

      <div className="mt-auto pb-10">
        <Button
          variant="pay"
          size="full"
          onClick={onComplete}
          disabled={inputValue.length < 10}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
