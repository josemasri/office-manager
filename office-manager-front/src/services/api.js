import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  getUserTypes: () => api.get('/users/user-types'),
  getWeeklyUsage: (id) => api.get(`/users/${id}/weekly-usage`),
};

// Meeting Rooms API
export const meetingRoomsAPI = {
  getAll: () => api.get('/meeting-rooms'),
  getOne: (id) => api.get(`/meeting-rooms/${id}`),
  create: (roomData) => api.post('/meeting-rooms', roomData),
  update: (id, roomData) => api.patch(`/meeting-rooms/${id}`, roomData),
  delete: (id) => api.delete(`/meeting-rooms/${id}`),
  getAvailable: (startTime, endTime) => 
    api.get(`/meeting-rooms/available?startTime=${startTime}&endTime=${endTime}`),
};

// Reservations API
export const reservationsAPI = {
  getAll: () => api.get('/reservations'),
  getMyReservations: () => api.get('/reservations/my-reservations'),
  getOne: (id) => api.get(`/reservations/${id}`),
  create: (reservationData) => api.post('/reservations', reservationData),
  update: (id, reservationData) => api.patch(`/reservations/${id}`, reservationData),
  cancel: (id) => api.patch(`/reservations/${id}/cancel`),
};

// System Config API
export const systemConfigAPI = {
  getAll: () => api.get('/system-config'),
  getTimezone: () => api.get('/system-config/timezone'),
  updateTimezone: (timezone) => api.post('/system-config/timezone', { timezone }),
  setConfig: (key, value, description) => api.post('/system-config/config', { key, value, description }),
};

export default api;