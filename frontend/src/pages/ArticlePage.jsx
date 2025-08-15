import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

// The component now accepts an 'onUnsave' prop
function ArticleCard({ article, onUnsave }) {
  const { user } = useAuth();
  
  const getSentimentClass = (sentiment) => {
    if (!sentiment) return 'sentiment-neutral';
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'sentiment-positive';
      case 'negative': return 'sentiment-negative';
      default: return 'sentiment-neutral';
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      alert("Please log in to save articles.");
      return;
    }
    try {
      await apiClient.post('/api/bookmarks', { article_id: article._id });
      alert('Article bookmarked!');
    } catch (error) {
      console.error("Error bookmarking article:", error);
      alert('Failed to bookmark. You might have already saved this article.');
    }
  };

  return (
    <div className="article-card">
      <h3>
        <Link to={`/article/${article._id}`} state={{ article }}>
          {article.title}
        </Link>
      </h3>
      <div className="article-meta">
        <span>{article.source}</span> | 
        <span>{format(new Date(article.published), 'MMM dd, yyyy')}</span>
      </div>
      <p dangerouslySetInnerHTML={{ __html: article.summary }}></p>
      <div className="article-footer">
        <div>
          <span className="category-tag">{article.category}</span>
          <span className={`sentiment-tag ${getSentimentClass(article.sentiment)}`}>
            {article.sentiment}
          </span>
        </div>
        
        {/* === KEY CHANGE HERE === */}
        {/* If onUnsave prop exists, show Unsave button. Otherwise, show Save button. */}
        {onUnsave ? (
          <button onClick={() => onUnsave(article._id)} className="bookmark-btn unsave-btn">
            ❌ Unsave
          </button>
        ) : (
          user && <button onClick={handleBookmark} className="bookmark-btn">🔖 Save</button>
        )}
      </div>
    </div>
  );
}

export default ArticleCard;