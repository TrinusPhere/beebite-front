<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import Sidebar from "../components/ui/Sidebar.vue";
import {
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  Settings,
  Store,
  ChevronDown,
  Check,
  Cloud,
  HardDrive,
  User,
  Building2,
  Eye,
  ShieldAlert,
} from "lucide-vue-next";
import { authState } from "../utils/auth";
import StoreSettingsModal from "../components/StoreSettingsModal.vue";
import UserProfileModal from "../components/UserProfileModal.vue";
import EdgeSyncStatusBadge from "../components/ui/EdgeSyncStatusBadge.vue";
import { useEdgeSyncHealth } from "../composables/useEdgeSyncHealth";

const router = useRouter();
const route = useRoute();
const { health: edgeSyncHealth, isEdgeMode: isLocalEdgeRuntime } =
  useEdgeSyncHealth();
const isMobileMenuOpen = ref(false);
const isStoreSettingsOpen = ref(false);
const isStoreSwitcherOpen = ref(false);
const isProfileMenuOpen = ref(false);
const isNotificationsOpen = ref(false);
const isUserProfileOpen = ref(false);
const storeViewKey = ref(0);
const readOnlyAlertMessage = ref("");
let alertTimer = null;

const handleReadOnlyBlocked = (event) => {
  readOnlyAlertMessage.value =
    event?.detail?.message ||
    "Ação bloqueada: o Super Administrador possui acesso somente leitura nas lojas dos clientes.";
  if (alertTimer) clearTimeout(alertTimer);
  alertTimer = setTimeout(() => {
    readOnlyAlertMessage.value = "";
  }, 5000);
};

onMounted(() => {
  if (authState.currentUser) {
    authState.refreshAccessibleStores();
  }
  window.addEventListener("beebite:readonly-blocked", handleReadOnlyBlocked);
});

onUnmounted(() => {
  window.removeEventListener("beebite:readonly-blocked", handleReadOnlyBlocked);
  if (alertTimer) clearTimeout(alertTimer);
});

const isPlatformContext = computed(
  () => authState.isSuperAdmin() && route.path.startsWith("/platform"),
);

const isSandboxBetaStore = computed(() =>
  Boolean(
    activeStore.value &&
      (activeStore.value.sandboxBeta ||
        activeStore.value.tenantId === "00000000-0000-0000-0000-000000000001"),
  ),
);

const isSuperAdminInsideStore = computed(
  () => authState.isSuperAdmin() && !route.path.startsWith("/platform"),
);

const isReadOnlyStoreInspection = computed(
  () => isSuperAdminInsideStore.value && !isSandboxBetaStore.value,
);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeAllDropdowns = () => {
  isStoreSwitcherOpen.value = false;
  isProfileMenuOpen.value = false;
  isNotificationsOpen.value = false;
};

const userName = computed(() =>
  authState.currentUser ? authState.currentUser.name : "Convidado",
);
const userRole = computed(() =>
  authState.currentUser ? authState.currentUser.role : "N/A",
);

const hasMultipleStores = computed(
  () => Array.isArray(authState.accessibleStores) && authState.accessibleStores.length > 1,
);

const activeStore = computed(() => {
  if (!Array.isArray(authState.accessibleStores) || authState.accessibleStores.length === 0) {
    return null;
  }
  return (
    authState.accessibleStores.find((s) => s.activeContext) ||
    authState.accessibleStores.find(
      (s) => authState.currentUser && s.storeId === authState.currentUser.storeId,
    ) ||
    authState.accessibleStores[0]
  );
});

const formatSyncTime = (isoTimestamp) => {
  if (!isoTimestamp) return "Aguardando 1º sync";
  try {
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 1000));
    if (diffSec < 60) return `Sincronizado há ${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Sincronizado há ${diffMin}min`;
    const diffHours = Math.floor(diffMin / 60);
    return `Sincronizado há ${diffHours}h`;
  } catch {
    return "Sincronizado";
  }
};

const handleSwitchStore = async (targetStoreId) => {
  isStoreSwitcherOpen.value = false;
  if (authState.currentUser && authState.currentUser.storeId === targetStoreId) {
    if (isPlatformContext.value) {
      router.push("/dashboard");
    }
    return;
  }
  const switched = await authState.switchStore(targetStoreId);
  if (switched) {
    storeViewKey.value += 1;
    if (isPlatformContext.value) {
      router.push("/dashboard");
    }
  }
};

const openPlatformBackoffice = () => {
  closeAllDropdowns();
  router.push("/platform/overview");
};

