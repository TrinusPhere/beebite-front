<script setup>
import { ref, onMounted } from "vue";
import { Plus, RefreshCw, Check, XCircle } from "lucide-vue-next";
import { platformService } from "@/services/platformService";

const loading = ref(false);
const errorMsg = ref("");
const invoices = ref([]);
const contracts = ref([]);
const statusFilter = ref("");

const showCreateModal = ref(false);
const showPayModal = ref(false);

const createForm = ref({
  contractId: "",
  tenantId: "",
  referenceMonth: new Date().toISOString().slice(0, 7),
  description: "",
  amount: 0,
  dueDate: new Date().toISOString().slice(0, 10),
});

const payForm = ref({
  invoiceId: "",
  tenantTradeName: "",
  amount: 0,
  paymentMethod: "PIX",
  notes: "",
});

const formatCurrency = (val) =>
  Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const loadData = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {};
    const [inv, con] = await Promise.all([
      platformService.listInvoices(params),
      platformService.listContracts(),
    ]);
    invoices.value = inv;
    contracts.value = con;
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao carregar faturas.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const handleGenerateNextMonth = async () => {
  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const ym = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;
  try {
    await platformService.generateMonthlyInvoices(ym);
    await loadData();
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao gerar mensalidades.";
  }
};

const openCreateModal = () => {
  if (contracts.value.length > 0) {
    const first = contracts.value[0];
    createForm.value.contractId = first.id;
    createForm.value.tenantId = first.tenantId;
    createForm.value.amount = Number(first.monthlyFee || 0);
  }
  showCreateModal.value = true;
};

const onSelectContractForInvoice = () => {
  const found = contracts.value.find((c) => c.id === createForm.value.contractId);
  if (found) {
    createForm.value.tenantId = found.tenantId;
    if (!createForm.value.amount) {
      createForm.value.amount = Number(found.monthlyFee || 0);
    }
  }
};

const submitCreateInvoice = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    await platformService.createInvoice({
      tenantId: createForm.value.tenantId,
      contractId: createForm.value.contractId,
      referenceMonth: createForm.value.referenceMonth,
      description: createForm.value.description,
      amount: createForm.value.amount,
      dueDate: createForm.value.dueDate,
    });
    showCreateModal.value = false;
    await loadData();
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao lançar fatura.";
  } finally {
    loading.value = false;
  }
};

const openPayModal = (inv) => {
  payForm.value = {
    invoiceId: inv.id,
    tenantTradeName: inv.tenantTradeName,
    amount: inv.amount,
    paymentMethod: "PIX",
    notes: "",
  };
  showPayModal.value = true;
};

const submitPayInvoice = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    await platformService.markInvoicePaid(payForm.value.invoiceId, {
      paymentMethod: payForm.value.paymentMethod,
      notes: payForm.value.notes,
    });
    showPayModal.value = false;
    await loadData();
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao dar baixa na fatura.";
  } finally {
    loading.value = false;
  }
};

const handleCancelInvoice = async (invoiceId) => {
  try {
    await platformService.cancelInvoice(invoiceId, "Cancelada via Trinusphere Backoffice");
    await loadData();
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao cancelar fatura.";
  }
};
</script>

