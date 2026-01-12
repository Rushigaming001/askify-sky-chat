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
import { Sparkles, Mail, Lock, User, Zap, Shield, Check, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import techBackground from '@/assets/tech-background.png';

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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-2 sm:p-4 md:p-6 lg:p-8 bg-[#0a0a1a]">
      {/* Tech Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${techBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Animated tech overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Hexagon grid pattern animation */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                <polygon 
                  points="25,0 50,14.4 50,43.4 25,43.4 0,43.4 0,14.4" 
                  fill="none" 
                  stroke="rgba(0,255,255,0.3)" 
                  strokeWidth="0.5"
                  className="animate-pulse"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
          </svg>
        </div>
        
        {/* Animated circuit lines */}
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Horizontal scanning line */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-horizontal opacity-60" />
          
          {/* Vertical scanning line */}
          <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-scan-vertical opacity-60" />
          
          {/* Glowing particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-glow-pulse shadow-[0_0_20px_rgba(0,255,255,0.8)]" />
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-glow-pulse shadow-[0_0_20px_rgba(0,255,255,0.8)]" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-glow-pulse shadow-[0_0_20px_rgba(0,255,255,0.8)]" style={{ animationDelay: '1s' }} />
          <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-glow-pulse shadow-[0_0_20px_rgba(0,255,255,0.8)]" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-glow-pulse shadow-[0_0_20px_rgba(0,255,255,0.8)]" style={{ animationDelay: '2s' }} />
          
          {/* Animated connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="rgba(0,255,255,0.6)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <line x1="0" y1="30%" x2="100%" y2="30%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-line-flow" />
            <line x1="0" y1="70%" x2="100%" y2="70%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-line-flow" style={{ animationDelay: '2s' }} />
          </svg>
        </div>
        
        {/* Floating tech elements */}
        <div className="absolute top-20 left-10 w-20 h-20 border border-cyan-400/30 rotate-45 animate-float opacity-40" />
        <div className="absolute bottom-32 right-20 w-16 h-16 border border-cyan-400/30 rotate-12 animate-float-slow opacity-40" />
        <div className="absolute top-1/2 left-20 w-12 h-12 border border-cyan-400/30 -rotate-12 animate-float opacity-30" style={{ animationDelay: '1s' }} />
        
        {/* Glowing corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-transparent blur-xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-cyan-400/20 to-transparent blur-xl" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-400/20 to-transparent blur-xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-transparent blur-xl" />
      </div>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 z-[1]" />

      {/* Glass card with content */}
      <Card className="w-full max-w-md mx-2 sm:mx-0 shadow-2xl border-cyan-400/30 backdrop-blur-xl bg-slate-900/80 relative z-10 overflow-hidden animate-scale-in">
        {/* Tech glow overlay on card */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-purple-400/10 pointer-events-none" />
        <div className="absolute inset-0 border border-cyan-400/20 rounded-lg pointer-events-none" />
        
        {/* Animated border glow */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-400/0 via-cyan-400/50 to-cyan-400/0 rounded-lg opacity-0 animate-border-glow pointer-events-none" />
        
        <CardHeader className="text-center space-y-6 pb-8 relative">
          <div className="flex justify-center animate-float">
            <div className="relative">
              {/* Glowing effect behind icon */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 blur-2xl opacity-60 rounded-full animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
              
              {/* Icon container with gradient */}
              <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-5 rounded-2xl shadow-2xl shadow-purple-500/50">
                <Sparkles className="h-14 w-14 text-white drop-shadow-lg" />
              </div>
              
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/40 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
          </div>
          
          <div>
            <CardTitle className="text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-md animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}>
                ASKIFY
              </span>
            </CardTitle>
            <CardDescription className="text-lg text-cyan-100/80 font-medium flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400 animate-pulse" />
              Your Intelligent AI Companion
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-8 relative">
          {showForgotPassword ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Reset Password</h3>
                <p className="text-sm text-cyan-100/60">Enter your email to receive a reset link</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-semibold text-cyan-100">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400/60 group-focus-within:text-cyan-400 transition-colors" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-12 h-12 bg-slate-800/60 border-cyan-400/30 text-white placeholder:text-cyan-100/40 focus:border-cyan-400 focus:bg-slate-800/80 backdrop-blur-sm transition-all focus:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={handleForgotPassword}
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-[1.02]" 
                  size="lg" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button 
                  onClick={() => setShowForgotPassword(false)}
                  variant="ghost"
                  className="w-full text-cyan-100/70 hover:text-cyan-100 hover:bg-cyan-400/10"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          ) : (
            <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => setIsLogin(v === 'login')}>
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-800/60 p-1 backdrop-blur-sm border border-cyan-400/20">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-cyan-100/70 font-semibold transition-all data-[state=active]:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-cyan-100/70 font-semibold transition-all data-[state=active]:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                >
                  Register
                </TabsTrigger>
              </TabsList>
            
              <TabsContent value="login">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-semibold text-cyan-100">Email</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Mail className="h-5 w-5 text-cyan-400/60 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 bg-slate-800/60 border-cyan-400/30 text-white placeholder:text-cyan-100/40 focus:border-cyan-400 focus:bg-slate-800/80 backdrop-blur-sm transition-all focus:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-sm font-semibold text-cyan-100">Password</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Lock className="h-5 w-5 text-cyan-400/60 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-12 bg-slate-800/60 border-cyan-400/30 text-white placeholder:text-cyan-100/40 focus:border-cyan-400 focus:bg-slate-800/80 backdrop-blur-sm transition-all focus:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400/60 hover:text-cyan-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-[1.02]" 
                    size="lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Logging in...
                      </div>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Login to ASKIFY
                      </>
                    )}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-cyan-400/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-900 px-2 text-cyan-100/60">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 bg-slate-800/60 border-cyan-400/30 text-white hover:bg-slate-800/80 hover:border-cyan-400/50 transition-all hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-sm font-semibold text-cyan-100">Full Name</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <User className="h-5 w-5 text-cyan-400/60 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-12 h-12 bg-slate-800/60 border-cyan-400/30 text-white placeholder:text-cyan-100/40 focus:border-cyan-400 focus:bg-slate-800/80 backdrop-blur-sm transition-all focus:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-sm font-semibold text-cyan-100">Email</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Mail className="h-5 w-5 text-cyan-400/60 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 bg-slate-800/60 border-cyan-400/30 text-white placeholder:text-cyan-100/40 focus:border-cyan-400 focus:bg-slate-800/80 backdrop-blur-sm transition-all focus:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-semibold text-cyan-100">Password</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Lock className="h-5 w-5 text-cyan-400/60 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-12 bg-slate-800/60 border-cyan-400/30 text-white placeholder:text-cyan-100/40 focus:border-cyan-400 focus:bg-slate-800/80 backdrop-blur-sm transition-all focus:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400/60 hover:text-cyan-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {password && (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${passwordStrength.color} transition-all`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs text-cyan-100/60">
                          <div className="flex items-center gap-1">
                            {password.length >= 8 ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                            8+ characters
                          </div>
                          <div className="flex items-center gap-1">
                            {/[A-Z]/.test(password) && /[a-z]/.test(password) ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                            Mixed case
                          </div>
                          <div className="flex items-center gap-1">
                            {/\d/.test(password) ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                            Number
                          </div>
                          <div className="flex items-center gap-1">
                            {/[^a-zA-Z0-9]/.test(password) ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                            Special char
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-sm font-semibold text-cyan-100">Confirm Password</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Shield className="h-5 w-5 text-cyan-400/60 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-12 pr-12 h-12 bg-slate-800/60 border-cyan-400/30 text-white placeholder:text-cyan-100/40 focus:border-cyan-400 focus:bg-slate-800/80 backdrop-blur-sm transition-all focus:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400/60 hover:text-cyan-400 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <X className="h-3 w-3" /> Passwords do not match
                      </p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-xs text-green-400 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Passwords match
                      </p>
                    )}
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms" 
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      className="mt-1 border-cyan-400/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                    <Label htmlFor="terms" className="text-sm text-cyan-100/70 leading-relaxed">
                      I agree to the{' '}
                      <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer underline">Terms of Service</span>
                      {' '}and{' '}
                      <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer underline">Privacy Policy</span>
                    </Label>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-[1.02]" 
                    size="lg" 
                    disabled={isLoading || !acceptTerms}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Create Account
                      </>
                    )}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-cyan-400/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-900 px-2 text-cyan-100/60">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 bg-slate-800/60 border-cyan-400/30 text-white hover:bg-slate-800/80 hover:border-cyan-400/50 transition-all hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Custom CSS for tech animations */}
      <style>{`
        @keyframes scan-horizontal {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes scan-vertical {
          0% { transform: translateX(-100vw); }
          100% { transform: translateX(100vw); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes line-flow {
          0% { opacity: 0; transform: translateX(-100%); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateX(100%); }
        }
        @keyframes border-glow {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.5; }
        }
        .animate-scan-horizontal {
          animation: scan-horizontal 4s linear infinite;
        }
        .animate-scan-vertical {
          animation: scan-vertical 5s linear infinite;
        }
        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
        .animate-line-flow {
          animation: line-flow 4s ease-in-out infinite;
        }
        .animate-border-glow {
          animation: border-glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Auth;
