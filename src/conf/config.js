// API Configuration
export const FLASK_API_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5000';

export const config = {
  flaskApiUrl: FLASK_API_URL,
};

export default config;
