import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import ArticleCard from '../components/ArticleCard';

function HomePage() {
  const [articles, setArticles] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [query, setQuery] = useState(''); // For the input field, updates instantly
  const [debouncedQuery, setDebouncedQuery] = useState(query); // For the API call, updates after a delay
  const [category, setCategory] = useState('All Categories');
  const [dateFilter, setDateFilter] = useState('');

  const categories = ["All Categories", "AI/ML", "Startups", "Cybersecurity", "Mobile", "Web3", "General Tech"];

  // Step 1: Add a useEffect for debouncing the search query
  // This prevents an API call on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // Wait 500ms after the user stops typing

    // Cleanup function to cancel the timeout if the user types again
    return () => {
      clearTimeout(handler);
    };
  }, [query]); // Only re-run this effect if the 'query' state changes


  // Step 2: Main useEffect to fetch news when any debounced filter changes
  // This now replaces the old handleFilterSubmit function
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {
          // Use the debounced query for the API call
          query: debouncedQuery || null,
          category: category !== 'All Categories' ? category : null,
          date_filter: dateFilter || null,
        };
        const response = await apiClient.get('/api/news', { params });
        setArticles(response.data);
      } catch (err) {
        setError('Failed to fetch news articles. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [debouncedQuery, category, dateFilter]); // Dependency array: re-fetches when these change


  // Effect for fetching trending topics (runs only once)
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await apiClient.get('/api/trending');
        setTrending(response.data);
      } catch (err) {
        console.error("Failed to fetch trending topics:", err);
      }
    }
    fetchTrending();
  }, []);


  return (
    <div className="home-page">
      <aside className="sidebar">
        <h3>Trending Topics</h3>
        <ul className="trending-list">
          {trending.map(item => (
            <li key={item.topic}>
              <span>{item.topic}</span>
              <span className="trending-count">{item.count}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="main-content">
        {/* Step 3: Remove the <form> and the filter button */}
        <div className="filters-container">
          <input
            type="text"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>

        {loading && <p>Loading articles...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && articles.length === 0 && <p>No articles found.</p>}

        <div className="articles-list">
          {articles.map(article => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default HomePage;