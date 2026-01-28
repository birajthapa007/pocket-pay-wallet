import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Shield, Loader2, Mail, Phone, ArrowLeft, KeyRound } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { authApi } from '@/services/api';

interface AuthScreenProps {
  onSuccess: () => void;
}

type AuthMethod = 'email' | 'phone';
type AuthStep = 'choose' | 'details' | 'otp' | 'password';

const AuthScreen = ({ onSuccess }: AuthScreenProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [method, setMethod] = useState<AuthMethod | null>(null);
  const [step, setStep] = useState<AuthStep>('choose');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  
  // Reset form when mode changes
  useEffect(() => {
    setStep('choose');
    setMethod(null);
    setError(null);
    setSuccessMessage(null);
    setOtp('');
  }, [mode]);

  const handleMethodSelect = (selectedMethod: AuthMethod) => {
    setMethod(selectedMethod);
    setStep('details');
    setError(null);
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('choose');
      setMethod(null);
    } else if (step === 'otp' || step === 'password') {
      setStep('details');
    }
    setError(null);
    setOtp('');
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 10 digits
    return digits.slice(0, 10);
  };

  const handleSendOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate fields for signup
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Name is required');
          setIsLoading(false);
          return;
        }
        if (!username.trim()) {
          setError('Username is required');
          setIsLoading(false);
          return;
        }
        if (username.length < 3) {
          setError('Username must be at least 3 characters');
          setIsLoading(false);
          return;
        }
      }

      if (method === 'email') {
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid email');
          setIsLoading(false);
          return;
        }
        
        const { error: otpError } = await authApi.sendOtpEmail(email);
        if (otpError) {
          setError(otpError);
        } else {
          setSuccessMessage(`Verification code sent to ${email}`);
          setStep('otp');
        }
      } else {
        if (!phone || phone.length < 10) {
          setError('Please enter a valid 10-digit phone number');
          setIsLoading(false);
          return;
        }
        
        const fullPhone = `+1${phone}`;
        const { error: otpError } = await authApi.sendOtpPhone(fullPhone);
        if (otpError) {
          setError(otpError);
        } else {
          setSuccessMessage(`Verification code sent to ${fullPhone}`);
          setStep('otp');
        }
      }
    } catch (err) {
      setError('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const contact = method === 'email' ? email : `+1${phone}`;
      
      if (mode === 'signup') {
        const { error: verifyError } = await authApi.verifyOtpSignup({
          contact,
          type: method!,
          otp,
          name: name.trim(),
          username: username.toLowerCase().trim(),
        });
        
        if (verifyError) {
          setError(verifyError);
        } else {
          onSuccess();
        }
      } else {
        const { error: verifyError } = await authApi.verifyOtpLogin({
          contact,
          type: method!,
          otp,
        });
        
        if (verifyError) {
          setError(verifyError);
        } else {
          onSuccess();
        }
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const contact = method === 'email' ? email : `+1${phone}`;
      const { error: loginError } = await authApi.signInWithPassword({
        contact,
        type: method!,
        password,
      });

      if (loginError) {
        setError(loginError);
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    await handleSendOtp();
  };

  const renderChooseMethod = () => (
    <div className="flex-1 flex flex-col justify-center space-y-4">
      <h2 className="text-lg font-medium text-center mb-6">
        {mode === 'login' ? 'How would you like to sign in?' : 'How would you like to sign up?'}
      </h2>
      
      <Button
        type="button"
        variant="outline"
        className="w-full h-16 text-lg font-medium rounded-2xl border-2 flex items-center justify-start gap-4 px-6"
        onClick={() => handleMethodSelect('email')}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        Continue with Email
      </Button>
      
      <Button
        type="button"
        variant="outline"
        className="w-full h-16 text-lg font-medium rounded-2xl border-2 flex items-center justify-start gap-4 px-6"
        onClick={() => handleMethodSelect('phone')}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Phone className="w-5 h-5 text-primary" />
        </div>
        Continue with Phone
      </Button>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="flex-1 space-y-4">
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {mode === 'signup' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mobile-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="alexj"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="mobile-input"
              required
            />
            <p className="text-xs text-muted-foreground">
              Others will find you by @{username || 'username'}
            </p>
          </div>
        </>
      )}

      {method === 'email' ? (
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="alex@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mobile-input"
            required
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex gap-2">
            <div className="flex items-center justify-center px-4 bg-muted rounded-xl text-muted-foreground font-medium">
              +1
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              className="mobile-input flex-1"
              required
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <Button
        type="button"
        className="w-full h-14 text-lg font-semibold rounded-2xl"
        disabled={isLoading}
        onClick={handleSendOtp}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Send Verification Code'
        )}
      </Button>

      {mode === 'login' && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setStep('password')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <KeyRound className="w-4 h-4" />
              Use password instead
            </span>
          </button>
        </div>
      )}
    </div>
  );

  const renderOtpVerification = () => (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
      <button
        type="button"
        onClick={handleBack}
        className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Enter verification code</h2>
        <p className="text-muted-foreground text-sm">
          We sent a 6-digit code to<br />
          <span className="font-medium text-foreground">
            {method === 'email' ? email : `+1 ${phone}`}
          </span>
        </p>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-primary/10 text-primary text-sm text-center w-full">
          {successMessage}
        </div>
      )}

      <InputOTP
        maxLength={6}
        value={otp}
        onChange={(value) => setOtp(value)}
        className="justify-center"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
          <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
          <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
          <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
          <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
          <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
        </InputOTPGroup>
      </InputOTP>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center w-full">
          {error}
        </div>
      )}

      <Button
        type="button"
        className="w-full h-14 text-lg font-semibold rounded-2xl"
        disabled={isLoading || otp.length !== 6}
        onClick={handleVerifyOtp}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Verify & Continue'
        )}
      </Button>

      <button
        type="button"
        onClick={handleResendOtp}
        disabled={isLoading}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Didn't receive a code? <span className="text-primary font-medium">Resend</span>
      </button>
    </div>
  );

  const renderPasswordLogin = () => (
    <div className="flex-1 space-y-4">
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center space-y-2 mb-6">
        <h2 className="text-xl font-semibold">Enter your password</h2>
        <p className="text-muted-foreground text-sm">
          {method === 'email' ? email : `+1 ${phone}`}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mobile-input"
          required
        />
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <Button
        type="button"
        className="w-full h-14 text-lg font-semibold rounded-2xl"
        disabled={isLoading}
        onClick={handlePasswordLogin}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Sign In'
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setStep('details');
            setPassword('');
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Use verification code instead
        </button>
      </div>
    </div>
  );

  return (
    <div className="screen-container flex flex-col min-h-screen">
      {/* Header */}
      <div className="safe-top pt-6 pb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Pocket Pay</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {mode === 'login' ? 'Welcome back!' : 'Create your wallet'}
        </p>
      </div>

      {/* Dynamic content based on step */}
      {step === 'choose' && renderChooseMethod()}
      {step === 'details' && renderDetailsForm()}
      {step === 'otp' && renderOtpVerification()}
      {step === 'password' && renderPasswordLogin()}

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-4">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span>256-bit encryption • Protected by Pocket Pay security</span>
      </div>

      {/* Toggle mode */}
      <div className="py-6 text-center">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <span className="text-primary font-medium">Sign up</span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span className="text-primary font-medium">Sign in</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AuthScreen;
