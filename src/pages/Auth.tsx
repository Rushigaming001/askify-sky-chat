import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Mail, Lock, User, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
        navigate('/');
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
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google',
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Animated background with moving orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large animated orbs with vibrant colors */}
        <div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-60 animate-orb-1"
          style={{
            background: 'radial-gradient(circle, hsl(217 91% 80%) 0%, hsl(217 91% 90%) 30%, transparent 70%)'
          }}
        />
        <div 
          className="absolute top-1/3 right-1/4 w-[700px] h-[700px] rounded-full blur-3xl opacity-50 animate-orb-2"
          style={{
            background: 'radial-gradient(circle, hsl(280 100% 85%) 0%, hsl(280 100% 92%) 30%, transparent 70%)'
          }}
        />
        <div 
          className="absolute bottom-1/4 left-1/3 w-[650px] h-[650px] rounded-full blur-3xl opacity-55 animate-orb-3"
          style={{
            background: 'radial-gradient(circle, hsl(340 82% 85%) 0%, hsl(340 82% 92%) 30%, transparent 70%)'
          }}
        />
        <div 
          className="absolute bottom-1/3 right-1/3 w-[550px] h-[550px] rounded-full blur-3xl opacity-45 animate-orb-1"
          style={{
            background: 'radial-gradient(circle, hsl(160 84% 75%) 0%, hsl(160 84% 88%) 30%, transparent 70%)',
            animationDelay: '5s'
          }}
        />
        
        {/* Additional smaller floating elements */}
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-blue-300/30 rounded-full blur-2xl animate-float" />
        <div className="absolute top-1/4 right-1/3 w-36 h-36 bg-purple-300/30 rounded-full blur-xl animate-float-slow" />
        <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-pink-300/25 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 right-1/2 w-40 h-40 bg-cyan-300/30 rounded-full blur-xl animate-float-slow" style={{ animationDelay: '3s' }} />
      </div>

      {/* Glass card with content */}
      <Card className="w-full max-w-md shadow-2xl border-primary/20 backdrop-blur-2xl bg-white/95 relative z-10 overflow-hidden">
        {/* Gradient overlay on card */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-purple-100/30 to-pink-100/50 pointer-events-none" />
        
        <CardHeader className="text-center space-y-6 pb-8 relative">
          <div className="flex justify-center animate-float">
            <div className="relative">
              {/* Glowing effect behind icon */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 blur-2xl opacity-60 rounded-full animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
              
              {/* Icon container with gradient */}
              <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-5 rounded-2xl shadow-2xl">
                <Sparkles className="h-14 w-14 text-white drop-shadow-lg" />
              </div>
              
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/40 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
          </div>
          
          <div>
            <CardTitle className="text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-md animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}>
                ASKIFY
              </span>
            </CardTitle>
            <CardDescription className="text-lg text-foreground/80 font-medium flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Your Intelligent AI Companion
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-8 relative">
          {showForgotPassword ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">Reset Password</h3>
                <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-semibold text-foreground">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-12 h-12 bg-white/80 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white backdrop-blur-sm transition-all"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={handleForgotPassword}
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]" 
                  size="lg" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button 
                  onClick={() => setShowForgotPassword(false)}
                  variant="ghost"
                  className="w-full text-foreground/70 hover:text-foreground"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          ) : (
            <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => setIsLogin(v === 'login')}>
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-primary/10 p-1 backdrop-blur-sm border border-primary/20">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-foreground/70 font-semibold transition-all"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-foreground/70 font-semibold transition-all"
                >
                  Register
                </TabsTrigger>
              </TabsList>
            
              <TabsContent value="login">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-semibold text-foreground">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 bg-white/80 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white backdrop-blur-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-sm font-semibold text-foreground">Password</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-12 bg-white/80 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white backdrop-blur-sm transition-all"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]" 
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
                      <span className="w-full border-t border-primary/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full h-12 border-primary/20 bg-white/80 hover:bg-white hover:border-primary/40 transition-all"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </form>
              </TabsContent>
            
              <TabsContent value="register">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-sm font-semibold text-foreground">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-12 h-12 bg-white/80 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white backdrop-blur-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-sm font-semibold text-foreground">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 bg-white/80 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white backdrop-blur-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-semibold text-foreground">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-12 bg-white/80 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white backdrop-blur-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-sm font-semibold text-foreground">Confirm Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-12 h-12 bg-white/80 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white backdrop-blur-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-age" className="text-sm font-semibold text-foreground">Age (Optional)</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="register-age"
                        type="number"
                        placeholder="Your age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="pl-12 h-12 bg-white/80 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white backdrop-blur-sm transition-all"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]" 
                    size="lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Create ASKIFY Account
                      </>
                    )}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-primary/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full h-12 border-primary/20 bg-white/80 hover:bg-white hover:border-primary/40 transition-all"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
