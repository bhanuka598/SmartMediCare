import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity } from 'lucide-react';
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

  const initialRole = searchParams.get('role') || 'patient';

  const [role, setRole] = useState(
    ['doctor', 'admin'].includes(initialRole) ? initialRole : 'patient'
  );

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const payload = {
      username,
      email,
      password,
      role
    };

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
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>
              Join SmartMediCare to manage your healthcare journey
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">

              {/* Role Selector */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg mb-6">
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
                    {r === 'admin' ? 'Admin' : `I am a ${r}`}
                  </button>
                ))}
              </div>

              {/* Name */}
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              {/* Email */}
              <Input
                label="Email address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* Password */}
              <Input
                label="Password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="Must be at least 8 characters."
              />

              {/* Doctor Extra Field */}
              {role === 'doctor' && (
                <Input
                  label="Medical License Number"
                  type="text"
                  placeholder="e.g. MD123456"
                  value={medicalLicenseNumber}
                  onChange={(e) => setMedicalLicenseNumber(e.target.value)}
                  required
                  helperText="Your registration will be pending admin verification."
                />
              )}

              {/* Admin Extra Field */}
              {role === 'admin' && (
                <Input
                  label="Admin Registration Code"
                  type="password"
                  placeholder="Enter admin code"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  required
                  helperText="Contact system owner for admin access code."
                />
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" fullWidth isLoading={isLoading}>
                Create account
              </Button>

              <div className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
}