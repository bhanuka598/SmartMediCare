import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, CheckCircle, Mail, ArrowLeft } from 'lucide-react';
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

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const initialRole = searchParams.get('role') || 'patient';
  const [role, setRole] = useState(
    ['doctor', 'admin'].includes(initialRole) ? initialRole : 'patient'
  );

  // Step: 'email' -> 'verify' -> 'form'
  const [step, setStep] = useState('email');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

    try {
      const response = await fetch('http://localhost:5002/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
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
      const response = await fetch('http://localhost:5002/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      setStep('form');
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
      const response = await fetch('http://localhost:5002/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
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

  // Step 3: Complete registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const payload = { username, email, password, role };

    if (role === 'doctor') {
      payload.medicalLicenseNumber = medicalLicenseNumber;
    }

    try {
      const response = await fetch('http://localhost:5002/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      login(data.token, data.user);
      navigate(`/${role}/dashboard`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'verify') setStep('email');
    if (step === 'form') setStep('verify');
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
              {step === 'email' && 'Verify your email'}
              {step === 'verify' && 'Enter verification code'}
              {step === 'form' && 'Complete registration'}
            </CardTitle>
            <CardDescription>
              {step === 'email' && 'Enter your email to receive a verification code'}
              {step === 'verify' && `We sent a code to ${email}`}
              {step === 'form' && 'Fill in your details to create your account'}
            </CardDescription>
          </CardHeader>

          {/* Step 1: Email Entry */}
          {step === 'email' && (
            <form onSubmit={handleSendVerification}>
              <CardContent className="space-y-4">
                {/* Role Selector */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg">
                  {['patient', 'doctor', 'admin'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-1.5 text-sm font-medium rounded-md capitalize transition-all ${
                        role === r
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {r === 'admin' ? 'Admin' : r}
                    </button>
                  ))}
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
                  Already have an account?{' '}
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
                          // Auto-focus next input
                          if (digit && index < 5) {
                            const nextInput = document.getElementById(`otp-${index + 1}`);
                            nextInput?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          // Handle backspace to go to previous input
                          if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                            const prevInput = document.getElementById(`otp-${index - 1}`);
                            prevInput?.focus();
                          }
                        }}
                        id={`otp-${index}`}
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

          {/* Step 3: Registration Form */}
          {step === 'form' && (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md text-green-700">
                  <CheckCircle size={18} />
                  <span className="text-sm font-medium">{email} verified</span>
                </div>

                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  helperText="Must be at least 8 characters."
                />

                {role === 'doctor' && (
                  <Input
                    label="Medical License Number"
                    type="text"
                    placeholder="e.g. MD123456"
                    value={medicalLicenseNumber}
                    onChange={(e) => setMedicalLicenseNumber(e.target.value)}
                    required
                    helperText="Required for doctor registration."
                  />
                )}

                {role === 'admin' && (
                  <Input
                    label="Admin Registration Code"
                    type="password"
                    placeholder="Enter admin code"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    required
                    helperText="Contact system owner for access code."
                  />
                )}

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" fullWidth isLoading={isLoading}>
                  Create account
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
