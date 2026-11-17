<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
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
  Calculator,
  Settings,
  Warehouse,
  Factory,
  Printer,
  ChartNoAxesCombined,
  Flame,
  Monitor,
  Wallet,
  Building2,
  FileText,
  Receipt,
  BarChart3,
  Eye,
  ArrowLeft,
} from "lucide-vue-next";
import { authState } from "@/utils/auth";
import BeeBiteLogo from "./BeeBiteLogo.vue";

const emit = defineEmits(["close-mobile"]);
const router = useRouter();
const route = useRoute();
const isCollapsed = ref(false);

const isPlatformContext = computed(
  () => authState.isSuperAdmin() && route.path.startsWith("/platform"),
);

const platformMenuItems = [
  {
    name: "Visão Geral & MRR",
    path: "/platform/overview",
    icon: BarChart3,
  },
  {
    name: "Clientes & Lojas",
    path: "/platform/tenants",
    icon: Building2,
  },
  {
    name: "Contratos & Planos",
    path: "/platform/contracts",
    icon: FileText,
  },
  {
    name: "Faturas & Recebimentos",
    path: "/platform/invoices",
    icon: Receipt,
  },
];

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard",
  },
  {
    name: "Caixa PDV",
    path: "/caixa",
    icon: Wallet,
    permission: "caixa",
  },
  {
    name: "Financeiro",
    path: "/financeiro",
    icon: DollarSign,
    permission: "financeiro",
  },
  {
    name: "CMV",
    path: "/financeiro/cmv",
    icon: Calculator,
    permission: "financeiro",
  },
  {
    name: "Inteligência",
    path: "/financeiro/inteligencia",
    icon: ChartNoAxesCombined,
    permission: "financeiro",
  },
  {
    name: "Pedidos",
    path: "/pedidos",
    icon: ClipboardList,
    permission: "pedidos",
  },
  {
    name: "KDS / Cozinha",
    path: "/kds",
    icon: Flame,
    permission: "kds",
  },
  {
    name: "Config. KDS",
    path: "/kds/configuracoes",
    icon: Monitor,
    permission: "kds",
  },
  { name: "Clientes", path: "/clientes", icon: Users, permission: "clientes" },
  {
    name: "Ingredientes",
    path: "/ingredientes",
    icon: Package,
    permission: "ingredientes",
  },
  {
    name: "Mov. Estoque",
    path: "/estoque/movimentacoes",
    icon: Warehouse,
    permission: "ingredientes",
  },
  {
    name: "Produtos",
    path: "/produtos",
    icon: ShoppingBag,
    permission: "produtos",
  },
  {
    name: "Entregadores",
    path: "/entregadores",
    icon: Truck,
    permission: "entregadores",
  },
  {
    name: "Acerto Entregadores",
    path: "/acerto-entregadores",
    icon: Bike,
    permission: "acerto_entregadores",
  },
  { name: "Usuários", path: "/usuarios", icon: Users, permission: "usuarios" },
  {
    name: "Integrações",
    path: "/integracoes",
    icon: Settings,
    permission: "integracoes",
  },
  {
    name: "Setores Produção",
    path: "/configuracoes/setores-producao",
    icon: Factory,
    permission: "produtos",
  },
  {
    name: "Impressoras",
    path: "/configuracoes/impressoras",
    icon: Printer,
    permission: "produtos",
  },
  {
    name: "Config. Modificadores",
    path: "/configuracoes/modificadores",
    icon: Settings,
    permission: "produtos",
  },
  {
    name: "Checklist Diário",
    path: "/checklist",
    icon: ClipboardList,
    permission: "pedidos",
  },
  {
    name: "Cotações",
    path: "/cotacoes",
    icon: DollarSign,
    permission: "financeiro",
  },
];

const navigate = (path) => {
  router.push(path);
  emit("close-mobile");
};

const handleLogout = () => {
  authState.logout();
  router.push("/");
  emit("close-mobile");
};
</script>

