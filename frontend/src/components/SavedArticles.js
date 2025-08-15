// src/components/SavedArticles.js

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

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
        // App.js handles the API call and the alert message
        await onArticleUnsave(articleId);

        // This removes the article from the UI instantly
        setSavedArticles(savedArticles.filter(article => article._id !== articleId));
    };

    if (loading) return <p className="text-center text-gray-500 mt-8 animate-pulse">Loading saved articles...</p>;
    if (savedArticles.length === 0) return <p className="text-center text-gray-500 mt-8">No saved articles yet. Start saving articles from your news feed!</p>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Your Saved Articles</h2>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {savedArticles.map(article => (
                    <div
                        key={article._id}
                        className="relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-transform transform hover:scale-105 duration-300 ease-in-out border border-gray-200 dark:border-gray-700 flex flex-col justify-between"
                    >
                        <div className="flex-grow cursor-pointer" onClick={() => onArticleSelect(article)}>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 leading-tight">{article.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">{article.summary}</p>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 inline-block py-1 px-2 rounded-full bg-blue-50 dark:bg-blue-900">{article.source}</span>
                        </div>
                        <div className="mt-4 flex justify-end items-center">
                            <button
                                onClick={() => handleUnsave(article._id)}
                                className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                aria-label="Unsave article"
                            >
                                <FontAwesomeIcon icon={faTrashCan} className="mr-1" /> Unsave
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SavedArticles;