import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../context/BookmarksContext'; // Import the bookmarks hook

// The component no longer needs the 'onUnsave' prop
function ArticleCard({ article }) {
  const { user } = useAuth();
  // Get bookmark state and functions from the context
  const { bookmarkedIds, addBookmark, removeBookmark } = useBookmarks();

  // Check if the current article is bookmarked. This is now the single source of truth.
  const isBookmarked = bookmarkedIds.has(article._id);

  const getSentimentClass = (sentiment) => {
    if (!sentiment) return 'sentiment-neutral';
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'sentiment-positive';
      case 'negative': return 'sentiment-negative';
      default: return 'sentiment-neutral';
    }
  };

  // This single function now handles both saving and unsaving
  const handleToggleBookmark = () => {
    if (!user) {
      alert("Please log in to manage your bookmarks.");
      return;
    }
    // Toggle based on the current state
    if (isBookmarked) {
      removeBookmark(article._id);
    } else {
      addBookmark(article._id);
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
        
        {/* The button's text and style now depend on the 'isBookmarked' boolean */}
        {user && (
          <button onClick={handleToggleBookmark} className={`bookmark-btn ${isBookmarked ? 'unsave-btn' : ''}`}>
            {isBookmarked ? '❌ Unsave' : '🔖 Save'}
          </button>
        )}
      </div>
    </div>
  );
}

export default ArticleCard;