<template>
  <div class="space-y-6">
    <div
      class="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
    >
      <div>
        <h1 class="text-2xl font-black text-slate-900">
          Faturas SaaS & Contas a Receber
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          Gere mensalidades em lote, lance cobranças avulsas e registre recebimentos via PIX ou Boleto.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <select
          v-model="statusFilter"
          @change="loadData"
          class="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
        >
          <option value="">Todos os Status</option>
          <option value="PENDING">A Vencer</option>
          <option value="OVERDUE">Atrasadas</option>
          <option value="PAID">Pagas</option>
          <option value="CANCELLED">Canceladas</option>
        </select>

        <button
          @click="loadData"
          class="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw :size="17" :class="{ 'animate-spin': loading }" />
        </button>

        <button
          @click="openCreateModal"
          class="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold"
        >
          <Plus :size="15" />
          <span>Lançar Fatura Avulsa</span>
        </button>

        <button
          @click="handleGenerateNextMonth"
          class="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
        >
          ⚡ Gerar Mensalidades Próximo Mês
        </button>
      </div>
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
            <th class="py-3.5 px-4">Competência</th>
            <th class="py-3.5 px-4">Descrição</th>
            <th class="py-3.5 px-4">Vencimento</th>
            <th class="py-3.5 px-4">Valor</th>
            <th class="py-3.5 px-4">Status</th>
            <th class="py-3.5 px-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-slate-50/60">
            <td class="py-3.5 px-4 font-bold text-slate-900">{{ inv.tenantTradeName }}</td>
            <td class="py-3.5 px-4 font-mono text-slate-600">{{ inv.referenceMonth }}</td>
            <td class="py-3.5 px-4 text-slate-700">{{ inv.description }}</td>
            <td class="py-3.5 px-4 text-slate-600">{{ inv.dueDate }}</td>
            <td class="py-3.5 px-4 font-bold text-slate-900">{{ formatCurrency(inv.amount) }}</td>
            <td class="py-3.5 px-4">
              <span
                v-if="inv.status === 'PAID'"
                class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold"
              >
                ● PAGO ({{ inv.paymentMethod || "PIX" }})
              </span>
              <span
                v-else-if="inv.status === 'OVERDUE'"
                class="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold"
              >
                ⚠️ ATRASADA
              </span>
              <span
                v-else-if="inv.status === 'CANCELLED'"
                class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold"
              >
                ✕ CANCELADA
              </span>
              <span
                v-else
                class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold"
              >
                ● A VENCER
              </span>
            </td>
            <td class="py-3.5 px-4 text-right space-x-2">
              <button
                v-if="inv.status === 'PENDING' || inv.status === 'OVERDUE'"
                @click="openPayModal(inv)"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
              >
                <Check :size="13" />
                <span>Dar Baixa</span>
              </button>
              <button
                v-if="inv.status === 'PENDING' || inv.status === 'OVERDUE'"
                @click="handleCancelInvoice(inv.id)"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 text-xs font-bold"
                title="Cancelar Fatura"
              >
                <XCircle :size="13" />
              </button>
              <span v-else class="text-slate-400">Finalizada</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL: NOVA FATURA AVULSA -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-black text-slate-900">Lançar Fatura Avulsa</h3>
          <button @click="showCreateModal = false" class="text-xs px-2 py-1 border rounded-lg">✕</button>
        </div>
        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-600 font-bold mb-1">Contrato / Cliente *</label>
            <select
              v-model="createForm.contractId"
              @change="onSelectContractForInvoice"
              class="w-full px-3 py-2 rounded-lg border border-slate-200"
            >
              <option v-for="c in contracts" :key="c.id" :value="c.id">
                {{ c.tenantTradeName }} — {{ c.planName }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Descrição *</label>
            <input
              v-model="createForm.description"
              placeholder="Ex: Treinamento / Implantação Extra"
              class="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-slate-600 font-bold mb-1">Valor (R$) *</label>
              <input v-model.number="createForm.amount" type="number" step="0.01" class="w-full px-2.5 py-2 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label class="block text-slate-600 font-bold mb-1">Competência *</label>
              <input v-model="createForm.referenceMonth" placeholder="2026-11" class="w-full px-2.5 py-2 rounded-lg border border-slate-200 font-mono" />
            </div>
            <div>
              <label class="block text-slate-600 font-bold mb-1">Vencimento *</label>
              <input v-model="createForm.dueDate" type="date" class="w-full px-2.5 py-2 rounded-lg border border-slate-200" />
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button @click="showCreateModal = false" class="px-4 py-2 rounded-xl border text-xs font-bold">Cancelar</button>
          <button @click="submitCreateInvoice" :disabled="loading" class="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold">Gerar Fatura</button>
        </div>
      </div>
    </div>

    <!-- MODAL: DAR BAIXA NA FATURA -->
    <div
      v-if="showPayModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span class="text-xs font-bold text-orange-600 uppercase">{{ payForm.tenantTradeName }}</span>
            <h3 class="text-base font-black text-slate-900">
              Registrar Pagamento ({{ formatCurrency(payForm.amount) }})
            </h3>
          </div>
          <button @click="showPayModal = false" class="text-xs px-2 py-1 border rounded-lg">✕</button>
        </div>
        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-600 font-bold mb-1">Forma de Pagamento</label>
            <select v-model="payForm.paymentMethod" class="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="PIX">PIX</option>
              <option value="BOLETO">Boleto Bancário</option>
              <option value="CARTAO">Cartão de Crédito</option>
              <option value="TRANSFERENCIA">Transferência / TED</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Observação / Comprovante</label>
            <input v-model="payForm.notes" placeholder="Ex: PIX confirmado no banco" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button @click="showPayModal = false" class="px-4 py-2 rounded-xl border text-xs font-bold">Cancelar</button>
          <button @click="submitPayInvoice" :disabled="loading" class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Confirmar Recebimento</button>
        </div>
      </div>
    </div>
  </div>
</template>

