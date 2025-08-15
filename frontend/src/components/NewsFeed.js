import React, { useState, useEffect, useCallback } from 'react';
import './NewsFeed.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSave, faBookmark } from '@fortawesome/free-solid-svg-icons';

const NewsFeed = ({ onArticleSelect, onArticleUnsave, dateFilter, categoryFilter, currentUser }) => {
    const [articles, setArticles] = useState([]);
    const [savedArticleIds, setSavedArticleIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // This function fetches the user's saved articles to determine which articles to mark as saved
    const fetchSavedArticles = useCallback(async () => {
        if (!currentUser) {
            setSavedArticleIds(new Set());
            return;
        }
        try {
            const response = await fetch('https://tech-news-aggregator-production.up.railway.app/api/bookmarks', {
                headers: {
                    'X-User-Id': currentUser
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch saved articles');
            }
            const data = await response.json();
            const ids = new Set(data.map(article => article._id));
            setSavedArticleIds(ids);
        } catch (error) {
            console.error("Error fetching saved articles:", error);
        }
    }, [currentUser]);

    const handleToggleSave = async (articleId, e) => {
        e.stopPropagation();

        if (!currentUser) {
            alert("Please log in to save or unsave articles.");
            return;
        }

        const isSaved = savedArticleIds.has(articleId);

        if (isSaved) {
            // Unsave the article
            try {
                await onArticleUnsave(articleId);
                setSavedArticleIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(articleId);
                    return newSet;
                });
                alert('Article unsaved successfully!');
            } catch (error) {
                console.error("Error unsaving article:", error);
                alert(`Could not unsave the article: ${error.message}`);
            }
        } else {
            // Save the article
            try {
                const response = await fetch('https://tech-news-aggregator-production.up.railway.app/api/bookmarks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Id': currentUser
                    },
                    body: JSON.stringify({ article_id: articleId })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to save article.');
                }
                
                setSavedArticleIds(prev => new Set(prev).add(articleId));
                alert('Article saved successfully!');
            } catch (error) {
                console.error("Error saving article:", error);
                alert(`Could not save the article: ${error.message}`);
            }
        }
    };

    const fetchNews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (dateFilter) params.append('date_filter', dateFilter);
            if (categoryFilter) params.append('category', categoryFilter);

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
    }, [dateFilter, categoryFilter]);

    useEffect(() => {
        fetchNews();
        fetchSavedArticles();
    }, [fetchNews, fetchSavedArticles]);

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