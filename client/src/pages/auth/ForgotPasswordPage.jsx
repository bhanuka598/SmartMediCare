import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, CheckCircle, Mail, ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../../components/shared/Card';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../lib/api';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { isAuthenticated, role: userRole, isLoading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && userRole) {
      navigate(`/${userRole}/dashboard`);
    }
  }, [isAuthenticated, userRole, authLoading, navigate]);

  // Step: 'email' -> 'verify' -> 'reset'
  const [step, setStep] = useState('email');

  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation requirements
  const getPasswordRequirements = (pwd) => ({
    minLength: pwd.length >= 8,
    hasUppercase: /[A-Z]/.test(pwd),
    hasLowercase: /[a-z]/.test(pwd),
    hasNumber: /\d/.test(pwd),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
  });

  const passwordReqs = getPasswordRequirements(newPassword);
  const allRequirementsMet = Object.values(passwordReqs).every(Boolean);

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-gray-200' };
    const met = Object.values(getPasswordRequirements(pwd)).filter(Boolean).length;
    if (met <= 2) return { score: met, label: 'Weak', color: 'bg-red-500' };
    if (met <= 4) return { score: met, label: 'Medium', color: 'bg-yellow-500' };
    return { score: met, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Step 1: Send verification code
  const handleSendVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address with @');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      setMessage('Verification code sent to your email!');
      setStep('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (!verificationCode) {
      setError('Please enter the verification code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }

      setMessage('New verification code sent!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (!allRequirementsMet) {
      setError('Password does not meet all requirements');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'verify') setStep('email');
    if (step === 'reset') setStep('verify');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Activity size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              SmartMediCare
            </span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            {step !== 'email' && (
              <button
                onClick={goBack}
                className="absolute left-4 top-4 p-2 text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <CardTitle className="text-2xl">
              {step === 'email' && 'Forgot Password'}
              {step === 'verify' && 'Verify Email'}
              {step === 'reset' && 'Reset Password'}
            </CardTitle>
            <CardDescription>
              {step === 'email' && 'Enter your email to receive a verification code'}
              {step === 'verify' && `We sent a code to ${email}`}
              {step === 'reset' && 'Create a new password for your account'}
            </CardDescription>
          </CardHeader>

          {/* Step 1: Email Entry */}
          {step === 'email' && (
            <form onSubmit={handleSendVerification}>
              <CardContent className="space-y-4">
                <div className="flex justify-center py-4">
                  <div className="bg-blue-50 p-4 rounded-full">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <Input
                  label="Email address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                )}
                {message && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{message}</div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" fullWidth isLoading={isLoading}>
                  Send verification code
                </Button>
                <div className="text-center text-sm text-slate-500">
                  Remember your password?{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}

          {/* Step 2: Verification Code */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyCode}>
              <CardContent className="space-y-4">
                <div className="flex justify-center py-4">
                  <div className="bg-blue-50 p-4 rounded-full">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Verification Code</label>
                  <div className="flex gap-2 justify-center">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        value={verificationCode[index] || ''}
                        onChange={(e) => {
                          const digit = e.target.value.replace(/\D/g, '').slice(0, 1);
                          const newCode = verificationCode.split('');
                          newCode[index] = digit;
                          setVerificationCode(newCode.join(''));
                          if (digit && index < 5) {
                            const nextInput = document.getElementById(`forgot-otp-${index + 1}`);
                            nextInput?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                            const prevInput = document.getElementById(`forgot-otp-${index - 1}`);
                            prevInput?.focus();
                          }
                        }}
                        id={`forgot-otp-${index}`}
                        className="w-12 h-14 text-center text-2xl font-semibold border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        placeholder="•"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 text-center">Enter the 6-digit code sent to your email</p>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                )}
                {message && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{message}</div>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" fullWidth isLoading={isLoading}>
                  Verify email
                </Button>
              </CardFooter>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="flex justify-center py-4">
                  <div className="bg-blue-50 p-4 rounded-full">
                    <Lock className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md text-green-700">
                  <CheckCircle size={18} />
                  <span className="text-sm font-medium">{email} verified</span>
                </div>

                {/* New Password with strength indicator */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.label === 'Weak' ? 'text-red-600' :
                          passwordStrength.label === 'Medium' ? 'text-yellow-600' :
                          passwordStrength.label === 'Strong' ? 'text-green-600' : 'text-slate-400'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>

                      {/* Requirements Checklist */}
                      <div className="grid grid-cols-1 gap-1.5 text-xs">
                        <div className={`flex items-center gap-1.5 ${passwordReqs.minLength ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordReqs.minLength ? <CheckCircle size={12} /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                          At least 8 characters
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordReqs.hasUppercase ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordReqs.hasUppercase ? <CheckCircle size={12} /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                          One uppercase letter (A-Z)
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordReqs.hasLowercase ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordReqs.hasLowercase ? <CheckCircle size={12} /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                          One lowercase letter (a-z)
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordReqs.hasNumber ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordReqs.hasNumber ? <CheckCircle size={12} /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                          One number (0-9)
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordReqs.hasSpecial ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordReqs.hasSpecial ? <CheckCircle size={12} /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                          One special character (!@#$...)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        confirmPassword && newPassword !== confirmPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-600">Passwords do not match</p>
                  )}
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                )}
                {message && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{message}</div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  disabled={!allRequirementsMet || newPassword !== confirmPassword}
                >
                  Reset Password
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
