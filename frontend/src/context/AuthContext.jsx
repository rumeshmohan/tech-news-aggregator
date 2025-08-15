import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in from a previous session
    const userId = localStorage.getItem('userId');
    if (userId) {
      setUser({ id: userId });
    }
  }, []);

  const login = async (username, password) => {
    const response = await apiClient.post('/api/login', { username, password });
    if (response.data.user_id) {
      localStorage.setItem('userId', response.data.user_id);
      setUser({ id: response.data.user_id });
      return response.data;
    }
  };
  
  const signup = async (username, password) => {
    return await apiClient.post('/api/signup', { username, password });
  };

  const logout = () => {
    localStorage.removeItem('userId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);