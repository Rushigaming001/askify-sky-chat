import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Zap, Check, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import askifyLogoNew from '@/assets/askify-logo-new.png';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register, session, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (session?.user) {
      navigate('/', { replace: true });
    }
  }, [authLoading, session?.user?.id, navigate]);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    if (!email || !password || (!isLogin && !name)) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (!isLogin && !acceptTerms) {
      toast({
        title: 'Error',
        description: 'Please accept the terms and conditions',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const result = await login(email, password);
        if (!result.success) {
          toast({
            title: 'Login Failed',
            description: result.error || 'Invalid email or password',
            variant: 'destructive'
          });
          return;
        }
        toast({
          title: 'Success',
          description: 'Logged in successfully!'
        });
        navigate('/', { replace: true });
      } else {
        const result = await register(email, password, name);
        if (!result.success) {
          toast({
            title: 'Registration Failed',
            description: result.error || 'Could not create account',
            variant: 'destructive'
          });
          return;
        }
        toast({
          title: 'Success',
          description: 'Account created! You can now log in.'
        });
        setIsLogin(true);
        setPassword('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://minequest.fun/auth'
        }
      });
      
      if (error) {
        const msg = error.message || 'Google sign-in failed';
        const hint = msg.toLowerCase().includes('provider') || msg.toLowerCase().includes('not enabled')
          ? 'Enable Google login in Backend → Users → Auth Settings → Google Settings, then try again.'
          : msg;

        toast({
          title: 'Google Sign-in Failed',
          description: hint,
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: 'Google Sign-in Failed',
        description: 'Enable Google login in Backend → Users → Auth Settings → Google Settings, then try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Success',
          description: 'Password reset link sent to your email'
        });
        setShowForgotPassword(false);
        setResetEmail('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reset email',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-2 sm:p-4 md:p-6 lg:p-8">
      {/* Premium light gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 animate-gradient-shift" style={{ backgroundSize: '400% 400%' }} />
      
      {/* Subtle light overlay for freshness */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10" />
      
      {/* Animated mesh overlay */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs - softer, more elegant */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-400/15 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-10 right-1/3 w-48 h-48 bg-cyan-400/10 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '3s' }} />
        
        {/* Glowing particles - subtle motion dots */}
        <div className="absolute top-20 left-20 w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-cyan-200/60 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-200/50 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }} />
      </div>

      {/* Subtle overlay for card readability */}
      <div className="absolute inset-0 bg-black/10 z-[1]" />

      {/* Glass card with content - enhanced glassmorphism */}
      <Card className="w-full max-w-md mx-2 sm:mx-0 shadow-2xl shadow-black/20 border border-white/20 backdrop-blur-2xl bg-white/10 relative z-10 overflow-hidden animate-scale-in rounded-2xl">
        {/* Inner glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-purple-500/5 pointer-events-none rounded-2xl" />
        <div className="absolute inset-[1px] border border-white/10 rounded-2xl pointer-events-none" />
        
        <CardHeader className="text-center space-y-8 pb-10 pt-10 relative">
          <div className="flex justify-center animate-float">
            <div className="relative">
              {/* Multi-layer glow effect behind logo */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 blur-3xl opacity-30 rounded-full animate-pulse" />
              <div className="absolute -inset-2 bg-white/20 blur-xl rounded-full" />
              
              {/* Logo with halo effect */}
              <div className="relative p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                <img 
                  src={askifyLogoNew} 
                  alt="Askify"
                  className="relative h-20 w-20 object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <CardTitle className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent drop-shadow-lg">
                ASKIFY
              </span>
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-white/80 font-medium flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-yellow-300 animate-pulse" />
              Your Intelligent AI Companion
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-8 relative">
          {showForgotPassword ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Reset Password</h3>
                <p className="text-sm text-white/60">Enter your email to receive a reset link</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-semibold text-white/90">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-400 focus:bg-white/10 backdrop-blur-sm transition-all"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={handleForgotPassword}
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-[1.02]" 
                  size="lg" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button 
                  onClick={() => setShowForgotPassword(false)}
                  variant="ghost"
                  className="w-full text-white/70 hover:text-white hover:bg-white/10"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          ) : (
            <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => setIsLogin(v === 'login')}>
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/10 p-1.5 backdrop-blur-md border border-white/20 rounded-full">
                <TabsTrigger 
                  value="login" 
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 text-white/70 font-semibold transition-all duration-300"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 text-white/70 font-semibold transition-all duration-300"
                >
                  Register
                </TabsTrigger>
              </TabsList>
            
              <TabsContent value="login">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-semibold text-white/90">Email</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Mail className="h-5 w-5 text-white/40 group-focus-within:text-blue-300 transition-colors duration-200" />
                      </div>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-13 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl focus:border-blue-400/60 focus:bg-white/15 focus:ring-2 focus:ring-blue-400/20 backdrop-blur-md transition-all duration-200 shadow-inner shadow-white/5"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-sm font-semibold text-white/90">Password</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Lock className="h-5 w-5 text-white/40 group-focus-within:text-blue-300 transition-colors duration-200" />
                      </div>
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-13 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl focus:border-blue-400/60 focus:bg-white/15 focus:ring-2 focus:ring-blue-400/20 backdrop-blur-md transition-all duration-200 shadow-inner shadow-white/5"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-13 text-base font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-400 hover:via-pink-400 hover:to-rose-400 text-white shadow-xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all duration-300 hover:scale-[1.02] rounded-xl" 
                    size="lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-sm font-semibold text-white/90">Full Name</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <User className="h-5 w-5 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-400 focus:bg-white/10 backdrop-blur-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-sm font-semibold text-white/90">Email</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Mail className="h-5 w-5 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-400 focus:bg-white/10 backdrop-blur-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-semibold text-white/90">Password</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Lock className="h-5 w-5 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-400 focus:bg-white/10 backdrop-blur-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i <= passwordStrength.score ? passwordStrength.color : 'bg-white/20'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${
                          passwordStrength.score <= 2 ? 'text-red-400' :
                          passwordStrength.score <= 3 ? 'text-orange-400' :
                          passwordStrength.score <= 4 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm" className="text-sm font-semibold text-white/90">Confirm Password</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Lock className="h-5 w-5 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <Input
                        id="register-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-12 pr-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-400 focus:bg-white/10 backdrop-blur-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <div className="flex items-center gap-1 text-xs">
                        {password === confirmPassword ? (
                          <>
                            <Check className="h-3 w-3 text-green-400" />
                            <span className="text-green-400">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 text-red-400" />
                            <span className="text-red-400">Passwords don't match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      className="mt-0.5 border-white/30 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                    />
                    <label htmlFor="terms" className="text-xs text-white/70 leading-relaxed cursor-pointer">
                      I agree to the Terms of Service and Privacy Policy. I confirm that I am at least 13 years old.
                    </label>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-[1.02]" 
                    size="lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-4 text-white/60 bg-transparent backdrop-blur-sm">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-13 bg-white/90 hover:bg-white border-0 text-slate-700 font-semibold transition-all duration-300 hover:scale-[1.02] rounded-xl shadow-lg"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        </CardContent>
      </Card>

      {/* Custom animations */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-gradient-shift { animation: gradient-shift 8s ease infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-scale-in { animation: scale-in 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default Auth;
