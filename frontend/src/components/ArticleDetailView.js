// src/components/ArticleDetailView.js
import React, { useState, useEffect } from 'react';
import ChatInterface from './ChatInterface';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faBookmark } from '@fortawesome/free-solid-svg-icons';
import './ArticleDetailView.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tech-news-aggregator-production.up.railway.app';

const ArticleDetailView = ({ article, onBack, isSaved, onSaveArticle, onArticleUnsave, currentUser }) => {
    const [recommendations, setRecommendations] = useState([]);

    const handleToggleSave = () => {
        if (isSaved) {
            onArticleUnsave(article._id);
        } else {
            onSaveArticle(article._id);
        }
    };

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

    return (
        <>
            <header className="article-header">
                <button onClick={onBack} className="back-button">
                    <FontAwesomeIcon icon={faArrowLeft} /> Back to News Feed
                </button>
                {currentUser && (
                    <button className="save-button" onClick={handleToggleSave}>
                        <FontAwesomeIcon icon={isSaved ? faBookmark : faSave} />
                        {isSaved ? ' Unsave Article' : ' Save Article'}
                    </button>
                )}
            </header>
            <main className="article-details-and-chat-container">
                <div className="main-article-content-wrapper">
                    <div className="selected-article-display">
                        <h2>{article.title}</h2>
                        <p><strong>Source:</strong> {article.source}</p>
                        <p><strong>Sentiment:</strong> <span className={`sentiment-${article.sentiment.toLowerCase()}`}>{article.sentiment}</span></p>
                        <p dangerouslySetInnerHTML={{ __html: article.summary }}></p>
                        <a href={article.link} target="_blank" rel="noopener noreferrer">
                            Read full article
                        </a>
                    </div>
                    <div className="chat-interface-wrapper">
                        <h3>Chat with AI Assistant</h3>
                        <ChatInterface articleId={article._id} />
                    </div>
                </div>
                {recommendations.length > 0 && (
                    <div className="recommendations-section">
                        <h3>Recommended Articles</h3>
                        <ul>
                            {recommendations.map(rec => (
                                <li key={rec._id}>
                                    <a href={rec.link} target="_blank" rel="noopener noreferrer">{rec.title}</a>
                                    <p>Source: {rec.source}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </main>
        </>
    );
};

export default ArticleDetailView;