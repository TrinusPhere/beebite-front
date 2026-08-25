<script setup>
import { ref, onMounted } from "vue";
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Percent,
  AlertTriangle,
} from "lucide-vue-next";
import { analyticsService } from "@/services/analyticsService";
const data = ref(null);
const today = new Date();
const startDate = ref(
  new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
);
const endDate = ref(today.toISOString().slice(0, 10));
const load = async () =>
  (data.value = await analyticsService.getOverview(
    startDate.value,
    endDate.value,
  ));
onMounted(load);
const money = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );
</script>
<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <div class="flex flex-col md:flex-row justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800">
          Inteligência Financeira
        </h1>
        <p class="text-sm text-slate-500">
          Visão consolidada de receita, margem, CMV, taxas e canais.
        </p>
      </div>
      <div class="flex gap-2">
        <input
          v-model="startDate"
          type="date"
          class="border p-2 rounded-xl"
        /><input
          v-model="endDate"
          type="date"
          class="border p-2 rounded-xl"
        /><button
          @click="load"
          class="bg-orange-500 text-white px-4 rounded-xl font-bold"
        >
          Atualizar
        </button>
      </div>
    </div>
    <template v-if="data"
      ><div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="bg-white border p-5 rounded-3xl">
          <TrendingUp class="text-emerald-600" />
          <p class="text-xs text-slate-500 mt-3">Receita líquida</p>
          <b class="text-2xl">{{ money(data.netRevenue) }}</b>
        </div>
        <div class="bg-white border p-5 rounded-3xl">
          <Receipt class="text-orange-500" />
          <p class="text-xs text-slate-500 mt-3">Pedidos</p>
          <b class="text-2xl">{{ data.orders || 0 }}</b>
        </div>
        <div class="bg-white border p-5 rounded-3xl">
          <BarChart3 class="text-blue-600" />
          <p class="text-xs text-slate-500 mt-3">CMV</p>
          <b class="text-2xl">{{ money(data.cmv) }}</b>
        </div>
        <div class="bg-white border p-5 rounded-3xl">
          <Percent class="text-violet-600" />
          <p class="text-xs text-slate-500 mt-3">Margem bruta</p>
          <b class="text-2xl"
            >{{ Number(data.grossMargin || 0).toFixed(1) }}%</b
          >
        </div>
      </div>
      <div class="grid lg:grid-cols-2 gap-6">
        <section class="bg-white border p-6 rounded-3xl">
          <h2 class="font-black mb-4">Vendas por canal</h2>
          <div v-if="!data.channels?.length" class="text-slate-400 text-sm">
            Sem dados do backend ainda.
          </div>
          <div
            v-for="c in data.channels"
            :key="c.name"
            class="flex justify-between border-b py-3"
          >
            <span>{{ c.name }}</span
            ><b>{{ money(c.value) }}</b>
          </div>
        </section>
        <section class="bg-white border p-6 rounded-3xl">
          <h2 class="font-black mb-4">Alertas gerenciais</h2>
          <div
            v-for="a in data.alerts"
            :key="a"
            class="flex gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2"
          >
            <AlertTriangle :size="17" />{{ a }}
          </div>
        </section>
      </div></template
    >
  </div>
</template>
