'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { setUser, setToken } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        toast({
          title: 'Login failed',
          description: result.error || 'Invalid email or password',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      apiClient.setToken(result.token!);
      setUser(result.user!);
      setToken(result.token!);

      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      });

      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-gateway-shell">
      <div className="auth-gateway-orb auth-gateway-orb-one" />
      <div className="auth-gateway-orb auth-gateway-orb-two" />
      <div className="auth-gateway-grid">
        <section className="auth-gateway-visual reveal-up hidden lg:flex">
          <div>
            <p className="auth-signup-chip">Research Gateway</p>
            <h1 className="auth-gateway-title">Step back into your research command center.</h1>
            <p className="auth-gateway-copy">
              Track papers, synthesize findings, and keep your interview prep in one workflow designed for deep technical learning.
            </p>
            <ul className="auth-gateway-points">
              <li>AI-assisted paper breakdowns</li>
              <li>Curated discovery feed with relevance scoring</li>
              <li>Interview simulation from your own research notes</li>
            </ul>
          </div>
          <div className="auth-gateway-image" />
        </section>

        <Card className="auth-gateway-card reveal-up">
          <div className="p-6 sm:p-8">
            <div className="mb-8 space-y-2">
              <p className="auth-signup-chip auth-signup-chip-inline">Welcome Back</p>
              <h2 className="text-3xl font-bold tracking-tight">Sign in to Research Plus</h2>
              <p className="text-muted-foreground">Continue from where your last research session ended.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 bg-background/85"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 bg-background/85"
                />
              </div>

              <Button
                type="submit"
                className="auth-signup-button h-11 w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
