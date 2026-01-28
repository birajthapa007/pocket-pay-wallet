import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 10);
  };

  const handleSendOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
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

  // Pocket Pay Logo Component
  const PocketPayLogo = ({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) => {
    const sizeClasses = {
      small: 'w-10 h-10',
      default: 'w-14 h-14',
      large: 'w-20 h-20'
    };
    const iconSizes = {
      small: 'w-5 h-5',
      default: 'w-7 h-7',
      large: 'w-10 h-10'
    };
    
    return (
      <div className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25`}>
        <Wallet className={`${iconSizes[size]} text-primary-foreground`} />
      </div>
    );
  };

  const renderChooseMethod = () => (
    <motion.div
      key="choose"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col"
    >
      {mode === 'signup' ? (
        // SIGNUP - Welcoming, brand-focused design
        <div className="flex-1 flex flex-col">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="mb-6"
            >
              <PocketPayLogo size="large" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold mb-2">Create your wallet</h1>
              <p className="text-muted-foreground">
                Join thousands managing money the smart way
              </p>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full h-16 text-base font-medium rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 flex items-center gap-4 px-5 transition-all duration-200"
              onClick={() => handleMethodSelect('email')}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Continue with Email</div>
                <div className="text-xs text-muted-foreground">We'll send a verification code</div>
              </div>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-16 text-base font-medium rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 flex items-center gap-4 px-5 transition-all duration-200"
              onClick={() => handleMethodSelect('phone')}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Continue with Phone</div>
                <div className="text-xs text-muted-foreground">Quick SMS verification</div>
              </div>
            </Button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-auto pt-8"
          >
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>256-bit encryption • Bank-level security</span>
            </div>
          </motion.div>
        </div>
      ) : (
        // LOGIN - Clean, welcoming design
        <div className="flex-1 flex flex-col">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="mb-6"
            >
              <PocketPayLogo size="default" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
              <p className="text-muted-foreground">
                Sign in to your Pocket Pay wallet
              </p>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base font-medium rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center gap-3 transition-all duration-200"
              onClick={() => handleMethodSelect('email')}
            >
              <Mail className="w-5 h-5 text-primary" />
              <span>Sign in with Email</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base font-medium rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center gap-3 transition-all duration-200"
              onClick={() => handleMethodSelect('phone')}
            >
              <Phone className="w-5 h-5 text-primary" />
              <span>Sign in with Phone</span>
            </Button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-auto pt-8"
          >
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Protected by Pocket Pay security</span>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );

  const renderDetailsForm = () => (
    <motion.div
      key="details"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex-1 flex flex-col"
    >
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      {/* Mini logo header */}
      <div className="flex items-center gap-2 mb-6">
        <PocketPayLogo size="small" />
        <span className="font-semibold text-lg">
          {mode === 'signup' ? 'Create Account' : 'Sign In'}
        </span>
      </div>

      <div className="space-y-5">
        {mode === 'signup' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-border focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  type="text"
                  placeholder="alexj"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="h-12 pl-9 rounded-xl bg-muted/50 border-border focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground pl-1">
                Friends will find you as @{username || 'username'}
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: mode === 'signup' ? 0.2 : 0.1 }}
        >
          {method === 'email' ? (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="alex@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-border focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center px-4 bg-muted rounded-xl text-muted-foreground font-medium h-12 border border-border">
                  +1
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="555 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  className="h-12 rounded-xl bg-muted/50 border-border focus:border-primary focus:ring-1 focus:ring-primary flex-1"
                  required
                />
              </div>
            </div>
          )}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-2"
        >
          <Button
            type="button"
            className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90"
            disabled={isLoading}
            onClick={handleSendOtp}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Send Verification Code'
            )}
          </Button>
        </motion.div>

        {mode === 'login' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center pt-2"
          >
            <button
              type="button"
              onClick={() => setStep('password')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Use password instead
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const renderOtpVerification = () => (
    <motion.div
      key="otp"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex-1 flex flex-col"
    >
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <PocketPayLogo size="default" />
        </motion.div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Check your {method}</h2>
          <p className="text-muted-foreground text-sm">
            Enter the 6-digit code sent to<br />
            <span className="font-medium text-foreground">
              {method === 'email' ? email : `+1 ${phone}`}
            </span>
          </p>
        </div>

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-primary/10 text-primary text-sm text-center w-full"
          >
            {successMessage}
          </motion.div>
        )}

        <div className="w-full flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot 
                  key={index}
                  index={index} 
                  className="w-12 h-14 text-xl rounded-xl border-2 border-border bg-muted/30 first:rounded-l-xl last:rounded-r-xl focus:border-primary" 
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center w-full"
          >
            {error}
          </motion.div>
        )}

        <Button
          type="button"
          className="w-full h-14 text-base font-semibold rounded-xl"
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
          Didn't get a code? <span className="text-primary font-medium">Resend</span>
        </button>
      </div>
    </motion.div>
  );

  const renderPasswordLogin = () => (
    <motion.div
      key="password"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex-1 flex flex-col"
    >
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <div className="flex-1 flex flex-col justify-center space-y-6">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            <PocketPayLogo size="default" />
          </motion.div>
          <div>
            <h2 className="text-xl font-semibold">Enter your password</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {method === 'email' ? email : `+1 ${phone}`}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl bg-muted/50 border-border focus:border-primary focus:ring-1 focus:ring-primary text-center text-lg tracking-widest"
            required
          />

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          <Button
            type="button"
            className="w-full h-14 text-base font-semibold rounded-xl"
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
      </div>
    </motion.div>
  );

  return (
    <div className="screen-container flex flex-col min-h-screen overflow-hidden">
      {/* Content */}
      <div className="flex-1 flex flex-col pt-12">
        <AnimatePresence mode="wait">
          {step === 'choose' && renderChooseMethod()}
          {step === 'details' && renderDetailsForm()}
          {step === 'otp' && renderOtpVerification()}
          {step === 'password' && renderPasswordLogin()}
        </AnimatePresence>
      </div>

      {/* Toggle mode */}
      <motion.div 
        layout
        className="py-6 text-center"
      >
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === 'login' ? (
            <>
              New to Pocket Pay?{' '}
              <span className="text-primary font-semibold">Create account</span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span className="text-primary font-semibold">Sign in</span>
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
