// src/components/NewsFeed.js
import React, { useState, useEffect, useCallback } from 'react';
import './NewsFeed.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSave, faBookmark } from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tech-news-aggregator-production.up.railway.app';

const NewsFeed = ({ onArticleSelect, onArticleUnsave, onSaveArticle, savedArticleIds, dateFilter, categoryFilter, currentUser }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleToggleSave = (articleId, e) => {
        e.stopPropagation();

        if (!currentUser) {
            return;
        }

        const isSaved = savedArticleIds.has(articleId);

        if (isSaved) {
            onArticleUnsave(articleId);
        } else {
            onSaveArticle(articleId);
        }
    };

    const fetchNews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (dateFilter) params.append('date_filter', dateFilter);
            if (categoryFilter) params.append('category', categoryFilter);

            const response = await fetch(`${API_BASE_URL}/api/news?${params.toString()}`);
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
    }, [dateFilter, categoryFilter, API_BASE_URL]);

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
                            {currentUser && (
                                <button
                                    className="save-button"
                                    onClick={(e) => handleToggleSave(article._id, e)}
                                >
                                    <FontAwesomeIcon icon={savedArticleIds.has(article._id) ? faBookmark : faSave} />
                                    {savedArticleIds.has(article._id) ? ' Unsave' : ' Save'}
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