import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import { useAuth } from './AuthContext';

const BookmarksContext = createContext(null);

export const BookmarksProvider = ({ children }) => {
  const { user } = useAuth();
  // Use a Set for faster lookups (checking if an ID exists)
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  // Fetch bookmarks when the user logs in or out
  useEffect(() => {
    if (user) {
      apiClient.get('/api/bookmarks')
        .then(response => {
          const ids = response.data.map(article => article._id);
          setBookmarkedIds(new Set(ids));
        })
        .catch(console.error);
    } else {
      // Clear bookmarks when user logs out
      setBookmarkedIds(new Set());
    }
  }, [user]);

  const addBookmark = async (articleId) => {
    try {
      await apiClient.post('/api/bookmarks', { article_id: articleId });
      // Add the new ID to our local state for instant UI update
      setBookmarkedIds(prevIds => new Set([...prevIds, articleId]));
    } catch (error) {
      console.error("Failed to add bookmark:", error);
    }
  };

  const removeBookmark = async (articleId) => {
    try {
      await apiClient.delete(`/api/bookmarks/${articleId}`);
      // Remove the ID from our local state for instant UI update
      setBookmarkedIds(prevIds => {
        const newIds = new Set(prevIds);
        newIds.delete(articleId);
        return newIds;
      });
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
    }
  };

  const value = { bookmarkedIds, addBookmark, removeBookmark };

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
};

// This is the line that was likely missing or incorrect
// It creates and exports the 'useBookmarks' hook
export const useBookmarks = () => useContext(BookmarksContext);