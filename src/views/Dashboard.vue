<script setup>
import { ref, computed, watch, onMounted } from "vue";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bike,
  Calendar,
  X,
  Search,
  Package,
  MapPin,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-vue-next";
import { financialService } from "@/services/financialService";
import { orderService } from "@/services/orderService";

const loading = ref(true);
const dashboardData = ref({
  stats: [],
  recentOrders: [],
  deliveryTeam: [],
  lastUpdatedAt: new Date(),
});

// Filtro de período do Dashboard
const selectedPeriod = ref("daily"); // 'daily', 'weekly', 'monthly', 'custom'
const dailyDate = ref(new Date().toISOString().split("T")[0]);
const customStartDate = ref(new Date().toISOString().split("T")[0]);
const customEndDate = ref(new Date().toISOString().split("T")[0]);

const periods = [
  { value: "daily", label: "Dia" },
  { value: "weekly", label: "Semana" },
  { value: "monthly", label: "Mês" },
  { value: "custom", label: "Personalizado" },
];

const setPeriod = (p) => {
  selectedPeriod.value = p;
  fetchDashboard();
};

// Modal de histórico de pedidos
const showHistoryModal = ref(false);
const historyDate = ref(new Date().toISOString().split("T")[0]);
const historyOrders = ref([]);
const loadingHistory = ref(false);
const historySearch = ref("");
const expandedOrderIds = ref({});

