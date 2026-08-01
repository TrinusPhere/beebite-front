<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  MoreVertical,
  Timer,
  ChevronRight,
  ArrowRightLeft,
  Trash2,
  Bike,
  Store,
  Edit,
  User,
  FileText, // Ícone NF-e
  MessageSquare, // Ícone WhatsApp
  Utensils, // Ícone
} from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import ChatDrawer from '@/components/ChatDrawer.vue' // Importar o ChatDrawer
import { ordersKanbanDB, motoboysDB } from '@/utils/mockData'

// --- Variáveis para o Novo Botão Flutuante de Abas ---
const isChatWidgetOpen = ref(false)
const activeChatWidgetTab = ref('whatsapp') // Aba padrão inicial

const toggleChatWidget = () => {
  isChatWidgetOpen.value = !isChatWidgetOpen.value
}

const router = useRouter()

// Filtros ativos
const activeFilters = ref(['delivery', 'balcao'])
const openMenuId = ref(null)

const columns = ordersKanbanDB.value

// --- Lógica do Chat Drawer ---
const showChatDrawer = ref(false)
const selectedPlatformForChat = ref(null) // Armazena a plataforma para o chat (whatsapp ou ifood)

const openChat = (platform) => {
  selectedPlatformForChat.value = platform
  showChatDrawer.value = true
}

const closeChat = () => {
  showChatDrawer.value = false
  selectedPlatformForChat.value = null
}

const handleSendMessage = (messageData) => {
  console.log('Mensagem enviada:', messageData)
  // Aqui você faria a chamada para o backend para enviar a mensagem
  // Ex: axios.post('/api/chats/send', messageData)
  alert(`Mensagem para ${messageData.platform} do pedido ${messageData.pedidoId}: "${messageData.content}" enviada! (Simulado)`)
}

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

// --- Lógica de Drag and Drop e Sincronização iFood ---
const isDragging = ref(false)
const draggedOrder = ref(null)
const draggedFromColumnIndex = ref(null)

const startDrag = (event, order, colIndex) => {
  isDragging.value = true
  draggedOrder.value = order
  draggedFromColumnIndex.value = colIndex
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', order.id) // Necessário para Firefox
}

const onDrop = (event, toColIndex) => {
  event.preventDefault()
  isDragging.value = false

  if (!draggedOrder.value || draggedFromColumnIndex.value === null) return

  const fromColIndex = draggedFromColumnIndex.value
  const order = draggedOrder.value

  // Prevenir mover para a mesma coluna
  if (fromColIndex === toColIndex) {
    draggedOrder.value = null
    draggedFromColumnIndex.value = null
    return
  }

  // Remover o pedido da coluna de origem
  const fromColumn = columns[fromColIndex]
  fromColumn.orders = fromColumn.orders.filter(o => o.id !== order.id)

  // Adicionar o pedido à nova coluna
  const toColumn = columns[toColIndex]
  toColumn.orders.unshift(order) // Adiciona no início da nova coluna

  // Lógica de sincronização iFood
  if (order.platform === 'ifood' && order.externalOrderId) {
    updateIfoodStatus(order, fromColumn.id, toColumn.id)
  }

  // Lógica de avaliação ao finalizar
  if (toColumn.id === 'finalizado') {
    const driverName = order.driver || 'Não aplicável (Balcão)'
    setTimeout(() => {
      alert(`Mensagem automática enviada via WhatsApp para o cliente ${order.customer} solicitando avaliação do pedido ${order.id} e do entregador: ${driverName}.`)
    }, 500)
  }

  draggedOrder.value = null
  draggedFromColumnIndex.value = null
}

const allowDrop = (event) => {
  event.preventDefault()
}

