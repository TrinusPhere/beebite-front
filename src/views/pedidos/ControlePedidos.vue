<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
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
  MessageSquare,
  Eye,
  Printer,
  CheckCircle2,
  XCircle,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import ChatDrawer from "@/components/ChatDrawer.vue";
import GeneralChatDrawer from "@/components/GeneralChatDrawer.vue";
import OrderDetailsModal from "@/components/OrderDetailsModal.vue";
import PrintOrderModal from "@/components/PrintOrderModal.vue";
import { orderService } from "@/services/orderService";
import { driverService } from "@/services/driverService";
import { integrationService } from "@/services/integrationService";
import { chatService } from "@/services/chatService";
import cashService from "@/services/cashService";
import { confirmAction, notify } from "@/services/notificationService";
import {
  OPERATIONS,
  normalizeOrderContext,
  contextLabel,
  isDeliveryOrder,
  requiresDeliveryDriver,
} from "@/utils/orderContext";

const router = useRouter();

const activeOperations = ref([OPERATIONS.SALAO, OPERATIONS.DELIVERY]);
const openMenuId = ref(null);
const currentSession = ref(null);

const checkCashSession = async () => {
  try {
    currentSession.value = await cashService.getCurrentSession();
  } catch {
    currentSession.value = null;
  }
};

const columns = ref([]);
const showOrderDetails = ref(false);
const selectedOrderDetails = ref(null);
const loadingOrderDetails = ref(false);

const openOrderDetails = async (order) => {
  openMenuId.value = null;
  selectedOrderDetails.value = order;
  showOrderDetails.value = true;
  loadingOrderDetails.value = true;
  try {
    selectedOrderDetails.value = await orderService.getById(order.id);
  } catch (error) {
    console.error("Erro ao carregar detalhes do pedido:", error);
    notify({ type: "error", message: "Não foi possível carregar os detalhes do pedido." });
    showOrderDetails.value = false;
  } finally {
    loadingOrderDetails.value = false;
  }
};

const closeOrderDetails = () => {
  showOrderDetails.value = false;
  selectedOrderDetails.value = null;
};

const showPrintModal = ref(false);
const orderToPrint = ref(null);

const openPrintModal = (order) => {
  openMenuId.value = null;
  orderToPrint.value = order;
  showPrintModal.value = true;
};

const fetchKanban = async () => {
  try {
    const data = await orderService.getKanban();
    columns.value = data.columns;
  } catch (error) {
    console.error("Erro ao buscar kanban:", error);
  }
};

let kanbanInterval = null;

onMounted(() => {
  fetchKanban();
  checkCashSession();
  loadDrivers();
  loadChatContext();
  
  kanbanInterval = setInterval(() => {
    fetchKanban();
    checkCashSession();
  }, 10000);
});

onUnmounted(() => {
  if (kanbanInterval) clearInterval(kanbanInterval);
});

const formatTime = (isoString) => {
  if (!isoString) return "--:--";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
};

