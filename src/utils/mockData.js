import { ref } from 'vue'

// --- Dados para Entregadores ---
export const motoboysDB = ref([
  { id: 1, name: 'Carlos Silva', phone: '(11) 98765-4321', status: 'Ativo', totalDeliveries: 120 },
  { id: 2, name: 'Fernanda Lima', phone: '(11) 91234-5678', status: 'Ativo', totalDeliveries: 95 },
  { id: 3, name: 'João Pereira', phone: '(11) 99887-6655', status: 'Inativo', totalDeliveries: 50 },
  { id: 4, name: 'Mariana Costa', phone: '(11) 95544-3322', status: 'Ativo', totalDeliveries: 150 },
])

// --- Dados para Dashboard ---
export const dashboardStats = ref([
  { name: 'Vendas Hoje', value: 'R$ 1.250,00', change: '+12.5%', icon: 'DollarSign', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { name: 'Novos Clientes', value: '12', change: '+3.2%', icon: 'Users', color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Pedidos Ativos', value: '8', change: '-2.1%', icon: 'ShoppingBag', color: 'text-orange-600', bg: 'bg-orange-50' },
  { name: 'Ticket Médio', value: 'R$ 42,50', change: '+5.4%', icon: 'TrendingUp', color: 'text-purple-600', bg: 'bg-purple-50' },
])

export const dashboardRecentOrders = ref([
  { id: '#1024', customer: 'Mateus Silva', total: 'R$ 65,00', status: 'Preparando', time: '12:45' },
  { id: '#1023', customer: 'Ana Oliveira', total: 'R$ 28,00', status: 'Entregue', time: '12:30' },
  { id: '#1022', customer: 'Ricardo Santos', total: 'R$ 45,00', status: 'Em Rota', time: '12:15' },
])

// --- Dados para Clientes ---
export const clientsDB = ref([
  { id: 1, name: 'Mateus Silva', phone: '(11) 98888-7777', address: 'Rua das Flores, 123', totalOrders: 15 },
  { id: 2, name: 'Ana Oliveira', phone: '(11) 97777-6666', address: 'Av. Paulista, 1500', totalOrders: 8 },
  { id: 3, name: 'Ricardo Santos', phone: '(11) 96666-5555', address: 'Rua Amazonas, 45', totalOrders: 22 },
])

// --- Dados para Ingredientes ---
export const ingredientsDB = ref([
  { id: 1, name: 'Pão Brioche', stock: 50, unit: 'un', price: 1.50 },
  { id: 2, name: 'Hambúrguer de Carne 150g', stock: 120, unit: 'un', price: 4.50 },
  { id: 3, name: 'Queijo Cheddar', stock: 5.5, unit: 'kg', price: 45.00 },
  { id: 4, name: 'Bacon Fatiado', stock: 2.3, unit: 'kg', price: 38.00 },
  { id: 5, name: 'Alface Americana', stock: 10, unit: 'un', price: 2.00 },
])

// --- Dados para Produtos ---
export const productsDB = ref([
  {
    id: 1,
    name: 'X-Bacon Especial',
    category: 'Hambúrgueres',
    price: 35.00,
    technicalSheet: [
      { id: 1, name: 'Pão Brioche', unit: 'un', cost: 1.50, quantity: 1 },
      { id: 4, name: 'Bacon Fatiado', unit: 'kg', cost: 38.00, quantity: 50 },
    ]
  },
  {
    id: 2,
    name: 'X-Salada Simples',
    category: 'Hambúrgueres',
    price: 28.00,
    technicalSheet: [
      { id: 1, name: 'Pão Brioche', unit: 'un', cost: 1.50, quantity: 1 },
      { id: 2, name: 'Hambúrguer 150g', unit: 'un', cost: 4.50, quantity: 1 },
      { id: 3, name: 'Queijo Cheddar', unit: 'kg', cost: 45.00, quantity: 20 },
      { id: 5, name: 'Alface Americana', unit: 'un', cost: 2.00, quantity: 0.2 },
    ]
  },
])

// --- Dados para Pedidos (ControlePedidos.vue) ---
export const ordersKanbanDB = ref([
  {
    id: 'preparando',
    title: 'Sendo Preparado',
    icon: 'Clock',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    orders: [
      { id: '#1024', customer: 'Mateus Silva', items: '2x X-Bacon, 1x Coca 600ml', time: '12 min', total: 'R$ 65,00', selected: false, type: 'delivery', driver: null },
      { id: '#1025', customer: 'Ana Oliveira', items: '1x X-Salada', time: '5 min', total: 'R$ 28,00', selected: false, type: 'balcao', driver: null },
    ]
  },
  {
    id: 'aguardando',
    title: 'Aguardando Entrega',
    icon: 'Package',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    orders: [
      { id: '#1022', customer: 'Ricardo Santos', items: '3x Hot Dog Especial', time: '25 min', total: 'R$ 45,00', selected: false, type: 'delivery', driver: null },
    ]
  },
  {
    id: 'rota',
    title: 'Em Rota de Entrega',
    icon: 'Truck',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    orders: [
      { id: '#1020', customer: 'Juliana Lima', items: '1x Combo Família', time: '40 min', total: 'R$ 120,00', driver: 'Carlos Silva', selected: false, type: 'delivery' },
    ]
  },
  {
    id: 'entregue',
    title: 'Entregue',
    icon: 'CheckCircle2',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    orders: [
      { id: '#1018', customer: 'Pedro Costa', items: '2x X-Tudo', time: '1h 10min', total: 'R$ 55,00', selected: false, type: 'balcao', driver: null },
    ]
  }
])

// --- Produtos para Novo Pedido (fallback/mock inicial) ---
export const mockAvailableProducts = ref([
  { id: 'prod1', name: 'X-Bacon', description: 'Pão, hambúrguer, queijo, bacon, alface, tomate', price: 25.00 },
  { id: 'prod2', name: 'X-Salada', description: 'Pão, hambúrguer, queijo, alface, tomate', price: 22.00 },
  { id: 'prod3', name: 'Coca-Cola 600ml', description: 'Refrigerante Coca-Cola', price: 8.00 },
  { id: 'prod4', name: 'Batata Frita Grande', description: 'Porção grande de batata frita', price: 15.00 },
])
