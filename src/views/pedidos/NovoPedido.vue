<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <!-- Header Dinâmico -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-4">
      <div class="flex items-center gap-4">
        <button @click="router.push('/pedidos')" class="p-2 hover:bg-white rounded-xl text-slate-400">
          <ChevronLeft :size="24" />
        </button>
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">Novo Pedido</h1>
          <p class="text-slate-500 text-sm font-medium">Crie um novo pedido para entrega ou balcão</p>
        </div>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 items-start">
      <!-- Painel de Resumo do Pedido (Lateral) -->
      <div class="w-full lg:w-72 shrink-0 space-y-6 lg:sticky lg:top-8 order-2 lg:order-1">
        <div class="bg-slate-900 rounded-3xl p-6 shadow-xl text-white space-y-6 border border-slate-800">
          <div class="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-widest mb-2">
            <ShoppingBag :size="16" /> Resumo do Pedido
          </div>
          <div class="space-y-4">
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400">Itens</span>
              <span class="font-bold">R$ {{ itemsTotalPrice.toFixed(2) }}</span>
            </div>
            <div v-if="order.type === 'delivery'" class="flex justify-between items-center text-sm">
              <span class="text-slate-400">Entrega</span>
              <span class="font-bold">R$ {{ deliveryCost.toFixed(2) }}</span>
            </div>
            <div class="pt-4 border-t border-slate-800">
              <div class="flex justify-between items-center mb-1">
                <span class="text-slate-400 text-xs font-bold uppercase tracking-wider">Total</span>
                <span class="text-xl font-black text-emerald-400">
                  R$ {{ totalOrderPrice.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
          <div class="pt-4 space-y-3">
            <BaseButton variant="primary" class="w-full" :loading="loading" @click="placeOrder">
              <Save :size="18" /> Finalizar Pedido
            </BaseButton>
            <BaseButton variant="secondary" class="w-full border-slate-700 text-slate-400" @click="cancelOrder">
              <X :size="18" /> Cancelar
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Formulário Principal -->
      <div class="flex-1 space-y-6 order-1 lg:order-2">
        <!-- Tipo de Pedido -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 class="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Package :size="16" class="text-orange-600" /> Tipo de Pedido
          </h2>
          <div class="flex gap-4">
            <label class="inline-flex items-center">
              <input type="radio" class="form-radio text-orange-600" name="orderType" value="delivery" v-model="order.type">
              <span class="ml-2 text-slate-700">Entrega (Delivery)</span>
            </label>
            <label class="inline-flex items-center">
              <input type="radio" class="form-radio text-orange-600" name="orderType" value="balcao" v-model="order.type">
              <span class="ml-2 text-slate-700">Consumo no Local (Balcão)</span>
            </label>
          </div>
        </div>

        <!-- Informações do Cliente -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 class="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest flex items-center gap-2">
            <User :size="16" class="text-orange-600" /> Informações do Cliente
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="customerName" class="block text-sm font-medium text-slate-700">Nome do Cliente</label>
              <input type="text" id="customerName" v-model="order.customer.name" class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500">
            </div>
            <div v-if="order.type === 'delivery'">
              <label for="customerAddress" class="block text-sm font-medium text-slate-700">Endereço de Entrega</label>
              <input type="text" id="customerAddress" v-model="order.customer.address" class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500">
            </div>
          </div>
        </div>

        <!-- Produtos -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 class="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest flex items-center gap-2">
            <ShoppingBag :size="16" class="text-orange-600" /> Produtos
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="product in availableProducts" :key="product.id" class="border p-4 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <h3 class="font-bold text-slate-800">{{ product.name }}</h3>
                <p class="text-sm text-slate-600">{{ product.description }}</p>
                <p class="text-lg font-semibold text-orange-600 mt-2">R$ {{ product.price.toFixed(2) }}</p>
              </div>
              <button @click="addProductToOrder(product)" class="mt-4 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">Adicionar</button>
            </div>
          </div>
          <p v-if="availableProducts.length === 0" class="text-slate-500 mt-4">Nenhum produto disponível.</p>
        </div>

        <!-- Itens do Pedido (Lista) -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 class="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest flex items-center gap-2">
            <UtensilsCrossed :size="16" class="text-orange-600" /> Itens Selecionados
          </h2>
          <ul class="divide-y divide-slate-200">
            <li v-for="item in order.items" :key="item.product.id" class="py-3 flex justify-between items-center">
              <div>
                <p class="font-medium text-slate-800">{{ item.product.name }}</p>
                <p class="text-sm text-slate-600">R$ {{ item.product.price.toFixed(2) }} cada</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="decreaseQuantity(item.product.id)" class="bg-slate-200 text-slate-700 px-2 py-1 rounded-md hover:bg-slate-300">-</button>
                <span class="font-bold">{{ item.quantity }}</span>
                <button @click="increaseQuantity(item.product.id)" class="bg-slate-200 text-slate-700 px-2 py-1 rounded-md hover:bg-slate-300">+</button>
                <button @click="removeItemFromOrder(item.product.id)" class="text-red-500 hover:text-red-700 ml-2">Remover</button>
              </div>
            </li>
          </ul>
          <p v-if="order.items.length === 0" class="text-slate-500 mt-4">Nenhum item adicionado ao pedido.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Save, X, ShoppingBag, User, Package, ChevronLeft, UtensilsCrossed } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import { mockAvailableProducts, ordersKanbanDB } from '@/utils/mockData' // Import mock data

const router = useRouter()
const loading = ref(false) // Para o estado de carregamento do botão de finalizar pedido

const order = ref({
  type: 'balcao', // 'delivery' ou 'balcao'
  customer: {
    name: '',
    address: '' // Apenas para delivery
  },
  items: [] // { product: {}, quantity: N }
})

const availableProducts = mockAvailableProducts.value // Use mock data directly

const deliveryCost = computed(() => {
  // Lógica de cálculo de frete (placeholder)
  return order.value.type === 'delivery' ? 10.00 : 0.00
})

const itemsTotalPrice = computed(() => {
  return order.value.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
})

const totalOrderPrice = computed(() => {
  return itemsTotalPrice.value + deliveryCost.value
})

const addProductToOrder = (product) => {
  const existingItem = order.value.items.find(item => item.product.id === product.id)
  if (existingItem) {
    existingItem.quantity++
  } else {
    order.value.items.push({ product: product, quantity: 1 })
  }
}

const increaseQuantity = (productId) => {
  const item = order.value.items.find(item => item.product.id === productId)
  if (item) {
    item.quantity++
  }
}

const decreaseQuantity = (productId) => {
  const itemIndex = order.value.items.findIndex(item => item.product.id === productId)
  if (itemIndex !== -1) {
    if (order.value.items[itemIndex].quantity > 1) {
      order.value.items[itemIndex].quantity--
    } else {
      order.value.items.splice(itemIndex, 1) // Remove if quantity becomes 0
    }
  }
}

const removeItemFromOrder = (productId) => {
  order.value.items = order.value.items.filter(item => item.product.id !== productId)
}

const cancelOrder = () => {
  if (confirm('Tem certeza que deseja cancelar este pedido? Todas as informações serão perdidas.')) {
    router.push({ name: 'pedidos' })
  }
}

const placeOrder = async () => {
  loading.value = true
  if (!order.value.customer.name) {
    alert('Por favor, informe o nome do cliente.')
    loading.value = false
    return
  }
  if (order.value.type === 'delivery' && !order.value.customer.address) {
    alert('Por favor, informe o endereço de entrega.')
    loading.value = false
    return
  }
  if (order.value.items.length === 0) {
    alert('Adicione pelo menos um item ao pedido.')
    loading.value = false
    return
  }

  // Simulate API call with a timeout
  setTimeout(() => {
    const newOrderId = `#${Math.floor(Math.random() * 10000)}`
    const newOrder = {
      id: newOrderId,
      customer: order.value.customer.name,
      items: order.value.items.map(item => `${item.quantity}x ${item.product.name}`).join(', '),
      time: 'Agora', // Or calculate based on current time
      total: `R$ ${totalOrderPrice.value.toFixed(2)}`,
      selected: false,
      type: order.value.type,
      driver: null
    }

    // Add the new order to the 'preparando' column in ordersKanbanDB
    const preparingColumn = ordersKanbanDB.value.find(col => col.id === 'preparando')
    if (preparingColumn) {
      preparingColumn.orders.unshift(newOrder)
    } else {
      console.error("Coluna 'preparando' não encontrada no mockData.")
    }

    alert('Pedido finalizado com sucesso!')
    loading.value = false
    router.push({ name: 'pedidos' })
  }, 1000)
}
</script>

<style scoped>
/* Estilos específicos para NovoPedido.vue */
</style>