const openMyProfile = () => {
  closeAllDropdowns();
  isUserProfileOpen.value = true;
};

const openStoreSettings = () => {
  closeAllDropdowns();
  isStoreSettingsOpen.value = true;
};

const handleLogout = () => {
  closeAllDropdowns();
  authState.logout();
  router.push("/");
};
</script>

<template>
  <div
    class="flex h-screen bg-slate-50 text-slate-900 overflow-hidden relative font-sans"
  >
    <!-- Overlay para fechar o menu mobile ao clicar fora -->
    <div
      v-if="isMobileMenuOpen"
      @click="isMobileMenuOpen = false"
      class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
    ></div>

    <!-- Overlay invisível para fechar os dropdowns da navbar -->
    <div
      v-if="isStoreSwitcherOpen || isProfileMenuOpen || isNotificationsOpen"
      @click="closeAllDropdowns"
      class="fixed inset-0 z-30"
    ></div>

    <!-- Sidebar: Adaptável e Sensível ao Contexto -->
    <div
      :class="[
        'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <Sidebar @close-mobile="isMobileMenuOpen = false" />
    </div>

    <!-- Área Principal -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
      <!-- Navbar Clara -->
      <header
        class="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-8 shadow-sm z-40"
      >
        <div class="flex items-center gap-3 md:gap-4">
          <button
            @click="toggleMobileMenu"
            class="p-2 hover:bg-slate-100 rounded-lg md:hidden text-slate-500"
          >
            <Menu v-if="!isMobileMenuOpen" :size="24" />
            <X v-else :size="24" />
          </button>

          <!-- Store Switcher Adaptativo -->
          <div v-if="hasMultipleStores && activeStore" class="relative">
            <button
              @click="
                isProfileMenuOpen = false;
                isNotificationsOpen = false;
                isStoreSwitcherOpen = !isStoreSwitcherOpen;
              "
              :disabled="authState.switchingStore"
              class="flex items-center gap-2.5 bg-orange-50/80 hover:bg-orange-100/80 border border-orange-200/80 text-slate-800 px-3 py-1.5 rounded-xl transition-all text-left"
              title="Alternar unidade para visualização ou operação"
            >
              <div
                class="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm"
              >
                <Store :size="15" />
              </div>
              <div class="max-w-[150px] sm:max-w-[220px]">
                <p class="text-xs font-bold leading-tight truncate text-slate-900">
                  {{ activeStore.storeName }}
                </p>
                <p class="text-[10px] text-slate-500 font-medium flex items-center gap-1 truncate">
                  <span
                    :class="[
                      'w-1.5 h-1.5 rounded-full inline-block',
                      activeStore.syncMode === 'EDGE' ? 'bg-amber-500' : 'bg-emerald-500',
                    ]"
                  ></span>
                  {{
                    activeStore.syncMode === "EDGE"
                      ? formatSyncTime(activeStore.lastEdgeSyncAt)
                      : "Unidade Online (Cloud)"
                  }}
                </p>
              </div>
              <ChevronDown
                :size="16"
                class="text-slate-500 transition-transform duration-200"
                :class="{ 'rotate-180': isStoreSwitcherOpen }"
              />
            </button>

            <!-- Dropdown de Unidades -->
            <div
              v-if="isStoreSwitcherOpen"
              class="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50"
            >
              <div class="px-3.5 py-1.5 border-b border-slate-100">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {{
                    authState.isSuperAdmin()
                      ? `Visualizar Unidade (${authState.accessibleStores.length} lojas)`
                      : `Alternar Unidade (${authState.accessibleStores.length} lojas)`
                  }}
                </p>
              </div>
              <button
                v-for="storeItem in authState.accessibleStores"
                :key="storeItem.storeId"
                @click="handleSwitchStore(storeItem.storeId)"
                class="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div
                    :class="[
                      'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                      storeItem.activeContext
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-500',
                    ]"
                  >
                    <HardDrive v-if="storeItem.syncMode === 'EDGE'" :size="15" />
                    <Cloud v-else :size="15" />
                  </div>
                  <div class="min-w-0">
                    <p
                      class="text-xs font-bold truncate"
                      :class="storeItem.activeContext ? 'text-orange-600' : 'text-slate-800'"
                    >
                      {{ storeItem.storeName }}
                    </p>
                    <p class="text-[10px] text-slate-400 truncate">
                      {{
                        storeItem.syncMode === "EDGE"
                          ? `PDV Local · ${formatSyncTime(storeItem.lastEdgeSyncAt)}`
                          : "Nuvem · Tempo Real"
                      }}
                    </p>
                  </div>
                </div>
                <Check
                  v-if="storeItem.activeContext"
                  :size="16"
                  class="text-orange-500 shrink-0"
                />
              </button>
            </div>
          </div>

          <div class="relative hidden lg:block max-w-xs w-full">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              :size="18"
            />
            <input
              type="text"
              placeholder="Pesquisar..."
              class="w-full bg-slate-100 border border-slate-200 text-sm text-slate-700 pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
            />
          </div>
        </div>

        <div class="flex items-center gap-2 md:gap-4">
          <!-- Indicador em tempo real da Sincronização Edge -> Nuvem -->
          <EdgeSyncStatusBadge v-if="!isPlatformContext" />

          <!-- Botão rápido Trinusphere Backoffice (apenas SUPER_ADMIN fora de /platform) -->
          <button
            v-if="isSuperAdminInsideStore"
            @click="openPlatformBackoffice"
            class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-colors"
            title="Voltar ao Painel Administrativo Trinusphere SaaS"
          >
            <Building2 :size="15" />
            <span>Painel Trinusphere</span>
          </button>

          <!-- Configurações da Loja (oculto apenas quando SUPER_ADMIN inspeciona loja de cliente) -->
          <button
            v-if="!isReadOnlyStoreInspection"
            @click="openStoreSettings"
            class="p-2 text-slate-400 hover:text-orange-500 transition-colors"
            title="Configurações da Loja"
          >
            <Settings :size="20" />
          </button>

          <!-- Notificações -->
          <div class="relative">
            <button
              @click="
                isProfileMenuOpen = false;
                isStoreSwitcherOpen = false;
                isNotificationsOpen = !isNotificationsOpen;
              "
              class="p-2 text-slate-400 hover:text-orange-500 transition-colors relative"
              title="Notificações e Status"
            >
              <Bell :size="20" />
              <span
                class="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"
              ></span>
            </button>

            <div
              v-if="isNotificationsOpen"
              class="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50"
            >
              <div class="px-4 py-2 border-b border-slate-100">
                <p class="text-xs font-bold text-slate-800">Status do Sistema</p>
              </div>
              <div class="px-4 py-3 text-xs text-slate-600 space-y-2">
                <p class="flex items-center justify-between">
                  <span>API Nuvem:</span>
                  <span
                    v-if="isLocalEdgeRuntime && (edgeSyncHealth?.consecutiveFailures || 0) > 0"
                    class="font-bold text-amber-600"
                  >
                    ● Aguardando reconexão
                  </span>
                  <span
                    v-else-if="isLocalEdgeRuntime && (edgeSyncHealth?.failedCount || 0) > 0"
                    class="font-bold text-red-600"
                  >
                    ● {{ edgeSyncHealth.failedCount }} rejeitado(s)
                  </span>
                  <span v-else class="font-bold text-emerald-600">● Online</span>
                </p>
                <button
                  v-if="isLocalEdgeRuntime && authState.hasPermission('integracoes')"
                  @click="
                    closeAllDropdowns();
                    router.push('/integracoes/edge-sync');
                  "
                  class="w-full py-1.5 rounded-lg bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 transition-colors"
                >
                  Diagnóstico de Sincronização Edge →
                </button>
                <p v-if="activeStore" class="flex items-center justify-between">
                  <span>Unidade Ativa:</span>
                  <span class="font-bold text-slate-800 truncate max-w-[140px]">{{
                    activeStore.storeName
                  }}</span>
                </p>
                <button
                  v-if="authState.isSuperAdmin()"
                  @click="openPlatformBackoffice"
                  class="w-full mt-1 py-1.5 rounded-lg bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 transition-colors"
                >
                  Ir para Trinusphere SaaS →
                </button>
              </div>
            </div>
          </div>

          <!-- Menu Interativo do Usuário / Perfil -->
          <div class="relative pl-3 md:pl-4 border-l border-slate-200">
            <button
              @click="
                isNotificationsOpen = false;
                isStoreSwitcherOpen = false;
                isProfileMenuOpen = !isProfileMenuOpen;
              "
              class="flex items-center gap-2.5 hover:bg-slate-50 px-2 py-1 rounded-xl transition-colors text-left"
              title="Abrir opções de perfil e conta"
            >
              <div class="text-right hidden lg:block">
                <p class="text-xs font-bold text-slate-800">{{ userName }}</p>
                <p
                  class="text-[10px] text-slate-400 uppercase tracking-widest font-semibold"
                >
                  {{ userRole }}
                </p>
              </div>
              <div
                class="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-500/20"
              >
                {{ userName.substring(0, 2).toUpperCase() }}
              </div>
              <ChevronDown
                :size="15"
                class="text-slate-400 hidden sm:block transition-transform duration-200"
                :class="{ 'rotate-180': isProfileMenuOpen }"
              />
            </button>

            <!-- Dropdown do Perfil -->
            <div
              v-if="isProfileMenuOpen"
              class="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50"
            >
              <div class="px-4 py-2.5 border-b border-slate-100">
                <p class="text-xs font-bold text-slate-900 truncate">{{ userName }}</p>
                <p class="text-[11px] text-slate-500 truncate">
                  {{ authState.currentUser?.login }} · {{ userRole }}
                </p>
              </div>

              <button
                @click="openMyProfile"
                class="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
              >
                <User :size="16" class="text-slate-400" />
                <span>Meu Perfil & Alterar Senha</span>
              </button>

              <button
                v-if="authState.isSuperAdmin()"
                @click="openPlatformBackoffice"
                class="w-full px-4 py-2.5 text-left text-xs font-bold text-orange-600 hover:bg-orange-50 flex items-center gap-2.5"
              >
                <Building2 :size="16" />
                <span>Trinusphere Backoffice (SaaS)</span>
              </button>

              <button
                v-if="!isReadOnlyStoreInspection"
                @click="openStoreSettings"
                class="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
              >
                <Settings :size="16" class="text-slate-400" />
                <span>Configurações da Loja</span>
              </button>

              <div class="my-1 border-t border-slate-100"></div>

              <button
                @click="handleLogout"
                class="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5"
              >
                <LogOut :size="16" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Banner de Loja Beta da Trinusphere (escrita liberada para testes em PRD) -->
      <div
        v-if="isSuperAdminInsideStore && isSandboxBetaStore"
        class="bg-indigo-50 border-b border-indigo-200 px-4 md:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-900 z-20"
      >
        <div class="flex items-center gap-2 font-medium">
          <span>🧪</span>
          <span>
            <strong>Loja Beta / Testes Trinusphere</strong> — Você está operando
            <strong>{{ activeStore?.storeName || "Loja Beta" }}</strong> (pertence à Trinusphere). Criação e edição liberadas para validação em PRD.
          </span>
        </div>
        <button
          @click="openPlatformBackoffice"
          class="font-bold text-indigo-800 hover:text-indigo-950 underline shrink-0"
        >
          Voltar ao Painel Trinusphere →
        </button>
      </div>

      <!-- Banner de Modo Somente Leitura (quando SUPER_ADMIN inspeciona loja de CLIENTE) -->
      <div
        v-if="isReadOnlyStoreInspection"
        class="bg-amber-50 border-b border-amber-200 px-4 md:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 z-20"
      >
        <div class="flex items-center gap-2 font-medium">
          <Eye :size="16" class="text-amber-600 shrink-0" />
          <span>
            <strong>Modo Auditoria / Suporte (Somente Leitura)</strong> — Visualizando
            <strong>{{ activeStore?.storeName || "Unidade Selecionada" }}</strong>. O Super
            Administrador não pode cadastrar, editar ou excluir dados operacionais do cliente.
          </span>
        </div>
        <button
          @click="openPlatformBackoffice"
          class="font-bold text-amber-800 hover:text-amber-950 underline shrink-0"
        >
          Voltar ao Painel Trinusphere →
        </button>
      </div>

      <!-- Toast de bloqueio caso tente salvar em modo somente leitura -->
      <div
        v-if="readOnlyAlertMessage"
        class="bg-red-600 text-white px-4 md:px-8 py-2.5 flex items-center justify-between text-xs font-bold shadow-md z-30"
      >
        <div class="flex items-center gap-2">
          <ShieldAlert :size="16" class="shrink-0" />
          <span>{{ readOnlyAlertMessage }}</span>
        </div>
        <button @click="readOnlyAlertMessage = ''" class="text-white/80 hover:text-white">
          ✕
        </button>
      </div>

      <!-- Conteúdo Principal -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <div :key="storeViewKey" class="p-4 md:p-8 max-w-[1600px] mx-auto">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </div>
    </main>

    <StoreSettingsModal
      v-if="isStoreSettingsOpen"
      @close="isStoreSettingsOpen = false"
    />

    <UserProfileModal
      v-if="isUserProfileOpen"
      @close="isUserProfileOpen = false"
    />
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease-out;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
