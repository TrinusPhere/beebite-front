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
  ClipboardList
} from 'lucide-vue-next'

const emit = defineEmits(['close-mobile'])
const router = useRouter()
const route = useRoute()
const isCollapsed = ref(false)

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Pedidos', path: '/pedidos', icon: ClipboardList },
  { name: 'Clientes', path: '/clientes', icon: Users },
  { name: 'Ingredientes', path: '/ingredientes', icon: Package },
  { name: 'Produtos', path: '/produtos', icon: ShoppingBag },
  { name: 'Entregadores', path: '/entregadores', icon: Truck },
]

const navigate = (path) => {
  router.push(path)
  emit('close-mobile')
}

const handleLogout = () => {
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
      <button
        v-for="item in menuItems"
        :key="item.path"
        @click="navigate(item.path)"
        class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative"
        :class="[
          route.path === item.path
            ? 'bg-orange-50 text-orange-600 font-bold'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        ]"
      >
        <component :is="item.icon" :size="22" />
        <span v-if="!isCollapsed" class="text-sm tracking-wide">{{ item.name }}</span>

        <div v-if="route.path === item.path && !isCollapsed" class="absolute left-0 w-1 h-6 bg-orange-500 rounded-r-full"></div>
      </button>
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
