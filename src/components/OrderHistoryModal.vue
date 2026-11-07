<script setup>
import { ref, computed, watch } from "vue";
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Bike,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ReceiptText,
} from "lucide-vue-next";
import { orderService } from "@/services/orderService";

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(["close"]);

const todayStr = new Date().toISOString().split("T")[0];
const selectedDate = ref(todayStr);
const loading = ref(false);
const orders = ref([]);
const searchTerm = ref("");
const statusFilter = ref("ALL"); // ALL, FINALIZADO, CANCELADO, ANDAMENTO
const expandedOrderId = ref(null);

const fetchOrders = async () => {
  if (!props.show) return;
  try {
    loading.value = true;
    const data = await orderService.getHistory(selectedDate.value);
    orders.value = data || [];
  } catch (error) {
    console.error("Erro ao carregar histórico de pedidos:", error);
    orders.value = [];
  } finally {
    loading.value = false;
  }
};

const changeDate = (days) => {
  const current = new Date(selectedDate.value + "T12:00:00");
  current.setDate(current.getDate() + days);
  selectedDate.value = current.toISOString().split("T")[0];
};

const goToToday = () => {
  selectedDate.value = todayStr;
};

const toggleOrderExpand = (orderId) => {
  expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId;
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val || 0);
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

// KPIs do dia
const stats = computed(() => {
  const totalCount = orders.value.length;
  const completedCount = orders.value.filter(
    (o) => o.status === "FINALIZADO"
  ).length;
  const canceledCount = orders.value.filter(
    (o) => o.status === "CANCELADO"
  ).length;
  const totalRevenue = orders.value
    .filter((o) => o.status === "FINALIZADO")
    .reduce((sum, o) => sum + (Number(o.totalValue) || 0), 0);

  return {
    totalCount,
    completedCount,
    canceledCount,
    totalRevenue,
  };
});

// Pedidos filtrados por busca e status
const filteredOrders = computed(() => {
  return orders.value.filter((order) => {
    // Filtro por status
    if (statusFilter.value === "FINALIZADO" && order.status !== "FINALIZADO")
      return false;
    if (statusFilter.value === "CANCELADO" && order.status !== "CANCELADO")
      return false;
    if (
      statusFilter.value === "ANDAMENTO" &&
      (order.status === "FINALIZADO" || order.status === "CANCELADO")
    )
      return false;

    // Filtro por texto
    if (!searchTerm.value.trim()) return true;
    const term = searchTerm.value.toLowerCase();
    const displayIdMatch = String(order.displayId || "").toLowerCase().includes(term);
    const customerMatch = (order.customerName || "").toLowerCase().includes(term);
    const addressMatch = (order.customerAddress || "").toLowerCase().includes(term);

    return displayIdMatch || customerMatch || addressMatch;
  });
});

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      fetchOrders();
    }
  }
);

