'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, Eye, EyeOff, Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if already logged in
    const token = localStorage.getItem('ql_admin_token');
    if (token) {
      // Quick verify client-side
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && payload.exp * 1000 > Date.now() && payload.role === 'admin') {
            router.push('/admin');
            return;
          }
        }
      } catch (e) {}
      localStorage.removeItem('ql_admin_token');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setSuccess('Login successful! Redirecting...');
        localStorage.setItem('ql_admin_token', data.token);
        setTimeout(() => router.push('/admin'), 1000);
      } else {
        setAttempts(prev => prev + 1);
        setError(data.error || 'Login failed. Please try again.');
        setPassword('');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">Quick<span className="text-orange-400">Loot</span>.net</div>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Admin Panel Access</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-500/20 p-2.5 rounded-xl">
              <Shield className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Secure Admin Login</h1>
              <p className="text-gray-400 text-xs">Protected with brute force detection</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Password field */}
            <div>
              <label className="block text-sm text-gray-300 mb-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 inline mr-1.5" />
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-xl p-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-green-300 text-xs">{success}</p>
              </div>
            )}

            {/* Brute force warning */}
            {attempts >= 2 && !error.includes('locked') && (
              <div className="flex items-start gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-300 text-xs">Warning: Account will be locked after 3 failed attempts.</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Sign In to Admin
                </>
              )}
            </button>
          </form>

          {/* Security info */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span className="text-gray-400">Security features active:</span>
            </div>
            <ul className="space-y-1.5">
              {[
                'JWT Token Authentication (24h expiry)',
                'Brute Force Protection (3 attempts = 15 min lockout)',
                'Rate Limiting (5 req/15min per IP)',
                'bcrypt Password Hashing',
              ].map(item => (
                <li key={item} className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="text-green-500">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2025 QuickLoot.net · Secure Admin Portal
        </p>
      </div>
    </div>
  );
}
