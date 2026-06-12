# 🍃 AI Air Quality Safe Route System (EcoPath)

An intelligent, full-stack application that provides safe routing and environmental insights using real-time air quality data and Generative AI.

---

## 📖 About the Project

**EcoPath** is an environmental awareness and navigation platform designed to help users minimize their exposure to harmful air pollution. While standard map applications prioritize the *fastest* or *shortest* route, EcoPath prioritizes your *health* by calculating routes that avoid highly polluted areas. 

By combining live environmental data with generative AI, the system not only guides you safely but also helps you understand the air you are breathing.

### ✨ Key Features
* **Real-Time AQI Tracking:** Fetches live Air Quality Index (AQI) data from the WAQI API to monitor pollution levels across different geographical zones.
* **Health-Optimized Routing:** Analyzes environmental data to suggest the healthiest travel paths, keeping users away from hazardous air quality zones.
* **AI-Powered Insights:** Utilizes OpenAI's generative models to translate complex environmental metrics into easy-to-understand health recommendations and alerts.
* **Interactive Dashboard:** A responsive, user-friendly React interface that visualizes air quality metrics and route options in real time.

---

## 🚀 Tech Stack

* **Frontend:** React, Vite, Node.js
* **Backend:** Python, FastAPI, Uvicorn
* **Database:** SQLite (`ecopath.db`)
* **External APIs:** OpenAI (Generative AI features), WAQI (Real-time Air Quality Data)
* **Deployment:** Netlify (Frontend), Ngrok (Secure Local Tunneling)

---

## 📂 Project Structure

```text
ai-air-quality-safe-route-system/
├── frontend/               # React application (Vite)
│   ├── src/                # UI components and API services
│   ├── package.json        # Frontend dependencies
│   └── dist/               # Production build files
└── backend/                # Python FastAPI application
    ├── main.py             # Core API endpoints and logic
    ├── ecopath.db          # SQLite database
    ├── requirements.txt    # Python dependencies
    └── .env                # Environment variables (secrets)