import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const PASSWORD_RULES = [
  { label: 'At least 1 character', test: (p: string) => p.length >= 1 },
];

const Signup = () => {
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // OTP verification state
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [resendCooldown > 0]);

  const allRulesPass = PASSWORD_RULES.every(r => r.test(password));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allRulesPass) {
      toast({ title: 'Password does not meet requirements', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-signup-otp', {
        body: { email, name },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to send code');
      }

      setShowOtp(true);
      setResendCooldown(600);
      toast({ title: 'Verification code sent!', description: 'Check your email for the 6-digit code.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-signup-otp', {
        body: { email, code: otpCode, password, name },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Verification failed');
      }

      // Auto sign in after successful verification
      const { error: signInError } = await signIn(email, password);

      // Send welcome email with discount code (fire and forget)
      supabase.functions.invoke('send-welcome-email', {
        body: { email, name },
      }).catch((err) => console.error('Welcome email error:', err));

      if (signInError) {
        toast({ title: 'Account created!', description: 'Please sign in with your credentials.' });
        navigate('/login');
      } else {
        toast({ title: 'Account verified! 🎉' });
        navigate('/');
      }
    } catch (err: any) {
      toast({ title: 'Invalid code', description: err.message, variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-signup-otp', {
        body: { email, name },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setResendCooldown(600);
      toast({ title: 'New code sent!', description: 'Check your email.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showOtp) {
    return (
      <div className="min-h-screen py-20 md:py-28 bg-background">
        <div className="container">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-12">
              <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">Verify Email</h1>
              <p className="text-muted-foreground">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>
            <form onSubmit={handleVerify} className="border border-border p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-12 bg-background border-border rounded-none focus:border-foreground text-center text-lg tracking-[0.3em]"
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 text-xs font-medium tracking-[0.15em] uppercase rounded-none"
                  disabled={verifying || otpCode.length < 6}
                >
                  {verifying ? 'Verifying...' : 'Verify Account'}
                </Button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isSubmitting || resendCooldown > 0}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : resendCooldown > 0 ? `Resend in ${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60).toString().padStart(2, '0')}` : "Didn't receive a code? Resend"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 md:py-28 bg-background">
      <div className="container">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">Create Account</h1>
            <p className="text-muted-foreground">Join Parfumistry for exclusive deals</p>
          </div>

          <form onSubmit={handleSubmit} className="border border-border p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="pl-11 h-12 bg-background border-border rounded-none focus:border-foreground"
                    maxLength={100}
                  />
                </div>
              </div>

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
                    maxLength={255}
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

                {password.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {PASSWORD_RULES.map((rule, i) => {
                      const passes = rule.test(password);
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {passes ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-destructive" />
                          )}
                          <span className={passes ? 'text-green-600' : 'text-muted-foreground'}>{rule.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="pl-11 h-12 bg-background border-border rounded-none focus:border-foreground"
                  />
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <div className="flex items-center gap-2 text-xs pt-1">
                    <X className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-muted-foreground">Passwords do not match</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-xs font-medium tracking-[0.15em] uppercase rounded-none"
                disabled={isSubmitting || !allRulesPass || password !== confirmPassword}
              >
                {isSubmitting ? 'Sending code...' : 'Create Account'}
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-foreground hover:text-accent transition-colors underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
