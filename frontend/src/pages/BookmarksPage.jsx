import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import ArticleCard from '../components/ArticleCard';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../context/BookmarksContext'; // Import useBookmarks
import { useNavigate } from 'react-router-dom';

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookmarkedIds, removeBookmark } = useBookmarks(); // Get the latest IDs from context

  // Fetch the initial list of bookmarked articles
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/bookmarks');
        setBookmarks(response.data);
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [user, navigate]);

  // This effect listens for changes in the context and updates the page's list
  useEffect(() => {
    setBookmarks(currentBookmarks => 
      currentBookmarks.filter(article => bookmarkedIds.has(article._id))
    );
  }, [bookmarkedIds]); // Re-run this whenever the global bookmarkedIds set changes

  const handleUnsaveAll = async () => {
    const isConfirmed = window.confirm("Are you sure you want to delete all bookmarks?");
    if (isConfirmed) {
      try {
        // We'll clear them one by one to ensure the context updates
        // This is simpler than adding a dedicated "clear all" function to the context
        for (const article of bookmarks) {
          await removeBookmark(article._id);
        }
      } catch (error) {
        console.error("Failed to clear bookmarks:", error);
      }
    }
  };

  if (loading) return <p className="container">Loading your bookmarks...</p>;

  return (
    <div className="container">
      <div className="bookmarks-header">
        <h2>Your Bookmarked Articles</h2>
        {bookmarks.length > 0 && (
          <button onClick={handleUnsaveAll} className="bookmark-btn unsave-btn">
            Clear All Bookmarks
          </button>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <p>You have no saved articles.</p>
      ) : (
        <div className="articles-list">
          {bookmarks.map(article => (
            // The ArticleCard is now self-sufficient, no extra props needed
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

export default BookmarksPage;