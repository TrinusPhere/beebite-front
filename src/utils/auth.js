import { reactive, watch } from 'vue'

const MOCK_USERS_KEY = 'biteflow_users'
const CURRENT_USER_KEY = 'biteflow_current_user'

const defaultUsers = [
  {
    id: 1,
    name: 'Administrador',
    login: 'admin',
    password: 'admin123',
    role: 'admin',
    permissions: ['dashboard', 'financeiro', 'pedidos', 'clientes', 'ingredientes', 'produtos', 'entregadores', 'acerto_entregadores', 'usuarios', 'integracoes']
  },
  {
    id: 2,
    name: 'Gerente da Loja',
    login: 'gerente',
    password: 'gerente123',
    role: 'gerente',
    permissions: ['pedidos', 'clientes', 'ingredientes', 'produtos', 'entregadores', 'acerto_entregadores']
  },
  {
    id: 3,
    name: 'Operador de Caixa',
    login: 'caixa1',
    password: 'caixa123',
    role: 'caixa',
    permissions: ['pedidos', 'clientes', 'entregadores']
  }
]

const loadUsers = () => {
  const saved = localStorage.getItem(MOCK_USERS_KEY)
  if (saved) {
    return JSON.parse(saved)
  }
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(defaultUsers))
  return defaultUsers
}

const loadCurrentUser = () => {
  const saved = localStorage.getItem(CURRENT_USER_KEY)
  if (saved) {
    return JSON.parse(saved)
  }
  return null
}

export const authState = reactive({
  users: loadUsers(),
  currentUser: loadCurrentUser(),
  
  login(login, password) {
    const user = this.users.find(u => u.login === login && u.password === password)
    if (user) {
      this.currentUser = { ...user }
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser))
      return true
    }
    return false
  },
  
  logout() {
    this.currentUser = null
    localStorage.removeItem(CURRENT_USER_KEY)
  },
  
  hasPermission(permission) {
    if (!this.currentUser) return false
    return this.currentUser.permissions.includes(permission)
  },
  
  addUser(userObj) {
    const newId = this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1
    const newUser = { ...userObj, id: newId }
    this.users.push(newUser)
    this.saveUsers()
  },
  
  updateUser(updatedUser) {
    const index = this.users.findIndex(u => u.id === updatedUser.id)
    if (index !== -1) {
      this.users[index] = { ...updatedUser }
      this.saveUsers()
    }
  },
  
  deleteUser(userId) {
    this.users = this.users.filter(u => u.id !== userId)
    this.saveUsers()
  },
  
  saveUsers() {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(this.users))
  }
})

watch(() => authState.users, () => {
  authState.saveUsers()
}, { deep: true })