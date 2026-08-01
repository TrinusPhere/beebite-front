<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Users,
  Package,
  ShoppingBag,
  Truck,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  X,
  ClipboardList,
  DollarSign,
  Bike,
  MessageSquare, // Novo ícone para Integrações
  Calculator, // Novo ícone para CMV
  Settings   // Ícone para Configurações
} from 'lucide-vue-next'
import { authState } from '@/utils/auth'

const emit = defineEmits(['close-mobile'])
const router = useRouter()
const route = useRoute()
const isCollapsed = ref(false)

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { name: 'Financeiro', path: '/financeiro', icon: DollarSign, permission: 'financeiro' },
  { name: 'CMV', path: '/financeiro/cmv', icon: Calculator, permission: 'financeiro' },
  { name: 'Pedidos', path: '/pedidos', icon: ClipboardList, permission: 'pedidos' },
  { name: 'Clientes', path: '/clientes', icon: Users, permission: 'clientes' },
  { name: 'Ingredientes', path: '/ingredientes', icon: Package, permission: 'ingredientes' },
  { name: 'Produtos', path: '/produtos', icon: ShoppingBag, permission: 'produtos' },
  { name: 'Entregadores', path: '/entregadores', icon: Truck, permission: 'entregadores' },
  { name: 'Acerto Entregadores', path: '/acerto-entregadores', icon: Bike, permission: 'acerto_entregadores' },
  { name: 'Usuários', path: '/usuarios', icon: Users, permission: 'usuarios' },
  { name: 'Integrações', path: '/integracoes', icon: Settings, permission: 'integracoes' },
  { name: 'Config. Modificadores', path: '/configuracoes/modificadores', icon: Settings, permission: 'produtos' },
  { name: 'Checklist Diário', path: '/checklist', icon: ClipboardList, permission: 'pedidos' },
  { name: 'Cotações', path: '/cotacoes', icon: DollarSign, permission: 'financeiro' },
]

const navigate = (path) => {
  router.push(path)
  emit('close-mobile')
}

const handleLogout = () => {
  authState.logout() // Chamar a função de logout do authState
  router.push('/')
  emit('close-mobile')
}
</script>

<template>
  <aside
    :class="[
      'h-full bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-sm',
      isCollapsed ? 'w-20' : 'w-72 md:w-64'
    ]"
  >
    <!-- Header Sidebar -->
    <div class="p-6 flex items-center justify-between">
      <div class="flex items-center gap-3 overflow-hidden">
        <div class="min-w-[32px] w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/30">
          BF
        </div>
        <span v-if="!isCollapsed" class="text-lg font-bold text-slate-800 tracking-tight whitespace-nowrap">BiteFlow</span>
      </div>
      <button @click="$emit('close-mobile')" class="md:hidden p-2 text-slate-400 hover:text-slate-600">
        <X :size="20" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
      <template v-for="item in menuItems" :key="item.path">
        <button
          v-if="authState.hasPermission(item.permission)"
          @click="navigate(item.path)"
          :class="[ // Combinando todas as classes aqui
            'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative',
            route.path === item.path
              ? 'bg-orange-50 text-orange-600 font-bold'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          ]"
        >
          <component :is="item.icon" :size="22" />
          <span v-if="!isCollapsed" class="text-sm tracking-wide">{{ item.name }}</span>

          <div v-if="route.path === item.path && !isCollapsed" class="absolute left-0 w-1 h-6 bg-orange-500 rounded-r-full"></div>
        </button>
      </template>
    </nav>

    <!-- Bottom Actions -->
    <div class="p-4 mt-auto border-t border-slate-100 space-y-2">
      <button
        @click="isCollapsed = !isCollapsed"
        class="hidden md:flex w-full items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded-2xl transition-all"
      >
        <ChevronLeft :size="22" :class="{'rotate-180': isCollapsed}" class="transition-transform duration-500" />
        <span v-if="!isCollapsed" class="font-bold text-sm">Recolher</span>
      </button>

      <button
        @click="handleLogout"
        class="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm"
      >
        <LogOut :size="22" />
        <span v-if="!isCollapsed">Sair da Conta</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
nav { scrollbar-width: none; }
nav::-webkit-scrollbar { display: none; }
</style>
