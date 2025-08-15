// src/components/SavedArticles.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import './SavedArticles.css';

const SavedArticles = ({ onArticleSelect, onArticleUnsave, savedArticles }) => {

    if (!savedArticles) {
        return <p className="saved-articles-message">Loading...</p>;
    }

    if (savedArticles.length === 0) {
        return <p className="saved-articles-message">No saved articles yet. Start saving articles from your news feed!</p>;
    }

    return (
        <div className="saved-articles-container">
            <h2 className="saved-articles-header">Your Saved Articles</h2>
            <div className="saved-articles-grid">
                {savedArticles.map(article => (
                    <div key={article._id} className="saved-article-item">
                        <div className="saved-article-content" onClick={() => onArticleSelect(article)}>
                            <h3>{article.title}</h3>
                            <p className="article-source"><strong>Source:</strong> {article.source}</p>
                            <p className="article-summary">{article.summary}</p>
                        </div>
                        <div className="unsave-button-container">
                            <button
                                onClick={() => onArticleUnsave(article._id)}
                                className="unsave-button"
                            >
                                <FontAwesomeIcon icon={faTrashCan} className="icon" /> Unsave
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SavedArticles;