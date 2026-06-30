<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  MoreVertical,
  Timer,
  ChevronRight,
  ArrowRightLeft,
  Trash2,
  Bike,
  Store,
  Filter,
  Edit,
  User // Importar User icon para motoboy
} from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import { ordersKanbanDB, motoboysDB } from '@/utils/mockData'

const router = useRouter()

// Filtros ativos
const activeFilters = ref(['delivery', 'balcao'])
const openMenuId = ref(null)

const columns = ordersKanbanDB.value

const toggleMenu = (id) => {
  openMenuId.value = openMenuId.value === id ? null : id
}

const deleteOrder = (id, colIndex) => {
  if (confirm('Tem certeza que deseja excluir este pedido?')) {
    columns[colIndex].orders = columns[colIndex].orders.filter(o => o.id !== id)
    openMenuId.value = null
  }
}

// Computado para aplicar o filtro nas colunas
const filteredColumns = computed(() => {
  return columns.map(col => ({
    ...col,
    orders: col.orders.filter(order => activeFilters.value.includes(order.type))
  }))
})

const toggleFilter = (filter) => {
  const index = activeFilters.value.indexOf(filter)
  if (index > -1) {
    if (activeFilters.value.length > 1) {
      activeFilters.value.splice(index, 1)
    }
  } else {
    activeFilters.value.push(filter)
  }
}

const selectedOrders = computed(() => {
  const selected = []
  filteredColumns.value.forEach((col, colIdx) => {
    col.orders.forEach(order => {
      if (order.selected) {
        selected.push({ ...order, colIndex: colIdx })
      }
    })
  })
  return selected
})

// --- Nova funcionalidade: Atribuição de Motoboy ---
const showMotoboyModal = ref(false)
const motoboys = motoboysDB.value
const selectedMotoboyId = ref(null)
const ordersToAssign = ref([]) // Armazena os pedidos que precisam de motoboy atribuído

const openMotoboyModal = (orders) => {
  ordersToAssign.value = orders
  selectedMotoboyId.value = null // Resetar seleção
  showMotoboyModal.value = true
}

const closeMotoboyModal = () => {
  showMotoboyModal.value = false
  ordersToAssign.value = []
  selectedMotoboyId.value = null
}

const assignMotoboy = () => {
  if (!selectedMotoboyId.value) {
    alert('Por favor, selecione um motoboy.')
    return
  }
  const motoboy = motoboys.find(m => m.id === selectedMotoboyId.value)
  if (!motoboy) {
    alert('Motoboy selecionado inválido.')
    return
  }

  const rotaColumnIndex = columns.findIndex(col => col.id === 'rota')
  if (rotaColumnIndex === -1) {
    console.error("Coluna 'Em Rota de Entrega' não encontrada.")
    closeMotoboyModal()
    return
  }

  ordersToAssign.value.forEach(orderInfo => {
    // Encontrar o pedido na sua coluna original e removê-lo
    const originalCol = columns[orderInfo.colIndex]
    const orderIndex = originalCol.orders.findIndex(o => o.id === orderInfo.id)
    if (orderIndex !== -1) {
      const [order] = originalCol.orders.splice(orderIndex, 1)
      order.selected = false // Desmarcar se fazia parte de uma movimentação em massa
      order.driver = motoboy.name // Atribuir motoboy
      columns[rotaColumnIndex].orders.unshift(order) // Adicionar à coluna 'rota'
    }
  })

  closeMotoboyModal()
}

const moveOrder = (orderId, currentColumnIndex) => {
  const rotaColumnIndex = columns.findIndex(col => col.id === 'rota')
  if (currentColumnIndex + 1 === rotaColumnIndex) { // Movendo para 'Em Rota de Entrega'
    const originalCol = columns[currentColumnIndex]
    const order = originalCol.orders.find(o => o.id === orderId)
    if (order && order.type === 'delivery') {
      openMotoboyModal([{ id: order.id, colIndex: currentColumnIndex }])
    } else if (order && order.type === 'balcao') {
      // Se for balcão, move diretamente sem motoboy
      const orderIndex = originalCol.orders.findIndex(o => o.id === orderId)
      if (orderIndex !== -1) {
        const [movedOrder] = originalCol.orders.splice(orderIndex, 1)
        columns[currentColumnIndex + 1].orders.unshift(movedOrder)
      }
    }
  } else if (currentColumnIndex < columns.length - 1) {
    const originalCol = columns[currentColumnIndex]
    const orderIndex = originalCol.orders.findIndex(o => o.id === orderId)
    if (orderIndex !== -1) {
      const [order] = originalCol.orders.splice(orderIndex, 1)
      columns[currentColumnIndex + 1].orders.unshift(order)
    }
  }
}

