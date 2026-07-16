import { ref } from 'vue'

// --- Dados da Loja para o Cardápio Digital ---
export const storeInfo = ref({
  name: 'BiteFlow Lanchonete',
  logoUrl: 'https://via.placeholder.com/150/FF7F50/FFFFFF?text=BiteFlow', // URL de exemplo
  isOpen: true, // true ou false
  openingHours: 'Seg-Sex: 11:00 - 23:00 | Sáb-Dom: 12:00 - 00:00',
  address: 'Rua da Lanchonete, 123 - Centro, Cidade/UF'
})

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
  { id: '#1024', customer: 'Mateus Silva', items: '2x X-Bacon, 1x Coca 600ml', total: 'R$ 65,00', status: 'Preparando', time: '12:45' },
  { id: '#1023', customer: 'Ana Oliveira', items: '1x X-Salada', total: 'R$ 28,00', status: 'Entregue', time: '12:30' },
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
  { id: 1, name: 'Pão Brioche', stock: 50, unit: 'un', costPrice: 1.50 },
  { id: 2, name: 'Hambúrguer de Carne 150g', stock: 120, unit: 'un', costPrice: 4.50 },
  { id: 3, name: 'Queijo Cheddar', stock: 5.5, unit: 'kg', costPrice: 45.00 },
  { id: 4, name: 'Bacon Fatiado', stock: 2.3, unit: 'kg', costPrice: 38.00 },
  { id: 5, name: 'Alface Americana', stock: 10, unit: 'un', costPrice: 2.00 },
  { id: 6, name: 'Tomate', stock: 8, unit: 'un', costPrice: 1.00 },
  { id: 7, name: 'Cebola Roxa', stock: 6, unit: 'un', costPrice: 1.20 },
  { id: 8, name: 'Molho Especial', stock: 10, unit: 'lt', costPrice: 25.00 },
])

// --- Dados para Produtos ---
export const productsDB = ref([
  {
    id: 1,
    name: 'X-Bacon Especial',
    category: 'Hambúrgueres',
    description: 'Pão brioche, hambúrguer 150g, queijo cheddar, bacon crocante, alface, tomate e molho especial.',
    price: 35.00,
    imageUrl: 'https://via.placeholder.com/300x200/FF7F50/FFFFFF?text=X-Bacon',
    stock: 50,
    technicalSheet: [
      { id: 1, name: 'Pão Brioche', unit: 'un', cost: 1.50, quantity: 1 },
      { id: 2, name: 'Hambúrguer de Carne 150g', unit: 'un', cost: 4.50, quantity: 1 },
      { id: 3, name: 'Queijo Cheddar', unit: 'kg', cost: 45.00, quantity: 0.020 },
      { id: 4, name: 'Bacon Fatiado', unit: 'kg', cost: 38.00, quantity: 0.050 },
      { id: 5, name: 'Alface Americana', unit: 'un', cost: 2.00, quantity: 0.1 },
      { id: 6, name: 'Tomate', unit: 'un', cost: 1.00, quantity: 0.2 },
      { id: 8, name: 'Molho Especial', unit: 'lt', cost: 25.00, quantity: 0.030 },
    ],
    // IDs dos ingredientes da ficha técnica que podem ser removidos pelo cliente
    removableItems: [3, 4, 5, 6, 8], // Queijo, Bacon, Alface, Tomate, Molho (não inclui pão e carne)
    // IDs dos grupos de modificadores vinculados a este produto
    modifierGroupIds: ['grp-ponto-carne', 'grp-adicionais'],
  },
  {
    id: 2,
    name: 'X-Salada Simples',
    category: 'Hambúrgueres',
    description: 'Pão brioche, hambúrguer 150g, queijo, alface e tomate.',
    price: 28.00,
    imageUrl: 'https://via.placeholder.com/300x200/FF7F50/FFFFFF?text=X-Salada',
    stock: 70,
    technicalSheet: [
      { id: 1, name: 'Pão Brioche', unit: 'un', cost: 1.50, quantity: 1 },
      { id: 2, name: 'Hambúrguer de Carne 150g', unit: 'un', cost: 4.50, quantity: 1 },
      { id: 3, name: 'Queijo Cheddar', unit: 'kg', cost: 45.00, quantity: 0.020 },
      { id: 5, name: 'Alface Americana', unit: 'un', cost: 2.00, quantity: 0.1 },
      { id: 6, name: 'Tomate', unit: 'un', cost: 1.00, quantity: 0.2 },
    ],
    removableItems: [3, 5, 6], // Queijo, Alface, Tomate
    modifierGroupIds: ['grp-ponto-carne', 'grp-adicionais'],
  },
  {
    id: 3,
    name: 'Batata Frita Média',
    category: 'Acompanhamentos',
    description: 'Porção de batatas fritas crocantes.',
    price: 15.00,
    imageUrl: 'https://via.placeholder.com/300x200/FF7F50/FFFFFF?text=Batata+Frita',
    stock: 100,
    technicalSheet: [],
    removableItems: [],
    modifierGroupIds: [],
  },
  {
    id: 4,
    name: 'Coca-Cola Lata',
    category: 'Bebidas',
    description: 'Refrigerante Coca-Cola original em lata 350ml.',
    price: 7.00,
    imageUrl: 'https://via.placeholder.com/300x200/FF7F50/FFFFFF?text=Coca-Cola',
    stock: 80,
    technicalSheet: [],
    removableItems: [],
    modifierGroupIds: [],
  },
  {
    id: 5,
    name: 'Milkshake de Chocolate',
    category: 'Sobremesas',
    description: 'Delicioso milkshake de chocolate com chantilly.',
    price: 20.00,
    imageUrl: 'https://via.placeholder.com/300x200/FF7F50/FFFFFF?text=Milkshake',
    stock: 30,
    technicalSheet: [],
    removableItems: [],
    modifierGroupIds: [],
  },
])

