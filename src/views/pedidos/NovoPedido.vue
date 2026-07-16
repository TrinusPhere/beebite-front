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

          <div class="space-y-2 pt-4 border-t border-slate-800">
            <label class="text-xs text-slate-400 font-bold uppercase tracking-widest">Forma de Pagamento</label>
            <select v-model="order.paymentMethod" class="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 text-white text-sm">
              <option value="pix">PIX</option>
              <option value="credito">Cartão de Crédito</option>
              <option value="debito">Cartão de Débito</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
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

        <!-- Cardápio de Produtos (agrupado por categoria) -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 class="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest flex items-center gap-2">
            <ShoppingBag :size="16" class="text-orange-600" /> Cardápio
          </h2>

          <!-- Filtro de categorias -->
          <div class="flex flex-wrap gap-2 mb-5">
            <button
              @click="selectedCategory = null"
              :class="[
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
                selectedCategory === null
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-orange-300'
              ]"
            >
              Todos
            </button>
            <button
              v-for="cat in productCategories"
              :key="cat"
              @click="selectedCategory = cat"
              :class="[
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
                selectedCategory === cat
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-orange-300'
              ]"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Grid de produtos -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              v-for="product in filteredProducts"
              :key="product.id"
              @click="openCustomizationModal(product)"
              class="group relative text-left border-2 border-slate-100 p-0 rounded-2xl flex flex-col overflow-hidden shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200 bg-white active:scale-[0.98]"
            >
              <!-- Imagem do produto -->
              <div class="h-28 bg-gradient-to-br from-orange-100 to-amber-100 overflow-hidden">
                <img
                  v-if="product.imageUrl"
                  :src="product.imageUrl"
                  :alt="product.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UtensilsCrossed :size="32" class="text-orange-300" />
                </div>
              </div>

              <!-- Info do produto -->
              <div class="p-3 flex flex-col flex-1 gap-1">
                <h3 class="font-bold text-slate-800 text-sm leading-tight">{{ product.name }}</h3>
                <p class="text-xs text-slate-500 leading-snug line-clamp-2 flex-1">{{ product.description }}</p>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-sm font-black text-orange-600">R$ {{ product.price.toFixed(2) }}</span>
                  <span class="text-[10px] bg-orange-50 text-orange-500 border border-orange-100 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-1">
                    <SlidersHorizontal :size="9" /> Personalizar
                  </span>
                </div>
              </div>
            </button>
          </div>
          <p v-if="filteredProducts.length === 0" class="text-slate-500 mt-4 text-sm text-center py-8">Nenhum produto nesta categoria.</p>
        </div>

        <!-- Itens do Pedido (carrinho) -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 class="text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest flex items-center gap-2">
            <UtensilsCrossed :size="16" class="text-orange-600" /> Itens Selecionados
            <span v-if="order.items.length" class="ml-auto bg-orange-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
              {{ order.items.length }}
            </span>
          </h2>

          <TransitionGroup name="cart-list" tag="ul" class="space-y-3">
            <li
              v-for="(item, index) in order.items"
              :key="item.cartItemId"
              class="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex gap-3 items-start"
            >
              <!-- Ícone / mini thumb -->
              <div class="w-10 h-10 rounded-xl bg-orange-100 shrink-0 overflow-hidden">
                <img
                  v-if="item.product.imageUrl"
                  :src="item.product.imageUrl"
                  :alt="item.product.name"
                  class="w-full h-full object-cover"
                />
              </div>

              <div class="flex-1 min-w-0">
                <p class="font-bold text-slate-800 text-sm leading-tight">{{ item.product.name }}</p>

                <!-- Tags de modificadores -->
                <div class="flex flex-wrap gap-1 mt-1.5">
                  <span
                    v-for="mod in item.modifiers"
                    :key="mod.optionId"
                    class="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-lg font-bold"
                  >
                    {{ mod.optionName }}<span v-if="mod.price > 0"> +R${{ mod.price.toFixed(2) }}</span>
                  </span>
                  <span
                    v-for="rem in item.removals"
                    :key="rem.id"
                    class="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-lg font-bold"
                  >
                    Sem {{ rem.name }}
                  </span>
                </div>

                <!-- Observação manual -->
                <div v-if="editingObsIndex === index" class="mt-2">
                  <input
                    type="text"
                    v-model="item.observation"
                    placeholder="Ex: Capricha no molho..."
                    class="w-full text-xs rounded-lg border border-slate-300 px-2 py-1.5 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none"
                    @blur="editingObsIndex = null"
                    @keyup.enter="editingObsIndex = null"
                    ref="obsInputRef"
                    autofocus
                  />
                </div>
                <button
                  v-else-if="item.observation"
                  @click="editingObsIndex = index"
                  class="mt-1 text-[10px] text-slate-400 italic hover:text-orange-500 transition-colors"
                >
                  💬 {{ item.observation }}
                </button>
                <button
                  v-else
                  @click="editingObsIndex = index"
                  class="mt-1 text-[10px] text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-1"
                >
                  <MessageSquare :size="10" /> Adicionar observação
                </button>
              </div>

              <!-- Preço e controles de qtd -->
              <div class="flex flex-col items-end gap-2 shrink-0">
                <span class="font-black text-slate-700 text-sm">R$ {{ (item.totalPrice * item.quantity).toFixed(2) }}</span>
                <div class="flex items-center gap-1.5">
                  <button
                    @click="decreaseQuantity(index)"
                    class="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 font-bold transition-all text-base leading-none"
                  >−</button>
                  <span class="font-black text-slate-700 w-5 text-center text-sm">{{ item.quantity }}</span>
                  <button
                    @click="increaseQuantity(index)"
                    class="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 font-bold transition-all text-base leading-none"
                  >+</button>
                  <button
                    @click="removeItemFromOrder(index)"
                    class="w-7 h-7 rounded-lg bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-all ml-1"
                  >
                    <Trash2 :size="13" />
                  </button>
                </div>
              </div>
            </li>
          </TransitionGroup>

          <div v-if="order.items.length === 0" class="text-center py-10 text-slate-400">
            <ShoppingBag :size="40" class="mx-auto mb-3 opacity-30" />
            <p class="text-sm font-medium">Nenhum item adicionado ao pedido.</p>
            <p class="text-xs mt-1">Selecione produtos no cardápio acima.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Customização -->
    <ItemCustomizationModal
      v-model="showCustomizationModal"
      :product="selectedProductForModal"
      :all-modifier-groups="allModifierGroups"
      @confirm="onModalConfirm"
      @cancel="showCustomizationModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Save, X, ShoppingBag, User, Package, ChevronLeft, UtensilsCrossed,
  SlidersHorizontal, Trash2, MessageSquare
} from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import ItemCustomizationModal from '@/components/ItemCustomizationModal.vue'
import { productsDB, ordersKanbanDB, financialRecordsDB, modifierGroupsDB } from '@/utils/mockData'

