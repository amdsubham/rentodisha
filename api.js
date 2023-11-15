// src/api.js
import axios from 'axios';
import API_BASE_URL from './services/config';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export default api;