// --- Grupos de Modificadores (configuração global) ---
// Cada grupo define um conjunto de opções que pode ser vinculado a produtos.
// type: 'radio' = seleção única | 'checkbox' = múltipla seleção
// required: se o cliente DEVE fazer uma escolha neste grupo
export const modifierGroupsDB = ref([
  {
    id: 'grp-ponto-carne',
    name: 'Ponto da Carne',
    type: 'radio',       // Seleção única obrigatória
    required: true,
    minSelections: 1,
    maxSelections: 1,
    icon: '🥩',
    options: [
      { id: 'opt-mal-passado', name: 'Mal Passado', price: 0 },
      { id: 'opt-ao-ponto', name: 'Ao Ponto', price: 0 },
      { id: 'opt-bem-passado', name: 'Bem Passado', price: 0 },
    ]
  },
  {
    id: 'grp-adicionais',
    name: 'Adicionais Extra',
    type: 'checkbox',    // Seleção múltipla opcional
    required: false,
    minSelections: 0,
    maxSelections: 5,
    icon: '✨',
    options: [
      { id: 'opt-geleia-pimenta', name: 'Geleia de Pimenta', price: 4.00 },
      { id: 'opt-queijo-coalho', name: 'Queijo Coalho', price: 5.00 },
      { id: 'opt-blend-160g', name: 'Blend 160g', price: 12.00 },
      { id: 'opt-smash-80g', name: 'Smash 80g', price: 7.00 },
      { id: 'opt-salada', name: 'Salada', price: 2.50 },
    ]
  },
])

// --- Adicionais Globais (catálogo completo para a tela de configuração) ---
// Estes adicionais podem ser usados em qualquer grupo de modificadores.
export const additionalsDB = ref([
  { id: 'add-1', name: 'Geleia de Pimenta', price: 4.00, category: 'Molhos e Condimentos', active: true },
  { id: 'add-2', name: 'Queijo Coalho', price: 5.00, category: 'Queijos', active: true },
  { id: 'add-3', name: 'Blend 160g', price: 12.00, category: 'Carnes', active: true },
  { id: 'add-4', name: 'Smash 80g', price: 7.00, category: 'Carnes', active: true },
  { id: 'add-5', name: 'Salada', price: 2.50, category: 'Vegetais', active: true },
  { id: 'add-6', name: 'Bacon Extra', price: 6.00, category: 'Carnes', active: true },
  { id: 'add-7', name: 'Ovo Frito', price: 3.00, category: 'Outros', active: false },
])

