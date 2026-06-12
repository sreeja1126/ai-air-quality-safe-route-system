import axios from 'axios';

const API_BASE_URL = 'https://mudunurisreeja.pythonanywhere.com/api';

// ==========================================
// 1. EXISTING ENDPOINTS (WAQI, Routing, AI)
// ==========================================

export const getRealtimeAQI = async (city) => {
  const response = await axios.get(`${API_BASE_URL}/aqi/realtime?city=${city}`);
  return response.data;
};

export const calculateSafeRoute = async (start, end) => {
  const response = await axios.post(`${API_BASE_URL}/navigation/calculate`, {
    start_node: start,
    destination_node: end
  });
  return response.data;
};

export const predictFutureAQI = async (features) => {
  const response = await axios.post(`${API_BASE_URL}/aqi/predict`, features);
  return response.data;
};


// ==========================================
// 2. NEW ENDPOINTS (Authentication & Security)
// ==========================================

export const registerUser = async (name, email, password) => {
  const response = await axios.post(`${API_BASE_URL}/register`, { 
    name, 
    email, 
    password 
  });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/login`, { 
    email, 
    password 
  });
  return response.data;
};