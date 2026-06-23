<script setup>
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight
} from 'lucide-vue-next'

const stats = [
  { name: 'Vendas Hoje', value: 'R$ 1.250,00', change: '+12.5%', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { name: 'Novos Clientes', value: '12', change: '+3.2%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Pedidos Ativos', value: '8', change: '-2.1%', icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50' },
  { name: 'Ticket Médio', value: 'R$ 42,50', change: '+5.4%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
]

const recentOrders = [
  { id: '#1024', customer: 'Mateus Silva', total: 'R$ 65,00', status: 'Preparando', time: '12:45' },
  { id: '#1023', customer: 'Ana Oliveira', total: 'R$ 28,00', status: 'Entregue', time: '12:30' },
  { id: '#1022', customer: 'Ricardo Santos', total: 'R$ 45,00', status: 'Em Rota', time: '12:15' },
]
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
        Última atualização: Hoje, 13:00
      </div>
    </div>

    <!-- Cards de Estatísticas (Versão Light) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="stat in stats"
        :key="stat.name"
        class="bg-white border border-slate-200 p-6 rounded-3xl hover:border-orange-200 transition-all shadow-sm group"
      >
        <div class="flex justify-between items-start mb-4">
          <div :class="['p-3 rounded-2xl transition-colors', stat.bg, stat.color]">
            <component :is="stat.icon" :size="24" />
          </div>
          <span :class="[
            'flex items-center text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider',
            stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          ]">
            {{ stat.change }}
            <ArrowUpRight v-if="stat.change.startsWith('+')" :size="12" class="ml-1" />
            <ArrowDownRight v-else :size="12" class="ml-1" />
          </span>
        </div>
        <p class="text-slate-400 text-xs font-black uppercase tracking-widest">{{ stat.name }}</p>
        <h3 class="text-2xl font-black text-slate-800 mt-1">{{ stat.value }}</h3>
      </div>
    </div>

    <!-- Seções de Detalhes -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- Pedidos Recentes -->
      <div class="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 class="font-black text-slate-800 text-sm uppercase tracking-widest">Pedidos Recentes</h3>
          <button class="text-orange-600 text-xs font-bold flex items-center gap-1 hover:underline">
            Ver todos <ChevronRight :size="14" />
          </button>
        </div>

        <div class="divide-y divide-slate-50">
          <div v-for="order in recentOrders" :key="order.id" class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-500">
                {{ order.id }}
              </div>
              <div>
                <p class="text-sm font-bold text-slate-800">{{ order.customer }}</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase">{{ order.time }} • {{ order.total }}</p>
              </div>
            </div>
            <span :class="[
              'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter',
              order.status === 'Entregue' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
            ]">
              {{ order.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Entregadores -->
      <div class="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
        <h3 class="font-black text-slate-800 text-sm uppercase tracking-widest mb-6">Equipe de Entrega</h3>
        <div class="space-y-4">
          <div v-for="i in 3" :key="i" class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-orange-100">
            <div class="w-10 h-10 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <Users :size="20" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-bold text-slate-800">Entregador {{ i }}</p>
              <p class="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Disponível</p>
            </div>
            <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
