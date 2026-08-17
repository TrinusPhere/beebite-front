import { reactive } from 'vue'
import { authService } from '@/services/authService'

const CURRENT_USER_KEY = 'biteflow_current_user'
const JWT_KEY = 'biteflow_jwt'

const loadCurrentUser = () => {
  const saved = localStorage.getItem(CURRENT_USER_KEY)
  const token = localStorage.getItem(JWT_KEY)
  
  if (saved && token) {
    if (isTokenValid(token)) {
      return JSON.parse(saved)
    } else {
      localStorage.removeItem(CURRENT_USER_KEY)
      localStorage.removeItem(JWT_KEY)
      return null
    }
  }
  return null
}

function isTokenValid(token) {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // Check expiration (payload.exp is in seconds, Date.now() is in ms)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false
    }
    return true
  } catch (e) {
    return false
  }
}

export const authState = reactive({
  currentUser: loadCurrentUser(),
  
  async login(login, password) {
    try {
      const response = await authService.login(login, password)
      if (response && response.token) {
        localStorage.setItem(JWT_KEY, response.token)
        this.currentUser = response.user
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser))
        return true
      }
      return false
    } catch (error) {
      console.error("Erro no login", error)
      throw error // Lança para o componente tratar
    }
  },
  
  logout() {
    this.currentUser = null
    localStorage.removeItem(CURRENT_USER_KEY)
    localStorage.removeItem(JWT_KEY)
  },
  
  hasPermission(permission) {
    if (!this.currentUser) return false
    
    const token = localStorage.getItem(JWT_KEY)
    if (!isTokenValid(token)) {
      this.logout()
      return false
    }

    if (this.currentUser.role === 'ADMIN') return true
    return this.currentUser.permissions && this.currentUser.permissions.includes(permission)
  }
})