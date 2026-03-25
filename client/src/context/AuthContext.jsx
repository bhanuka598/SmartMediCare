import React, { useState, createContext, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const login = (email, selectedRole) => {
    // Mock login implementation
    setUser({
      id: Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0].replace('.', ' '),
      email,
      avatar: `https://ui-avatars.com/api/?name=${email}&background=0D8ABC&color=fff`
    });

    setRole(selectedRole);
  };

  const logout = () => {
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