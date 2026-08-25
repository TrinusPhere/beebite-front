<script setup>
import { ref, onMounted, watch } from "vue";
import { Bike } from "lucide-vue-next";
import { settlementService } from "@/services/settlementService";

const period = ref("daily"); // 'daily', 'weekly', 'monthly'
const loading = ref(true);
const report = ref({ entries: [], grandTotal: 0 });

const periods = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
];

const fetchReport = async () => {
  try {
    loading.value = true;
    const data = await settlementService.getSettlementReport(period.value);
    report.value = data;
  } catch (error) {
    console.error("Erro ao buscar acerto de entregadores:", error);
  } finally {
    loading.value = false;
  }
};

const setPeriod = (newPeriod) => {
  period.value = newPeriod;
};

watch(period, () => {
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
          Relatório de entregas e valores a pagar no período selecionado.
        </p>
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

    <!-- Tabela de Acerto de Entregadores -->
    <div
      class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
    >
      <div class="p-6 border-b border-slate-50 flex items-center gap-3">
        <div class="p-2 bg-orange-50 text-orange-600 rounded-xl">
          <Bike :size="20" />
        </div>
        <div>
          <h3
            class="font-black text-slate-800 text-sm uppercase tracking-widest"
          >
            Detalhes do Acerto
          </h3>
          <p class="text-xs text-slate-400 font-medium mt-0.5">
            Valores detalhados por entregador
          </p>
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
                Entregas
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
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="loading">
              <td
                colspan="6"
                class="p-8 text-center text-slate-400 font-medium text-sm"
              >
                Carregando dados...
              </td>
            </tr>
            <template v-else>
              <tr
                v-for="motoboy in report.entries"
                :key="motoboy.driverId"
                class="hover:bg-slate-50 transition-colors"
              >
                <td class="p-4 font-bold text-slate-800 text-sm">
                  {{ motoboy.driverName }}
                </td>
                <td class="p-4">
                  <span
                    :class="[
                      'px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg',
                      motoboy.driverType === 'FIXO'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-purple-50 text-purple-600',
                    ]"
                  >
                    {{ motoboy.driverType }}
                  </span>
                </td>
                <td class="p-4 font-medium text-slate-600 text-sm">
                  {{ motoboy.deliveries }}
                </td>
                <td class="p-4 font-medium text-slate-500 text-sm">
                  {{
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(motoboy.feePerDelivery)
                  }}
                </td>
                <td class="p-4 font-medium text-slate-500 text-sm">
                  {{
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(motoboy.allowance)
                  }}
                </td>
                <td class="p-4 font-black text-orange-600 text-sm">
                  {{
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(motoboy.total)
                  }}
                </td>
              </tr>
              <tr v-if="report.entries.length === 0">
                <td
                  colspan="6"
                  class="p-8 text-center text-slate-400 font-medium text-sm"
                >
                  Nenhum dado encontrado para este período.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div
        v-if="!loading && report.entries.length > 0"
        class="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center"
      >
        <span
          class="font-black text-slate-600 uppercase tracking-widest text-sm"
          >Total Geral:</span
        >
        <span class="text-xl font-black text-slate-800">{{
          new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(report.grandTotal)
        }}</span>
      </div>
    </div>
  </div>
</template>