const getOrderItems = (summary) => {
  if (!summary) return [];
  if (summary.includes("\n")) {
    return summary
      .split("\n")
      .map((s) => s.trim().replace(/^,\s*/, "").replace(/,\s*$/, ""))
      .filter(Boolean);
  }
  let items = summary
    .split(/,\s*(?=\d+x\s)/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (items.length === 1 && summary.includes(", ")) {
    items = summary.split(", ").map((s) => s.trim()).filter(Boolean);
  }
  return items;
};

// --- Chat vinculado diretamente ao pedido ---
const showChatDrawer = ref(false);
const showGeneralChat = ref(false);
const selectedOrderForChat = ref(null);
const integrations = ref({ whatsapp: {}, ifood: {} });
const conversations = ref([]);

const loadChatContext = async () => {
  try {
    const [integrationData, conversationData] = await Promise.all([
      integrationService.getAll(),
      chatService.list(),
    ]);
    integrations.value = integrationData || { whatsapp: {}, ifood: {} };
    conversations.value = conversationData || [];
  } catch (error) {
    console.error("Erro ao carregar contexto de chat:", error);
  }
};
const getDriverName = (order) => order?.driverName || order?.driver || "";
const unreadMessagesForOrder = (order) => {
  const oid = String(order?.id ?? "").replace(/^#/, "");
  return conversations.value
    .filter((c) => String(c.orderId ?? "").replace(/^#/, "") === oid)
    .reduce((t, c) => t + Number(c.unread || 0), 0);
};
const totalUnreadMessages = computed(() =>
  conversations.value.reduce(
    (total, conversation) => total + Number(conversation.unread || 0),
    0,
  ),
);
const openOrderChat = (order) => {
  selectedOrderForChat.value = order;
  showChatDrawer.value = true;
};
const closeChat = () => {
  showChatDrawer.value = false;
  selectedOrderForChat.value = null;
};
const handleChatUpdated = async () => {
  conversations.value = await chatService.list();
};

const toggleMenu = (id) => {
  openMenuId.value = openMenuId.value === id ? null : id;
};

const canCancelOrder = (order, columnId = "") =>
  !["EM_ROTA", "FINALIZADO", "CANCELADO"].includes(
    String(order?.status || columnId).toUpperCase(),
  );

const cancelOrder = async (order, columnId) => {
  if (!canCancelOrder(order, columnId)) return;

  const confirmed = await confirmAction({
    title: "Cancelar pedido?",
    message: "O pedido será cancelado e permanecerá registrado no histórico.",
    confirmLabel: "Sim, cancelar",
  });
  if (!confirmed) return;

  try {
    await orderService.cancel(order.id);
    await fetchKanban();
    openMenuId.value = null;
  } catch (error) {
    console.error("Erro ao cancelar pedido:", error);
    notify({
      type: "error",
      message: error.response?.data?.message || "Erro ao cancelar pedido.",
    });
  }
};

// Computado para aplicar o filtro nas colunas
const filteredColumns = computed(() => {
  if (!columns.value) return [];
  return columns.value.map((col) => ({
    ...col,
    orders: col.orders.filter((order) =>
      activeOperations.value.includes(normalizeOrderContext(order).operation),
    ),
  }));
});

const toggleOperation = (operation) => {
  const index = activeOperations.value.indexOf(operation);
  if (index > -1) {
    if (activeOperations.value.length > 1)
      activeOperations.value.splice(index, 1);
  } else {
    activeOperations.value.push(operation);
  }
};

const selectedOrders = computed(() => {
  const selected = [];
  filteredColumns.value.forEach((col, colIdx) => {
    col.orders.forEach((order) => {
      if (order.selected) {
        selected.push({ ...order, colIndex: colIdx });
      }
    });
  });
  return selected;
});

// --- Nova funcionalidade: Atribuição de Motoboy ---
const showMotoboyModal = ref(false);
const motoboys = ref([]);
const selectedMotoboyId = ref(null);
const ordersToAssign = ref([]); // Armazena os pedidos que precisam de motoboy atribuído
const pendingAdvanceOrderId = ref(null); // Order ID pendente de advance após atribuir motoboy

const loadDrivers = async () => {
  try {
    motoboys.value = await driverService.getAll();
  } catch (e) {
    console.error("Erro ao carregar entregadores:", e);
  }
};

const openMotoboyModal = (orders) => {
  // Garantir que apenas pedidos que necessitam de entregador abram o modal
  const validOrders = (orders || []).filter((o) => {
    let orderData = o;
    if (!orderData.serviceType && !orderData.type) {
      for (const col of columns.value || []) {
        const found = col.orders?.find((item) => item.id === o.id);
        if (found) {
          orderData = found;
          break;
        }
      }
    }
    return requiresDeliveryDriver(orderData);
  });

  if (validOrders.length === 0) {
    notify({
      type: "info",
      message: "Pedidos de balcão, retirada ou salão não utilizam motoboy.",
    });
    return;
  }

  ordersToAssign.value = validOrders;
  selectedMotoboyId.value = null; // Resetar seleção
  showMotoboyModal.value = true;
};

const closeMotoboyModal = () => {
  showMotoboyModal.value = false;
  ordersToAssign.value = [];
  selectedMotoboyId.value = null;
};

const assignMotoboy = async () => {
  if (!selectedMotoboyId.value) {
    alert("Por favor, selecione um motoboy.");
    return;
  }
  const motoboy = motoboys.value.find((m) => m.id === selectedMotoboyId.value);
  if (!motoboy) {
    alert("Motoboy selecionado inválido.");
    return;
  }

  try {
    await orderService.batchAssignDriver(
      ordersToAssign.value.map((o) => o.id),
      motoboy.id,
      motoboy.name,
    );

    // Se há um pedido pendente de advance, avançar agora
    if (pendingAdvanceOrderId.value) {
      const advanceId = pendingAdvanceOrderId.value;
      pendingAdvanceOrderId.value = null;
      closeMotoboyModal();
      await orderService.advanceStatus(advanceId);
      await fetchKanban();
    } else {
      await fetchKanban();
      closeMotoboyModal();
    }
  } catch (error) {
    console.error("Erro ao atribuir motoboy:", error);
    alert(error.response?.data?.message || "Erro ao atribuir motoboy.");
  }
};

// --- Lógica de Drag and Drop e Sincronização iFood ---
const isDragging = ref(false);
const draggedOrder = ref(null);
const draggedFromColumnIndex = ref(null);

const startDrag = (event, order, colIndex) => {
  if (order.status === "CANCELADO") {
    event.preventDefault();
    return;
  }
  isDragging.value = true;
  draggedOrder.value = order;
  draggedFromColumnIndex.value = colIndex;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", order.id); // Necessário para Firefox
};

const onDrop = async (event, toColIndex) => {
  event.preventDefault();
  isDragging.value = false;

  if (!draggedOrder.value || draggedFromColumnIndex.value === null) return;

  const fromColIndex = draggedFromColumnIndex.value;
  const order = draggedOrder.value;

  // Prevenir mover para a mesma coluna
  if (fromColIndex === toColIndex) {
    draggedOrder.value = null;
    draggedFromColumnIndex.value = null;
    return;
  }

  const toColumn = columns.value[toColIndex];
  if (!toColumn) return;

  // Se estiver tentando mover para EM_ROTA
  if (toColumn.id === "EM_ROTA" || toColumn.id === "rota") {
    if (!requiresDeliveryDriver(order)) {
      alert("Pedidos de balcão, retirada ou salão não vão para rota de entrega.");
      draggedOrder.value = null;
      draggedFromColumnIndex.value = null;
      return;
    }
    if (!order.driverName) {
      pendingAdvanceOrderId.value = order.id;
      openMotoboyModal([{ id: order.id, colIndex: fromColIndex }]);
      draggedOrder.value = null;
      draggedFromColumnIndex.value = null;
      return;
    }
  }

  try {
    await orderService.moveToColumn(order.id, toColumn.id);
    await fetchKanban();
  } catch (error) {
    console.error("Erro ao mover pedido via drag-and-drop:", error);
    alert(error.response?.data?.message || "Não foi possível mover o pedido.");
    await fetchKanban();
  }

  draggedOrder.value = null;
  draggedFromColumnIndex.value = null;
};

const allowDrop = (event) => {
  event.preventDefault();
};

const updateIfoodStatus = (order, fromColumnId, toColumnId) => {
  console.log(
    `Simulando atualização de status iFood para o pedido ${order.id} (externalId: ${order.externalOrderId})`,
  );
  console.log(`De: ${fromColumnId} Para: ${toColumnId}`);

  // Mapeamento de colunas para status da iFood API (simplificado)
  const ifoodStatusMap = {
    preparando: "confirm", // ou startPreparation
    rota: "dispatched",
    entregue: "delivered",
  };

  const targetIfoodStatus = ifoodStatusMap[toColumnId];

  if (!targetIfoodStatus) {
    console.warn(
      `Transição de status para ${toColId} não mapeada para iFood API.`,
    );
    return;
  }

  // Simula a chamada à API do iFood
  // Em um sistema real, você faria um axios.post para seu backend
  // que por sua vez chamaria a iFood Merchant API.
  console.log(
    `Chamando iFood API para ${order.externalOrderId} com status: ${targetIfoodStatus}`,
  );

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

  alert(
    `Simulação: Status iFood do pedido ${order.id} atualizado para "${toColId}"!`,
  );
};



const moveOrder = (orderId, currentColumnIndex) => {
  const rotaColumnIndex = columns.value.findIndex((col) => col.id === "EM_ROTA" || col.id === "rota");
  const finalizadoColumnIndex = columns.value.findIndex(
    (col) => col.id === "FINALIZADO" || col.id === "finalizado",
  );

  if (currentColumnIndex + 1 === rotaColumnIndex) {
    // Movendo para 'Em Rota de Entrega'
    const originalCol = columns.value[currentColumnIndex];
    const order = originalCol.orders.find((o) => o.id === orderId);
    if (order && requiresDeliveryDriver(order)) {
      openMotoboyModal([{ id: order.id, colIndex: currentColumnIndex }]);
    } else if (order) {
      // Se for balcão, retirada ou salão, move diretamente sem motoboy
      const orderIndex = originalCol.orders.findIndex((o) => o.id === orderId);
      if (orderIndex !== -1) {
        const [movedOrder] = originalCol.orders.splice(orderIndex, 1);
        columns.value[currentColumnIndex + 1].orders.unshift(movedOrder);
      }
    }
  } else if (currentColumnIndex < columns.value.length - 1) {
    const originalCol = columns.value[currentColumnIndex];
    const orderIndex = originalCol.orders.findIndex((o) => o.id === orderId);
    if (orderIndex !== -1) {
      const [order] = originalCol.orders.splice(orderIndex, 1);
      const targetColIndex = currentColumnIndex + 1;
      columns.value[targetColIndex].orders.unshift(order);

      // Se moveu para finalizado, disparar solicitação de avaliação
      if (targetColIndex === finalizadoColumnIndex) {
        const driverName = getDriverName(order) || "Não aplicável (Balcão/Retirada)";
        // Simulação do envio de mensagem de avaliação
        setTimeout(() => {
          alert(
            `Mensagem automática enviada via WhatsApp para o cliente ${order.customerName}${order.customerPhone ? ` (${order.customerPhone})` : ""} solicitando avaliação do pedido ${order.id} e do entregador: ${driverName}.`,
          );
        }, 500);
      }
    }
  }
};

const advanceOrder = async (orderId) => {
  // Buscar o pedido nas colunas do kanban para verificar tipo e coluna atual
  let orderData = null;
  let columnId = null;
  for (const col of columns.value) {
    const found = col.orders.find((o) => o.id === orderId);
    if (found) {
      orderData = found;
      columnId = col.id;
      break;
    }
  }

  // Apenas pedidos para entrega a domicílio (com motoboy) em PREPARO abrem o modal
  // Pedidos de balcão, retirada ou salão pulam a rota e vão direto para FINALIZADO
  if (
    orderData &&
    requiresDeliveryDriver(orderData) &&
    columnId === "PREPARO" &&
    !orderData.driverName
  ) {
    pendingAdvanceOrderId.value = orderId;
    openMotoboyModal([{ id: orderId }]);
    return;
  }

  try {
    await orderService.advanceStatus(orderId);
    await fetchKanban();
    openMenuId.value = null;
  } catch (error) {
    console.error("Erro ao avançar pedido:", error);
    if (error.response?.status === 422) {
      alert(
        error.response.data.message ||
          "Erro ao avançar pedido (ação inválida).",
      );
    } else {
      alert("Erro ao avançar status.");
    }
  }
};

const processBatchMove = async (orders, action) => {
  if (action === "avance" || action === "send_to_kitchen") {
    try {
      await orderService.batchMove(
        orders.map((o) => o.id),
        "PREPARO",
      );
      await fetchKanban();
      orders.forEach((o) => (o.selected = false));
    } catch (error) {
      console.error("Erro ao mover em lote:", error);
    }
  } else if (action === "assign_driver") {
    openMotoboyModal(orders);
  }
};

const moveSelectedTo = async (targetColIndex) => {
  const targetCol = columns.value[targetColIndex];
  if (!targetCol) return;

  const isRota = targetCol.id === "EM_ROTA" || targetCol.id === "rota";
  if (isRota) {
    // Movendo para 'Em Rota de Entrega'
    const deliveryOrdersToMove = selectedOrders.value.filter((order) =>
      requiresDeliveryDriver(order),
    );
    const nonDeliveryOrdersToMove = selectedOrders.value.filter(
      (order) => !requiresDeliveryDriver(order),
    );

    if (nonDeliveryOrdersToMove.length > 0 && deliveryOrdersToMove.length === 0) {
      alert(
        "Pedidos de balcão, retirada ou salão não podem ser enviados para a rota de entrega.",
      );
      return;
    }

    if (deliveryOrdersToMove.length > 0) {
      if (nonDeliveryOrdersToMove.length > 0) {
        alert(
          "Apenas pedidos para entrega a domicílio serão enviados para a rota. Pedidos de retirada/balcão foram ignorados.",
        );
      }
      openMotoboyModal(deliveryOrdersToMove);
    } else {
      alert('Nenhum pedido selecionado para mover para "Em Rota de Entrega".');
    }
  } else {
    // Mover para outras colunas no backend
    try {
      await orderService.batchMove(
        selectedOrders.value.map((o) => o.id),
        targetCol.id,
      );
      await fetchKanban();
      selectedOrders.value.forEach((o) => (o.selected = false));
    } catch (err) {
      console.error("Erro ao mover em lote:", err);
      alert(err.response?.data?.message || "Erro ao mover pedidos em lote.");
    }
  }
};

const toggleAllInColumn = (colIndex, value) => {
  filteredColumns.value[colIndex].orders.forEach((o) => (o.selected = value));
};

const goToNewOrder = () => {
  router.push({ name: "novo-pedido" });
};

const printReceipt = (orderId) => {
  alert(`Imprimindo cupom do pedido #${orderId}`);
  openMenuId.value = null;
};

const emitNfe = async (orderId) => {
  try {
    await orderService.emitNfe(orderId);
    alert(`NF-e emitida com sucesso para o pedido #${orderId}!`);
    await fetchKanban();
  } catch (error) {
    console.error("Erro ao emitir NF-e:", error);
    alert("Erro ao emitir NF-e");
  }
  openMenuId.value = null;
};

const editOrder = (orderId) => {
  openMenuId.value = null;
  router.push({ name: "editar-pedido", params: { id: orderId } });
};

const emitirNFe = (order) => {
  openMenuId.value = null;
  alert(`NF-e do pedido ${order.id} emitida com sucesso! (Simulado)`);
};
</script>

<template>
  <div class="space-y-6" @click="openMenuId = null">
    <!-- Header e Filtros -->
    <div class="flex flex-col gap-6">
      <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4">
          <div>
            <h1 class="text-2xl font-black text-slate-800 tracking-tight">
              Painel de Pedidos
            </h1>
            <p class="text-slate-500 text-sm font-medium">
              Controle de produção e logística
            </p>
          </div>
          <div
            v-if="currentSession"
            class="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-bold"
            title="Caixa aberto — exibindo pedidos do turno atual"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Caixa Aberto</span>
          </div>
          <div
            v-else
            class="flex items-center gap-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-bold"
            title="Caixa encerrado — o kanban fica limpo até a abertura do próximo turno"
          >
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Caixa Fechado</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            class="bg-white border border-slate-200 p-1 rounded-2xl flex gap-1 shadow-sm"
          >
            <button
              @click="toggleOperation(OPERATIONS.SALAO)"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2',
                activeOperations.includes(OPERATIONS.SALAO)
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300',
              ]"
            >
              <Store :size="16" />
              Salão
            </button>

            <button
              @click="toggleOperation(OPERATIONS.DELIVERY)"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2',
                activeOperations.includes(OPERATIONS.DELIVERY)
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300',
              ]"
            >
              <Bike :size="16" />
              Delivery
            </button>
          </div>
          <BaseButton variant="primary" size="md" @click="goToNewOrder"
            >Novo Pedido</BaseButton
          >
        </div>
      </div>

      <!-- Barra de Ações em Massa -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform -translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
      >
        <div
          v-if="selectedOrders.length > 0"
          class="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3">
            <div class="bg-orange-500 p-2 rounded-lg">
              <ArrowRightLeft :size="20" />
            </div>
            <span class="font-bold"
              >{{ selectedOrders.length }} pedidos selecionados</span
            >
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="(col, idx) in columns"
              :key="col.id"
              @click="moveSelectedTo(idx)"
              class="px-3 py-1.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-lg text-[10px] font-black uppercase transition-all"
            >
              {{ col.title }}
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Kanban Board -->
    <div
      class="flex gap-6 overflow-x-auto pb-6 custom-scrollbar min-h-[calc(100vh-250px)]"
    >
      <div
        v-for="(column, colIndex) in filteredColumns"
        :key="column.id"
        class="flex-shrink-0 w-80 max-w-[20rem] flex flex-col gap-4"
      >
        <!-- Header da Coluna -->
        <div class="flex items-center justify-between px-2">
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              class="w-4 h-4 rounded border-slate-300 text-orange-600"
              :checked="
                column.orders.length > 0 &&
                column.orders.every((o) => o.selected)
              "
              @change="toggleAllInColumn(colIndex, $event.target.checked)"
            />
            <div :class="['p-2 rounded-lg', column.bg, column.color]">
              <component :is="column.icon" :size="18" />
            </div>
            <h3
              :class="[
                'font-black text-[10px] uppercase tracking-widest',
                column.color,
              ]"
            >
              {{ column.title }}
            </h3>
          </div>
          <span
            class="bg-white border border-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm"
            >{{ column.orders.length }}</span
          >
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
              class="w-full min-w-0 border p-3 rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-visible flex flex-col gap-2 break-words"
              :class="[
                order.status === 'CANCELADO'
                  ? 'bg-rose-50/40 border-rose-300'
                  : (order.status === 'FINALIZADO'
                      ? 'bg-emerald-50/20 border-emerald-200'
                      : column.bg),
                order.selected
                  ? 'ring-2 ring-orange-500/5'
                  : (order.status === 'CANCELADO'
                      ? 'border-rose-300'
                      : (order.status === 'FINALIZADO'
                          ? 'border-emerald-200'
                          : 'border-slate-200')),
              ]"
              :draggable="order.status !== 'CANCELADO'"
              @dragstart="startDrag($event, order, colIndex)"
            >
              <!-- Top Row: Checkbox, ID, Time, Menu -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <input
                    v-model="order.selected"
                    type="checkbox"
                    class="w-4 h-4 rounded border-slate-300 text-orange-600 transition-all cursor-pointer"
                  />
                  <span
                    :class="[
                      'text-xs font-black tracking-tight',
                      order.status === 'CANCELADO'
                        ? 'text-rose-600 line-through'
                        : (order.status === 'FINALIZADO' ? 'text-emerald-700' : column.color),
                    ]"
                    >{{ order.displayId || order.id }}</span
                  >
                </div>

                <div class="flex items-center gap-2">
                  <div
                    class="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg"
                  >
                    <Timer :size="10" /> {{ formatTime(order.createdAt) }}
                  </div>

                  <div class="relative">
                    <button
                      @click.stop="toggleMenu(order.id)"
                      class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                    >
                      <MoreVertical :size="14" />
                    </button>
                    <!-- Dropdown Menu -->
                    <transition
                      enter-active-class="transition duration-100 ease-out"
                      enter-from-class="transform scale-95 opacity-0"
                      enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-75 ease-in"
                      leave-from-class="transform scale-100 opacity-100"
                      leave-to-class="transform scale-95 opacity-0"
                    >
                      <div
                        v-if="openMenuId === order.id"
                        class="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1"
                      >
                        <button
                          @click.stop="openOrderDetails(order)"
                          class="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Eye :size="14" class="text-orange-500" /> Detalhes do pedido
                        </button>
                        <button
                          @click.stop="openPrintModal(order)"
                          class="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Printer :size="14" class="text-orange-500" /> Imprimir comanda
                        </button>
                        <button
                          v-if="['ANALISE', 'PREPARO'].includes(order.status)"
                          @click.stop="editOrder(order.id)"
                          class="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Edit :size="14" class="text-blue-500" /> Editar
                        </button>
                        <button
                          v-if="order.status !== 'CANCELADO'"
                          @click.stop="emitirNFe(order)"
                          class="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <FileText :size="14" class="text-emerald-500" />
                          Emitir NF-e
                        </button>
                        <button
                          v-if="colIndex < filteredColumns.length - 1 && order.status !== 'CANCELADO'"
                          @click="advanceOrder(order.id)"
                          class="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <ChevronRight :size="16" />
                          Avançar Status
                        </button>
                        <button
                          v-if="order.status !== 'CANCELADO'"
                          @click="cancelOrder(order, column.id)"
                          :disabled="!canCancelOrder(order, column.id)"
                          :title="
                            canCancelOrder(order, column.id)
                              ? 'Cancelar pedido'
                              : 'Pedidos em rota ou finalizados não podem ser cancelados'
                          "
                          :class="[
                            'w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors',
                            canCancelOrder(order, column.id)
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-slate-300 cursor-not-allowed bg-slate-50',
                          ]"
                        >
                          <Trash2 :size="14" /> Cancelar pedido
                        </button>
                      </div>
                    </transition>
                  </div>
                </div>
              </div>

              <!-- Customer & Driver -->
              <div>
                <h4 class="font-bold text-slate-800 text-xs truncate">
                  {{ order.customerName || "Cliente Avulso" }}
                </h4>
                <div class="flex flex-wrap gap-1 mt-1">
                  <!-- Badges de Status (Concluído Verde / Cancelado Vermelho) -->
                  <div
                    v-if="order.status === 'FINALIZADO'"
                    class="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                  >
                    <CheckCircle2 :size="11" /> Concluído
                  </div>
                  <div
                    v-else-if="order.status === 'CANCELADO'"
                    class="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-300 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                  >
                    <XCircle :size="11" /> Cancelado
                  </div>

                  <div
                    v-if="
                      normalizeOrderContext(order).operation ===
                      OPERATIONS.SALAO
                    "
                    class="px-2 py-1 bg-orange-100 text-orange-600 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                  >
                    <Store :size="10" /> Salão
                  </div>
                  <div
                    v-else
                    class="px-2 py-1 bg-blue-100 text-blue-600 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                  >
                    <Bike :size="10" /> Delivery
                  </div>
                  <div
                    v-if="
                      normalizeOrderContext(order).operation ===
                        OPERATIONS.DELIVERY && getDriverName(order)
                    "
                    class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-wide flex items-center gap-1"
                    :title="`Entregador: ${getDriverName(order)}`"
                  >
                    <Bike :size="10" /> {{ getDriverName(order) }}
                  </div>
                  <span
                    class="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase"
                    >{{
                      contextLabel(normalizeOrderContext(order).channel)
                    }}</span
                  >
                  <span
                    class="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase"
                    >{{
                      contextLabel(normalizeOrderContext(order).serviceType)
                    }}</span
                  >
                </div>
              </div>

              <!-- Items (com quebra de linha por item) -->
              <div
                class="text-[11px] text-slate-600 font-medium leading-snug space-y-1 break-words overflow-hidden"
              >
                <div
                  v-for="(item, idx) in getOrderItems(order.itemsSummary)"
                  :key="idx"
                  class="break-words"
                >
                  <span class="text-slate-400 mr-1">•</span>{{ item }}
                </div>
              </div>

              <!-- Footer: Total & Action -->
              <div
                class="flex items-center justify-between mt-1 pt-2 border-t border-slate-50"
              >
                <span class="text-xs font-black text-orange-600"
                  >R$ {{ (order.totalValue || 0).toFixed(2) }}</span
                >

                <div class="flex items-center gap-1.5">
                  <button
                    @click.stop="openOrderChat(order)"
                    class="relative px-2 py-1 bg-white hover:bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 border border-blue-200 hover:border-blue-300"
                    title="Abrir chats deste pedido"
                  >
                    <MessageSquare :size="12" /> Chat
                    <span
                      v-if="unreadMessagesForOrder(order) > 0"
                      class="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center shadow-sm"
                      >{{ unreadMessagesForOrder(order) }}</span
                    >
                  </button>
                  <button
                    v-if="colIndex < filteredColumns.length - 1 && order.status !== 'CANCELADO'"
                    @click="advanceOrder(order.id)"
                    class="px-2 py-1 bg-slate-50 hover:bg-orange-50 text-slate-500 hover:text-orange-600 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border border-slate-200 hover:border-orange-200"
                  >
                    Avançar <ChevronRight :size="12" />
                  </button>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>

    <!-- Motoboy Assignment Modal -->
    <div
      v-if="showMotoboyModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md">
        <h3 class="text-xl font-bold text-slate-800 mb-4">Atribuir Motoboy</h3>
        <p class="mb-4 text-slate-600">
          Selecione o motoboy para
          {{
            ordersToAssign.length > 1 ? "os pedidos selecionados" : "o pedido"
          }}:
        </p>

        <div class="space-y-3 mb-6">
          <label
            v-for="motoboy in motoboys"
            :key="motoboy.id"
            class="flex items-center p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <input
              type="radio"
              :value="motoboy.id"
              v-model="selectedMotoboyId"
              class="form-radio text-orange-600"
            />
            <span class="ml-3 text-slate-700 font-medium">{{
              motoboy.name
            }}</span>
          </label>
        </div>

        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="closeMotoboyModal"
            >Cancelar</BaseButton
          >
          <BaseButton variant="primary" @click="assignMotoboy"
            >Confirmar</BaseButton
          >
        </div>
      </div>
    </div>

    <!-- Chat integrado ao pedido -->
    <ChatDrawer
      :show="showChatDrawer"
      :order="selectedOrderForChat"
      :integrations="integrations"
      @close="closeChat"
      @updated="handleChatUpdated"
    />

    <button
      @click="showGeneralChat = true"
      class="fixed right-5 bottom-5 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-xl shadow-orange-500/30 hover:scale-105 transition-transform flex items-center justify-center"
      title="Abrir central de conversas"
      aria-label="Abrir central de conversas"
    >
      <MessageSquare :size="24" />
      <span
        v-if="totalUnreadMessages > 0"
        class="absolute -top-1 -right-1 min-w-6 h-6 px-1 rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-black flex items-center justify-center"
      >{{ totalUnreadMessages }}</span>
    </button>

    <GeneralChatDrawer
      :show="showGeneralChat"
      @close="showGeneralChat = false"
      @updated="handleChatUpdated"
    />

    <OrderDetailsModal
      :show="showOrderDetails"
      :order="selectedOrderDetails"
      :loading="loadingOrderDetails"
      @close="closeOrderDetails"
    />

    <PrintOrderModal
      :show="showPrintModal"
      :order="orderToPrint"
      @close="showPrintModal = false"
    />
  </div>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.list-leave-active {
  position: absolute;
  width: 100%;
}
.custom-scrollbar::-webkit-scrollbar {
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-slate-100 rounded-full;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-slate-300 rounded-full hover:bg-slate-400;
}
</style>
