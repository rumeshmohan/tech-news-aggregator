import React, { useState, useEffect } from 'react';

// Use this base URL for your local backend.
// In a real app, you would use environment variables.
const API_BASE_URL = 'https://tech-news-aggregator-production.up.railway.app';

// A simple utility for a toast-like message.
const showToast = (text, type) => {
    const event = new CustomEvent('show-toast', { detail: { text, type } });
    window.dispatchEvent(event);
};

// Main App component
const App = () => {
    const [view, setView] = useState('newsFeed'); // 'newsFeed', 'articleDetail', 'login', 'signup', 'saved'
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [theme, setTheme] = useState('light');

    const [articles, setArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [errorArticles, setErrorArticles] = useState(null);

    const [trending, setTrending] = useState([]);
    const [loadingTrending, setLoadingTrending] = useState(false);

    const [dateFilter, setDateFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const [savedArticleIds, setSavedArticleIds] = useState(new Set());
    const [savedArticlesList, setSavedArticlesList] = useState([]);
    const [savingArticleId, setSavingArticleId] = useState(null); // New state to track which article is being saved/unsaved

    // Check for user ID in local storage on initial load
    useEffect(() => {
        const storedUserId = localStorage.getItem('user_id');
        if (storedUserId) {
            setCurrentUser(storedUserId);
            setView('newsFeed');
        } else {
            setView('login');
        }
    }, []);

    // Fetch articles based on filters
    useEffect(() => {
        const fetchNews = async () => {
            setLoadingArticles(true);
            setErrorArticles(null);
            try {
                const params = new URLSearchParams();
                if (dateFilter) params.append('date_filter', dateFilter);
                if (categoryFilter) params.append('category', categoryFilter);

                const response = await fetch(`${API_BASE_URL}/api/news?${params.toString()}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch articles: ${response.statusText}`);
                }
                const data = await response.json();
                setArticles(data);
            } catch (e) {
                setErrorArticles(e.message);
            } finally {
                setLoadingArticles(false);
            }
        };
        fetchNews();
    }, [dateFilter, categoryFilter]);

    // Fetch trending topics
    useEffect(() => {
        const fetchTrending = async () => {
            setLoadingTrending(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/trending`);
                const data = await response.json();
                setTrending(data);
            } catch (error) {
                console.error("Error fetching trending topics:", error);
            } finally {
                setLoadingTrending(false);
            }
        };
        fetchTrending();
    }, []);

    // Fetch saved articles for the current user
    const fetchSavedArticles = async () => {
        if (!currentUser) {
            setSavedArticleIds(new Set());
            setSavedArticlesList([]);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
                headers: { 'X-User-Id': currentUser }
            });
            if (!response.ok) {
                console.error('Failed to fetch saved articles:', await response.text());
                throw new Error('Failed to fetch saved articles');
            }
            const data = await response.json();
            const ids = new Set(data.map(article => article._id));
            setSavedArticleIds(ids);
            setSavedArticlesList(data);
        } catch (error) {
            console.error("Error fetching saved articles:", error);
            showToast('Failed to load saved articles.', 'error');
        }
    };

    // Refetch saved articles when currentUser changes
    useEffect(() => {
        fetchSavedArticles();
    }, [currentUser]);

    // Handle saving/unsaving an article
    const handleSaveToggle = async (articleId) => {
        if (!currentUser) {
            showToast("Please log in to save articles.", "error");
            return;
        }

        setSavingArticleId(articleId); // Start loading state for this article
        const isSaved = savedArticleIds.has(articleId);

        try {
            if (isSaved) {
                // Unsave article
                const response = await fetch(`${API_BASE_URL}/api/bookmarks/${articleId}`, {
                    method: 'DELETE',
                    headers: { 'X-User-Id': currentUser }
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Failed to unsave article.');
                }
                showToast('Article unsaved successfully.', 'success');
            } else {
                // Save article
                const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Id': currentUser
                    },
                    body: JSON.stringify({ article_id: articleId })
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Failed to save article.');
                }
                showToast('Article saved successfully!', 'success');
            }
            // Await the fetch to ensure state is synchronized with the backend before re-rendering
            await fetchSavedArticles();
        } catch (error) {
            console.error("Error toggling save:", error);
            showToast(`Failed to update saved articles: ${error.message}`, 'error');
        } finally {
            setSavingArticleId(null); // End loading state
        }
    };

    // Logout and clear state
    const handleLogout = () => {
        localStorage.removeItem('user_id');
        setCurrentUser(null);
        setSavedArticleIds(new Set());
        setSavedArticlesList([]);
        setView('login');
    };

    // Switch theme
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    // Shared UI components
    const Header = () => (
        <header className="flex justify-between items-center p-4 shadow-md bg-white dark:bg-zinc-800 dark:text-gray-100 sticky top-0 z-10">
            <h1 className="text-2xl font-bold">Tech News Aggregator</h1>
            <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun-moon">
                        {theme === 'light' ?
                            <path d="M12 18a6 6 0 0 0 0-12v12zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M17.66 6.34l1.41-1.41M6.34 17.66l-1.41 1.41" />
                            :
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                        }
                    </svg>
                </button>
                {currentUser && (
                    <>
                        <button onClick={() => setView('saved')} className="flex items-center p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark">
                                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                            </svg>
                        </button>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
                            Logout
                        </button>
                    </>
                )}
            </div>
        </header>
    );

    const Toast = () => {
        const [message, setMessage] = useState({ text: '', type: '' });
        const [isVisible, setIsVisible] = useState(false);

        useEffect(() => {
            const handleShowToast = (e) => {
                setMessage(e.detail);
                setIsVisible(true);
                setTimeout(() => {
                    setIsVisible(false);
                }, 3000);
            };

            window.addEventListener('show-toast', handleShowToast);
            return () => window.removeEventListener('show-toast', handleShowToast);
        }, []);

        if (!isVisible) return null;

        const toastClass = message.type === 'success' ? 'bg-green-500' : 'bg-red-500';

        return (
            <div className={`fixed bottom-4 right-4 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'} z-50`}>
                {message.text}
            </div>
        );
    };

    // Renders the main news feed view
    const NewsFeedView = () => (
        <div className="flex flex-col lg:flex-row gap-8 p-8 max-w-7xl mx-auto">
            {/* Trending Topics Sidebar */}
            <div className="lg:w-1/4 p-4 rounded-xl shadow-lg bg-white dark:bg-zinc-800 dark:text-gray-100 h-fit">
                <h2 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-zinc-700">Trending Topics</h2>
                {loadingTrending ? (
                    <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
                ) : (
                    <ul>
                        {trending.length > 0 ? (
                            trending.map((topic, index) => (
                                <li key={index} className="py-2 border-b last:border-b-0 border-gray-200 dark:border-zinc-700">
                                    {topic.topic} ({topic.count})
                                </li>
                            ))
                        ) : (
                            <li className="text-gray-500 dark:text-gray-400">No trending topics.</li>
                        )}
                    </ul>
                )}
            </div>

            {/* Main News Feed */}
            <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-4">
                    <button onClick={() => setDateFilter('')} className={`px-4 py-2 rounded-full transition ${dateFilter === '' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 dark:text-gray-100'}`}>All</button>
                    <button onClick={() => setDateFilter('today')} className={`px-4 py-2 rounded-full transition ${dateFilter === 'today' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 dark:text-gray-100'}`}>Today</button>
                    <button onClick={() => setDateFilter('this_week')} className={`px-4 py-2 rounded-full transition ${dateFilter === 'this_week' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 dark:text-gray-100'}`}>This Week</button>
                    <button onClick={() => setDateFilter('this_month')} className={`px-4 py-2 rounded-full transition ${dateFilter === 'this_month' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-zinc-700 dark:text-gray-100'}`}>This Month</button>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 rounded-full bg-gray-200 dark:bg-zinc-700 dark:text-gray-100 transition"
                    >
                        <option value="">All Categories</option>
                        {["AI/ML", "Startups", "Cybersecurity", "Mobile", "Web3"].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                {loadingArticles ? (
                    <div className="text-center text-gray-500 dark:text-gray-400">Loading articles...</div>
                ) : errorArticles ? (
                    <div className="text-center text-red-500">{errorArticles}</div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.length > 0 ? (
                            articles.map(article => (
                                <div key={article._id} onClick={() => {
                                    setSelectedArticle(article);
                                    setView('articleDetail');
                                }} className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow border border-gray-200 dark:border-zinc-700 relative">
                                    <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{article.summary.slice(0, 100)}...</p>
                                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                        <span>{article.source}</span>
                                        <span>{new Date(article.published).toLocaleDateString()}</span>
                                    </div>
                                    {currentUser && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSaveToggle(article._id);
                                            }} 
                                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
                                            disabled={savingArticleId === article._id}
                                        >
                                            {savingArticleId === article._id ? (
                                                // Loading spinner SVG
                                                <svg className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                // Bookmark icon
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={savedArticleIds.has(article._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark">
                                                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 col-span-3">No articles found.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // Renders the saved articles view
    const SavedArticlesView = () => (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => setView('newsFeed')} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                        <path d="m12 19-7-7 7-7" />
                        <path d="M19 12H5" />
                    </svg>
                    Back to News Feed
                </button>
            </div>
            <h2 className="text-2xl font-bold mb-6 text-center">Your Saved Articles</h2>
            {savedArticlesList.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400">
                    You haven't saved any articles yet.
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedArticlesList.map(article => (
                        <div key={article._id} className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 relative">
                            <div onClick={() => {
                                setSelectedArticle(article);
                                setView('articleDetail');
                            }} className="cursor-pointer">
                                <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{article.summary}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                    <span>{article.source}</span>
                                    <span>{new Date(article.published).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleSaveToggle(article._id)} 
                                className="absolute bottom-4 right-4 text-red-500 hover:text-red-600 transition"
                                disabled={savingArticleId === article._id}
                            >
                                {savingArticleId === article._id ? (
                                    // Loading spinner SVG
                                    <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    // Trash icon
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        <line x1="10" x2="10" y1="11" y2="17" />
                                        <line x1="14" x2="14" y1="11" y2="17" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Renders the login form
    const LoginView = ({ onLoginSuccess, onSwitchToSignup }) => {
        const [username, setUsername] = useState('');
        const [password, setPassword] = useState('');
        const [error, setError] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            setError('');
            try {
                const response = await fetch(`${API_BASE_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || 'Login failed.');
                }
                localStorage.setItem('user_id', data.user_id);
                onLoginSuccess(data.user_id);
                setView('newsFeed');
            } catch (err) {
                setError(err.message);
            }
        };

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-900">
                <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-zinc-700">
                    <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Login</h2>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 rounded-md border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-md border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="submit" className="w-full p-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors">
                            Login
                        </button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <span onClick={onSwitchToSignup} className="text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer hover:underline">
                            Sign up
                        </span>
                    </p>
                </div>
            </div>
        );
    };

    // Renders the signup form
    const SignupView = ({ onSignupSuccess }) => {
        const [username, setUsername] = useState('');
        const [password, setPassword] = useState('');
        const [error, setError] = useState('');
        const [successMessage, setSuccessMessage] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            setError('');
            setSuccessMessage('');
            try {
                const response = await fetch(`${API_BASE_URL}/api/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || 'Signup failed.');
                }
                setSuccessMessage(data.message + " You can now log in.");
                setTimeout(() => {
                    onSignupSuccess();
                    showToast('Signup successful. Please log in.', 'success');
                }, 2000);
            } catch (err) {
                setError(err.message);
            }
        };

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-900">
                <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-zinc-700">
                    <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Sign Up</h2>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 rounded-md border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-md border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="submit" className="w-full p-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors">
                            Sign Up
                        </button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <span onClick={() => setView('login')} className="text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer hover:underline">
                            Login
                        </span>
                    </p>
                </div>
            </div>
        );
    };

    // Renders the article detail view with chat and recommendations
    const ArticleDetailView = ({ article, onBack, isSaved, onSaveToggle }) => {
        const [recommendations, setRecommendations] = useState([]);
        const [chatInput, setChatInput] = useState('');
        const [chatMessages, setChatMessages] = useState([]);
        const [loadingChat, setLoadingChat] = useState(false);

        useEffect(() => {
            const fetchRecommendations = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/recommendations/${article._id}`);
                    const data = await response.json();
                    setRecommendations(data);
                } catch (error) {
                    console.error("Error fetching recommendations:", error);
                }
            };
            fetchRecommendations();
        }, [article._id]);

        const handleChatSubmit = async (e) => {
            e.preventDefault();
            if (!chatInput.trim()) return;

            const newUserMessage = { sender: 'user', text: chatInput };
            setChatMessages(prev => [...prev, newUserMessage]);
            setChatInput('');
            setLoadingChat(true);

            try {
                const response = await fetch(`${API_BASE_URL}/api/chat/${article._id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: newUserMessage.text }),
                });
                const data = await response.json();
                const aiMessage = { sender: 'ai', text: data.response };
                setChatMessages(prev => [...prev, aiMessage]);
            } catch (error) {
                console.error("Error with AI assistant:", error);
                setChatMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I am unable to respond right now.' }]);
            } finally {
                setLoadingChat(false);
            }
        };

        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onBack} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                            <path d="m12 19-7-7 7-7" />
                            <path d="M19 12H5" />
                        </svg>
                        Back
                    </button>
                    {currentUser && (
                        <button 
                            onClick={() => onSaveToggle(article._id)} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${isSaved ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                            disabled={savingArticleId === article._id}
                        >
                            {savingArticleId === article._id ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : isSaved ?
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark-x"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /><path d="m14.5 9-5 5" /><path d="m9.5 9 5 5" /></svg>
                                :
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark-plus"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /><line x1="12" x2="12" y1="7" y2="13" /><line x1="9" x2="15" y1="10" y2="10" /></svg>
                            }
                            {isSaved ? 'Unsave' : 'Save'}
                        </button>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Article Content */}
                    <div className="lg:col-span-2 p-8 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700">
                        <h2 className="text-3xl font-bold mb-4">{article.title}</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                            <span>Source: <span className="font-semibold">{article.source}</span></span>
                            <span>Published: {new Date(article.published).toLocaleDateString()}</span>
                            <span>Category: <span className="font-semibold">{article.category}</span></span>
                            <span>Sentiment: <span className={`font-semibold ${article.sentiment === 'Positive' ? 'text-green-500' : article.sentiment === 'Negative' ? 'text-red-500' : 'text-gray-500'}`}>{article.sentiment}</span></span>
                        </div>
                        <p className="mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: article.summary }}></p>
                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">Read full article</a>
                    </div>

                    {/* Sidebar with Chat and Recommendations */}
                    <div className="lg:col-span-1 flex flex-col gap-8">
                        {/* AI Chat Assistant */}
                        <div className="p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 flex flex-col h-96">
                            <h3 className="text-xl font-bold mb-4">AI Assistant</h3>
                            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                                {chatMessages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 rounded-xl max-w-[80%] ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-zinc-700 dark:text-gray-100'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {loadingChat && <div className="text-gray-500 dark:text-gray-400 italic">AI is thinking...</div>}
                            </div>
                            <form onSubmit={handleChatSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask about this article..."
                                    className="flex-1 p-3 rounded-full border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button type="submit" className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 19-3-8-8-3 19-7z" /></svg>
                                </button>
                            </form>
                        </div>

                        {/* Recommendations */}
                        <div className="p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700">
                            <h3 className="text-xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-zinc-700">Recommended Articles</h3>
                            <ul className="space-y-3">
                                {recommendations.length > 0 ? (
                                    recommendations.map(rec => (
                                        <li key={rec._id} className="border-b last:border-b-0 pb-3 border-gray-200 dark:border-zinc-700">
                                            <a href={rec.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline block font-medium">{rec.title}</a>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Source: {rec.source}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-500 dark:text-gray-400">No recommendations available.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Main App render logic based on current view
    let content;
    switch (view) {
        case 'login':
            content = <LoginView onLoginSuccess={setCurrentUser} onSwitchToSignup={() => setView('signup')} />;
            break;
        case 'signup':
            content = <SignupView onSignupSuccess={() => setView('login')} />;
            break;
        case 'articleDetail':
            content = selectedArticle ? (
                <ArticleDetailView 
                    article={selectedArticle}
                    onBack={() => { setSelectedArticle(null); setView('newsFeed'); }}
                    isSaved={savedArticleIds.has(selectedArticle._id)}
                    onSaveToggle={handleSaveToggle}
                />
            ) : null;
            break;
        case 'saved':
            content = <SavedArticlesView />;
            break;
        case 'newsFeed':
        default:
            content = <NewsFeedView />;
            break;
    }

    return (
        <div className={`font-sans antialiased min-h-screen transition-colors ${theme === 'dark' ? 'dark bg-zinc-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
            {view !== 'login' && view !== 'signup' && <Header />}
            {content}
            <Toast />
        </div>
    );
};

export default App;