// --- Dados para Pedidos (ControlePedidos.vue) ---
export const ordersKanbanDB = ref([
  {
    id: 'preparando',
    title: 'Sendo Preparado',
    icon: 'Clock',
    color: 'text-red-500', // Vermelho
    bg: 'bg-red-50',      // Vermelho
    orders: [
      { id: '#1024', customer: 'Mateus Silva', items: '2x X-Bacon, 1x Coca 600ml', time: '12 min', total: 'R$ 65,00', selected: false, type: 'delivery', driver: null, platform: 'own', externalOrderId: null },
      { id: '#1025', customer: 'Ana Oliveira', items: '1x X-Salada', time: '5 min', total: 'R$ 28,00', selected: false, type: 'balcao', driver: null, platform: 'own', externalOrderId: null },
      { id: '#IFD001', customer: 'Cliente iFood 1', items: '1x X-Salada, 1x Batata Frita', time: '8 min', total: 'R$ 43,00', selected: false, type: 'delivery', driver: null, platform: 'ifood', externalOrderId: 'IFD-ABC-123' },
    ]
  },
  // Coluna 'aguardando' removida
  {
    id: 'rota',
    title: 'Em Rota de Entrega',
    icon: 'Truck',
    color: 'text-blue-500', // Azul
    bg: 'bg-blue-50',      // Azul
    orders: [
      { id: '#1020', customer: 'Juliana Lima', items: '1x Combo Família', time: '40 min', total: 'R$ 120,00', driver: 'Carlos Silva', selected: false, type: 'delivery', platform: 'own', externalOrderId: null },
      { id: '#1022', customer: 'Ricardo Santos', items: '3x Hot Dog Especial', time: '25 min', total: 'R$ 45,00', selected: false, type: 'delivery', driver: null, platform: 'own', externalOrderId: null },
    ]
  },
  {
    id: 'entregue',
    title: 'Entregue',
    icon: 'CheckCircle2',
    color: 'text-emerald-500', // Verde
    bg: 'bg-emerald-50',      // Verde
    orders: [
      { id: '#1018', customer: 'Pedro Costa', items: '2x X-Tudo', time: '1h 10min', total: 'R$ 55,00', selected: false, type: 'balcao', driver: null, platform: 'own', externalOrderId: null },
    ]
  }
])

// --- Dados Financeiros (Registros de Vendas Individuais) ---
export const financialRecordsDB = ref([
  {
    id: 'FIN001',
    orderId: '#1023',
    date: '2023-10-26',
    time: '12:30',
    totalValue: 28.00,
    paymentMethod: 'Cartão de Crédito',
    status: 'Concluído',
    products: [{ productId: 2, name: 'X-Salada Simples', quantity: 1, price: 28.00 }]
  },
  {
    id: 'FIN002',
    orderId: '#1018',
    date: '2023-10-26',
    time: '11:50',
    totalValue: 55.00,
    paymentMethod: 'PIX',
    status: 'Concluído',
    products: [{ productId: 1, name: 'X-Bacon Especial', quantity: 1, price: 35.00 }, { productId: 4, name: 'Coca-Cola Lata', quantity: 2, price: 7.00 }]
  },
])

// --- Dados para Relatórios Financeiros Agregados ---
export const salesValueDB = ref({
  daily: { value: 1250.00, change: '+12%', orders: 45 },
  weekly: { value: 8430.00, change: '+5%', orders: 312 },
  monthly: { value: 35600.00, change: '+18%', orders: 1250 }
})

