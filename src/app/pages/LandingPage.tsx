import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Trophy, Users, Award, TrendingUp } from 'lucide-react';
import { signIn, signUp, getSession } from '../lib/auth';
import PageLoader from '../components/PageLoader';
import { toast } from 'sonner';

export default function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Sign in form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');

  useEffect(() => {
    // Check if already logged in using localStorage instead of async call
    const hasToken = localStorage.getItem('access_token');

    if (hasToken) {
      // Check if there's a pending group join
      const pendingGroupId = sessionStorage.getItem('pendingGroupJoin');
      if (pendingGroupId) {
        sessionStorage.removeItem('pendingGroupJoin');
        navigate(`/join/${pendingGroupId}`);
      } else {
        navigate('/dashboard');
      }
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signIn(signInEmail, signInPassword);
      toast.success('Welcome back!');
      
      // Check if there's a pending group join
      const pendingGroupId = sessionStorage.getItem('pendingGroupJoin');
      if (pendingGroupId) {
        sessionStorage.removeItem('pendingGroupJoin');
        navigate(`/join/${pendingGroupId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Sign in failed. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signUp(signUpEmail, signUpPassword, signUpName);
      toast.success('Account created successfully!');
      
      // Check if there's a pending group join
      const pendingGroupId = sessionStorage.getItem('pendingGroupJoin');
      if (pendingGroupId) {
        sessionStorage.removeItem('pendingGroupJoin');
        navigate(`/join/${pendingGroupId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Sign up failed. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-white space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-12 h-12 text-yellow-400" />
              <h1 className="text-5xl font-bold">FIFA Card Rank</h1>
            </div>
            <p className="text-xl text-green-100">
              Create custom FIFA-style ranking cards for your friends and vote for Ballon d'Or style awards!
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-8">
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-yellow-400 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Create Groups</h3>
                <p className="text-green-100">Set up ranking events with custom attributes for your squad</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-yellow-400 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Custom Awards</h3>
                <p className="text-green-100">Vote for personalized awards like "Best Dressed" or "MVP"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-yellow-400 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">View Analytics</h3>
                <p className="text-green-100">See rankings and voting results when the creator reveals them</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Sign in or create an account to start ranking</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your name"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}