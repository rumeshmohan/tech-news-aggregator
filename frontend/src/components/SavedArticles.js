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

    if (loading) return <p className="text-center text-gray-500 mt-8">Loading saved articles...</p>;
    if (savedArticles.length === 0) return <p className="text-center text-gray-500 mt-8">No saved articles yet.</p>;

    return (
        <div className="space-y-4">
            <h2>Your Saved Articles</h2>
            {savedArticles.map(article => (
                <div key={article._id} className="relative p-6 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 cursor-pointer" onClick={() => onArticleSelect(article)}>
                            {article.title}
                        </h3>
                        {/* A button to unsave an article would go here.
                            It would need a prop passed from the parent component, like so:
                            <button onClick={() => onArticleUnsave(article._id)}>Unsave</button>
                        */}
                    </div>
                    <p className="text-gray-600 line-clamp-3 mb-4">{article.summary}</p>
                    <span className="text-sm font-medium text-gray-500">Source: {article.source}</span>
                </div>
            ))}
        </div>
    );
};

export default SavedArticles;