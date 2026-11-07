<script setup>
import { ref, onMounted, watch, computed } from "vue";
import {
  Bike,
  Calendar,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  CreditCard,
  PackageCheck,
  Search,
} from "lucide-vue-next";
import { settlementService } from "@/services/settlementService";

const period = ref("daily"); // 'daily', 'weekly', 'monthly'
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const loading = ref(true);
const report = ref({ entries: [], grandTotal: 0 });
const expandedDriverId = ref(null);
const searchTerm = ref("");

const periods = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
];

const fetchReport = async () => {
  try {
    loading.value = true;
    const dateParam = period.value === "daily" ? selectedDate.value : null;
    const data = await settlementService.getSettlementReport(
      period.value,
      dateParam
    );
    report.value = data || { entries: [], grandTotal: 0 };
  } catch (error) {
    console.error("Erro ao buscar acerto de entregadores:", error);
  } finally {
    loading.value = false;
  }
};

const setPeriod = (newPeriod) => {
  period.value = newPeriod;
};

const toggleDriverDetails = (driverId) => {
  expandedDriverId.value =
    expandedDriverId.value === driverId ? null : driverId;
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

const totalDeliveriesCount = computed(() => {
  return (
    report.value.entries?.reduce((acc, curr) => acc + (curr.deliveries || 0), 0) ||
    0
  );
});

const filteredEntries = computed(() => {
  if (!searchTerm.value.trim()) return report.value.entries || [];
  const term = searchTerm.value.toLowerCase();
  return (report.value.entries || []).filter(
    (e) =>
      e.driverName?.toLowerCase().includes(term) ||
      e.orders?.some(
        (o) =>
          String(o.displayId).includes(term) ||
          o.customerName?.toLowerCase().includes(term)
      )
  );
});

watch([period, selectedDate], () => {
  fetchReport();
});

onMounted(() => {
  fetchReport();
});
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">
          Acerto de Entregadores 🏍️
        </h1>
        <p class="text-slate-500 text-sm font-medium">
          Relatório integrado com os pedidos entregues e valores devidos.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Date Picker para Período Diário -->
        <div
          v-if="period === 'daily'"
          class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
        >
          <Calendar :size="16" class="text-slate-400" />
          <input
            type="date"
            v-model="selectedDate"
            class="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
          />
        </div>

        <!-- Seletor de Período -->
        <div class="flex bg-slate-100 p-1 rounded-xl">
          <button
            v-for="p in periods"
            :key="p.value"
            @click="setPeriod(p.value)"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-bold transition-all',
              period === p.value
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ]"
          >
            {{ p.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Cards de Resumo Rápido -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div
        class="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between"
      >
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-slate-400">
            Total de Entregas
          </p>
          <h3 class="text-2xl font-black text-slate-800 mt-1">
            {{ totalDeliveriesCount }}
          </h3>
        </div>
        <div class="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <PackageCheck :size="24" />
        </div>
      </div>

      <div
        class="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between"
      >
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-slate-400">
            Motoboys Ativos
          </p>
          <h3 class="text-2xl font-black text-slate-800 mt-1">
            {{ report.entries?.length || 0 }}
          </h3>
        </div>
        <div class="p-3 bg-orange-50 text-orange-600 rounded-xl">
          <Bike :size="24" />
        </div>
      </div>

      <div
        class="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between"
      >
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-slate-400">
            Total a Pagar
          </p>
          <h3 class="text-2xl font-black text-emerald-600 mt-1">
            {{ formatCurrency(report.grandTotal) }}
          </h3>
        </div>
        <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <CreditCard :size="24" />
        </div>
      </div>
    </div>

    <!-- Tabela de Acerto de Entregadores -->
    <div
      class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
    >
      <div
        class="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-orange-50 text-orange-600 rounded-xl">
            <Bike :size="20" />
          </div>
          <div>
            <h3
              class="font-black text-slate-800 text-sm uppercase tracking-widest"
            >
              Detalhes do Acerto por Entregador
            </h3>
            <p class="text-xs text-slate-400 font-medium mt-0.5">
              Clique em um entregador para visualizar os pedidos entregues
            </p>
          </div>
        </div>

        <!-- Busca rápida -->
        <div class="relative w-full sm:w-64">
          <Search
            :size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            v-model="searchTerm"
            placeholder="Buscar entregador ou #pedido..."
            class="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50">
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
              >
                Entregador
              </th>
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
              >
                Tipo
              </th>
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
              >
                Entregas Realizadas
              </th>
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
              >
                Taxa p/ Entrega
              </th>
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
              >
                Ajuda de Custo
              </th>
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
              >
                Total a Pagar
              </th>
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right"
              >
                Pedidos
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="loading">
              <td
                colspan="7"
                class="p-8 text-center text-slate-400 font-medium text-sm"
              >
                Carregando dados de acerto...
              </td>
            </tr>
            <template v-else>
              <template
                v-for="motoboy in filteredEntries"
                :key="motoboy.driverId"
              >
                <tr
                  @click="toggleDriverDetails(motoboy.driverId)"
                  class="hover:bg-slate-50 cursor-pointer transition-colors"
                  :class="{
                    'bg-orange-50/30': expandedDriverId === motoboy.driverId,
                  }"
                >
                  <td class="p-4 font-bold text-slate-800 text-sm">
                    <div class="flex items-center gap-2">
                      <span>{{ motoboy.driverName }}</span>
                    </div>
                  </td>
                  <td class="p-4">
                    <span
                      :class="[
                        'px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg',
                        motoboy.driverType === 'FIXO'
                          ? 'bg-blue-50 text-blue-600'
                          : motoboy.driverType === 'DIARISTA'
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-amber-50 text-amber-700',
                      ]"
                    >
                      {{ motoboy.driverType }}
                    </span>
                  </td>
                  <td class="p-4">
                    <div class="flex items-center gap-2">
                      <span
                        class="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700"
                      >
                        {{ motoboy.deliveries }}
                      </span>
                      <!-- Amostra dos números dos pedidos -->
                      <div
                        v-if="motoboy.orders && motoboy.orders.length > 0"
                        class="hidden sm:flex flex-wrap gap-1 max-w-xs"
                      >
                        <span
                          v-for="order in motoboy.orders.slice(0, 4)"
                          :key="order.id"
                          class="px-1.5 py-0.5 text-[10px] font-black rounded bg-orange-50 text-orange-700 border border-orange-100"
                        >
                          #{{ order.displayId }}
                        </span>
                        <span
                          v-if="motoboy.orders.length > 4"
                          class="text-[10px] font-bold text-slate-400"
                        >
                          +{{ motoboy.orders.length - 4 }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="p-4 font-medium text-slate-500 text-sm">
                    {{ formatCurrency(motoboy.feePerDelivery) }}
                  </td>
                  <td class="p-4 font-medium text-slate-500 text-sm">
                    {{ formatCurrency(motoboy.allowance) }}
                  </td>
                  <td class="p-4 font-black text-orange-600 text-sm">
                    {{ formatCurrency(motoboy.total) }}
                  </td>
                  <td class="p-4 text-right">
                    <button
                      class="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                      :title="
                        expandedDriverId === motoboy.driverId
                          ? 'Recolher detalhes'
                          : 'Ver pedidos do entregador'
                      "
                    >
                      <ChevronUp
                        v-if="expandedDriverId === motoboy.driverId"
                        :size="18"
                      />
                      <ChevronDown v-else :size="18" />
                    </button>
                  </td>
                </tr>

                <!-- Linha Expandida: Lista de Pedidos Entregues -->
                <tr
                  v-if="expandedDriverId === motoboy.driverId"
                  :key="`details-${motoboy.driverId}`"
                  class="bg-slate-50/70 border-y border-slate-100"
                >
                  <td colspan="7" class="p-6">
                    <div class="space-y-4">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <PackageCheck :size="16" class="text-orange-600" />
                          <h4 class="text-xs font-black uppercase tracking-wider text-slate-700">
                            Pedidos Realizados por {{ motoboy.driverName }}
                            ({{ motoboy.orders?.length || 0 }})
                          </h4>
                        </div>
                        <span class="text-xs text-slate-400 font-medium">
                          Total gerado em taxas: {{ formatCurrency((motoboy.feePerDelivery || 0) * (motoboy.deliveries || 0)) }}
                        </span>
                      </div>

                      <div
                        v-if="!motoboy.orders || motoboy.orders.length === 0"
                        class="p-4 bg-white rounded-2xl border border-slate-200 text-center text-xs font-medium text-slate-400"
                      >
                        Nenhum pedido finalizado ou entregue encontrado para este período.
                      </div>

                      <div
                        v-else
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                      >
                        <div
                          v-for="order in motoboy.orders"
                          :key="order.id"
                          class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2"
                        >
                          <div class="flex items-center justify-between">
                            <span
                              class="px-2.5 py-1 text-xs font-black rounded-lg bg-orange-100 text-orange-700"
                            >
                              Pedido #{{ order.displayId }}
                            </span>
                            <span class="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock :size="12" />
                              {{ formatTime(order.createdAt) }}
                            </span>
                          </div>

                          <div>
                            <p class="text-xs font-bold text-slate-800 truncate">
                              {{ order.customerName || "Cliente" }}
                            </p>
                            <p
                              v-if="order.customerAddress"
                              class="text-[11px] text-slate-400 flex items-start gap-1 mt-0.5"
                            >
                              <MapPin :size="12" class="mt-0.5 shrink-0 text-slate-400" />
                              <span class="truncate">{{ order.customerAddress }}</span>
                            </p>
                          </div>

                          <div
                            class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs"
                          >
                            <span class="font-medium text-slate-500">
                              Total Pedido:
                              <strong class="font-bold text-slate-700">{{
                                formatCurrency(order.totalValue)
                              }}</strong>
                            </span>
                            <span
                              :class="[
                                'px-2 py-0.5 text-[10px] font-black rounded uppercase',
                                order.status === 'FINALIZADO'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-blue-50 text-blue-700',
                              ]"
                            >
                              {{ order.status }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="filteredEntries.length === 0">
                <td
                  colspan="7"
                  class="p-8 text-center text-slate-400 font-medium text-sm"
                >
                  Nenhum dado encontrado para o filtro selecionado.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div
        v-if="!loading && report.entries?.length > 0"
        class="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center"
      >
        <span
          class="font-black text-slate-600 uppercase tracking-widest text-sm"
        >
          Total Geral a Pagar:
        </span>
        <span class="text-xl font-black text-slate-800">
          {{ formatCurrency(report.grandTotal) }}
        </span>
      </div>
    </div>
  </div>
</template>
