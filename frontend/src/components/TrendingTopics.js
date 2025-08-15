// src/components/TrendingTopics.js
import React, { useState, useEffect } from 'react';
import './TrendingTopics.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tech-news-aggregator-production.up.railway.app';

const TrendingTopics = () => {
    const [trending, setTrending] = useState([]);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/trending`);
                const data = await response.json();
                setTrending(data);
            } catch (error) {
                console.error("Error fetching trending topics:", error);
            }
        };

        fetchTrending();
    }, []);

    return (
        <aside className="trending-topics-section">
            <h3>Trending Topics</h3>
            <ul>
                {trending.length > 0 ? (
                    trending.map((topic, index) => (
                        <li key={index}>{topic.topic} ({topic.count})</li>
                    ))
                ) : (
                    <li>No trending topics available.</li>
                )}
            </ul>
        </aside>
    );
};

export default TrendingTopics;