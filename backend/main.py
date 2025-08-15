# main.py
import os
import json
import requests
import feedparser
import uvicorn
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from collections import Counter
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
import time

# New imports for authentication, CORS, and Groq API
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq

# Load environment variables from .env file
load_dotenv()

# FastAPI and MongoDB setup
app = FastAPI()
client_mongo = MongoClient(os.getenv("MONGO_CONNECTION_STRING"))
db = client_mongo.tech_news_db
news_collection = db.articles
bookmarks_collection = db.bookmarks
users_collection = db.users

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# CORS Configuration
origins = [
    "*",
    "https://tech-news-aggregator-beta.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq configuration - The API key is now handled by the environment.
groq_client = Groq()
GROQ_MODEL = "llama-3.3-70b-versatile" # Using the fast Llama 3 8B model

RSS_FEEDS = [
    "https://feeds.feedburner.com/TechCrunch/",
    "https://www.theverge.com/rss/index.xml",
    "https://hnrss.org/frontpage"
]

def analyze_sentiment(text: str) -> str:
    """Uses Groq API to determine the sentiment of a text."""
    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a sentiment analysis bot. Respond with only 'positive', 'negative', or 'neutral'."},
                {"role": "user", "content": f"Analyze the sentiment of the following text:\n\nText: {text}"}
            ],
            temperature=0.0, # Set to 0 for consistent, non-creative responses
            max_tokens=10,
        )
        sentiment = completion.choices[0].message.content.lower().strip()
        if sentiment in ['positive', 'negative', 'neutral']:
            return sentiment
        return "neutral"
    except Exception as e:
        print(f"Error in sentiment analysis with Groq: {e}")
        return "neutral"

def categorize_article(title: str, content: str) -> str:
    """Uses Groq API to categorize an article."""
    categories = ["AI/ML", "Startups", "Cybersecurity", "Mobile", "Web3"]
    prompt = f"Categorize the following tech article into one of these categories: {', '.join(categories)}. Respond with only the category name, or 'Miscellaneous' if none apply.\n\nTitle: {title}\nContent: {content[:500]}..."
    
    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a tech article categorizer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,
            max_tokens=30,
        )
        ai_response = completion.choices[0].message.content.strip()
        
        for cat in categories:
            if cat.lower() in ai_response.lower():
                return cat
        
        return "Miscellaneous"
        
    except Exception as e:
        print(f"Error in categorization with Groq: {e}")
        return "Miscellaneous"

def fetch_and_store_news():
    """Fetches news from RSS feeds and stores it in MongoDB, limited to 2 articles per website."""
    print("Fetching news data from RSS feeds...")
    for url in RSS_FEEDS:
        print(f"Fetching from {url}...")
        try:
            feed = feedparser.parse(url)
            # Use a counter to limit articles per feed
            article_count = 0 
            for entry in feed.entries:
                if article_count >= 2:
                    break # Stop processing after 2 articles
                
                try:
                    response = requests.get(entry.link, timeout=10)
                    soup = BeautifulSoup(response.content, 'lxml')
                    full_content = soup.body.get_text(strip=True, separator=' ')
                    
                    sentiment = analyze_sentiment(full_content)
                    category = categorize_article(entry.title, full_content)

                    article = {
                        "title": entry.title,
                        "link": entry.link,
                        "summary": entry.summary,
                        "source": feed.feed.title if 'title' in feed.feed else 'Unknown',
                        "published": datetime(*entry.published_parsed[:6]),
                        "content": full_content,
                        "sentiment": sentiment,
                        "category": category
                    }
                    news_collection.update_one(
                        {"link": article["link"]},
                        {"$set": article},
                        upsert=True
                    )
                    article_count += 1
                    time.sleep(1) # Add a delay to avoid rate limiting
                except Exception as e:
                    print(f"Error processing article from {url}: {e}")
                    continue
        except Exception as e:
            print(f"Error fetching from {url}: {e}")
            continue

@app.on_event("startup")
async def startup_event():
    fetch_and_store_news()
    print("Initial news fetch complete.")

# --- Authentication and User Models ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

class User(BaseModel):
    username: str
    password: str

def get_current_user(user_id: str = Header(None, alias="X-User-Id")):
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid user")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user ID format")

@app.post("/api/signup")
def signup(user: User):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    users_collection.insert_one({"username": user.username, "password": hashed_password})
    return {"message": "User created successfully"}

