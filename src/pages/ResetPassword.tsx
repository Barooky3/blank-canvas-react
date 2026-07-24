import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const passwordValid = password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (!passwordValid) {
      toast({ title: 'Password does not meet requirements', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Failed to reset password', description: error.message, variant: 'destructive' });
    } else {
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen py-20 md:py-28 bg-background">
        <div className="container">
          <div className="max-w-md mx-auto text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="font-display text-3xl text-foreground mb-2">Password Reset</h1>
            <p className="text-muted-foreground">Your password has been updated. Redirecting to login...</p>
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
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">Reset Password</h1>
            <p className="text-muted-foreground">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="border border-border p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
                  New Password
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
                <div className="space-y-1 mt-2">
                  {[
                    { ok: password.length >= 8, label: '8+ characters' },
                    { ok: /[A-Z]/.test(password), label: 'Uppercase letter' },
                    { ok: /[0-9]/.test(password), label: 'Number' },
                    { ok: /[^A-Za-z0-9]/.test(password), label: 'Special character' },
                  ].map(r => (
                    <p key={r.label} className={`text-xs ${r.ok ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {r.ok ? '✓' : '○'} {r.label}
                    </p>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="pl-11 h-12 bg-background border-border rounded-none focus:border-foreground"
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-xs font-medium tracking-[0.15em] uppercase rounded-none"
                disabled={isSubmitting || !passwordValid || password !== confirmPassword}
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
