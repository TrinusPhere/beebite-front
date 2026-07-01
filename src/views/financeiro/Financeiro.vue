<script setup>
import { ref } from 'vue'
import {
  DollarSign,
  TrendingUp,
  Package,
  ArrowUpRight,
  CreditCard
} from 'lucide-vue-next'
import { authState } from '../../utils/auth'
import { salesValueDB, salesByProductDB, paymentMethodsDataDB } from '@/utils/mockData' // Importar dados mockados

// Mock Data para exemplificar a estrutura
const period = ref('daily') // 'daily', 'weekly', 'monthly'

const periods = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' }
]

const salesValue = salesValueDB
const salesByProduct = salesByProductDB
const paymentMethodsData = paymentMethodsDataDB

const setPeriod = (newPeriod) => {
  period.value = newPeriod
}
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Financeiro 💰</h1>
        <p class="text-slate-500 text-sm font-medium">Acompanhe o faturamento e vendas por produto.</p>
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
              : 'text-slate-500 hover:text-slate-700'
          ]"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Conteúdo Principal do Financeiro -->
    <div class="space-y-8">
      <!-- Cards de Valor de Vendas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Faturamento -->
      <div class="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <div class="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign :size="24" />
          </div>
          <span class="flex items-center text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider bg-emerald-50 text-emerald-600">
            {{ salesValue[period].change }}
            <ArrowUpRight :size="12" class="ml-1" />
          </span>
        </div>
        <div class="mt-4">
          <p class="text-slate-400 text-xs font-black uppercase tracking-widest">Faturamento Bruto</p>
          <h3 class="text-3xl font-black text-slate-800 mt-1">{{ salesValue[period].value }}</h3>
        </div>
      </div>

      <!-- Pedidos Finalizados -->
      <div class="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <div class="p-3 bg-orange-50 text-orange-600 rounded-2xl">
            <TrendingUp :size="24" />
          </div>
        </div>
        <div class="mt-4">
          <p class="text-slate-400 text-xs font-black uppercase tracking-widest">Total de Pedidos</p>
          <h3 class="text-3xl font-black text-slate-800 mt-1">{{ salesValue[period].orders }}</h3>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Relatório de Vendas por Produto -->
      <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-50 flex items-center gap-3">
          <div class="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Package :size="20" />
          </div>
          <div>
            <h3 class="font-black text-slate-800 text-sm uppercase tracking-widest">Vendas por Produto</h3>
            <p class="text-xs text-slate-400 font-medium mt-0.5">Ranking dos produtos mais vendidos</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50">
                <th class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Produto</th>
                <th class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Qtd.</th>
                <th class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="(product, index) in salesByProduct[period]" :key="index" class="hover:bg-slate-50 transition-colors">
                <td class="p-4 font-bold text-slate-800 text-sm">{{ product.name }}</td>
                <td class="p-4 font-medium text-slate-600 text-sm">{{ product.quantity }}</td>
                <td class="p-4 font-black text-emerald-600 text-sm">{{ product.value }}</td>
              </tr>
              <tr v-if="salesByProduct[period].length === 0">
                <td colspan="3" class="p-8 text-center text-slate-400 font-medium text-sm">Nenhum dado encontrado.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Relatório de Formas de Pagamento -->
      <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-50 flex items-center gap-3">
          <div class="p-2 bg-purple-50 text-purple-600 rounded-xl">
            <CreditCard :size="20" />
          </div>
          <div>
            <h3 class="font-black text-slate-800 text-sm uppercase tracking-widest">Formas de Pagamento</h3>
            <p class="text-xs text-slate-400 font-medium mt-0.5">Distribuição das transações por método</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50">
                <th class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Método</th>
                <th class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Pedidos</th>
                <th class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="(payment, index) in paymentMethodsData[period]" :key="index" class="hover:bg-slate-50 transition-colors">
                <td class="p-4">
                  <span :class="['px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg', payment.bg, payment.color]">
                    {{ payment.method }}
                  </span>
                </td>
                <td class="p-4 font-medium text-slate-600 text-sm">{{ payment.quantity }}</td>
                <td class="p-4 font-black text-emerald-600 text-sm">{{ payment.value }}</td>
              </tr>
              <tr v-if="paymentMethodsData[period].length === 0">
                <td colspan="3" class="p-8 text-center text-slate-400 font-medium text-sm">Nenhum dado encontrado.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>