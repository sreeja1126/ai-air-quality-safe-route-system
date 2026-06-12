import os
import httpx
import numpy as np
import joblib
import networkx as nx
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import jwt
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from passlib.context import CryptContext
from fastapi import Depends, HTTPException


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ecopathai.netlify.app"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. SQLITE DATABASE, AUTHENTICATION & JWT
# ==========================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SQLALCHEMY_DATABASE_URL = "sqlite:///./ecopath.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# JWT Configuration
SECRET_KEY = "super-secret-ecopath-key" # In a real app, keep this hidden!
ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7) # Wristband lasts for 7 days
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/api/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = pwd_context.hash(user.password)
    new_user = UserDB(name=user.name, email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate the VIP Wristband
    token = create_access_token(data={"sub": new_user.email})
    return {"message": "Success", "name": new_user.name, "token": token}

@app.post("/api/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Generate the VIP Wristband
    token = create_access_token(data={"sub": db_user.email})
    return {"message": "Success", "name": db_user.name, "token": token}


# ==========================================
# 2. MACHINE LEARNING (AI PREDICTOR)
# ==========================================
# Load the Random Forest model we trained earlier
MODEL_PATH = os.path.join(os.path.dirname(__file__), "saved_models/random_forest_aqi.pkl")
ai_model = None

try:
    ai_model = joblib.load(MODEL_PATH)
    print("AI Model loaded successfully!")
except Exception as e:
    print("Warning: AI model not found. Did you run train.py?")

class AQIPredictionInput(BaseModel):
    pm25: float
    pm10: float
    no2: float
    temperature: float
    humidity: float
    wind_speed: float

@app.post("/api/aqi/predict")
async def predict_future_aqi(features: AQIPredictionInput):
    if ai_model is None:
        raise HTTPException(status_code=500, detail="AI Engine is offline. Run train.py first.")
    
    # Format data for the Random Forest
    input_data = np.array([[
        features.pm25, features.pm10, features.no2, 
        features.temperature, features.humidity, features.wind_speed
    ]])
    
    prediction = ai_model.predict(input_data)[0]
    predicted_aqi = int(np.clip(prediction, 0, 500))
    
    if predicted_aqi <= 50: category = "Good"
    elif predicted_aqi <= 100: category = "Moderate"
    elif predicted_aqi <= 150: category = "Unhealthy for Sensitive Groups"
    elif predicted_aqi <= 200: category = "Unhealthy"
    else: category = "Hazardous"
    
    return {
        "predicted_aqi": predicted_aqi,
        "category": category
    }


# ==========================================
# 3. LIVE API (WAQI DATA)
# ==========================================
WAQI_TOKEN = "a5c6d5d52a527c28c0a8bcc3998b0fe9926020ec" 
@app.get("/api/aqi/realtime")
async def get_realtime_aqi(city: str):
    async with httpx.AsyncClient() as client:
        url = f"https://api.waqi.info/feed/{city}/?token={WAQI_TOKEN}"
        response = await client.get(url)
        data = response.json()

        if data.get("status") != "ok":
            raise HTTPException(status_code=404, detail="City not found in WAQI database")

        sensor_data = data["data"]
        aqi_value = sensor_data.get("aqi", 0)
        
        # --- NEW: Extract REAL temperature and wind from the sensor ---
        iaqi = sensor_data.get("iaqi", {})
        pm25_val = iaqi.get("pm25", {}).get("v", aqi_value * 0.5) # Fallback math if missing
        temp_val = iaqi.get("t", {}).get("v", 25.0) 
        wind_val = iaqi.get("w", {}).get("v", 10.0) 

        if aqi_value <= 50: category = "Good"
        elif aqi_value <= 100: category = "Moderate"
        elif aqi_value <= 150: category = "Unhealthy for Sensitive Groups"
        elif aqi_value <= 200: category = "Unhealthy"
        elif aqi_value <= 300: category = "Very Unhealthy"
        else: category = "Hazardous"

        return {
            "city": sensor_data.get("city", {}).get("name", city),
            "aqi": aqi_value,
            "category": category,
            # --- NEW: Send weather to React ---
            "weather": {
                "pm25": pm25_val,
                "temperature": temp_val,
                "wind_speed": wind_val
            }
        }


# ==========================================
# 4. ROUTING & NAVIGATION (DIJKSTRA)
# ==========================================
class RouteRequest(BaseModel):
    start_node: str
    destination_node: str

@app.post("/api/navigation/calculate")
async def calculate_route(request: RouteRequest):
    G = nx.Graph()
    
    aqi_map = {
        "Node_A": 45, 
        "Node_B": 280,
        "Node_C": 50, 
        "Node_D": 52, 
        "Node_E": 48 
    }
    
    streets = [
        ("Node_A", "Node_B", 2.0),
        ("Node_B", "Node_E", 2.0),
        ("Node_A", "Node_C", 2.5),
        ("Node_C", "Node_D", 1.5),
        ("Node_D", "Node_E", 2.0)
    ]
    
    for start, end, distance in streets:
        avg_aqi = (aqi_map[start] + aqi_map[end]) / 2
        aqi_weight = distance * (avg_aqi / 50.0) 
        G.add_edge(start, end, weight=aqi_weight, distance=distance)
        
    try:
        optimal_path = nx.shortest_path(G, source=request.start_node, target=request.destination_node, weight="weight")
        
        total_distance = sum(G[optimal_path[i]][optimal_path[i+1]]['distance'] for i in range(len(optimal_path)-1))
        total_weight = sum(G[optimal_path[i]][optimal_path[i+1]]['weight'] for i in range(len(optimal_path)-1))
        
        return {
            "status": "success",
            "path": optimal_path,
            "total_distance_km": round(total_distance, 2),
            "exposure_index": round(total_weight, 2),
            "summary": f"Path calculated successfully via {', '.join(optimal_path)}"
        }
        
    except nx.NetworkXNoPath:
        return {"status": "error", "message": "No available route found between these points."}