// src/components/SavedArticles.js

import React, { useState, useEffect } from 'react';

const SavedArticles = ({ currentUser, onArticleSelect }) => {
    const [savedArticles, setSavedArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSavedArticles = async () => {
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
                setSavedArticles(data);
            } catch (error) {
                console.error("Error fetching saved articles:", error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchSavedArticles();
        }
    }, [currentUser]);

    if (loading) return <p>Loading saved articles...</p>;
    if (savedArticles.length === 0) return <p>No saved articles yet.</p>;

    return (
        <div className="news-feed">
            <h2>Your Saved Articles</h2>
            {savedArticles.map(article => (
                <div key={article._id} className="news-item" onClick={() => onArticleSelect(article)}>
                    <h3>{article.title}</h3>
                    <p>{article.summary}</p>
                    <span>Source: {article.source}</span>
                </div>
            ))}
        </div>
    );
};

export default SavedArticles;