import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

function Recommendations({ articleId }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/recommendations/${articleId}`);
        setRecs(response.data);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [articleId]);

  if (loading) return <p>Loading recommendations...</p>;
  if (recs.length === 0) return null;

  return (
    <div className="recommendations">
      <h4>Related Articles</h4>
      <ul>
        {recs.map(rec => (
          <li key={rec._id}>
            <Link to={`/article/${rec._id}`} state={{ article: rec }}>
              {rec.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Recommendations;