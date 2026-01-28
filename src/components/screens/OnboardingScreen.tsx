import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Mail, ArrowRight, Shield, Zap, Lock } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [step, setStep] = useState<'welcome' | 'signup'>('welcome');
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [inputValue, setInputValue] = useState('');

  const handleContinue = () => {
    if (step === 'welcome') {
      setStep('signup');
    } else {
      onComplete();
    }
  };

  if (step === 'welcome') {
    return (
      <div className="screen-container flex flex-col justify-between animate-fade-in">
        <div className="pt-12" />
        
        {/* Logo and Hero */}
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-primary flex items-center justify-center shadow-wallet">
            <span className="text-3xl font-bold text-primary-foreground">P</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">Pocket Pay</h1>
            <p className="text-lg text-muted-foreground">
              Send money instantly. Stay secure.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 py-12">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50">
            <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Instant Transfers</h3>
              <p className="text-sm text-muted-foreground">Send money in seconds</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50">
            <div className="w-12 h-12 rounded-xl bg-success-soft flex items-center justify-center">
              <Shield className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">Smart Protection</h3>
              <p className="text-sm text-muted-foreground">We keep your money safe</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50">
            <div className="w-12 h-12 rounded-xl bg-info-soft flex items-center justify-center">
              <Lock className="w-6 h-6 text-info" />
            </div>
            <div>
              <h3 className="font-semibold">Bank-Level Security</h3>
              <p className="text-sm text-muted-foreground">Your data is encrypted</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4 pb-8">
          <Button size="full" onClick={handleContinue}>
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container flex flex-col animate-fade-in">
      {/* Header */}
      <div className="pt-8 pb-8">
        <h1 className="text-3xl font-bold mb-2">Create your account</h1>
        <p className="text-muted-foreground">
          Enter your {authMethod === 'phone' ? 'phone number' : 'email'} to get started
        </p>
      </div>

      {/* Auth Method Toggle */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setAuthMethod('phone')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            authMethod === 'phone'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          <Smartphone className="w-5 h-5" />
          Phone
        </button>
        <button
          onClick={() => setAuthMethod('email')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            authMethod === 'email'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          <Mail className="w-5 h-5" />
          Email
        </button>
      </div>

      {/* Input */}
      <div className="space-y-4">
        <input
          type={authMethod === 'phone' ? 'tel' : 'email'}
          placeholder={authMethod === 'phone' ? '+1 (555) 000-0000' : 'your@email.com'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="mobile-input"
        />
      </div>

      {/* Continue Button */}
      <div className="mt-auto pt-8 pb-8">
        <Button
          size="full"
          onClick={handleContinue}
          disabled={!inputValue}
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
