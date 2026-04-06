'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { setUser, setToken } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await register(email, password, firstName, lastName);

      if (!result.success) {
        toast({
          title: 'Registration failed',
          description: result.error || 'Failed to create account',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      apiClient.setToken(result.token!);
      setUser(result.user!);
      setToken(result.token!);

      toast({
        title: 'Account created',
        description: 'Welcome to Research Plus!',
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
    <div className="auth-signup-shell">
      <div className="auth-signup-orb auth-signup-orb-one" />
      <div className="auth-signup-orb auth-signup-orb-two" />
      <div className="auth-signup-grid">
        <section className="auth-signup-intro reveal-up hidden lg:block">
          <p className="auth-signup-chip">Research Plus Workspace</p>
          <h1 className="auth-signup-title">Build sharper research habits from day one.</h1>
          <p className="auth-signup-copy">
            Create your account to organize papers, extract insights quickly, and prepare interview-ready talking points in one focused workflow.
          </p>
          <ul className="auth-signup-list">
            <li>Structured research notes and analysis in one place</li>
            <li>Trending discovery feed tailored to your interests</li>
            <li>Interview simulation flow based on your saved work</li>
          </ul>
        </section>

        <Card className="auth-signup-card reveal-up">
          <div className="p-6 sm:p-8">
            <div className="mb-8 space-y-2">
              <p className="auth-signup-chip auth-signup-chip-inline">Get Started</p>
              <h2 className="text-3xl font-bold tracking-tight">Create your account</h2>
              <p className="text-muted-foreground">
                Join Research Plus and start building your technical edge.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                    className="h-11 bg-background/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                    className="h-11 bg-background/80"
                  />
                </div>
              </div>

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
                  className="h-11 bg-background/80"
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
                  minLength={6}
                  disabled={isLoading}
                  className="h-11 bg-background/80"
                />
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>

              <Button
                type="submit"
                className="auth-signup-button h-11 w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
