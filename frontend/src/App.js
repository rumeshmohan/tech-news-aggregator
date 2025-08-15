// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import NewsFeed from './components/NewsFeed';
import ChatInterface from './components/ChatInterface';
import TrendingTopics from './components/TrendingTopics';
import SavedArticles from './components/SavedArticles';
import Login from './components/Login';
import Signup from './components/Signup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faArrowLeft, faSave, faBookmark } from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tech-news-aggregator-production.up.railway.app';

function App() {
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [theme, setTheme] = useState('light');
    const [view, setView] = useState('newsFeed');
    const [currentUser, setCurrentUser] = useState(null);
    const [dateFilter, setDateFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    const availableCategories = ["AI/ML", "Startups", "Cybersecurity", "Mobile", "Web3"];

    useEffect(() => {
        const storedUserId = localStorage.getItem('user_id');
        if (storedUserId) {
            setCurrentUser(storedUserId);
        }
    }, []);

    useEffect(() => {
        document.body.className = `${theme}-theme`;
    }, [theme]);

    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000); // Message disappears after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [message]);

    const showMessage = (text, type) => {
        setMessage({ text, type });
    };

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleArticleSelect = (article) => {
        setSelectedArticle(article);
    };

    const handleBack = () => {
        setSelectedArticle(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('user_id');
        setCurrentUser(null);
        setView('newsFeed');
    };

    const handleSaveArticle = async (articleId) => {
        if (!currentUser) {
            showMessage("Please log in to save articles.", "error");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': currentUser
                },
                body: JSON.stringify({ article_id: articleId })
            });
            if (!response.ok) {
                throw new Error('Failed to save article');
            }
            showMessage('Article saved successfully!', 'success');
        } catch (error) {
            console.error("Error saving article:", error);
            showMessage('Could not save the article.', 'error');
        }
    };

    const handleArticleUnsave = async (articleId) => {
        if (!currentUser) {
            showMessage("You must be logged in to unsave articles.", "error");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookmarks/${articleId}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Id': currentUser,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to unsave article.');
            }
            showMessage("Article unsaved successfully!", "success");
        } catch (error) {
            console.error("Error unsaving article:", error);
            showMessage('Could not unsave the article. Please try again.', 'error');
        }
    };

    const renderMessage = () => {
        if (!message.text) return null;
        const messageClass = message.type === 'success' ? 'bg-green-500' : 'bg-red-500';
        return (
            <div className={`fixed bottom-4 right-4 text-white px-4 py-2 rounded shadow-lg ${messageClass} transition-opacity duration-500`}>
                {message.text}
            </div>
        );
    };

    const renderContent = () => {
        if (!currentUser) {
            if (view === 'signup') {
                return <Signup onSignupSuccess={() => setView('login')} />;
            }
            return <Login onLoginSuccess={setCurrentUser} onSwitchToSignup={() => setView('signup')} />;
        }

        if (selectedArticle) {
            return (
                <>
                    <header className="app-header">
                        <h1>Tech News Aggregator</h1>
                        <div className="header-controls">
                            <button onClick={toggleTheme} className="theme-toggle">
                                <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
                            </button>
                            {currentUser && (
                                <>
                                    <button onClick={() => setView('saved')} className="saved-articles-button">
                                        <FontAwesomeIcon icon={faBookmark} /> Saved
                                    </button>
                                    <button onClick={handleLogout} className="logout-button">
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </header>
                    <main>
                        <div className="article-details-and-chat-container">
                            <div className="article-header">
                                <button onClick={handleBack} className="back-button">
                                    <FontAwesomeIcon icon={faArrowLeft} /> Back to News Feed
                                </button>
                                <div className="article-and-actions">
                                    <button className="save-button" onClick={() => handleSaveArticle(selectedArticle._id)}>
                                        <FontAwesomeIcon icon={faSave} /> Save Article
                                    </button>
                                </div>
                            </div>
                            <div className="main-article-content-wrapper">
                                <div className="selected-article-display">
                                    <h2>{selectedArticle.title}</h2>
                                    <p><strong>Source:</strong> {selectedArticle.source}</p>
                                    <p><strong>Sentiment:</strong> <span className={`sentiment-${selectedArticle.sentiment.toLowerCase()}`}>{selectedArticle.sentiment}</span></p>
                                    <p dangerouslySetInnerHTML={{ __html: selectedArticle.summary }}></p>
                                    <a href={selectedArticle.link} target="_blank" rel="noopener noreferrer">
                                        Read full article
                                    </a>
                                </div>
                                <div className="chat-interface-wrapper">
                                    <h3>Chat with AI Assistant</h3>
                                    <ChatInterface articleId={selectedArticle._id} />
                                </div>
                            </div>
                        </div>
                    </main>
                </>
            );
        }

        if (view === 'saved') {
            return (
                <>
                    <header className="app-header">
                        <h1>Tech News Aggregator</h1>
                        <div className="header-controls">
                            <button onClick={toggleTheme} className="theme-toggle">
                                <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
                            </button>
                            {currentUser && (
                                <>
                                    <button onClick={handleLogout} className="logout-button">
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </header>
                    <main>
                        <div>
                            <button onClick={() => setView('newsFeed')} className="back-button">
                                <FontAwesomeIcon icon={faArrowLeft} /> Back to News Feed
                            </button>
                            <SavedArticles
                                onArticleSelect={handleArticleSelect}
                                onArticleUnsave={handleArticleUnsave}
                                currentUser={currentUser}
                            />
                        </div>
                    </main>
                </>
            );
        }

        return (
            <>
                <header className="app-header">
                    <h1>Tech News Aggregator</h1>
                    <div className="header-controls">
                        <button onClick={toggleTheme} className="theme-toggle">
                            <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
                        </button>
                        {currentUser && (
                            <>
                                <button onClick={() => setView('saved')} className="saved-articles-button">
                                    <FontAwesomeIcon icon={faBookmark} /> Saved
                                </button>
                                <button onClick={handleLogout} className="logout-button">
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </header>
                <main>
                    <div className="dashboard-container">
                        <TrendingTopics />
                        <div className="main-news-section">
                            <div className="filter-controls">
                                <button onClick={() => setDateFilter('')} className={dateFilter === '' ? 'active' : ''}>
                                    All
                                </button>
                                <button onClick={() => setDateFilter('today')} className={dateFilter === 'today' ? 'active' : ''}>
                                    Today
                                </button>
                                <button onClick={() => setDateFilter('this_week')} className={dateFilter === 'this_week' ? 'active' : ''}>
                                    This Week
                                </button>
                                <button onClick={() => setDateFilter('this_month')} className={dateFilter === 'this_month' ? 'active' : ''}>
                                    This Month
                                </button>
                                <select
                                    className="category-dropdown"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {availableCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <NewsFeed
                                onArticleSelect={handleArticleSelect}
                                currentUser={currentUser}
                                setView={setView}
                                dateFilter={dateFilter}
                                categoryFilter={categoryFilter}
                                onArticleUnsave={handleArticleUnsave}
                            />
                        </div>
                    </div>
                </main>
            </>
        );
    };

    return (
        <>
            {renderContent()}
            {renderMessage()}
        </>
    );
}

export default App;