const router = useRouter()
const loading = ref(false)

// ── Estado do pedido ──
const order = ref({
  type: 'balcao',
  customer: { name: '', address: '' },
  items: [],  // cada item é um objeto customizadoItem + { quantity, observation }
  paymentMethod: 'pix'
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

// ── Modal de customização ──
const showCustomizationModal = ref(false)
const selectedProductForModal = ref(null)

const openCustomizationModal = (product) => {
  selectedProductForModal.value = product
  showCustomizationModal.value = true
}

// Callback ao confirmar no modal — sempre adiciona como nova linha (independente de customizações)
const onModalConfirm = (customizedItem) => {
  order.value.items.push({
    ...customizedItem,
    observation: '',
  })
}

// ── Observação inline ──
const editingObsIndex = ref(null)

// ── Controles de quantidade ──
const increaseQuantity = (index) => {
  order.value.items[index].quantity++
}

const decreaseQuantity = (index) => {
  if (order.value.items[index].quantity > 1) {
    order.value.items[index].quantity--
  } else {
    order.value.items.splice(index, 1)
  }
}

const removeItemFromOrder = (index) => {
  order.value.items.splice(index, 1)
}

// ── Cálculos de preço ──
const deliveryCost = computed(() => order.value.type === 'delivery' ? 10.00 : 0.00)

const itemsTotalPrice = computed(() =>
  order.value.items.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0)
)

const totalOrderPrice = computed(() => itemsTotalPrice.value + deliveryCost.value)

// ── Ações do pedido ──
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

  setTimeout(() => {
    const newOrderId = `#${Math.floor(Math.random() * 10000)}`

    // Montar descrição dos itens com modificadores
    const itemsDescription = order.value.items.map(item => {
      const mods = item.modifiers.map(m => m.optionName).join(', ')
      const rems = item.removals.map(r => `Sem ${r.name}`).join(', ')
      const obs = item.observation ? `[${item.observation}]` : ''
      const extra = [mods, rems, obs].filter(Boolean).join(' | ')
      return `${item.quantity}x ${item.product.name}${extra ? ` (${extra})` : ''}`
    }).join(', ')

    const newOrder = {
      id: newOrderId,
      customer: order.value.customer.name,
      items: itemsDescription,
      time: 'Agora',
      total: `R$ ${totalOrderPrice.value.toFixed(2)}`,
      selected: false,
      type: order.value.type,
      paymentMethod: order.value.paymentMethod,
      driver: null
    }

    const preparingColumn = ordersKanbanDB.value.find(col => col.id === 'preparando')
    if (preparingColumn) {
      preparingColumn.orders.unshift(newOrder)
    }

    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().split(' ')[0].substring(0, 5)

    const newFinancialRecord = {
      id: `FIN${Math.floor(Math.random() * 900) + 100}`,
      orderId: newOrderId,
      date,
      time,
      totalValue: totalOrderPrice.value,
      paymentMethod: order.value.paymentMethod === 'credito' ? 'Cartão de Crédito' :
                     order.value.paymentMethod === 'debito' ? 'Cartão de Débito' :
                     order.value.paymentMethod === 'pix' ? 'PIX' : 'Dinheiro',
      status: 'Pendente',
      products: order.value.items.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.totalPrice,
        modifiers: item.modifiers,
        removals: item.removals,
      }))
    }
    financialRecordsDB.value.push(newFinancialRecord)

    alert('Pedido finalizado com sucesso!')
    loading.value = false
    router.push({ name: 'pedidos' })
  }, 1000)
}
</script>

<style scoped>
/* Animação de entrada/saída dos itens do carrinho */
.cart-list-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.cart-list-leave-active {
  transition: all 0.2s ease;
}
.cart-list-enter-from {
  opacity: 0;
  transform: translateX(-16px) scale(0.96);
}
.cart-list-leave-to {
  opacity: 0;
  transform: translateX(16px) scale(0.96);
}
.cart-list-move {
  transition: transform 0.3s ease;
}
</style>