const moveSelectedTo = (targetColIndex) => {
  const rotaColumnIndex = columns.findIndex(col => col.id === 'rota')
  if (targetColIndex === rotaColumnIndex) { // Movendo para 'Em Rota de Entrega'
    const deliveryOrdersToMove = selectedOrders.value.filter(order => order.type === 'delivery')
    const balcaoOrdersToMove = selectedOrders.value.filter(order => order.type === 'balcao')

    if (deliveryOrdersToMove.length > 0) {
      openMotoboyModal(deliveryOrdersToMove)
    } else if (balcaoOrdersToMove.length > 0) {
      // Mover pedidos de balcão diretamente
      balcaoOrdersToMove.forEach(item => {
        const originalColIdx = columns.findIndex((_, idx) => idx === item.colIndex)
        const col = columns[originalColIdx]
        const orderIdx = col.orders.findIndex(o => o.id === item.id)
        if (orderIdx !== -1) {
          const [order] = col.orders.splice(orderIdx, 1)
          order.selected = false
          columns[targetColIndex].orders.unshift(order)
        }
      })
      // Limpar seleção após mover
      selectedOrders.value.forEach(order => order.selected = false)
    } else {
      alert('Nenhum pedido selecionado para mover para "Em Rota de Entrega".')
    }
  } else {
    // Lógica existente para mover para outras colunas
    selectedOrders.value.forEach(item => {
      const originalColIdx = columns.findIndex((_, idx) => idx === item.colIndex)
      const col = columns[originalColIdx]
      const orderIdx = col.orders.findIndex(o => o.id === item.id)
      if (orderIdx !== -1) {
        const [order] = col.orders.splice(orderIdx, 1)
        order.selected = false
        columns[targetColIndex].orders.unshift(order)
      }
    })
  }
}

const toggleAllInColumn = (colIndex, value) => {
  filteredColumns.value[colIndex].orders.forEach(o => o.selected = value)
}

const goToNewOrder = () => {
  router.push({ name: 'novo-pedido' })
}
</script>

