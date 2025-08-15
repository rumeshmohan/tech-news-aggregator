import axios from 'axios';

// IMPORTANT: Replace this with your backend's URL.
// If running locally, it's likely 'http://127.0.0.1:8000'.
const API_BASE_URL = 'http://127.0.0.1:8000'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Use an interceptor to add the auth header to every request
apiClient.interceptors.request.use(config => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default apiClient;