const statStyles = [
  { icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { icon: ShoppingBag, color: "text-orange-600", bg: "bg-orange-50" },
  { icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
];

const fetchDashboard = async () => {
  try {
    loading.value = true;
    let start = null;
    let end = null;
    if (selectedPeriod.value === "daily") {
      start = dailyDate.value;
      end = dailyDate.value;
    } else if (selectedPeriod.value === "custom") {
      start = customStartDate.value;
      end = customEndDate.value;
    }

    const data = await financialService.getDashboard(selectedPeriod.value, start, end);
    // Map stats with styles
    if (data.stats) {
      data.stats = data.stats.map((s, index) => {
        const style = statStyles[index % statStyles.length];
        return {
          ...s,
          value: s.formattedValue,
          change: s.changePercentage,
          icon: style.icon,
          bg: style.bg,
          color: style.color,
        };
      });
    }
    dashboardData.value = data;
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error);
  } finally {
    loading.value = false;
  }
};

watch([dailyDate, customStartDate, customEndDate], () => {
  fetchDashboard();
});

const openOrderHistoryModal = async () => {
  showHistoryModal.value = true;
  await fetchHistoryOrders();
};

const closeOrderHistoryModal = () => {
  showHistoryModal.value = false;
};

const fetchHistoryOrders = async () => {
  try {
    loadingHistory.value = true;
    const data = await orderService.getHistory(historyDate.value);
    historyOrders.value = data || [];
  } catch (error) {
    console.error("Erro ao buscar histórico de pedidos:", error);
    historyOrders.value = [];
  } finally {
    loadingHistory.value = false;
  }
};

const toggleOrderExpand = (id) => {
  expandedOrderIds.value[id] = !expandedOrderIds.value[id];
};

const filteredHistoryOrders = computed(() => {
  if (!historySearch.value.trim()) return historyOrders.value;
  const q = historySearch.value.toLowerCase().trim();
  return historyOrders.value.filter((o) => {
    const displayIdMatch = String(o.displayId || "").toLowerCase().includes(q);
    const customerMatch = String(o.customerName || "").toLowerCase().includes(q);
    const phoneMatch = String(o.customerPhone || "").toLowerCase().includes(q);
    return displayIdMatch || customerMatch || phoneMatch;
  });
});

const historyKpis = computed(() => {
  const total = historyOrders.value.length;
  const completed = historyOrders.value.filter((o) => o.status === "FINALIZADO").length;
  const canceled = historyOrders.value.filter((o) => o.status === "CANCELADO").length;
  const inProgress = total - completed - canceled;
  const revenue = historyOrders.value
    .filter((o) => o.status !== "CANCELADO")
    .reduce((sum, o) => sum + (Number(o.totalValue) || 0), 0);

  return { total, completed, canceled, inProgress, revenue };
});

const getStatusBadge = (status) => {
  switch (status) {
    case "FINALIZADO":
      return { label: "Concluído", class: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "CANCELADO":
      return { label: "Cancelado", class: "bg-rose-50 text-rose-700 border-rose-200" };
    case "EM_ROTA":
      return { label: "Em Rota", class: "bg-blue-50 text-blue-700 border-blue-200" };
    case "PREPARO":
      return { label: "Em Preparo", class: "bg-amber-50 text-amber-700 border-amber-200" };
    case "ANALISE":
      return { label: "Pendente", class: "bg-purple-50 text-purple-700 border-purple-200" };
    default:
      return { label: status, class: "bg-slate-50 text-slate-700 border-slate-200" };
  }
};

onMounted(() => {
  fetchDashboard();
});
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header com Filtros de Período -->
    <div
      class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">
          Painel Administrativo 👋
        </h1>
        <p class="text-slate-500 text-sm font-medium">
          Resumo operacional da sua lanchonete por período.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Date Picker para Dia Específico -->
        <div
          v-if="selectedPeriod === 'daily'"
          class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
        >
          <Calendar :size="16" class="text-slate-400" />
          <input
            type="date"
            v-model="dailyDate"
            class="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
            title="Selecionar Dia"
          />
        </div>

        <!-- Date Range Pickers para Período Personalizado -->
        <div
          v-if="selectedPeriod === 'custom'"
          class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
        >
          <Calendar :size="16" class="text-slate-400" />
          <input
            type="date"
            v-model="customStartDate"
            class="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
            title="Data Inicial"
          />
          <span class="text-xs text-slate-400 font-bold">até</span>
          <input
            type="date"
            v-model="customEndDate"
            class="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
            title="Data Final"
          />
        </div>

        <!-- Seletor de Período -->
        <div class="flex bg-slate-100 p-1 rounded-xl">
          <button
            v-for="p in periods"
            :key="p.value"
            @click="setPeriod(p.value)"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
              selectedPeriod === p.value
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ]"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Última atualização -->
        <div
          class="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm"
        >
          <Clock :size="14" />
          {{ new Date(dashboardData.lastUpdatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }}
        </div>
      </div>
    </div>

    <!-- Cards de Estatísticas (Versão Light) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="stat in dashboardData.stats"
        :key="stat.name"
        class="bg-white border border-slate-200 p-6 rounded-3xl hover:border-orange-200 transition-all shadow-sm group flex flex-col justify-between"
      >
        <div class="flex items-center justify-between">
          <div
            :class="[
              'inline-flex items-center justify-center w-12 h-12 rounded-2xl transition-colors',
              stat.bg,
              stat.color,
            ]"
          >
            <component :is="stat.icon" :size="24" />
          </div>
          <span
            v-if="stat.change"
            :class="[
              'inline-flex items-center text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider',
              stat.change.startsWith('+')
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600',
            ]"
          >
            {{ stat.change }}
            <ArrowUpRight
              v-if="stat.change.startsWith('+')"
              :size="12"
              class="ml-1"
            />
            <ArrowDownRight v-else :size="12" class="ml-1" />
          </span>
        </div>
        <div class="mt-4">
          <p
            class="text-slate-400 text-xs font-black uppercase tracking-widest"
          >
            {{ stat.name }}
          </p>
          <h3 class="text-2xl font-black text-slate-800 mt-1 truncate">
            {{ stat.value }}
          </h3>
        </div>
      </div>
    </div>

    <!-- Seções de Detalhes -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Pedidos Recentes -->
      <div
        class="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
      >
        <div
          class="p-6 border-b border-slate-50 flex items-center justify-between"
        >
          <div>
            <h3 class="font-black text-slate-800 tracking-tight">
              Pedidos Recentes
            </h3>
            <p class="text-xs text-slate-400 font-medium">
              Últimos pedidos que entraram no sistema
            </p>
          </div>
          <button
            type="button"
            @click="openOrderHistoryModal"
            class="text-orange-600 text-sm font-bold hover:text-orange-700 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-xl hover:bg-orange-50"
          >
            Ver pedidos <ChevronRight :size="16" />
          </button>
        </div>

        <div class="divide-y divide-slate-50">
          <div
            v-for="order in dashboardData.recentOrders"
            :key="order.displayId"
            class="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors font-mono"
              >
                #{{ order.displayId }}
              </div>
              <div>
                <h4 class="font-bold text-slate-800">
                  {{ order.customerName }}
                </h4>
                <p
                  class="text-xs text-slate-400 font-medium mt-0.5 truncate max-w-[200px]"
                >
                  {{ order.itemsSummary }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <div class="font-black text-slate-800">
                {{
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(order.totalValue)
                }}
              </div>
              <span
                class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                >{{ order.status }}</span
              >
            </div>
          </div>

          <div
            v-if="!dashboardData.recentOrders || dashboardData.recentOrders.length === 0"
            class="p-8 text-center text-slate-400 text-sm"
          >
            Nenhum pedido recente registrado hoje.
          </div>
        </div>
      </div>

      <!-- Equipe de Entrega -->
      <div
        class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
      >
        <div class="p-6 border-b border-slate-50">
          <h3
            class="font-black text-slate-800 tracking-tight flex items-center gap-2"
          >
            <Bike :size="18" class="text-orange-600" /> Equipe de Entrega
          </h3>
          <p class="text-xs text-slate-400 font-medium mt-1">
            Status dos motoboys agora
          </p>
        </div>
        <div class="p-4 space-y-3">
          <div
            v-for="driver in dashboardData.deliveryTeam"
            :key="driver.id"
            class="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs"
              >
                {{ driver.name.charAt(0) }}
              </div>
              <span class="font-bold text-slate-700 text-sm">{{
                driver.name
              }}</span>
            </div>
            <span
              :class="[
                'w-2.5 h-2.5 rounded-full',
                driver.status === 'ATIVO'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  : driver.status === 'EM_ROTA'
                    ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                    : 'bg-slate-300',
              ]"
            ></span>
          </div>
          <div
            v-if="!dashboardData.deliveryTeam || dashboardData.deliveryTeam.length === 0"
            class="p-4 text-center text-slate-400 text-xs"
          >
            Nenhum entregador cadastrado.
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE HISTÓRICO DE PEDIDOS -->
    <div
      v-if="showHistoryModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
      @click.self="closeOrderHistoryModal"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- Header do Modal -->
        <div class="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div class="flex items-center gap-2">
              <div class="p-2 bg-orange-100 text-orange-600 rounded-xl">
                <Package :size="20" />
              </div>
              <div>
                <h2 class="text-xl font-black text-slate-800 tracking-tight">
                  Histórico de Pedidos
                </h2>
                <p class="text-xs text-slate-500 font-medium">
                  Consulte os detalhes de todos os pedidos realizados por data
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Seletor de Data -->
            <div class="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
              <Calendar :size="16" class="text-slate-400" />
              <input
                type="date"
                v-model="historyDate"
                @change="fetchHistoryOrders"
                class="text-sm font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            <!-- Botão Fechar -->
            <button
              type="button"
              @click="closeOrderHistoryModal"
              class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              <X :size="20" />
            </button>
          </div>
        </div>

        <!-- KPIs Resumo do Dia Selecionado -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 border-b border-slate-100 bg-white">
          <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Pedidos</span>
            <div class="text-lg font-black text-slate-800 mt-0.5">{{ historyKpis.total }}</div>
          </div>
          <div class="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
            <span class="text-[10px] font-black uppercase tracking-wider text-emerald-600">Faturamento</span>
            <div class="text-lg font-black text-emerald-700 mt-0.5">
              {{
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(historyKpis.revenue)
              }}
            </div>
          </div>
          <div class="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
            <span class="text-[10px] font-black uppercase tracking-wider text-blue-600">Concluídos</span>
            <div class="text-lg font-black text-blue-700 mt-0.5">{{ historyKpis.completed }}</div>
          </div>
          <div class="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100">
            <span class="text-[10px] font-black uppercase tracking-wider text-rose-600">Cancelados</span>
            <div class="text-lg font-black text-rose-700 mt-0.5">{{ historyKpis.canceled }}</div>
          </div>
        </div>

        <!-- Barra de Busca -->
        <div class="px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
          <div class="relative flex-1">
            <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              v-model="historySearch"
              placeholder="Buscar por número (#1001) ou nome do cliente..."
              class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <!-- Conteúdo / Lista de Pedidos -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <div v-if="loadingHistory" class="py-12 text-center text-slate-400 font-medium text-sm">
            Carregando pedidos da data selecionada...
          </div>

          <div v-else-if="filteredHistoryOrders.length === 0" class="py-12 text-center space-y-2">
            <Package :size="36" class="mx-auto text-slate-300" />
            <p class="text-slate-500 font-bold text-sm">Nenhum pedido encontrado para esta data</p>
            <p class="text-slate-400 text-xs">Selecione outro dia no calendário acima para visualizar o histórico.</p>
          </div>

          <div
            v-else
            v-for="ord in filteredHistoryOrders"
            :key="ord.id"
            class="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-orange-200 shadow-sm transition-all"
          >
            <!-- Card Header -->
            <div
              class="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60 transition-colors"
              @click="toggleOrderExpand(ord.id)"
            >
              <div class="flex items-center gap-3">
                <div class="px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl font-mono font-black text-sm">
                  #{{ ord.displayId || '—' }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-slate-800 text-sm">
                      {{ ord.customerName || 'Cliente Balcão' }}
                    </h4>
                    <span
                      :class="[
                        'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
                        getStatusBadge(ord.status).class
                      ]"
                    >
                      {{ getStatusBadge(ord.status).label }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span v-if="ord.createdAt" class="flex items-center gap-1">
                      <Clock :size="12" />
                      {{ new Date(ord.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }}
                    </span>
                    <span v-if="ord.type" class="uppercase font-semibold">
                      • {{ ord.type }}
                    </span>
                    <span v-if="ord.driverName" class="flex items-center gap-1 text-slate-500 font-semibold">
                      <Bike :size="12" class="text-orange-500" /> {{ ord.driverName }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                <div class="text-right">
                  <div class="text-xs text-slate-400 font-medium flex items-center gap-1 justify-end">
                    <CreditCard :size="12" /> {{ ord.paymentMethod || 'A Definir' }}
                  </div>
                  <div class="text-sm font-black text-slate-800">
                    {{
                      new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(ord.totalValue || 0)
                    }}
                  </div>
                </div>

                <button
                  type="button"
                  @click.stop="toggleOrderExpand(ord.id)"
                  class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-xs font-bold inline-flex items-center gap-1"
                >
                  <span v-if="expandedOrderIds[ord.id]" class="flex items-center gap-1">
                    Recolher <ChevronUp :size="14" />
                  </span>
                  <span v-else class="flex items-center gap-1">
                    Detalhes <ChevronDown :size="14" />
                  </span>
                </button>
              </div>
            </div>

            <!-- Card Body / Itens e Detalhes do Pedido -->
            <div
              v-if="expandedOrderIds[ord.id]"
              class="border-t border-slate-100 bg-slate-50/70 p-4 space-y-3 text-xs"
            >
              <!-- Informações de Entrega / Contato -->
              <div v-if="ord.customerAddress || ord.customerPhone" class="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-white rounded-xl border border-slate-200/80">
                <div v-if="ord.customerAddress" class="flex items-start gap-1.5 text-slate-600">
                  <MapPin :size="14" class="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span class="font-bold text-slate-700">Endereço: </span>
                    <span>{{ ord.customerAddress }}</span>
                    <span v-if="ord.customerAddressComplement" class="text-slate-400 text-[11px]"> ({{ ord.customerAddressComplement }})</span>
                  </div>
                </div>
                <div v-if="ord.customerPhone" class="text-slate-600 flex items-center gap-1.5">
                  <span class="font-bold text-slate-700">Telefone: </span>
                  <span>{{ ord.customerPhone }}</span>
                </div>
              </div>

              <!-- Lista de Itens -->
              <div class="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                <div class="p-3 bg-slate-100/70 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  Itens do Pedido ({{ ord.items ? ord.items.length : 0 }})
                </div>
                <div class="divide-y divide-slate-100">
                  <div
                    v-for="item in ord.items"
                    :key="item.id"
                    class="p-3 hover:bg-slate-50 transition-colors flex flex-col gap-1"
                  >
                    <div class="flex items-center justify-between font-bold text-slate-800">
                      <span>{{ item.quantity }}x {{ item.productName }}</span>
                      <span>
                        {{
                          new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.totalPrice || item.unitPrice || 0)
                        }}
                      </span>
                    </div>

                    <!-- Modificadores / Adicionais -->
                    <div
                      v-if="item.modifiers && item.modifiers.length > 0"
                      class="text-[11px] text-emerald-700 pl-4 space-y-0.5"
                    >
                      <div v-for="mod in item.modifiers" :key="mod.id || mod.name" class="flex items-center justify-between">
                        <span>+ {{ mod.name }}</span>
                        <span v-if="mod.additionalPrice && Number(mod.additionalPrice) > 0">
                          {{
                            new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(mod.additionalPrice)
                          }}
                        </span>
                      </div>
                    </div>

                    <!-- Remoções -->
                    <div
                      v-if="item.removals && item.removals.length > 0"
                      class="text-[11px] text-rose-600 pl-4 space-y-0.5"
                    >
                      <div v-for="rem in item.removals" :key="rem.id || rem.ingredientName">
                        - Sem {{ rem.ingredientName }}
                      </div>
                    </div>

                    <!-- Observação do Item -->
                    <div v-if="item.notes" class="text-[11px] text-slate-500 italic pl-4">
                      Obs: {{ item.notes }}
                    </div>
                  </div>

                  <div v-if="!ord.items || ord.items.length === 0" class="p-3 text-center text-slate-400 text-xs">
                    Nenhum item discriminado no pedido.
                  </div>
                </div>
              </div>

              <!-- Observação Geral do Pedido -->
              <div v-if="ord.notes" class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                <span class="font-bold">Observações do pedido: </span>{{ ord.notes }}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer do Modal -->
        <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            @click="closeOrderHistoryModal"
            class="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-900 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
