import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggleButton from './ThemeToggleButton'; // 1. Import the new component

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <Link to="/" className="logo">TechNews AI</Link>
      <nav>
        <Link to="/">Home</Link>
        {user && <Link to="/bookmarks">Bookmarks</Link>}
        {user ? (
          <button onClick={handleLogout} className="auth-button">Logout</button>
        ) : (
          <Link to="/login" className="auth-button">Login</Link>
        )}
        <ThemeToggleButton /> {/* 2. Add the button here */}
      </nav>
    </header>
  );
}

export default Header;