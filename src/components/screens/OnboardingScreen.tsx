import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Mail, ArrowRight, Shield, Zap, Lock, Sparkles } from 'lucide-react';

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
      <div className="screen-container flex flex-col justify-between animate-fade-in min-h-screen">
        <div className="pt-16" />
        
        {/* Logo and Hero */}
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow animate-pulse-glow">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              <span className="text-gradient">Pocket Pay</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xs mx-auto">
              The smarter way to send, receive, and manage your money.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 py-12">
          {[
            { icon: Zap, title: 'Instant Transfers', desc: 'Send money in seconds, not days', color: 'text-primary', bg: 'bg-primary-soft' },
            { icon: Shield, title: 'Smart Protection', desc: 'AI-powered fraud detection', color: 'text-success', bg: 'bg-success-soft' },
            { icon: Lock, title: 'Bank-Level Security', desc: '256-bit encryption standard', color: 'text-info', bg: 'bg-info-soft' },
          ].map((feature, i) => (
            <div 
              key={i}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-4 pb-10">
          <Button size="full" onClick={handleContinue} className="shadow-glow">
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container flex flex-col animate-fade-in min-h-screen">
      {/* Header */}
      <div className="pt-10 pb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow-sm mb-6">
          <Sparkles className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Create account</h1>
        <p className="text-muted-foreground">
          Enter your {authMethod === 'phone' ? 'phone number' : 'email'} to get started
        </p>
      </div>

      {/* Auth Method Toggle */}
      <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => setAuthMethod('phone')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            authMethod === 'phone'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Phone
        </button>
        <button
          onClick={() => setAuthMethod('email')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            authMethod === 'email'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          <Mail className="w-4 h-4" />
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
          autoFocus
        />
      </div>

      {/* Continue Button */}
      <div className="mt-auto pt-8 pb-10">
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
