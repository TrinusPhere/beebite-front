<template>
  <div class="max-w-[1600px] mx-auto space-y-4 pb-10 h-[calc(100vh-6rem)] flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
      <div class="flex items-center gap-4">
        <button @click="router.push('/pedidos')" class="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
          <ChevronLeft :size="20" />
        </button>
      <div>
          <h1 class="text-xl font-black text-slate-800 tracking-tight leading-none">
            {{ isEditMode ? 'Editar Pedido' : 'Novo Pedido' }}
          </h1>
          <p class="text-slate-500 text-xs font-medium mt-1">
            {{ isEditMode ? `Editando pedido ${editOrderId}` : 'Selecione os produtos e adicione ao carrinho' }}
          </p>
        </div>
      </div>
      
      <!-- Toggle Tipo de Pedido (Compacto) -->
      <div class="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 shadow-inner">
        <button 
          @click="order.type = 'balcao'"
          :class="['px-4 py-1.5 text-xs font-bold rounded-lg transition-all', order.type === 'balcao' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
        >
          Balcão
        </button>
        <button 
          @click="order.type = 'delivery'"
          :class="['px-4 py-1.5 text-xs font-bold rounded-lg transition-all', order.type === 'delivery' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
        >
          Delivery
        </button>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
      
      <!-- Área Principal (Cardápio e Cliente) -->
      <div class="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        
        <!-- Info do Cliente -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 shrink-0">
          <div class="flex items-center gap-2 mb-3">
            <User :size="16" class="text-orange-500" />
            <h2 class="text-xs font-bold text-slate-700 uppercase tracking-widest">Dados do Cliente</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input type="text" v-model="order.customer.name" placeholder="Nome do Cliente (opcional)" class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
            </div>
            <div v-if="order.type === 'delivery'">
              <input type="text" v-model="order.customer.address" placeholder="Endereço Completo" class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
            </div>
          </div>
        </div>

        <!-- Categorias e Produtos -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0">
          
          <!-- Abas de Categorias (Scroll Horizontal) -->
          <div class="flex items-center gap-2 overflow-x-auto pb-2 mb-4 shrink-0 hide-scrollbar border-b border-slate-100">
            <button
              @click="selectedCategory = null"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border',
                selectedCategory === null
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:bg-orange-50'
              ]"
            >
              Todos os Itens
            </button>
            <button
              v-for="cat in productCategories"
              :key="cat"
              @click="selectedCategory = cat"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border',
                selectedCategory === cat
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:bg-orange-50'
              ]"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Grid de Produtos -->
          <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <PosProductCard 
                v-for="product in filteredProducts" 
                :key="product.id" 
                :product="product" 
                @click="openCustomizationModal(product)"
              />
            </div>
            <div v-if="filteredProducts.length === 0" class="text-center py-12 text-slate-400 flex flex-col items-center">
              <PackageX :size="48" class="mb-3 opacity-20" />
              <p class="text-sm font-medium">Nenhum produto encontrado nesta categoria.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumo do Pedido (Sidebar Fixa à direita) -->
      <OrderSummarySidebar 
        :order="sidebarOrder"
        :itemsTotalPrice="itemsTotalPrice"
        :deliveryCost="deliveryCost"
        :totalOrderPrice="totalOrderPrice"
        :loading="loading"
        @remove-item="removeItemFromOrder"
        @update:paymentMethod="order.paymentMethod = $event"
        @finish="requestOrderConfirmation"
        @cancel="cancelOrder"
      />
    </div>

    <!-- Modais -->
    <ItemCustomizationModal
      v-model="showCustomizationModal"
      :product="selectedProductForModal"
      :all-modifier-groups="allModifierGroups"
      @confirm="onModalConfirm"
      @cancel="showCustomizationModal = false"
    />

    <OrderConfirmationModal 
      v-model="showConfirmationModal"
      :order="sidebarOrder"
      :totalOrderPrice="totalOrderPrice"
      @confirm="placeOrder"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft, User, PackageX } from 'lucide-vue-next'
import PosProductCard from '@/components/domain/PosProductCard.vue'
import OrderSummarySidebar from '@/components/domain/OrderSummarySidebar.vue'
import OrderConfirmationModal from '@/components/domain/OrderConfirmationModal.vue'
import ItemCustomizationModal from '@/components/ItemCustomizationModal.vue'
import { productsDB, ordersKanbanDB, financialRecordsDB, modifierGroupsDB } from '@/utils/mockData'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

// ── Modo edição ──
const isEditMode = computed(() => !!route.params.id)
const editOrderId = computed(() => route.params.id || null)

// Referência ao pedido original (para atualizar)
let originalOrderRef = null
let originalColRef = null
const originalTotal = ref(0)          // total do pedido original em modo edição
const originalItemsText = ref('')     // descrição dos itens originais

// ── Estado do pedido ──
const order = ref({
  type: 'balcao',
  customer: { name: '', address: '' },
  items: [],
  paymentMethod: 'pix'
})

// ── Carregar dados se estiver em modo edição ──
onMounted(() => {
  if (isEditMode.value) {
    for (const col of ordersKanbanDB.value) {
      const found = col.orders.find(o => o.id === editOrderId.value)
      if (found) {
        originalOrderRef = found
        originalColRef = col
        // Pre-preencher o formulário com os dados do pedido existente
        order.value.type = found.type || 'balcao'
        order.value.paymentMethod = found.paymentMethod || 'pix'
        order.value.customer.name = found.customer || ''
        order.value.customer.address = found.address || ''
        // Guardar total e itens originais (armazenados como string no mock)
        const totalStr = (found.total || 'R$ 0').replace('R$ ', '').replace(',', '.')
        originalTotal.value = parseFloat(totalStr) || 0
        originalItemsText.value = found.items || ''
        break
      }
    }
  }
})

