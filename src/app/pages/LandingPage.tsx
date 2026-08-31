import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Award, Gamepad2, Sparkles, Trophy, Users } from 'lucide-react';
import { isAuthenticated, signIn, signUp } from '../lib/auth';
import { useAppTheme } from '../lib/theme';
import { toast } from 'sonner';

interface LandingLocationState {
  openLogin?: boolean;
  redirectTo?: string;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tokens } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('signin');
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');

  useEffect(() => {
    const state = location.state as LandingLocationState | null;
    if (!state?.openLogin) return;

    setRedirectTo(state.redirectTo ?? null);
    setAuthTab('signin');
    setAuthOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const finishAuthentication = () => {
    const destination = redirectTo || sessionStorage.getItem('pendingGroupJoin') || '/dashboard';
    sessionStorage.removeItem('pendingGroupJoin');
    setRedirectTo(null);
    setAuthOpen(false);
    navigate(destination);
  };

  const handlePlayGame = () => {
    if (isAuthenticated()) {
      navigate('/dashboard');
      return;
    }
    setAuthTab('signin');
    setAuthOpen(true);
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signIn(signInEmail, signInPassword);
      toast.success('Welcome back!');
      finishAuthentication();
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signUp(signUpEmail, signUpPassword, signUpName);
      toast.success('Account created successfully!');
      finishAuthentication();
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-6xl grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
        <section className="text-white space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Trophy className={`w-12 h-12 ${tokens.accentText}`} />
              <h1 className="text-4xl sm:text-5xl font-bold">FIFA Card Rank</h1>
            </div>
            <p className={`max-w-2xl text-lg sm:text-xl ${tokens.accentTextSecondary}`}>
              Build your FIFA-style card, then sign in to create a group, invite your squad, and play together.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex gap-3">
              <Users className={`w-6 h-6 shrink-0 ${tokens.accentText}`} />
              <div><h2 className="font-semibold">Create groups</h2><p className={`text-sm ${tokens.accentTextSecondary}`}>Set up games for your squad.</p></div>
            </div>
            <div className="flex gap-3">
              <Award className={`w-6 h-6 shrink-0 ${tokens.accentText}`} />
              <div><h2 className="font-semibold">Vote for awards</h2><p className={`text-sm ${tokens.accentTextSecondary}`}>Rank each other your way.</p></div>
            </div>
            <div className="flex gap-3">
              <Sparkles className={`w-6 h-6 shrink-0 ${tokens.accentText}`} />
              <div><h2 className="font-semibold">Make it yours</h2><p className={`text-sm ${tokens.accentTextSecondary}`}>Design a custom card first.</p></div>
            </div>
          </div>
        </section>

        <Card className="w-full shadow-2xl">
          <CardHeader>
            <CardTitle>Ready to play?</CardTitle>
            <CardDescription>Choose how you want to get started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handlePlayGame} className="w-full h-auto min-h-14 justify-start gap-3 text-left">
              <Gamepad2 className="w-5 h-5 shrink-0" />
              <span><span className="block font-semibold">Play Game</span><span className="block text-xs opacity-80">Create or join a group</span></span>
            </Button>
            <Button onClick={() => navigate('/create-card')} variant="outline" className="w-full h-auto min-h-14 justify-start gap-3 text-left">
              <Sparkles className="w-5 h-5 shrink-0" />
              <span><span className="block font-semibold">Create Card</span><span className="block text-xs opacity-70">Design a card without signing in</span></span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to play</DialogTitle>
            <DialogDescription>Create or join a group after you sign in.</DialogDescription>
          </DialogHeader>
          <Tabs value={authTab} onValueChange={setAuthTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" placeholder="you@example.com" value={signInEmail} onChange={(event) => setSignInEmail(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" type="password" value={signInPassword} onChange={(event) => setSignInPassword(event.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input id="signup-name" type="text" placeholder="Your name" value={signUpName} onChange={(event) => setSignUpName(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="you@example.com" value={signUpEmail} onChange={(event) => setSignUpEmail(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" value={signUpPassword} onChange={(event) => setSignUpPassword(event.target.value)} minLength={6} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