<template>
  <div class="space-y-6" @click="openMenuId = null">
    <!-- Header e Filtros -->
    <div class="flex flex-col gap-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">Painel de Pedidos</h1>
          <p class="text-slate-500 text-sm font-medium">Controle de produção e logística</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="bg-white border border-slate-200 p-1 rounded-2xl flex gap-1 shadow-sm">
            <button @click="toggleFilter('delivery')" :class="[
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                activeFilters.includes('delivery') ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-50'
              ]">
              <Bike :size="16" /> Delivery
            </button>
            <button @click="toggleFilter('balcao')" :class="[
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                activeFilters.includes('balcao') ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-50'
              ]">
              <Store :size="16" /> Balcão
            </button>
          </div>
          <BaseButton variant="primary" size="md" @click="goToNewOrder">Novo Pedido</BaseButton>
        </div>
      </div>

      <!-- Barra de Ações em Massa -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform -translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
      >
        <div v-if="selectedOrders.length > 0" class="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="bg-orange-500 p-2 rounded-lg"><ArrowRightLeft :size="20" /></div>
            <span class="font-bold">{{ selectedOrders.length }} pedidos selecionados</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button v-for="(col, idx) in columns" :key="col.id" @click="moveSelectedTo(idx)" class="px-3 py-1.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-lg text-[10px] font-black uppercase transition-all">
              {{ col.title }}
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Kanban Board -->
    <div class="flex gap-6 overflow-x-auto pb-6 custom-scrollbar min-h-[calc(100vh-250px)]">
      <div v-for="(column, colIndex) in filteredColumns" :key="column.id" class="flex-shrink-0 w-84 flex flex-col gap-4">
        <!-- Header da Coluna -->
        <div class="flex items-center justify-between px-2">
          <div class="flex items-center gap-2">
            <input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-orange-600" :checked="column.orders.length > 0 && column.orders.every(o => o.selected)" @change="toggleAllInColumn(colIndex, $event.target.checked)">
            <div :class="['p-2 rounded-lg', column.bg, column.color]"><component :is="column.icon" :size="18" /></div>
            <h3 class="font-black text-slate-800 text-[10px] uppercase tracking-widest">{{ column.title }}</h3>
          </div>
          <span class="bg-white border border-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">{{ column.orders.length }}</span>
        </div>

        <!-- Lista de Pedidos -->
        <div class="flex-1 space-y-4 bg-slate-100/50 p-2 rounded-[2.5rem] border-2 border-dashed border-slate-200">
          <TransitionGroup name="list">
            <div v-for="order in column.orders" :key="order.id" class="bg-white border p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group relative overflow-visible" :class="order.selected ? 'border-orange-500 ring-4 ring-orange-500/5' : 'border-slate-100'">

              <!-- Checkbox -->
              <div class="absolute top-5 left-5 z-10">
                <input v-model="order.selected" type="checkbox" class="w-5 h-5 rounded-lg border-slate-300 text-orange-600 transition-all cursor-pointer">
              </div>

              <!-- Menu de Configuração (3 pontinhos) -->
              <div class="absolute top-4 right-4 z-20">
                <button @click.stop="toggleMenu(order.id)" class="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                  <MoreVertical :size="20" />
                </button>

                <!-- Dropdown Menu -->
                <transition enter-active-class="transition duration-100 ease-out" enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
                  <div v-if="openMenuId === order.id" class="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2">
                    <button class="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                      <Edit :size="16" class="text-blue-500" /> Editar Pedido
                    </button>
                    <button @click="deleteOrder(order.id, colIndex)" class="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 :size="16" /> Excluir Pedido
                    </button>
                  </div>
                </transition>
              </div>

              <div class="pl-8 pt-1">
                <div class="flex justify-between items-start mb-3">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{{ order.id }}</span>
                </div>

                <div class="space-y-4">
                  <div>
                    <h4 class="font-black text-slate-800 text-sm tracking-tight leading-none mb-2">{{ order.customer }}</h4>
                    <p class="text-xs text-slate-500 font-medium leading-relaxed">{{ order.items }}</p>
                    <div v-if="order.driver" class="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                      <User :size="14" /> {{ order.driver }}
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div class="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Timer :size="14" /> {{ order.time }}
                    </div>
                    <span class="text-sm font-black text-orange-600">R$ {{ order.total.replace('R$ ', '') }}</span>
                  </div>
                </div>

                <button v-if="colIndex < columns.length - 1" @click="moveOrder(order.id, colIndex)" class="mt-4 w-full py-3 bg-slate-50 hover:bg-orange-50 text-slate-500 hover:text-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn border border-slate-100 hover:border-orange-200">
                  Próxima Etapa <ChevronRight :size="14" />
                </button>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>

    <!-- Motoboy Assignment Modal -->
    <div v-if="showMotoboyModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md">
        <h3 class="text-xl font-bold text-slate-800 mb-4">Atribuir Motoboy</h3>
        <p class="mb-4 text-slate-600">Selecione o motoboy para {{ ordersToAssign.length > 1 ? 'os pedidos selecionados' : 'o pedido' }}:</p>

        <div class="space-y-3 mb-6">
          <label v-for="motoboy in motoboys" :key="motoboy.id" class="flex items-center p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="radio" :value="motoboy.id" v-model="selectedMotoboyId" class="form-radio text-orange-600">
            <span class="ml-3 text-slate-700 font-medium">{{ motoboy.name }}</span>
          </label>
        </div>

        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="closeMotoboyModal">Cancelar</BaseButton>
          <BaseButton variant="primary" @click="assignMotoboy">Confirmar</BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-move, .list-enter-active, .list-leave-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }
.list-leave-active { position: absolute; width: 100%; }
.custom-scrollbar::-webkit-scrollbar { height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { @apply bg-slate-100 rounded-full; }
.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-300 rounded-full hover:bg-slate-400; }
</style>