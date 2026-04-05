import React, { useState, createContext, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Check for stored token on initial load
    const token = localStorage.getItem('token');
    return null; // Will be populated by token verification if needed
  });
  const [role, setRole] = useState(null);

  const login = (token, userData) => {
    // Store token in localStorage
    localStorage.setItem('token', token);
    
    // Set user from backend response
    setUser(userData);
    setRole(userData.role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}