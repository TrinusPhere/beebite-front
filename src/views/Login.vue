<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { LogIn, Lock, User, AlertCircle } from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { authState } from "@/utils/auth"; // Importar authState

const router = useRouter();
const loading = ref(false);
const errorMessage = ref("");

const form = reactive({
  login: "",
  password: "",
});

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const success = await authState.login(form.login, form.password);
    if (success) {
      router.push("/pedidos"); // Redirecionar para o dashboard após login bem-sucedido
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      errorMessage.value = "Usuário ou senha incorretos. Tente novamente.";
    } else {
      errorMessage.value =
        "Erro ao conectar com o servidor. Tente novamente mais tarde.";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/20 rotate-3 transition-transform hover:rotate-0 duration-500"
        >
          <span class="text-white text-3xl font-black font-sans">BF</span>
        </div>
        <h1 class="text-3xl font-bold text-slate-800 tracking-tight">
          BiteFlow
        </h1>
        <p class="text-slate-500 mt-2 font-medium">
          Controle de Vendas & Delivery
        </p>
      </div>

      <!-- Card de Login -->
      <div
        class="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl relative overflow-hidden"
      >
        <!-- Barra de Erro Reativa -->
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform -translate-y-4 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform -translate-y-4 opacity-0"
        >
          <div
            v-if="errorMessage"
            class="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm"
          >
            <AlertCircle :size="18" />
            {{ errorMessage }}
          </div>
        </transition>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-700 ml-1">Usuário</label>
            <div class="relative group">
              <User
                class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                :size="20"
              />
              <input
                v-model="form.login"
                type="text"
                placeholder="Ex: admin"
                required
                class="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-center ml-1">
              <label class="text-sm font-bold text-slate-700">Senha</label>
              <a
                href="#"
                class="text-xs text-orange-600 font-bold hover:underline transition-colors"
                >Esqueceu a senha?</a
              >
            </div>
            <div class="relative group">
              <Lock
                class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                :size="20"
              />
              <input
                v-model="form.password"
                type="password"
                placeholder="••••••••"
                required
                class="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <BaseButton
            type="submit"
            variant="primary"
            class="w-full py-4 text-lg font-bold"
            :loading="loading"
          >
            <LogIn :size="20" />
            Acessar Painel
          </BaseButton>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-100 text-center">
          <div class="p-3 bg-slate-50 rounded-xl inline-block">
            <p class="text-slate-500 text-xs font-medium">
              Credenciais de Teste:
            </p>
            <p class="text-orange-600 text-xs font-bold font-mono">
              admin / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
