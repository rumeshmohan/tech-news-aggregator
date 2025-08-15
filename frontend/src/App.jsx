import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookmarksProvider } from './context/BookmarksContext';
import { ThemeProvider } from './context/ThemeContext';

import Header from './components/Header';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import AuthPage from './pages/AuthPage';
import BookmarksPage from './pages/BookmarksPage';

// A wrapper for routes that require authentication
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BookmarksProvider>
          <Router>
            <Header />
            <main className="main-container">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/article/:id" element={<ArticlePage />} />
                <Route 
                  path="/bookmarks" 
                  element={
                    <ProtectedRoute>
                      <BookmarksPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </Router>
        </BookmarksProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;