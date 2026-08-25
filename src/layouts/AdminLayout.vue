<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import Sidebar from "../components/ui/Sidebar.vue";
import { Bell, Search, UserCircle, Menu, X, LogOut } from "lucide-vue-next";
import { authState } from "../utils/auth";

const router = useRouter();
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

// Computed properties para exibir informações do usuário
const userName = computed(() =>
  authState.currentUser ? authState.currentUser.name : "Convidado",
);
const userRole = computed(() =>
  authState.currentUser ? authState.currentUser.role : "N/A",
);

const handleLogout = () => {
  authState.logout();
  router.push("/"); // Redireciona para a página de login
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

    <!-- Sidebar: Adaptável -->
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
        class="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-8 shadow-sm z-30"
      >
        <div class="flex items-center gap-4">
          <button
            @click="toggleMobileMenu"
            class="p-2 hover:bg-slate-100 rounded-lg md:hidden text-slate-500"
          >
            <Menu v-if="!isMobileMenuOpen" :size="24" />
            <X v-else :size="24" />
          </button>

          <div class="relative hidden sm:block max-w-xs lg:max-w-md w-full">
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

        <div class="flex items-center gap-2 md:gap-6">
          <button
            class="p-2 text-slate-400 hover:text-orange-500 transition-colors relative"
          >
            <Bell :size="20" />
            <span
              class="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"
            ></span>
          </button>

          <div
            class="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200"
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
            <button
              @click="handleLogout"
              class="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut :size="20" />
            </button>
          </div>
        </div>
      </header>

      <!-- Conteúdo Principal -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <div class="p-4 md:p-8 max-w-[1600px] mx-auto">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </div>
    </main>
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