export const salesByProductDB = ref({
  daily: [
    { name: 'X-Bacon Especial', quantity: 15, value: 525.00 },
    { name: 'Batata Frita Média', quantity: 12, value: 180.00 },
    { name: 'Coca-Cola Lata', quantity: 20, value: 140.00 }
  ],
  weekly: [
    { name: 'X-Bacon Especial', quantity: 105, value: 3675.00 },
    { name: 'Coca-Cola Lata', quantity: 140, value: 980.00 },
    { name: 'Batata Frita Média', quantity: 82, value: 1230.00 }
  ],
  monthly: [
    { name: 'X-Bacon Especial', quantity: 450, value: 15750.00 },
    { name: 'Batata Frita Média', quantity: 380, value: 5700.00 },
    { name: 'Coca-Cola Lata', quantity: 600, value: 4200.00 }
  ]
})

export const paymentMethodsDataDB = ref({
  daily: [
    { method: 'PIX', quantity: 20, value: 550.00, color: 'text-teal-600', bg: 'bg-teal-50' },
    { method: 'Cartão de Crédito', quantity: 15, value: 450.00, color: 'text-blue-600', bg: 'bg-blue-50' },
    { method: 'Cartão de Débito', quantity: 7, value: 150.00, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { method: 'Dinheiro', quantity: 3, value: 100.00, color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ],
  weekly: [
    { method: 'PIX', quantity: 150, value: 3850.00, color: 'text-teal-600', bg: 'bg-teal-50' },
    { method: 'Cartão de Crédito', quantity: 100, value: 2900.00, color: 'text-blue-600', bg: 'bg-blue-50' },
    { method: 'Cartão de Débito', quantity: 42, value: 1080.00, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { method: 'Dinheiro', quantity: 20, value: 600.00, color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ],
  monthly: [
    { method: 'PIX', quantity: 600, value: 16000.00, color: 'text-teal-600', bg: 'bg-teal-50' },
    { method: 'Cartão de Crédito', quantity: 450, value: 12500.00, color: 'text-blue-600', bg: 'bg-blue-50' },
    { method: 'Cartão de Débito', quantity: 150, value: 4500.00, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { method: 'Dinheiro', quantity: 50, value: 2600.00, color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ]
})

export const deliverySettlementsDB = ref({
  daily: [
    { name: 'João Silva', type: 'Fixo', deliveries: 12, allowance: 20.00, feePerDelivery: 5.00, total: 80.00 },
    { name: 'Carlos Souza', type: 'Diarista', deliveries: 18, allowance: 0.00, feePerDelivery: 6.00, total: 108.00 }
  ],
  weekly: [
    { name: 'João Silva', type: 'Fixo', deliveries: 65, allowance: 100.00, feePerDelivery: 5.00, total: 425.00 },
    { name: 'Carlos Souza', type: 'Diarista', deliveries: 42, allowance: 0.00, feePerDelivery: 6.00, total: 252.00 }
  ],
  monthly: [
    { name: 'João Silva', type: 'Fixo', deliveries: 250, allowance: 400.00, feePerDelivery: 5.00, total: 1650.00 },
    { name: 'Carlos Souza', type: 'Diarista', deliveries: 180, allowance: 0.00, feePerDelivery: 6.00, total: 1080.00 }
  ]
})

// --- Dados para Dashboard (Equipe de Entrega) ---
export const deliveryTeamDB = ref([
  { id: 1, name: 'Entregador 1', status: 'Disponível' },
  { id: 2, name: 'Entregador 2', status: 'Disponível' },
  { id: 3, name: 'Entregador 3', status: 'Disponível' },
])

// --- Dados para Integrações (WhatsApp e iFood) ---
export const integrationsDB = ref({
  whatsapp: {
    status: 'disconnected', // 'connected', 'disconnected', 'pending_qr'
  },
  ifood: {
    status: 'disconnected', // 'connected', 'disconnected'
    credentials: {
      clientId: '',
      clientSecret: '',
    },
    merchantId: null,
    storeStatus: 'closed', // 'open', 'closed'
  }
})