// ── Order para o Sidebar: em modo edição, sempre inclui os itens originais como primeiro item virtual ──
const originalSubtotal = computed(() => {
  if (!isEditMode.value || originalTotal.value === 0) return 0
  // subtotal original = total original menos taxa de entrega (se o tipo original era delivery)
  const origDelivery = originalOrderRef?.type === 'delivery' ? 10 : 0
  return Math.max(0, originalTotal.value - origDelivery)
})

const sidebarOrder = computed(() => {
  if (isEditMode.value && originalItemsText.value) {
    const virtualItem = {
      product: { name: originalItemsText.value },
      quantity: 1,
      totalPrice: originalSubtotal.value,
      modifiers: [],
      removals: [],
      observation: ''
    }
    return {
      ...order.value,
      items: [virtualItem, ...order.value.items]
    }
  }
  return order.value
})

// ── Cardápio e filtros ──
const availableProducts = productsDB.value
const allModifierGroups = modifierGroupsDB.value
const selectedCategory = ref(null)

const productCategories = computed(() => {
  return [...new Set(availableProducts.map(p => p.category))]
})

const filteredProducts = computed(() => {
  if (!selectedCategory.value) return availableProducts
  return availableProducts.filter(p => p.category === selectedCategory.value)
})

// ── Modal de Customização ──
const showCustomizationModal = ref(false)
const selectedProductForModal = ref(null)

const openCustomizationModal = (product) => {
  selectedProductForModal.value = product
  showCustomizationModal.value = true
}

const onModalConfirm = (customizedItem) => {
  order.value.items.push({
    ...customizedItem,
    observation: customizedItem.observation || '',
  })
}

const removeItemFromOrder = (index) => {
  if (isEditMode.value && originalItemsText.value) {
    // O índice 0 é o item virtual dos itens originais — não pode ser removido aqui
    if (index === 0) return
    order.value.items.splice(index - 1, 1)
  } else {
    order.value.items.splice(index, 1)
  }
}

// ── Cálculos de preço ──
const deliveryCost = computed(() => order.value.type === 'delivery' ? 10.00 : 0.00)

const itemsTotalPrice = computed(() => {
  const newItemsTotal = order.value.items.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0)
  // Em modo edição, soma o subtotal original com os novos itens adicionados
  if (isEditMode.value && originalSubtotal.value > 0) {
    return originalSubtotal.value + newItemsTotal
  }
  return newItemsTotal
})

const totalOrderPrice = computed(() => itemsTotalPrice.value + deliveryCost.value)

// ── Ações do Pedido ──
const cancelOrder = () => {
  if (confirm('Tem certeza que deseja cancelar este pedido? Todas as informações serão perdidas.')) {
    router.push({ name: 'pedidos' })
  }
}

const showConfirmationModal = ref(false)

const requestOrderConfirmation = () => {
  if (order.value.type === 'delivery' && !order.value.customer.address) {
    alert('Por favor, informe o endereço de entrega.')
    return
  }
  // Em modo edição, permite salvar mesmo sem adicionar novos itens (mantém os originais)
  if (!isEditMode.value && order.value.items.length === 0) {
    alert('Adicione pelo menos um item ao pedido.')
    return
  }
  showConfirmationModal.value = true
}

const placeOrder = async () => {
  loading.value = true
  showConfirmationModal.value = false
  
  setTimeout(() => {
    const itemsDescription = order.value.items.map(item => {
      const mods = item.modifiers.map(m => m.optionName).join(', ')
      const rems = item.removals.map(r => `Sem ${r.name}`).join(', ')
      const obs = item.observation ? `[${item.observation}]` : ''
      const extra = [mods, rems, obs].filter(Boolean).join(' | ')
      return `${item.quantity}x ${item.product.name}${extra ? ` (${extra})` : ''}`
    }).join(', ')

    if (isEditMode.value && originalOrderRef) {
      // Atualizar o pedido existente
      originalOrderRef.customer = order.value.customer.name || originalOrderRef.customer
      originalOrderRef.address = order.value.customer.address || ''
      originalOrderRef.type = order.value.type
      originalOrderRef.paymentMethod = order.value.paymentMethod
      if (order.value.items.length > 0) {
        originalOrderRef.items = itemsDescription
        originalOrderRef.total = `R$ ${totalOrderPrice.value.toFixed(2)}`
      }
    } else {
      // Criar novo pedido
      const newOrderId = `#${Math.floor(Math.random() * 10000)}`
      const newOrder = {
        id: newOrderId,
        customer: order.value.customer.name || 'Cliente Padrão',
        items: itemsDescription,
        time: 'Agora',
        total: `R$ ${totalOrderPrice.value.toFixed(2)}`,
        selected: false,
        type: order.value.type,
        paymentMethod: order.value.paymentMethod,
        driver: null
      }

      const initialColumn = ordersKanbanDB.value.find(col => col.id === 'analise')
      if (initialColumn) {
        initialColumn.orders.unshift(newOrder)
      }
    }

    loading.value = false
    router.push({ name: 'pedidos' })
  }, 800)
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>