<template>
  <aside
    :class="[
      'h-full bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-sm',
      isCollapsed ? 'w-20' : 'w-72 md:w-64',
    ]"
  >
    <!-- Header Sidebar -->
    <div class="p-6 flex items-center justify-between">
      <div class="flex items-center overflow-hidden">
        <BeeBiteLogo :variant="isCollapsed ? 'icon' : 'horizontal'" />
      </div>
      <button
        @click="$emit('close-mobile')"
        class="md:hidden p-2 text-slate-400 hover:text-slate-600"
      >
        <X :size="20" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto">
      <!-- ================================================================= -->
      <!-- CONTEXTO 1: BACKOFFICE TRINUSPHERE (/platform/* para SUPER_ADMIN) -->
      <!-- ================================================================= -->
      <template v-if="isPlatformContext">
        <p
          v-if="!isCollapsed"
          class="px-4 pb-1.5 text-[10px] font-black uppercase tracking-wider text-orange-600"
        >
          Trinusphere SaaS
        </p>

        <button
          v-for="item in platformMenuItems"
          :key="item.path"
          @click="navigate(item.path)"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative',
            route.path === item.path
              ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20'
              : 'text-slate-600 hover:bg-orange-50/70 hover:text-orange-700 font-medium',
          ]"
        >
          <component :is="item.icon" :size="21" />
          <span v-if="!isCollapsed" class="text-sm tracking-wide">
            {{ item.name }}
          </span>
        </button>

        <div class="pt-4 mt-4 border-t border-slate-100">
          <p
            v-if="!isCollapsed"
            class="px-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
          >
            Auditoria de Lojas
          </p>
          <button
            @click="navigate('/dashboard')"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 font-semibold text-xs transition-all"
            title="Visualizar menus do PDV da loja selecionada (Somente Leitura)"
          >
            <Eye :size="18" class="text-slate-500 shrink-0" />
            <span v-if="!isCollapsed" class="text-left leading-tight">
              Visualizar Loja Ativa
              <span class="block text-[10px] text-slate-400 font-normal">
                Modo somente leitura
              </span>
            </span>
          </button>
        </div>
      </template>

      <!-- ================================================================= -->
      <!-- CONTEXTO 2: OPERAÇÃO DA LOJA (PDV / Produtos / Pedidos / KDS)     -->
      <!-- ================================================================= -->
      <template v-else>
        <!-- Atalho fixo de retorno para o SUPER_ADMIN -->
        <div
          v-if="authState.isSuperAdmin()"
          class="mb-3 pb-3 border-b border-slate-100"
        >
          <button
            @click="navigate('/platform/overview')"
            class="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-xs transition-all"
          >
            <ArrowLeft :size="17" class="shrink-0" />
            <span v-if="!isCollapsed">Voltar ao Painel Trinusphere</span>
          </button>
        </div>

        <template v-for="item in menuItems" :key="item.path">
          <button
            v-if="authState.hasPermission(item.permission)"
            @click="navigate(item.path)"
            :class="[
              'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative',
              route.path === item.path
                ? 'bg-orange-50 text-orange-600 font-bold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
            ]"
          >
            <component :is="item.icon" :size="22" />
            <span v-if="!isCollapsed" class="text-sm tracking-wide">{{
              item.name
            }}</span>

            <div
              v-if="route.path === item.path && !isCollapsed"
              class="absolute left-0 w-1 h-6 bg-orange-500 rounded-r-full"
            ></div>
          </button>
        </template>
      </template>
    </nav>

    <!-- Bottom Actions -->
    <div class="p-4 mt-auto border-t border-slate-100 space-y-2">
      <button
        @click="isCollapsed = !isCollapsed"
        class="hidden md:flex w-full items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded-2xl transition-all"
      >
        <ChevronLeft
          :size="22"
          :class="{ 'rotate-180': isCollapsed }"
          class="transition-transform duration-500"
        />
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
nav {
  scrollbar-width: none;
}
nav::-webkit-scrollbar {
  display: none;
}
</style>
