// Dynamic API Configuration for Localhost and Production Deployments
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Base origin without trailing /api (e.g., http://localhost:8080 or https://your-backend.onrender.com)
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export default {
    API_BASE_URL,
    API_ORIGIN
};
