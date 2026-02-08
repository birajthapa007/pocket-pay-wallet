import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, Mail, Phone, ArrowLeft, KeyRound, UserPlus, Zap, CreditCard, TrendingUp, Send, Fingerprint, Smartphone } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { authApi } from '@/services/api';
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth';

interface AuthScreenProps {
  onSuccess: () => void;
}

type AuthMethod = 'email' | 'phone';
type AuthStep = 'choose' | 'details' | 'otp' | 'password' | 'forgot';

const AuthScreen = ({ onSuccess }: AuthScreenProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [method, setMethod] = useState<AuthMethod | null>(null);
  const [step, setStep] = useState<AuthStep>('choose');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Firebase Phone Auth
  const firebasePhone = useFirebasePhoneAuth();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  
  // Helper to get full name
  const getFullName = () => {
    const parts = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean);
    return parts.join(' ');
  };
  
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
    
    // Setup reCAPTCHA for phone auth
    if (selectedMethod === 'phone') {
      setTimeout(() => {
        firebasePhone.setupRecaptcha('recaptcha-container');
      }, 300);
    }
  };

  const handleBack = () => {
    if (step === 'details' || step === 'forgot') {
      setStep('choose');
      setMethod(null);
      firebasePhone.resetRecaptcha();
    } else if (step === 'otp' || step === 'password') {
      setStep('details');
      // Re-setup reCAPTCHA if going back to phone details
      if (method === 'phone') {
        setTimeout(() => {
          firebasePhone.setupRecaptcha('recaptcha-container');
        }, 300);
      }
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
        if (!firstName.trim()) {
          setError('First name is required');
          setIsLoading(false);
          return;
        }
        if (!lastName.trim()) {
          setError('Last name is required');
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
        if (!password) {
          setError('Password is required');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
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
        
        const { error: otpError } = await authApi.sendOtp(
          email,
          'email',
          mode === 'signup' ? 'signup' : 'login',
          mode === 'signup' ? { name: getFullName(), username: username.toLowerCase().trim(), password } : undefined
        );
        if (otpError) {
          setError(otpError);
        } else {
          setSuccessMessage(`Verification code sent to ${email}`);
          setStep('otp');
        }
      } else {
        // Phone auth via Firebase
        if (!phone || phone.length < 10) {
          setError('Please enter a valid 10-digit phone number');
          setIsLoading(false);
          return;
        }
        
        const fullPhone = `+1${phone}`;
        const { error: firebaseError } = await firebasePhone.sendOtp(fullPhone);
        
        if (firebaseError) {
          setError(firebaseError);
        } else {
          setSuccessMessage(`Verification code sent via SMS to ${fullPhone}`);
          setStep('otp');
        }
      }
    } catch (err) {
      setError('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (method === 'email') {
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid email');
          setIsLoading(false);
          return;
        }
        
        const { error: otpError } = await authApi.sendOtp(email, 'email', 'recovery');
        if (otpError) {
          setError(otpError);
        } else {
          setSuccessMessage(`Password reset code sent to ${email}`);
          setStep('otp');
        }
      } else {
        if (!phone || phone.length < 10) {
          setError('Please enter a valid 10-digit phone number');
          setIsLoading(false);
          return;
        }
        
        const fullPhone = `+1${phone}`;
        const { error: otpError } = await authApi.sendOtp(fullPhone, 'sms', 'recovery');
        if (otpError) {
          setError(otpError);
        } else {
          setSuccessMessage(`Password reset code sent to ${fullPhone}`);
          setStep('otp');
        }
      }
    } catch (err) {
      setError('Failed to send reset code');
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
      if (method === 'phone') {
        // Firebase phone auth verification
        const { idToken, error: firebaseError } = await firebasePhone.verifyOtp(otp);
        
        if (firebaseError || !idToken) {
          setError(firebaseError || 'Verification failed');
          setIsLoading(false);
          return;
        }

        // Exchange Firebase token for Supabase session
        const { error: verifyError } = await authApi.verifyFirebasePhone({
          firebaseIdToken: idToken,
          authAction: mode === 'signup' ? 'signup' : 'login',
          name: mode === 'signup' ? getFullName() : undefined,
          username: mode === 'signup' ? username.toLowerCase().trim() : undefined,
          password: mode === 'signup' ? password : undefined,
        });

        if (verifyError) {
          setError(verifyError);
        } else {
          onSuccess();
        }
      } else {
        // Email OTP verification (unchanged)
        const contact = email;
        
        if (mode === 'signup') {
          const { error: verifyError } = await authApi.verifyOtpSignup({
            contact,
            type: 'email',
            otp,
            name: getFullName(),
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
            type: 'email',
            otp,
          });
          
          if (verifyError) {
            setError(verifyError);
          } else {
            onSuccess();
          }
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
    if (method === 'phone') {
      // Re-setup reCAPTCHA and resend via Firebase
      firebasePhone.resetRecaptcha();
      setTimeout(() => {
        firebasePhone.setupRecaptcha('recaptcha-container');
        setTimeout(() => handleSendOtp(), 500);
      }, 300);
    } else {
      await handleSendOtp();
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    },
    exit: { opacity: 0, y: 20 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Floating icons for hero section
  const floatingIcons = [
    { icon: CreditCard, delay: 0, x: -60, y: -40 },
    { icon: Send, delay: 0.2, x: 70, y: -30 },
    { icon: TrendingUp, delay: 0.4, x: -50, y: 50 },
    { icon: Zap, delay: 0.6, x: 60, y: 40 },
  ];

  const renderChooseMethod = () => (
    <motion.div
      key="choose"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex-1 flex flex-col"
    >
      {mode === 'signup' ? (
        // SIGNUP - Clean, premium design
        <div className="flex-1 flex flex-col">
          {/* Hero Section */}
          <motion.div 
            variants={itemVariants}
            className="text-center mb-8"
          >
            {/* Animated gradient ring */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, hsl(175 70% 50%), hsl(175 50% 30%), hsl(175 70% 50%))',
                  padding: '2px',
                }}
              >
                <div className="w-full h-full rounded-full bg-background" />
              </motion.div>
              
              {/* Center icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="absolute inset-2 rounded-full bg-gradient-to-br from-card to-secondary flex items-center justify-center"
              >
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <UserPlus className="w-10 h-10 text-primary" />
                </motion.div>
              </motion.div>
            </div>

            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold mb-2"
            >
              Create Account
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground"
            >
              Join thousands managing money smarter
            </motion.p>
          </motion.div>

          {/* Method selection */}
          <motion.div variants={itemVariants} className="space-y-3">
            <Button
              type="button"
              className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all duration-300"
              onClick={() => handleMethodSelect('email')}
            >
              <Mail className="w-5 h-5" />
              <span>Continue with Email</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base font-medium rounded-2xl border-2 border-border hover:bg-muted/50 flex items-center justify-center gap-3 transition-all duration-200"
              onClick={() => handleMethodSelect('phone')}
            >
              <Smartphone className="w-5 h-5 text-primary" />
              <span>Continue with Phone</span>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div 
            variants={itemVariants}
            className="mt-auto pt-8"
          >
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" />
                <span>256-bit encryption</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" />
                <span>Instant setup</span>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        // LOGIN - Premium hero section
        <div className="flex-1 flex flex-col">
          {/* Hero Section with floating elements */}
          <motion.div 
            variants={itemVariants}
            className="text-center mb-10 relative"
          >
            {/* Floating icons */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              {floatingIcons.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: [item.x - 5, item.x + 5, item.x - 5],
                    y: [item.y - 5, item.y + 5, item.y - 5],
                  }}
                  transition={{
                    delay: item.delay,
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  className="absolute left-1/2 top-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-muted to-secondary flex items-center justify-center shadow-lg border border-border/50"
                  style={{ marginLeft: -20, marginTop: -20 }}
                >
                  <item.icon className="w-5 h-5 text-primary" />
                </motion.div>
              ))}
              
              {/* Main center icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                }}
                transition={{ type: "spring", stiffness: 200 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/20 rounded-2xl" />
                <Fingerprint className="w-10 h-10 text-primary-foreground relative z-10" />
              </motion.div>
            </div>

            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold mb-3"
            >
              Welcome Back
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-lg"
            >
              Your wallet is ready for you
            </motion.p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <Button
              type="button"
              className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all duration-300"
              onClick={() => handleMethodSelect('email')}
            >
              <Mail className="w-5 h-5" />
              <span>Sign in with Email</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base font-medium rounded-2xl border-2 border-border hover:bg-muted/50 flex items-center justify-center gap-3 transition-all duration-200"
              onClick={() => handleMethodSelect('phone')}
            >
              <Smartphone className="w-5 h-5 text-primary" />
              <span>Sign in with Phone</span>
            </Button>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-auto pt-10"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
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

      <div className="space-y-5">
        {mode === 'signup' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Alex"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Johnson"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName" className="text-sm font-medium">
                Middle Name <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="middleName"
                type="text"
                placeholder="Michael"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/50"
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
                  className="h-12 pl-9 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground pl-1">
                Friends will find you as @{username || 'username'}
              </p>
            </div>
            
            {/* Password fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="signupPassword" className="text-sm font-medium">Password</Label>
                <Input
                  id="signupPassword"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground pl-1">
              You can use this password to log in if you have OTP issues
            </p>
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
                className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center px-4 bg-muted/50 rounded-xl text-muted-foreground font-medium h-12">
                  +1
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="555 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/50 flex-1"
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
        >
          <Button
            type="button"
            className={`w-full h-14 text-base font-semibold rounded-xl ${
              mode === 'signup' 
                ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70' 
                : ''
            }`}
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
            className="flex flex-col gap-3 items-center"
          >
            <button
              type="button"
              onClick={() => setStep('password')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Use password instead
            </button>
            <button
              type="button"
              onClick={() => setStep('forgot')}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Forgot password?
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const renderForgotPassword = () => (
    <motion.div
      key="forgot"
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
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4"
          >
            <KeyRound className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-muted-foreground">
            We'll send you a code to reset your password
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 justify-center mb-4">
            <button
              type="button"
              onClick={() => setMethod('email')}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                method === 'email' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-secondary'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setMethod('phone')}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                method === 'phone' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-secondary'
              }`}
            >
              Phone
            </button>
          </div>

          {method === 'email' ? (
            <Input
              id="forgot-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/50"
              required
            />
          ) : method === 'phone' ? (
            <div className="flex gap-2">
              <div className="flex items-center justify-center px-4 bg-muted/50 rounded-xl text-muted-foreground font-medium h-12">
                +1
              </div>
              <Input
                id="forgot-phone"
                type="tel"
                placeholder="555 123 4567"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/50 flex-1"
                required
              />
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">Select a method above</p>
          )}

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
            disabled={isLoading || !method}
            onClick={handleForgotPassword}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Send Reset Code'
            )}
          </Button>
        </div>
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
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
        >
          {method === 'email' ? (
            <Mail className="w-8 h-8 text-primary" />
          ) : (
            <Phone className="w-8 h-8 text-primary" />
          )}
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
                  className="w-12 h-14 text-xl rounded-xl border-2 border-muted bg-muted/30 first:rounded-l-xl last:rounded-r-xl" 
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
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4"
          >
            <Fingerprint className="w-7 h-7 text-primary" />
          </motion.div>
          <h2 className="text-xl font-semibold">Enter password</h2>
          <p className="text-muted-foreground text-sm">
            {method === 'email' ? email : `+1 ${phone}`}
          </p>
        </div>

        <div className="space-y-4">
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-primary/50 text-center text-lg tracking-widest"
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

          <div className="flex flex-col gap-2 items-center">
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
            <button
              type="button"
              onClick={() => setStep('forgot')}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="screen-container flex flex-col min-h-screen overflow-hidden relative">
      {/* Premium gradient background for both modes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute -bottom-40 right-1/4 w-60 h-60 rounded-full bg-primary/5 blur-[80px]" />
      </div>

      {/* Header with premium logo */}
      <motion.div 
        layout
        className={`safe-top text-center relative z-10 ${mode === 'signup' ? 'pt-8 pb-6' : 'pt-10 pb-6'}`}
      >
        <AnimatePresence mode="wait">
          {step === 'choose' && (
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-center justify-center gap-3"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`rounded-2xl flex items-center justify-center relative overflow-hidden ${
                  mode === 'signup' 
                    ? 'w-14 h-14' 
                    : 'w-12 h-12'
                }`}
                style={{
                  background: 'linear-gradient(135deg, hsl(175 70% 50%) 0%, hsl(175 60% 40%) 50%, hsl(180 50% 35%) 100%)',
                  boxShadow: '0 8px 32px -8px hsla(175, 70%, 50%, 0.4)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/30" />
                <svg 
                  viewBox="0 0 24 24" 
                  className={`relative z-10 ${mode === 'signup' ? 'w-7 h-7' : 'w-6 h-6'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" className="text-primary-foreground" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" className="text-primary-foreground" />
                </svg>
              </motion.div>
              <h1 className={`font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text ${mode === 'signup' ? 'text-2xl' : 'text-xl'}`}>
                Pocket Pay
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dynamic content based on step */}
      <div className="flex-1 relative z-10 px-1">
        <AnimatePresence mode="wait">
          {step === 'choose' && renderChooseMethod()}
          {step === 'details' && renderDetailsForm()}
          {step === 'otp' && renderOtpVerification()}
          {step === 'password' && renderPasswordLogin()}
          {step === 'forgot' && renderForgotPassword()}
        </AnimatePresence>
      </div>

      {/* Toggle mode */}
      <motion.div 
        layout
        className="py-6 text-center relative z-10"
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
      
      {/* Firebase reCAPTCHA container (invisible) */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} />
    </div>
  );
};

export default AuthScreen;