const updateIfoodStatus = (order, fromColumnId, toColumnId) => {
  console.log(`Simulando atualização de status iFood para o pedido ${order.id} (externalId: ${order.externalOrderId})`)
  console.log(`De: ${fromColumnId} Para: ${toColumnId}`)

  // Mapeamento de colunas para status da iFood API (simplificado)
  const ifoodStatusMap = {
    'preparando': 'confirm', // ou startPreparation
    'rota': 'dispatched',
    'entregue': 'delivered'
  }

  const targetIfoodStatus = ifoodStatusMap[toColumnId]

  if (!targetIfoodStatus) {
    console.warn(`Transição de status para ${toColId} não mapeada para iFood API.`)
    return
  }

  // Simula a chamada à API do iFood
  // Em um sistema real, você faria um axios.post para seu backend
  // que por sua vez chamaria a iFood Merchant API.
  console.log(`Chamando iFood API para ${order.externalOrderId} com status: ${targetIfoodStatus}`)

  // Exemplo de como seria a chamada real (via backend):
  // axios.post(`/api/ifood/orders/${order.externalOrderId}/status`, { newStatus: targetIfoodStatus })
  //   .then(response => {
  //     console.log('Status iFood atualizado com sucesso:', response.data);
  //     alert(`Status iFood do pedido ${order.id} atualizado para ${toColId}!`);
  //   })
  //   .catch(error => {
  //     console.error('Erro ao atualizar status iFood:', error);
  //     alert(`Erro ao atualizar status iFood do pedido ${order.id}.`);
  //     // Reverter a mudança no frontend se a API falhar
  //   });

  alert(`Simulação: Status iFood do pedido ${order.id} atualizado para "${toColId}"!`)
}

// --- Polling de Novos Pedidos iFood ---
let pollingInterval = null
const isPolling = ref(false)

const startPollingIfoodOrders = () => {
  if (isPolling.value) return

  isPolling.value = true
  console.log('Iniciando polling de pedidos iFood...')

  pollingInterval = setInterval(() => {
    console.log('Verificando novos pedidos iFood (simulado)...')
    // Simula uma chamada ao backend para buscar novos pedidos iFood
    // Em um sistema real, seria um GET /api/ifood/new-orders
    setTimeout(() => {
      // Simula a chegada de um novo pedido iFood a cada 15 segundos
      if (Math.random() < 0.3) { // 30% de chance de um novo pedido
        const newIfoodOrderId = `IFD-${Math.floor(Math.random() * 100000)}`
        const newOrder = {
          id: newIfoodOrderId,
          customer: `Cliente iFood ${Math.floor(Math.random() * 100)}`,
          items: '1x X-Burger, 1x Refri',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          total: `R$ ${(Math.random() * 50 + 20).toFixed(2)}`,
          selected: false,
          type: 'delivery',
          driver: null,
          platform: 'ifood',
          externalOrderId: `IFD-EXT-${Math.floor(Math.random() * 1000)}`
        }

        const preparingColumn = columns.find(col => col.id === 'preparando')
        if (preparingColumn) {
          preparingColumn.orders.unshift(newOrder)
          alert(`Novo pedido iFood recebido: ${newOrder.id}!`)
        }
      }
    }, 1000) // Simula o tempo de resposta do backend
  }, 15000) // Polling a cada 15 segundos (para demonstração)
}

const stopPollingIfoodOrders = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
  isPolling.value = false
  console.log('Polling de pedidos iFood parado.')
}

onMounted(() => {
  startPollingIfoodOrders()
})

onUnmounted(() => {
  stopPollingIfoodOrders()
})

const moveOrder = (orderId, currentColumnIndex) => {
  const rotaColumnIndex = columns.findIndex(col => col.id === 'rota')
  const finalizadoColumnIndex = columns.findIndex(col => col.id === 'finalizado')

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
      const targetColIndex = currentColumnIndex + 1
      columns[targetColIndex].orders.unshift(order)

      // Se moveu para finalizado, disparar solicitação de avaliação
      if (targetColIndex === finalizadoColumnIndex) {
        const driverName = order.driver || 'Não aplicável (Balcão)'
        // Simulação do envio de mensagem de avaliação
        setTimeout(() => {
          alert(`Mensagem automática enviada via WhatsApp para o cliente ${order.customer} solicitando avaliação do pedido ${order.id} e do entregador: ${driverName}.`)
        }, 500)
      }
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
    }
    )
  }
}

const toggleAllInColumn = (colIndex, value) => {
  filteredColumns.value[colIndex].orders.forEach(o => o.selected = value)
}

const goToNewOrder = () => {
  router.push({ name: 'novo-pedido' })
}

const editOrder = (orderId) => {
  openMenuId.value = null
  router.push({ name: 'editar-pedido', params: { id: orderId } })
}

