import axios from 'axios';

// ------------------------------
// API Base URL
// ------------------------------
const API_BASE_URL = import.meta.env.VITE_BASE_URL;
if (!API_BASE_URL) {
  throw new Error("VITE_BASE_URL is not defined in your .env file");
}

console.log('🔧 API Configuration:');
console.log('  - VITE_BASE_URL from env:', import.meta.env.VITE_BASE_URL);
console.log('  - Final API_BASE_URL:', API_BASE_URL);

// ------------------------------
// Axios Instance
// ------------------------------
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for general requests
});

// ------------------------------
// JWT Interceptor (attach token)
// ------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ------------------------------
// Request Logger
// ------------------------------
api.interceptors.request.use((config) => {
  console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
}, (error) => {
  console.error('📤 Request error:', error);
  return Promise.reject(error);
});

// ------------------------------
// Response Logger
// ------------------------------
api.interceptors.response.use((response) => {
  console.log(`📥 API Response: ${response.status} ${response.config.url}`);
  return response;
}, (error) => {
  console.error('📥 Response error:', error.message);
  if (error.response) {
    console.error('  - Status:', error.response.status);
    console.error('  - Data:', error.response.data);
  } else if (error.request) {
    console.error('  - No response received');
    console.error('  - Request was made to:', error.config?.url);
  }
  return Promise.reject(error);
});

// ------------------------------
// Types
// ------------------------------
export interface SignupData {
  user_id: string;
  name: string;
  password: string;
}

export interface LoginData {
  user_id: string;
  password: string;
}

export interface Location {
  lat: number;
  lon: number;
}

export interface Hazard {
  _id: string;
  user_id: string;
  hazard_type: string;
  description: string;
  confidence: number;
  location: Location;
  timestamp: string;
}

// ------------------------------
// API Methods
// ------------------------------
export const authAPI = {
  signup: (data: SignupData) => api.post('/signup', data),
  login: (data: LoginData) => api.post('/login', data),
};

export const hazardAPI = {
  getHazards: () => api.get<Hazard[]>('/get_hazards'),
  updateLocation: (location: Location) => api.post('/update_location', { location }),
  reportVoice: (formData: FormData) => {
    return api.post('/report_hazard_voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 minutes for audio uploads
    });
  },
};

export default api;
