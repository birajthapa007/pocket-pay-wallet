import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { authApi } from '@/services/api';

interface AuthScreenProps {
  onSuccess: () => void;
}

const AuthScreen = ({ onSuccess }: AuthScreenProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error: loginError } = await authApi.signIn({ email, password });
        if (loginError) {
          setError(loginError);
        } else {
          onSuccess();
        }
      } else {
        // Validate signup fields
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
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }

        const { error: signupError } = await authApi.signUp({
          email,
          password,
          name: name.trim(),
          username: username.toLowerCase().trim(),
        });

        if (signupError) {
          setError(signupError);
        } else {
          onSuccess();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mobile-input"
            minLength={6}
            required
          />
          {mode === 'signup' && (
            <p className="text-xs text-muted-foreground">
              At least 6 characters
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive-soft text-destructive text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-14 text-lg font-semibold rounded-2xl"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : mode === 'login' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </Button>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>256-bit encryption • Protected by Pocket Pay security</span>
        </div>
      </form>

      {/* Toggle mode */}
      <div className="py-6 text-center">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(null);
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