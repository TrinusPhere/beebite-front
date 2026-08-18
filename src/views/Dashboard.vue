<script setup>
import { ref, onMounted } from 'vue'
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
  Bike
} from 'lucide-vue-next'
import { financialService } from '@/services/financialService'

const loading = ref(true)
const dashboardData = ref({
  stats: [],
  recentOrders: [],
  deliveryTeam: [],
  lastUpdatedAt: new Date()
})

const statStyles = [
  { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50' },
  { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' }
]

const fetchDashboard = async () => {
  try {
    loading.value = true
    const data = await financialService.getDashboard()
    // Map stats with styles
    if (data.stats) {
      data.stats = data.stats.map((s, index) => {
        const style = statStyles[index % statStyles.length]
        return {
          ...s,
          value: s.formattedValue,
          change: s.changePercentage,
          icon: style.icon,
          bg: style.bg,
          color: style.color
        }
      })
    }
    dashboardData.value = data
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header de Boas-vindas -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Painel Administrativo 👋</h1>
        <p class="text-slate-500 text-sm font-medium">Resumo operacional da sua lanchonete hoje.</p>
      </div>
      <div class="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
        <Clock :size="14" />
        Última atualização: {{ new Date(dashboardData.lastUpdatedAt).toLocaleString('pt-BR') }}
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
          <div :class="['inline-flex items-center justify-center w-12 h-12 rounded-2xl transition-colors', stat.bg, stat.color]">
            <component :is="stat.icon" :size="24" />
          </div>
          <span v-if="stat.change" :class="[
            'inline-flex items-center text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider',
            stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          ]">
            {{ stat.change }}
            <ArrowUpRight v-if="stat.change.startsWith('+')" :size="12" class="ml-1" />
            <ArrowDownRight v-else :size="12" class="ml-1" />
          </span>
        </div>
        <div class="mt-4">
          <p class="text-slate-400 text-xs font-black uppercase tracking-widest">{{ stat.name }}</p>
          <h3 class="text-2xl font-black text-slate-800 mt-1 truncate">{{ stat.value }}</h3>
        </div>
      </div>
    </div>

    <!-- Seções de Detalhes -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- Pedidos Recentes -->
      <div class="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 class="font-black text-slate-800 tracking-tight">Pedidos Recentes</h3>
            <p class="text-xs text-slate-400 font-medium">Últimos pedidos que entraram no sistema</p>
          </div>
          <button class="text-orange-600 text-sm font-bold hover:text-orange-700 flex items-center gap-1 transition-colors">
            Ver Kanban <ChevronRight :size="16" />
          </button>
        </div>

        <div class="divide-y divide-slate-50">
          <div v-for="order in dashboardData.recentOrders" :key="order.displayId" class="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                {{ order.displayId }}
              </div>
              <div>
                <h4 class="font-bold text-slate-800">{{ order.customerName }}</h4>
                <p class="text-xs text-slate-400 font-medium mt-0.5 truncate max-w-[200px]">{{ order.itemsSummary }}</p>
              </div>
            </div>
            <div class="text-right">
              <div class="font-black text-slate-800">{{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalValue) }}</div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ order.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Equipe de Entrega -->
      <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-50">
          <h3 class="font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Bike :size="18" class="text-orange-600" /> Equipe de Entrega
          </h3>
          <p class="text-xs text-slate-400 font-medium mt-1">Status dos motoboys agora</p>
        </div>
        <div class="p-4 space-y-3">
          <div v-for="driver in dashboardData.deliveryTeam" :key="driver.id" class="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                {{ driver.name.charAt(0) }}
              </div>
              <span class="font-bold text-slate-700 text-sm">{{ driver.name }}</span>
            </div>
            <span :class="[
              'w-2.5 h-2.5 rounded-full',
              driver.status === 'ATIVO' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
              driver.status === 'EM_ROTA' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' :
              'bg-slate-300'
            ]"></span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>