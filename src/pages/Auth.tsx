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

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background with moving orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large animated orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-50 animate-orb-1"
          style={{
            background: 'radial-gradient(circle, hsl(var(--auth-gradient-1)) 0%, transparent 70%)'
          }}
        />
        <div 
          className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-40 animate-orb-2"
          style={{
            background: 'radial-gradient(circle, hsl(var(--auth-gradient-2)) 0%, transparent 70%)'
          }}
        />
        <div 
          className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] rounded-full blur-3xl opacity-45 animate-orb-3"
          style={{
            background: 'radial-gradient(circle, hsl(var(--auth-gradient-3)) 0%, transparent 70%)'
          }}
        />
        <div 
          className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] rounded-full blur-3xl opacity-35 animate-orb-1"
          style={{
            background: 'radial-gradient(circle, hsl(var(--auth-gradient-4)) 0%, transparent 70%)',
            animationDelay: '5s'
          }}
        />
        
        {/* Additional smaller floating elements */}
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-float" />
        <div className="absolute top-1/4 right-1/3 w-24 h-24 bg-purple-500/20 rounded-full blur-xl animate-float-slow" />
        <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-pink-500/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Glass card with content */}
      <Card className="w-full max-w-md shadow-2xl border-white/20 backdrop-blur-xl bg-white/10 relative z-10 overflow-hidden">
        {/* Gradient overlay on card */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
        
        <CardHeader className="text-center space-y-6 pb-8 relative">
          <div className="flex justify-center animate-float">
            <div className="relative">
              {/* Glowing effect behind icon */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 blur-2xl opacity-75 rounded-full animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
              
              {/* Icon container with gradient */}
              <div className="relative bg-gradient-to-br from-primary via-purple-600 to-pink-600 p-5 rounded-2xl shadow-2xl">
                <Sparkles className="h-14 w-14 text-white drop-shadow-lg" />
              </div>
              
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
          </div>
          
          <div>
            <CardTitle className="text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}>
                ASKIFY
              </span>
            </CardTitle>
            <CardDescription className="text-lg text-white/90 font-medium flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Your Intelligent AI Companion
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-8 relative">
          <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/10 p-1 backdrop-blur-sm">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white text-white/70 font-semibold transition-all"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white text-white/70 font-semibold transition-all"
              >
                Register
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-semibold text-white/90">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:bg-white/15 backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-semibold text-white/90">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:bg-white/15 backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-pink-600/90 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]" 
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
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-sm font-semibold text-white/90">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:bg-white/15 backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-sm font-semibold text-white/90">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:bg-white/15 backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-sm font-semibold text-white/90">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:bg-white/15 backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-pink-600/90 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]" 
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
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
