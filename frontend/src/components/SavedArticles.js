// src/components/SavedArticles.js

import React, { useState, useEffect } from 'react';

const SavedArticles = ({ currentUser, onArticleSelect, onArticleUnsave }) => {
    const [savedArticles, setSavedArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tech-news-aggregator-production.up.railway.app';

    const fetchSavedArticles = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
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

    useEffect(() => {
        if (currentUser) {
            fetchSavedArticles();
        }
    }, [currentUser]);

    const handleUnsave = async (articleId) => {
        try {
            await onArticleUnsave(articleId);
            // After successful unsave, update the local state to remove the article
            setSavedArticles(savedArticles.filter(article => article._id !== articleId));
        } catch (error) {
            console.error("Error unsaving article:", error);
        }
    };

    if (loading) return <p className="text-center text-gray-500 mt-8">Loading saved articles...</p>;
    if (savedArticles.length === 0) return <p className="text-center text-gray-500 mt-8">No saved articles yet.</p>;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Your Saved Articles</h2>
            {savedArticles.map(article => (
                <div key={article._id} className="relative p-6 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 cursor-pointer" onClick={() => onArticleSelect(article)}>
                            {article.title}
                        </h3>
                        <button 
                            onClick={() => handleUnsave(article._id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            aria-label="Unsave article"
                        >
                            &times;
                        </button>
                    </div>
                    <p className="text-gray-600 line-clamp-3 mb-4">{article.summary}</p>
                    <span className="text-sm font-medium text-gray-500">Source: {article.source}</span>
                </div>
            ))}
        </div>
    );
};

export default SavedArticles;