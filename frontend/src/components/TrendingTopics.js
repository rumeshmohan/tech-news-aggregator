// src/components/TrendingTopics.js

import React, { useState, useEffect } from 'react';
import './TrendingTopics.css';

const TrendingTopics = () => {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const response = await fetch('https://tech-news-aggregator-production.up.railway.app/api/trending');
                const data = await response.json();
                setTopics(data);
            } catch (error) {
                console.error("Error fetching trending topics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopics();
    }, []);

    if (loading) return <div className="trending-topics"><h3>Trending Topics</h3><p>Loading...</p></div>;

    return (
        <div className="trending-topics">
            <h3>Trending Topics</h3>
            <ul>
                {topics.map((topic, index) => (
                    <li key={index}>
                        {topic.topic} ({topic.count})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TrendingTopics;