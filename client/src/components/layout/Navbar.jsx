import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../shared/Button';

export function Navbar() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Activity size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            HealthSync
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">

          {!isAuthenticated ? (
            <>
              <Link
                to="/#features"
                className="text-sm font-medium text-slate-600 hover:text-blue-600"
              >
                Features
              </Link>

              <Link
                to="/#how-it-works"
                className="text-sm font-medium text-slate-600 hover:text-blue-600"
              >
                How it Works
              </Link>

              <div className="flex items-center gap-4 ml-4">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>

                <Link to="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">

              <button className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">

                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-900">
                    {user?.name}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">
                    {role}
                  </span>
                </div>

                <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-full w-full p-2 text-slate-400" />
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="ml-2 px-2 text-slate-500 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                </Button>

              </div>
            </div>
          )}

        </nav>
      </div>
    </header>
  );
}