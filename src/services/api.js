import axios from 'axios'
import { authState } from '@/utils/auth'

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptador de requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('biteflow_jwt')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptador de resposta
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expirado ou inválido
      authState.logout()
      window.location.href = '/' // Redireciona para o login
    }
    return Promise.reject(error)
  }
)

export default api