watch(selectedDate, () => {
  fetchOrders();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Container do Modal -->
      <div
        class="relative bg-white w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
      >
        <!-- Header -->
        <header
          class="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shrink-0"
        >
          <div>
            <div class="flex items-center gap-2">
              <span
                class="p-2 bg-orange-50 text-orange-600 rounded-xl inline-block"
              >
                <ShoppingBag :size="20" />
              </span>
              <h2 class="text-xl font-black text-slate-800 tracking-tight">
                Histórico de Pedidos
              </h2>
            </div>
            <p class="text-xs text-slate-400 font-medium mt-1">
              Consulte os detalhes dos pedidos realizados por data
            </p>
          </div>

          <!-- Navegação de Data -->
          <div class="flex items-center gap-2">
            <button
              @click="changeDate(-1)"
              class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Dia anterior"
            >
              <ChevronLeft :size="18" />
            </button>

            <div
              class="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs"
            >
              <Calendar :size="16" class="text-slate-400" />
              <input
                type="date"
                v-model="selectedDate"
                class="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
              />
            </div>

            <button
              @click="changeDate(1)"
              class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Próximo dia"
            >
              <ChevronRight :size="18" />
            </button>

            <button
              v-if="selectedDate !== todayStr"
              @click="goToToday"
              class="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-100 transition"
            >
              Hoje
            </button>

            <button
              @click="$emit('close')"
              class="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition ml-2"
            >
              <X :size="20" />
            </button>
          </div>
        </header>

        <!-- Barra de KPIs do Dia -->
        <div
          class="bg-slate-50/70 border-b border-slate-100 p-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0"
        >
          <div class="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Total Pedidos
            </p>
            <p class="text-lg font-black text-slate-800 mt-0.5">
              {{ stats.totalCount }}
            </p>
          </div>

          <div class="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Faturado no Dia
            </p>
            <p class="text-lg font-black text-emerald-600 mt-0.5">
              {{ formatCurrency(stats.totalRevenue) }}
            </p>
          </div>

          <div class="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Concluídos
            </p>
            <p class="text-lg font-black text-emerald-600 mt-0.5">
              {{ stats.completedCount }}
            </p>
          </div>

          <div class="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Cancelados
            </p>
            <p class="text-lg font-black text-rose-600 mt-0.5">
              {{ stats.canceledCount }}
            </p>
          </div>
        </div>

        <!-- Filtros e Busca -->
        <div
          class="p-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white shrink-0"
        >
          <!-- Status Tabs -->
          <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              @click="statusFilter = 'ALL'"
              :class="[
                'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition',
                statusFilter === 'ALL'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700',
              ]"
            >
              Todos ({{ stats.totalCount }})
            </button>
            <button
              @click="statusFilter = 'FINALIZADO'"
              :class="[
                'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition',
                statusFilter === 'FINALIZADO'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700',
              ]"
            >
              Concluídos ({{ stats.completedCount }})
            </button>
            <button
              @click="statusFilter = 'ANDAMENTO'"
              :class="[
                'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition',
                statusFilter === 'ANDAMENTO'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700',
              ]"
            >
              Em Andamento
            </button>
            <button
              @click="statusFilter = 'CANCELADO'"
              :class="[
                'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition',
                statusFilter === 'CANCELADO'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700',
              ]"
            >
              Cancelados ({{ stats.canceledCount }})
            </button>
          </div>

          <!-- Busca por texto -->
          <div class="relative w-full sm:w-72">
            <Search
              :size="15"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              v-model="searchTerm"
              placeholder="Buscar #número, cliente..."
              class="w-full pl-9 pr-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <!-- Conteúdo: Lista de Pedidos -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div v-if="loading" class="p-12 text-center text-slate-400">
            <p class="text-sm font-medium">Carregando pedidos de {{ formatDateLabel(selectedDate) }}...</p>
          </div>

          <div
            v-else-if="filteredOrders.length === 0"
            class="p-12 text-center text-slate-400 space-y-2"
          >
            <ShoppingBag :size="32" class="mx-auto text-slate-300" />
            <p class="text-sm font-bold text-slate-600">Nenhum pedido encontrado</p>
            <p class="text-xs text-slate-400">
              Não há registros para a data {{ formatDateLabel(selectedDate) }} com os filtros aplicados.
            </p>
          </div>

          <!-- Cards de Pedidos -->
          <div
            v-else
            v-for="order in filteredOrders"
            :key="order.id"
            class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition hover:border-slate-300"
          >
            <!-- Linha Principal do Pedido -->
            <div
              @click="toggleOrderExpand(order.id)"
              class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60 transition"
            >
              <div class="flex items-center gap-3">
                <!-- Badge DisplayId -->
                <div
                  class="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex flex-col items-center justify-center text-orange-600 font-black"
                >
                  <span class="text-[9px] uppercase tracking-tighter">Nº</span>
                  <span class="text-sm leading-tight">{{ order.displayId }}</span>
                </div>

                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-slate-800 text-sm">
                      {{ order.customerName || "Cliente Avulso" }}
                    </h4>
                    <!-- Tipo de pedido -->
                    <span
                      class="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-slate-100 text-slate-600"
                    >
                      {{ order.type }}
                    </span>
                  </div>

                  <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                    <span class="flex items-center gap-1 font-medium">
                      <Clock :size="12" /> {{ formatTime(order.createdAt) }}
                    </span>
                    <span v-if="order.driverName" class="flex items-center gap-1 font-medium text-slate-600">
                      <Bike :size="12" class="text-orange-500" /> {{ order.driverName }}
                    </span>
                    <span v-if="order.customerAddress" class="hidden md:flex items-center gap-1 max-w-xs truncate">
                      <MapPin :size="12" class="shrink-0" /> {{ order.customerAddress }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Status e Valor -->
              <div class="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <!-- Status Badge -->
                <span
                  :class="[
                    'px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider',
                    order.status === 'FINALIZADO'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : order.status === 'CANCELADO'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : order.status === 'EM_ROTA'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200',
                  ]"
                >
                  {{ order.status }}
                </span>

                <!-- Valor e Forma de Pagamento -->
                <div class="text-right">
                  <div class="font-black text-slate-800 text-sm">
                    {{ formatCurrency(order.totalValue) }}
                  </div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {{ order.paymentMethod || "PAGAMENTO" }}
                  </span>
                </div>

                <!-- Botão de Expandir -->
                <button
                  class="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 transition"
                >
                  <ChevronUp v-if="expandedOrderId === order.id" :size="18" />
                  <ChevronDown v-else :size="18" />
                </button>
              </div>
            </div>

            <!-- Detalhes Expandidos do Pedido -->
            <div
              v-if="expandedOrderId === order.id"
              class="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5 space-y-4"
            >
              <!-- Info Complementar -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200/70">
                <div>
                  <span class="text-slate-400 font-medium">Endereço de Entrega:</span>
                  <p class="font-bold text-slate-700 mt-0.5">
                    {{ order.customerAddress || "Retirada no Balcão / Não informado" }}
                  </p>
                  <p v-if="order.customerAddressComplement" class="text-slate-500 text-[11px]">
                    {{ order.customerAddressComplement }}
                  </p>
                </div>

                <div>
                  <span class="text-slate-400 font-medium">Telefone / Contato:</span>
                  <p class="font-bold text-slate-700 mt-0.5">
                    {{ order.customerPhone || "Não informado" }}
                  </p>
                  <p v-if="order.notes" class="text-orange-600 font-medium text-[11px] mt-0.5">
                    Obs: {{ order.notes }}
                  </p>
                </div>
              </div>

              <!-- Itens do Pedido -->
              <div class="space-y-2">
                <h5 class="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ReceiptText :size="14" /> Itens do Pedido ({{ order.items?.length || 0 }})
                </h5>

                <div class="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/70 overflow-hidden">
                  <div
                    v-for="item in order.items"
                    :key="item.id"
                    class="p-3 flex items-start justify-between gap-4 text-xs"
                  >
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[11px]">
                          {{ item.quantity }}x
                        </span>
                        <span class="font-bold text-slate-800">
                          {{ item.productName }}
                        </span>
                      </div>

                      <!-- Modificadores / Adicionais -->
                      <div
                        v-if="item.modifiers && item.modifiers.length > 0"
                        class="mt-1 flex flex-wrap gap-1"
                      >
                        <span
                          v-for="mod in item.modifiers"
                          :key="mod.id"
                          class="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded"
                        >
                          + {{ mod.name }}
                          <span v-if="mod.price > 0">({{ formatCurrency(mod.price) }})</span>
                        </span>
                      </div>

                      <!-- Remoções -->
                      <div
                        v-if="item.removals && item.removals.length > 0"
                        class="mt-1 flex flex-wrap gap-1"
                      >
                        <span
                          v-for="rem in item.removals"
                          :key="rem.id"
                          class="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-semibold rounded"
                        >
                          - Sem {{ rem.ingredientName }}
                        </span>
                      </div>

                      <!-- Observação do Item -->
                      <p v-if="item.notes" class="text-[11px] text-slate-400 italic mt-1">
                        Obs: {{ item.notes }}
                      </p>
                    </div>

                    <div class="text-right shrink-0">
                      <span class="font-bold text-slate-700">
                        {{ formatCurrency(item.totalPrice) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Totais e Taxas -->
              <div class="flex justify-between items-center text-xs font-bold text-slate-500 pt-1">
                <span>Taxa de Entrega: {{ formatCurrency(order.deliveryCost) }}</span>
                <span class="text-sm font-black text-slate-800">
                  Total Geral: {{ formatCurrency(order.totalValue) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer
          class="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0"
        >
          <span class="text-xs text-slate-400 font-medium">
            Mostrando {{ filteredOrders.length }} de {{ orders.length }} pedidos
          </span>
          <button
            @click="$emit('close')"
            class="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
