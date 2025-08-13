// src/components/NewsFeed.js

import React, { useState, useEffect, useCallback } from 'react';
import './NewsFeed.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const NewsFeed = ({ onArticleSelect, dateFilter, categoryFilter }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

            const response = await fetch(`http://localhost:8000/api/news?${params.toString()}`);
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

    // Now, the useEffect dependency array only needs fetchNews
    useEffect(() => {
        fetchNews();
    }, [fetchNews]); // The useEffect hook now depends on the memoized function

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