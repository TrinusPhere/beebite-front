<script setup>
import { ref } from "vue";
import { X, User, KeyRound, CheckCircle2 } from "lucide-vue-next";
import { authState } from "@/utils/auth";

const emit = defineEmits(["close"]);

const name = ref(authState.currentUser?.name || "");
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

const handleSave = async () => {
  errorMsg.value = "";
  successMsg.value = "";

  if (!name.value || name.value.trim().length < 2) {
    errorMsg.value = "O nome deve ter pelo menos 2 caracteres.";
    return;
  }

  if (newPassword.value) {
    if (!currentPassword.value) {
      errorMsg.value = "Informe sua senha atual para definir uma nova senha.";
      return;
    }
    if (newPassword.value.length < 6) {
      errorMsg.value = "A nova senha deve ter no mínimo 6 caracteres.";
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      errorMsg.value = "A confirmação da nova senha não confere.";
      return;
    }
  }

  loading.value = true;
  try {
    await authState.updateProfile({
      name: name.value.trim(),
      currentPassword: newPassword.value ? currentPassword.value : null,
      newPassword: newPassword.value ? newPassword.value : null,
    });
    successMsg.value = "Perfil atualizado com sucesso!";
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    setTimeout(() => emit("close"), 900);
  } catch (err) {
    errorMsg.value =
      err?.response?.data?.message ||
      "Não foi possível atualizar o perfil. Verifique sua senha atual.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div
    class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
  >
    <div
      class="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl"
    >
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold"
          >
            <User :size="18" />
          </div>
          <div>
            <h3 class="text-base font-black text-slate-900">
              Meu Perfil & Segurança
            </h3>
            <p class="text-xs text-slate-500">
              {{ authState.currentUser?.login }} · {{ authState.currentUser?.role }}
            </p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X :size="18" />
        </button>
      </div>

      <div
        v-if="errorMsg"
        class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
      >
        {{ errorMsg }}
      </div>
      <div
        v-if="successMsg"
        class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2"
      >
        <CheckCircle2 :size="16" />
        <span>{{ successMsg }}</span>
      </div>

      <div class="space-y-4 text-xs">
        <div>
          <label class="block text-slate-600 font-bold mb-1">Nome de Exibição</label>
          <input
            v-model="name"
            type="text"
            class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
          />
        </div>

        <div class="pt-3 border-t border-slate-100 space-y-3">
          <p class="font-bold text-slate-700 flex items-center gap-1.5">
            <KeyRound :size="14" class="text-orange-500" />
            <span>Alterar Senha (Opcional)</span>
          </p>
          <div>
            <label class="block text-slate-500 mb-1">Senha Atual</label>
            <input
              v-model="currentPassword"
              type="password"
              placeholder="Digite sua senha atual"
              class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:border-orange-500"
            />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block text-slate-500 mb-1">Nova Senha</label>
              <input
                v-model="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label class="block text-slate-500 mb-1">Confirmar Nova Senha</label>
              <input
                v-model="confirmPassword"
                type="password"
                placeholder="Repita a nova senha"
                class="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          @click="$emit('close')"
          class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          @click="handleSave"
          :disabled="loading"
          class="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20"
        >
          {{ loading ? "Salvando..." : "Salvar Alterações" }}
        </button>
      </div>
    </div>
  </div>
</template>

