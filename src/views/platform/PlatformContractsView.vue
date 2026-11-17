<script setup>
import { ref, onMounted } from "vue";
import { Pencil, RefreshCw, FileText } from "lucide-vue-next";
import { platformService } from "@/services/platformService";

const loading = ref(false);
const errorMsg = ref("");
const contracts = ref([]);
const showEditModal = ref(false);

const editForm = ref({
  id: "",
  tenantTradeName: "",
  planName: "",
  billingCycle: "MONTHLY",
  monthlyFee: 0,
  maxStores: 1,
  includesIfood: true,
  includesEdgeSync: false,
  billingDay: 10,
  status: "ACTIVE",
  contractNotes: "",
});

const formatCurrency = (val) =>
  Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const loadContracts = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    contracts.value = await platformService.listContracts();
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao carregar contratos.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadContracts();
});

const openEdit = (c) => {
  editForm.value = {
    id: c.id,
    tenantTradeName: c.tenantTradeName,
    planName: c.planName,
    billingCycle: c.billingCycle || "MONTHLY",
    monthlyFee: Number(c.monthlyFee || 0),
    maxStores: c.maxStores || 1,
    includesIfood: Boolean(c.includesIfood),
    includesEdgeSync: Boolean(c.includesEdgeSync),
    billingDay: c.billingDay || 10,
    status: c.status || "ACTIVE",
    contractNotes: c.contractNotes || "",
  };
  showEditModal.value = true;
};

const saveContract = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    await platformService.updateContract(editForm.value.id, {
      planName: editForm.value.planName,
      billingCycle: editForm.value.billingCycle,
      monthlyFee: editForm.value.monthlyFee,
      maxStores: editForm.value.maxStores,
      includesIfood: editForm.value.includesIfood,
      includesEdgeSync: editForm.value.includesEdgeSync,
      billingDay: editForm.value.billingDay,
      status: editForm.value.status,
      contractNotes: editForm.value.contractNotes,
    });
    showEditModal.value = false;
    await loadContracts();
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao atualizar contrato.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <div
      class="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
    >
      <div>
        <h1 class="text-2xl font-black text-slate-900">Contratos & Planos SaaS</h1>
        <p class="text-xs text-slate-500 mt-1">
          Gerencie planos contratados, valores recorrentes, dias de vencimento e limites de lojas.
        </p>
      </div>
      <button
        @click="loadContracts"
        class="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
      >
        <RefreshCw :size="18" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <div
      v-if="errorMsg"
      class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
    >
      {{ errorMsg }}
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50 text-slate-500">
            <th class="py-3.5 px-4">Cliente</th>
            <th class="py-3.5 px-4">Plano</th>
            <th class="py-3.5 px-4">Mensalidade</th>
            <th class="py-3.5 px-4">Limite Lojas</th>
            <th class="py-3.5 px-4">Recursos</th>
            <th class="py-3.5 px-4">Dia Venc.</th>
            <th class="py-3.5 px-4">Status</th>
            <th class="py-3.5 px-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="c in contracts" :key="c.id" class="hover:bg-slate-50/60">
            <td class="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
              <FileText :size="15" class="text-orange-500" />
              <span>{{ c.tenantTradeName }}</span>
            </td>
            <td class="py-3.5 px-4 font-semibold text-slate-700">{{ c.planName }}</td>
            <td class="py-3.5 px-4 font-black text-emerald-700">
              {{ formatCurrency(c.monthlyFee) }}
            </td>
            <td class="py-3.5 px-4 text-slate-600">{{ c.maxStores }} loja(s)</td>
            <td class="py-3.5 px-4 space-x-1">
              <span
                v-if="c.includesIfood"
                class="px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold"
              >
                iFood
              </span>
              <span
                v-if="c.includesEdgeSync"
                class="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold"
              >
                Edge Offline
              </span>
            </td>
            <td class="py-3.5 px-4 text-slate-600">Dia {{ c.billingDay }}</td>
            <td class="py-3.5 px-4">
              <span
                :class="[
                  'px-2 py-0.5 rounded-full font-bold',
                  c.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700',
                ]"
              >
                {{ c.status }}
              </span>
            </td>
            <td class="py-3.5 px-4 text-right">
              <button
                @click="openEdit(c)"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-orange-400 font-bold text-slate-700 bg-white"
              >
                <Pencil :size="13" />
                <span>Editar</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL: EDITAR CONTRATO -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span class="text-xs font-bold text-orange-600 uppercase">{{ editForm.tenantTradeName }}</span>
            <h3 class="text-base font-black text-slate-900">Editar Contrato SaaS</h3>
          </div>
          <button @click="showEditModal = false" class="text-xs px-2 py-1 border rounded-lg">✕</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label class="block text-slate-600 font-bold mb-1">Plano *</label>
            <input v-model="editForm.planName" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Status</label>
            <select v-model="editForm.status" class="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="ACTIVE">ACTIVE</option>
              <option value="TRIAL">TRIAL</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Mensalidade (R$) *</label>
            <input v-model.number="editForm.monthlyFee" type="number" step="0.01" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Dia Vencimento (1-28)</label>
            <input v-model.number="editForm.billingDay" type="number" min="1" max="28" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Máximo de Lojas</label>
            <input v-model.number="editForm.maxStores" type="number" min="1" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div class="flex flex-col justify-center gap-1.5 pt-2">
            <label class="flex items-center gap-2 font-bold text-slate-700">
              <input type="checkbox" v-model="editForm.includesIfood" class="accent-orange-500" />
              <span>Inclui iFood</span>
            </label>
            <label class="flex items-center gap-2 font-bold text-slate-700">
              <input type="checkbox" v-model="editForm.includesEdgeSync" class="accent-orange-500" />
              <span>Inclui Edge Offline</span>
            </label>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-slate-600 font-bold mb-1">Observações do Contrato</label>
            <textarea v-model="editForm.contractNotes" rows="2" class="w-full px-3 py-2 rounded-lg border border-slate-200"></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button @click="showEditModal = false" class="px-4 py-2 rounded-xl border text-xs font-bold">Cancelar</button>
          <button @click="saveContract" :disabled="loading" class="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold">Salvar Contrato</button>
        </div>
      </div>
    </div>
  </div>
</template>