const emitirNFe = (order) => {
  openMenuId.value = null
  alert(`NF-e do pedido ${order.id} emitida com sucesso! (Simulado)`)
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
            <h3 :class="['font-black text-[10px] uppercase tracking-widest', column.color]">{{ column.title }}</h3>
          </div>
          <span class="bg-white border border-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">{{ column.orders.length }}</span>
        </div>

        <!-- Lista de Pedidos -->
        <div
            class="flex-1 space-y-4 bg-slate-100/50 p-2 rounded-[2.5rem] border-2 border-dashed border-slate-200"
            @drop="onDrop($event, colIndex)"
            @dragover="allowDrop"
            @dragleave="isDragging = false"
        >
          <TransitionGroup name="list">
            <div
                v-for="order in column.orders"
                :key="order.id"
                class="border p-3 rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-visible flex flex-col gap-2"
                :class="[column.bg, order.selected ? 'ring-2 ring-orange-500/5' : 'border-slate-200']"
                draggable="true"
                @dragstart="startDrag($event, order, colIndex)"
            >
              <!-- Top Row: Checkbox, ID, Time, Menu -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <input v-model="order.selected" type="checkbox" class="w-4 h-4 rounded border-slate-300 text-orange-600 transition-all cursor-pointer">
                  <span :class="['text-xs font-black tracking-tight', column.color]">{{ order.id }}</span>
                </div>

                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    <Timer :size="10" /> {{ order.time }}
                  </div>

                  <div class="relative">
                    <button @click.stop="toggleMenu(order.id)" class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                      <MoreVertical :size="14" />
                    </button>
                    <!-- Dropdown Menu -->
                    <transition enter-active-class="transition duration-100 ease-out" enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
                      <div v-if="openMenuId === order.id" class="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
                        <button @click.stop="editOrder(order.id)" class="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                          <Edit :size="14" class="text-blue-500" /> Editar
                        </button>
                        <button @click.stop="emitirNFe(order)" class="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                          <FileText :size="14" class="text-emerald-500" /> Emitir NF-e
                        </button>
                        <button @click="deleteOrder(order.id, colIndex)" class="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 :size="14" /> Excluir
                        </button>
                      </div>
                    </transition>
                  </div>
                </div>
              </div>

              <!-- Customer & Driver -->
              <div>
                <h4 class="font-bold text-slate-800 text-xs truncate">{{ order.customer }}</h4>
                <div v-if="order.driver" class="flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-0.5">
                  <User :size="10" /> {{ order.driver }}
                </div>
              </div>

              <!-- Items (Compact) -->
              <p class="text-[10px] text-slate-500 font-medium leading-tight line-clamp-2">{{ order.items }}</p>

              <!-- Footer: Total & Action -->
              <div class="flex items-center justify-between mt-1 pt-2 border-t border-slate-50">
                <span class="text-xs font-black text-orange-600">R$ {{ order.total.replace('R$ ', '') }}</span>

                <button v-if="colIndex < columns.length - 1" @click="moveOrder(order.id, colIndex)" class="px-2 py-1 bg-slate-50 hover:bg-orange-50 text-slate-500 hover:text-orange-600 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border border-slate-200 hover:border-orange-200">
                  Avançar <ChevronRight :size="12" />
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

    <!-- Chat Drawer -->
    <!-- Removido daqui, será global no MainLayout -->
    <!-- <ChatDrawer
      :show="showChatDrawer"
      :pedido="selectedPedidoForChat"
      @close="closeChat"
      @send-message="handleSendMessage"
    /> -->
  </div>
  <div class="chat-widget-container">

    <!-- Card Flutuante de Abas (Só renderiza se estiver aberto) -->
    <div v-if="isChatWidgetOpen" class="chat-card">
      <!-- Cabeçalho -->
      <div class="chat-card-header">
        <h3>Canais de Atendimento</h3>
        <button @click="toggleChatWidget" class="close-btn">&times;</button>
      </div>

      <!-- Navegação por Abas -->
      <div class="chat-tabs">
        <button
            :class="['tab-btn', { active: activeChatWidgetTab === 'whatsapp' }]"
            @click="activeChatWidgetTab = 'whatsapp'"
        >
          <MessageSquare :size="16" class="inline-icon text-green-500" />
          WhatsApp
        </button>
        <button
            :class="['tab-btn', { active: activeChatWidgetTab === 'ifood' }]"
            @click="activeChatWidgetTab = 'ifood'"
        >
          <Utensils :size="16" class="inline-icon text-red-500" />
          iFood
        </button>
      </div>

      <!-- Conteúdo Interno das Abas -->
      <div class="chat-card-content">
        <!-- Aba WhatsApp -->
        <div v-if="activeChatWidgetTab === 'whatsapp'" class="tab-content">
          <p>Deseja iniciar um atendimento direto ou dar suporte ao cliente?</p>
          <!-- Aqui integra com a sua lógica existente openChat('whatsapp') se necessário, ou link direto -->
          <button @click="openChat('whatsapp'); toggleChatWidget()" class="action-btn wa-btn">
            Abrir Chat WhatsApp
          </button>
        </div>

        <!-- Aba iFood -->
        <div v-if="activeChatWidgetTab === 'ifood'" class="tab-content">
          <p>Gerencie o canal do iFood ou envie mensagens integradas da plataforma.</p>
          <!-- Integra com a sua lógica existente openChat('ifood') -->
          <button @click="openChat('ifood'); toggleChatWidget()" class="action-btn ifood-btn">
            Abrir Chat iFood
          </button>
        </div>
      </div>
    </div>

    <!-- Botão Flutuante Fixo (Gatilho) -->
    <button @click="toggleChatWidget" class="chat-float-trigger" :class="{ 'btn-active': isChatWidgetOpen }">
      <!-- Exibe o ícone de mensagem padrão ou troca se estiver aberto -->
      <MessageSquare v-if="!isChatWidgetOpen" :size="28" color="#FFFFFF" />
      <span v-else class="text-xl font-bold text-white">&times;</span>
    </button>

  </div>
</template>

<style scoped>
/* Container fixado no canto inferior direito */
.chat-widget-container {
  position: fixed;
  bottom: 25px;
  right: 25px;
  z-index: 9999;
  font-family: sans-serif;
}

/* Botão Redondo Flutuante */
.chat-float-trigger {
  width: 60px;
  height: 60px;
  background-color: #3b82f6; /* Azul primário (ajuste conforme seu sistema) */
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background-color 0.2s;
  float: right;
}

.chat-float-trigger:hover {
  transform: scale(1.05);
}

/* Estado ativo do botão flutuante (opcional: muda para vermelho ao abrir) */
.chat-float-trigger.btn-active {
  background-color: #ef4444;
}

/* Card flutuante de seleção */
.chat-card {
  width: 300px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

/* Cabeçalho do Card */
.chat-card-header {
  background-color: #1f2937;
  color: #ffffff;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-card-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 20px;
  cursor: pointer;
}
.close-btn:hover {
  color: #ffffff;
}

/* Abas */
.chat-tabs {
  display: flex;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #1f2937;
  background: #ffffff;
  border-bottom: 3px solid #3b82f6;
}

/* Conteúdo */
.chat-card-content {
  padding: 16px;
}

.tab-content p {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

/* Botões de Ação de cada Aba */
.action-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 0.9;
}

.wa-btn {
  background-color: #25D366; /* Verde WhatsApp */
}

.ifood-btn {
  background-color: #ea1d2c; /* Vermelho iFood */
}
.whatsapp-float {
  position: fixed;
  bottom: 20px; /* Distância do fundo da página */
  right: 20px;  /* Distância da borda direita */
  z-index: 9999; /* Garante que fica por cima de tudo */

  /* Visual do botão */
  width: 60px;
  height: 60px;
  background-color: #25D366; /* Fundo verde original do WhatsApp */
  border-radius: 50%;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);

  /* Centralização do ícone */
  display: flex;
  align-items: center;
  justify-content: center;

  /* Efeito de clique e transição */
  cursor: pointer;
  transition: transform 0.2s ease;
}
.whatsapp-float:hover {
  transform: scale(1.1);
}
.list-move, .list-enter-active, .list-leave-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }
.list-leave-active { position: absolute; width: 100%; }
.custom-scrollbar::-webkit-scrollbar { height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { @apply bg-slate-100 rounded-full; }
.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-300 rounded-full hover:bg-slate-400; }
</style>