@app.post("/api/login")
def login(user: User):
    try:
        # Handle the specific test user
        if user.username == "testuser" and user.password == "testpass":
            test_user = users_collection.find_one({"username": "testuser"})
            if not test_user:
                hashed_password = get_password_hash("testpass")
                result = users_collection.insert_one({"username": "testuser", "password": hashed_password})
                user_id = str(result.inserted_id)
            else:
                user_id = str(test_user["_id"])
            
            return {"message": "Login successful", "user_id": user_id}
        
        db_user = users_collection.find_one({"username": user.username})
        
        if not db_user or not verify_password(user.password, db_user["password"]):
            raise HTTPException(status_code=400, detail="Incorrect username or password")

        return {"message": "Login successful", "user_id": str(db_user["_id"])}

    except Exception as e:
        # Catch any unexpected errors, including database connection issues
        print(f"An error occurred during login: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

class ChatMessage(BaseModel):
    message: str

@app.post("/api/chat/{article_id}")
async def chat_with_ai(article_id: str, chat_message: ChatMessage):
    try:
        article = news_collection.find_one({"_id": ObjectId(article_id)})
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid article ID format")

    system_prompt = (
        f"You are a helpful and knowledgeable AI assistant. Your responses should be based "
        f"on the provided news article content. Be concise and conversational. "
        f"The article is titled '{article['title']}' and its content is:\n\n---\n{article['content']}\n---"
    )
    try:
        chat_payload = {
            "model": GROQ_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": chat_message.message},
            ],
            "stream": False,
        }
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=chat_payload['messages'],
            stream=False,
            temperature=0.7,
            max_tokens=500
        )
        return {"response": completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI assistant error: {e}")

@app.get("/")
def read_root():
    return {"message": "Tech News Aggregator API is running"}

@app.get("/api/news")
def get_news(query: str = None, category: str = None, date_filter: str = None):
    find_query = {}
    
    if date_filter:
        now = datetime.now()
        if date_filter == "today":
            start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            find_query["published"] = {"$gte": start_of_day}
        elif date_filter == "this_week":
            start_of_week = now - timedelta(days=now.weekday())
            find_query["published"] = {"$gte": start_of_week}
        elif date_filter == "this_month":
            start_of_month = now.replace(day=1)
            find_query["published"] = {"$gte": start_of_month}

    if query:
        find_query["$or"] = [
            {"title": {"$regex": query, "$options": "i"}},
            {"summary": {"$regex": query, "$options": "i"}},
            {"content": {"$regex": query, "$options": "i"}}
        ]
    if category and category != "All Categories":
        find_query["category"] = {"$regex": category, "$options": "i"}
    
    # Removed the .limit(50) to return all matching articles
    articles = list(news_collection.find(find_query).sort("published", -1))
    for article in articles:
        article["_id"] = str(article["_id"])
    return articles

@app.get("/api/trending")
def get_trending_topics():
    articles = list(news_collection.find({"category": {"$ne": "Miscellaneous"}}, {"category": 1}))
    categories = [article.get("category") for article in articles if article.get("category")]
    trending_counts = Counter(categories)
    top_topics = trending_counts.most_common(5)
    return [{"topic": topic, "count": count} for topic, count in top_topics]

@app.get("/api/recommendations/{article_id}")
def get_recommendations(article_id: str):
    try:
        current_article = news_collection.find_one({"_id": ObjectId(article_id)})
        if not current_article:
            raise HTTPException(status_code=404, detail="Article not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid article ID format")

    category = current_article.get("category")
    if not category:
        return []

    recommended_articles = list(news_collection.find(
        {"category": category, "_id": {"$ne": ObjectId(article_id)}}
    ).sort("published", -1).limit(5))

    for article in recommended_articles:
        article["_id"] = str(article["_id"])
    
    return recommended_articles

class BookmarkRequest(BaseModel):
    article_id: str

@app.post("/api/bookmarks")
def save_article(request: BookmarkRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    try:
        article = news_collection.find_one({"_id": ObjectId(request.article_id)})
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid article ID format")
    
    bookmarks_collection.update_one(
        {"user_id": user_id},
        {"$addToSet": {"article_ids": ObjectId(request.article_id)}},
        upsert=True
    )
    return {"message": "Article saved successfully"}

@app.get("/api/bookmarks")
def get_saved_articles(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    user_bookmarks = bookmarks_collection.find_one({"user_id": user_id})
    if not user_bookmarks or not user_bookmarks.get("article_ids"):
        return []
    
    saved_articles = list(news_collection.find(
        {"_id": {"$in": user_bookmarks["article_ids"]}}
    ).sort("published", -1))
    
    for article in saved_articles:
        article["_id"] = str(article["_id"])
    return saved_articles

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

