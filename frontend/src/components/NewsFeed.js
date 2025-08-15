// src/components/NewsFeed.js
import React, { useState, useEffect, useCallback } from 'react';
import './NewsFeed.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';

// The NewsFeed component now accepts a 'currentUser' prop
const NewsFeed = ({ onArticleSelect, dateFilter, categoryFilter, currentUser }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // This function handles the API call to save an article
    const handleSaveArticle = async (articleId, e) => {
        // Prevents the parent div's onClick (to view the article) from firing
        e.stopPropagation();

        if (!currentUser) {
            alert("Please log in to save articles.");
            return;
        }

        try {
            // Note: The API_BASE_URL for the bookmarks endpoint is different from the news feed URL.
            // This is the correct endpoint for saving articles.
            const response = await fetch('https://tech-news-aggregator-production.up.railway.app/api/bookmarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Pass the user ID in a custom header for authentication
                    'X-User-Id': currentUser
                },
                body: JSON.stringify({ article_id: articleId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to save article.');
            }

            alert('Article saved successfully!');
        } catch (error) {
            console.error("Error saving article:", error);
            alert(`Could not save the article: ${error.message}`);
        }
    };

    // Wrap fetchNews in useCallback to memoize it
    const fetchNews = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            
            if (dateFilter) {
                params.append('date_filter', dateFilter);
            }
            
            if (categoryFilter) {
                params.append('category', categoryFilter);
            }

            // This is the exact URL you specified, used for fetching news articles.
            const response = await fetch(`https://tech-news-aggregator-production.up.railway.app/api/news?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setArticles(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [dateFilter, categoryFilter]); // fetchNews depends on these filters

    // The useEffect hook now depends on the memoized function
    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    if (loading) return <div className="news-feed-message"><FontAwesomeIcon icon={faSpinner} spin /> Loading news...</div>;
    if (error) return <div className="news-feed-message">Error fetching news: {error}</div>;

    return (
        <div className="main-news-section">
            <div className="news-feed-grid">
                {articles.length > 0 ? (
                    articles.map(article => (
                        <div key={article._id} className="news-item" onClick={() => onArticleSelect(article)}>
                            <h2>{article.title}</h2>
                            <p><strong>Source:</strong> {article.source}</p>
                            <p><strong>Published:</strong> {new Date(article.published).toLocaleDateString()}</p>
                            <p><strong>Category:</strong> {article.category}</p>
                            {/* Conditionally render the button for logged-in users */}
                            {currentUser && (
                                <button
                                    className="save-button"
                                    onClick={(e) => handleSaveArticle(article._id, e)}
                                >
                                    <FontAwesomeIcon icon={faSave} /> Save
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="news-feed-message">No articles found for the selected filters.</div>
                )}
            </div>
        </div>
    );
};

export default NewsFeed;
