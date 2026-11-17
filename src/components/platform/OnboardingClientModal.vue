<script setup>
import { ref } from "vue";
import { platformService } from "@/services/platformService";

const emit = defineEmits(["close", "created"]);

const loading = ref(false);
const errorMsg = ref("");

const form = ref({
  companyName: "",
  tradeName: "",
  ownerName: "",
  documentNumber: "",
  email: "",
  phone: "",
  ownerLogin: "",
  ownerInitialPassword: "",
  stores: [
    { name: "", cnpj: "", address: "", publicSlug: "", syncMode: "CLOUD" },
    { name: "", cnpj: "", address: "", publicSlug: "", syncMode: "EDGE" },
  ],
  contract: {
    planName: "HIBRIDO_MULTI",
    monthlyFee: 399.0,
    setupFee: 299.0,
    billingDay: 10,
    includesIfood: true,
    includesEdgeSync: true,
  },
});

const addStoreRow = () => {
  form.value.stores.push({
    name: "",
    cnpj: "",
    address: "",
    publicSlug: "",
    syncMode: "CLOUD",
  });
};

const removeStoreRow = (idx) => {
  if (form.value.stores.length > 1) {
    form.value.stores.splice(idx, 1);
  }
};

const submit = async () => {
  errorMsg.value = "";
  const validStores = form.value.stores.filter((s) => s.name && s.name.trim().length > 0);
  if (validStores.length === 0) {
    errorMsg.value = "Informe ao menos uma loja para o cliente.";
    return;
  }

  loading.value = true;
  try {
    const result = await platformService.onboardClient({
      ...form.value,
      stores: validStores,
    });
    emit("created", result);
  } catch (err) {
    errorMsg.value =
      err?.response?.data?.message || "Falha ao realizar onboarding do cliente.";
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
      class="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl"
    >
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="text-xs font-bold uppercase text-orange-600">
            Onboarding 1-Clique
          </span>
          <h3 class="text-lg font-black text-slate-900">
            Cadastrar Novo Cliente + Login do Dono + Lojas + Contrato
          </h3>
        </div>
        <button
          @click="$emit('close')"
          class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs"
        >
          ✕ Fechar
        </button>
      </div>

      <div
        v-if="errorMsg"
        class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
      >
        {{ errorMsg }}
      </div>

      <div class="space-y-4 text-xs">
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <p class="font-bold text-orange-600 uppercase">
            1. Dados do Cliente & Login Exclusivo do Proprietário
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-600 font-semibold mb-1">Nome Fantasia *</label>
              <input
                v-model="form.tradeName"
                type="text"
                placeholder="Ex: Chefs Burguer"
                class="w-full px-3 py-2 rounded-lg bg-white border border-slate-200"
              />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold mb-1">Razão Social *</label>
              <input
                v-model="form.companyName"
                type="text"
                placeholder="Ex: Chefs Burguer Gastronomia Ltda"
                class="w-full px-3 py-2 rounded-lg bg-white border border-slate-200"
              />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold mb-1">Proprietário *</label>
              <input
                v-model="form.ownerName"
                type="text"
                placeholder="Ex: João da Silva"
                class="w-full px-3 py-2 rounded-lg bg-white border border-slate-200"
              />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold mb-1">WhatsApp / Telefone</label>
              <input
                v-model="form.phone"
                type="text"
                placeholder="(11) 99999-9999"
                class="w-full px-3 py-2 rounded-lg bg-white border border-slate-200"
              />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold mb-1">
                Login Exclusivo do Cliente (ADMIN) *
              </label>
              <input
                v-model="form.ownerLogin"
                type="text"
                placeholder="Ex: chefsburguer"
                class="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono"
              />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold mb-1">
                Senha Inicial do Cliente *
              </label>
              <input
                v-model="form.ownerInitialPassword"
                type="text"
                placeholder="Ex: Chefs@2026!"
                class="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div class="flex items-center justify-between">
            <p class="font-bold text-orange-600 uppercase">
              2. Unidades / Lojas deste Cliente (com CNPJ próprio)
            </p>
            <button
              type="button"
              @click="addStoreRow"
              class="text-xs font-bold text-orange-600 hover:underline"
            >
              + Adicionar Outra Loja
            </button>
          </div>

          <div
            v-for="(st, idx) in form.stores"
            :key="idx"
            class="p-3 rounded-xl bg-white border border-slate-200 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800">Unidade {{ idx + 1 }}</span>
              <button
                v-if="form.stores.length > 1"
                type="button"
                @click="removeStoreRow(idx)"
                class="text-red-500 text-xs"
              >
                Remover
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                v-model="st.name"
                type="text"
                placeholder="Nome (Ex: Chefs Burguer - Balcão)"
                class="px-2.5 py-1.5 rounded border border-slate-200"
              />
              <input
                v-model="st.cnpj"
                type="text"
                placeholder="CNPJ da Unidade"
                class="px-2.5 py-1.5 rounded border border-slate-200"
              />
              <select
                v-model="st.syncMode"
                class="px-2.5 py-1.5 rounded border border-slate-200"
              >
                <option value="CLOUD">☁️ CLOUD (Online / iFood)</option>
                <option value="EDGE">💻 EDGE (PDV Local Offline)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <p class="font-bold text-orange-600 uppercase">3. Contrato & Mensalidade SaaS</p>
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label class="block text-slate-600 font-semibold mb-1">Plano</label>
              <input
                v-model="form.contract.planName"
                type="text"
                class="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200"
              />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold mb-1">Mensalidade (R$)</label>
              <input
                v-model.number="form.contract.monthlyFee"
                type="number"
                step="0.01"
                class="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200"
              />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold mb-1">Taxa Setup (R$)</label>
              <input
                v-model.number="form.contract.setupFee"
                type="number"
                step="0.01"
                class="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200"
              />
            </div>
            <div>
              <label class="block text-slate-600 font-semibold mb-1">Dia Vencimento</label>
              <input
                v-model.number="form.contract.billingDay"
                type="number"
                min="1"
                max="28"
                class="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          @click="$emit('close')"
          class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
        >
          Cancelar
        </button>
        <button
          @click="submit"
          :disabled="loading"
          class="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20"
        >
          {{ loading ? "Provisionando..." : "🚀 Criar Cliente, Login, Lojas & Gerar Token" }}
        </button>
      </div>
    </div>
  </div>
</template>

