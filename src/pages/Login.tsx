import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Login failed', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome back! 🎉' });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen py-20 md:py-28 bg-background">
      <div className="container">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="border border-border p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-11 h-12 bg-background border-border rounded-none focus:border-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 bg-background border-border rounded-none focus:border-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setForgotEmail(email); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-xs font-medium tracking-[0.15em] uppercase rounded-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>

          {/* Forgot Password Modal */}
          {forgotMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setForgotMode(false)}>
              <div className="bg-background border border-border p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                {forgotSent ? (
                  <div className="text-center">
                    <h2 className="font-display text-2xl text-foreground mb-2">Check your email</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      If an account exists for <strong>{forgotEmail}</strong>, we've sent a password reset link.
                    </p>
                    <Button variant="outline" className="rounded-none" onClick={() => { setForgotMode(false); setForgotSent(false); }}>
                      Back to Login
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-2xl text-foreground mb-2">Reset Password</h2>
                    <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send you a reset link.</p>
                    <div className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={forgotEmail}
                          onChange={e => setForgotEmail(e.target.value)}
                          className="pl-11 h-12 bg-background border-border rounded-none focus:border-foreground"
                        />
                      </div>
                      <Button
                        className="w-full h-12 text-xs font-medium tracking-[0.15em] uppercase rounded-none"
                        disabled={forgotSending || !forgotEmail.trim()}
                        onClick={async () => {
                          setForgotSending(true);
                          await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
                            redirectTo: `${window.location.origin}/reset-password`,
                          });
                          setForgotSending(false);
                          setForgotSent(true);
                        }}
                      >
                        {forgotSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setForgotMode(false)}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-foreground hover:text-accent transition-colors underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
