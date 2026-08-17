import axios from 'axios'
import { authState } from '@/utils/auth'
import router from '@/router'

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
    const isUnauthorized = error.response && (error.response.status === 401 || error.response.status === 403);
    const isCorsAuthError = !error.response && error.message === 'Network Error' && localStorage.getItem('biteflow_jwt');

    if (isUnauthorized || isCorsAuthError) {
      // Token expirado ou inválido (ou bloqueado por CORS devido a 401 do Quarkus)
      authState.logout()
      router.push({ name: 'login' })
    }
    return Promise.reject(error)
  }
)

export default api
