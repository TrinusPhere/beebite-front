<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Building2,
  Plus,
  DollarSign,
  FileText,
  Cloud,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  Copy,
  ExternalLink,
  RefreshCw,
} from "lucide-vue-next";
import { platformService } from "@/services/platformService";
import { authState } from "@/utils/auth";

const router = useRouter();
const activeTab = ref("overview");
const loading = ref(false);
const errorMessage = ref("");

const overview = ref({
  totalTenants: 0,
  activeTenants: 0,
  suspendedTenants: 0,
  totalStores: 0,
  cloudStores: 0,
  edgeStores: 0,
  mrrAmount: 0,
  receivedThisMonth: 0,
  pendingThisMonth: 0,
  overdueAmount: 0,
  overdueInvoicesCount: 0,
});

const tenants = ref([]);
const invoices = ref([]);

const showOnboardModal = ref(false);
const showEdgeTokenModal = ref(false);
const selectedEdgeStore = ref({ storeName: "", storeId: "", token: "" });

const onboardForm = ref({
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

const formatCurrency = (val) => {
  const num = Number(val || 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const loadAllData = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [ov, tn, inv] = await Promise.all([
      platformService.getOverview(),
      platformService.listTenants(),
      platformService.listInvoices(),
    ]);
    overview.value = ov;
    tenants.value = tn;
    invoices.value = inv;
    await authState.refreshAccessibleStores();
  } catch (err) {
    errorMessage.value =
      err?.response?.data?.message ||
      "Erro ao carregar dados do Trinusphere Backoffice.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAllData();
});

const addStoreRowToForm = () => {
  onboardForm.value.stores.push({
    name: "",
    cnpj: "",
    address: "",
    publicSlug: "",
    syncMode: "CLOUD",
  });
};

const removeStoreRowFromForm = (index) => {
  if (onboardForm.value.stores.length > 1) {
    onboardForm.value.stores.splice(index, 1);
  }
};

const submitOnboarding = async () => {
  errorMessage.value = "";
  const validStores = onboardForm.value.stores.filter(
    (s) => s.name && s.name.trim().length > 0,
  );
  if (validStores.length === 0) {
    errorMessage.value = "Informe ao menos uma loja para o cliente.";
    return;
  }

  try {
    loading.value = true;
    const payload = {
      ...onboardForm.value,
      stores: validStores,
    };
    const result = await platformService.onboardClient(payload);
    showOnboardModal.value = false;
    await loadAllData();
    activeTab.value = "tenants";

    const edgeProvisioned = (result.stores || []).find(
      (s) => s.syncMode === "EDGE" && s.generatedEdgeDeviceToken,
    );
    if (edgeProvisioned) {
      openEdgeTokenModal(
        edgeProvisioned.storeName,
        edgeProvisioned.storeId,
        edgeProvisioned.generatedEdgeDeviceToken,
      );
    }
  } catch (err) {
    errorMessage.value =
      err?.response?.data?.message || "Falha ao realizar onboarding do cliente.";
  } finally {
    loading.value = false;
  }
};

const openEdgeTokenModal = (storeName, storeId, token) => {
  selectedEdgeStore.value = {
    storeName,
    storeId,
    token: token || "Token configurado no banco",
  };
  showEdgeTokenModal.value = true;
};

const copyEnvSnippet = async () => {
  const snippet = `STORE_ID=${selectedEdgeStore.value.storeId}\nBITEFLOW_SYNC_MODE=EDGE\nCLOUD_SYNC_URL=https://api.trinusphere.com\nEDGE_DEVICE_TOKEN=${selectedEdgeStore.value.token}`;
  try {
    await navigator.clipboard.writeText(snippet);
  } catch {
    // ignore clipboard errors
  }
};

const toggleTenantStatus = async (tenant) => {
  const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  try {
    await platformService.changeTenantStatus(tenant.id, nextStatus);
    await loadAllData();
  } catch (err) {
    errorMessage.value =
      err?.response?.data?.message || "Erro ao alterar status do cliente.";
  }
};

const inspectStore = async (storeId) => {
  const switched = await authState.switchStore(storeId);
  if (switched) {
    router.push("/dashboard");
  }
};

const handlePayInvoice = async (invoiceId) => {
  try {
    await platformService.markInvoicePaid(invoiceId, {
      paymentMethod: "PIX",
      notes: "Baixa realizada via Trinusphere Backoffice",
    });
    await loadAllData();
  } catch (err) {
    errorMessage.value =
      err?.response?.data?.message || "Erro ao dar baixa na fatura.";
  }
};

const handleGenerateNextMonth = async () => {
  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const ym = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;
  try {
    await platformService.generateMonthlyInvoices(ym);
    await loadAllData();
  } catch (err) {
    errorMessage.value =
      err?.response?.data?.message || "Erro ao gerar mensalidades.";
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Cabeçalho Principal -->
    <div
      class="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
    >
      <div>
        <div class="flex items-center gap-2">
          <span
            class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500 text-white"
          >
            Trinusphere Control Plane
          </span>
          <span class="text-xs text-slate-500 font-medium">
            Gestão de Clientes SaaS, Multi-Lojas, Contratos & MRR
          </span>
        </div>
        <h1 class="text-2xl font-black text-slate-900 mt-1">
          Backoffice Comercial & Financeiro Trinusphere
        </h1>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="loadAllData"
          class="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
          title="Atualizar dados"
        >
          <RefreshCw :size="18" :class="{ 'animate-spin': loading }" />
        </button>
        <button
          @click="showOnboardModal = true"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all"
        >
          <Plus :size="18" />
          <span>Novo Cliente (Onboarding 1-Clique)</span>
        </button>
      </div>
    </div>

    <!-- Mensagem de Erro -->
    <div
      v-if="errorMessage"
      class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
    >
      {{ errorMessage }}
    </div>

    <!-- Navegação de Abas -->
    <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
      <button
        @click="activeTab = 'overview'"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-bold transition-all',
          activeTab === 'overview'
            ? 'bg-orange-500 text-white shadow-sm'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200',
        ]"
      >
        📊 Visão Geral & MRR
      </button>
      <button
        @click="activeTab = 'tenants'"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-bold transition-all',
          activeTab === 'tenants'
            ? 'bg-orange-500 text-white shadow-sm'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200',
        ]"
      >
        🏢 Clientes & Lojas ({{ tenants.length }})
      </button>
      <button
        @click="activeTab = 'billing'"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-bold transition-all',
          activeTab === 'billing'
            ? 'bg-orange-500 text-white shadow-sm'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200',
        ]"
      >
        📄 Contratos & Mensalidades ({{ invoices.length }})
      </button>
    </div>

    <!-- ABA 1: VISÃO GERAL & MRR -->
    <div v-if="activeTab === 'overview'" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p class="text-xs font-bold uppercase text-slate-400">
            MRR (Receita Recorrente Mensal)
          </p>
          <p class="text-2xl font-black text-emerald-600 mt-1">
            {{ formatCurrency(overview.mrrAmount) }}
          </p>
          <p class="text-xs text-slate-500 mt-1">
            {{ overview.activeTenants }} cliente(s) ativo(s)
          </p>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p class="text-xs font-bold uppercase text-slate-400">
            Total de Clientes & Lojas
          </p>
          <p class="text-2xl font-black text-slate-900 mt-1">
            {{ overview.totalTenants }} Clientes · {{ overview.totalStores }} Lojas
          </p>
          <p class="text-xs text-slate-500 mt-1">
            {{ overview.cloudStores }} Cloud (Online) · {{ overview.edgeStores }} Edge (PDV Local)
          </p>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p class="text-xs font-bold uppercase text-slate-400">
            Total Recebido (Faturas Pagas)
          </p>
          <p class="text-2xl font-black text-orange-600 mt-1">
            {{ formatCurrency(overview.receivedThisMonth) }}
          </p>
          <p class="text-xs text-slate-500 mt-1">
            {{ formatCurrency(overview.pendingThisMonth) }} a vencer
          </p>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p class="text-xs font-bold uppercase text-slate-400">
            Inadimplência (Em Atraso)
          </p>
          <p class="text-2xl font-black text-amber-600 mt-1">
            {{ formatCurrency(overview.overdueAmount) }}
          </p>
          <p class="text-xs text-slate-500 mt-1">
            {{ overview.overdueInvoicesCount }} fatura(s) vencida(s)
          </p>
        </div>
      </div>

      <!-- Resumo da Carteira -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div
          class="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
        >
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Carteira de Clientes Trinusphere
          </h3>
          <button
            @click="activeTab = 'tenants'"
            class="text-xs font-bold text-orange-600 hover:underline"
          >
            Gerenciar Lojas e Tokens Edge →
          </button>
        </div>
        <div class="divide-y divide-slate-100">
          <div
            v-for="tenant in tenants"
            :key="tenant.id"
            class="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/60"
          >
            <div>
              <div class="flex items-center gap-2.5">
                <span class="font-bold text-slate-900">{{ tenant.tradeName }}</span>
                <span class="text-xs text-slate-400">({{ tenant.companyName }})</span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-[11px] font-bold',
                    tenant.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700',
                  ]"
                >
                  {{ tenant.status }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Proprietário: <strong>{{ tenant.ownerName }}</strong> ·
                {{ tenant.storesCount }} unidade(s) · Mensalidade Ativa:
                <strong>{{ formatCurrency(tenant.activeMonthlyFee) }}/mês</strong>
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span
                v-for="st in tenant.stores"
                :key="st.id"
                class="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
              >
                {{ st.syncMode === "EDGE" ? "💻" : "☁️" }} {{ st.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ABA 2: CLIENTES & LOJAS -->
    <div v-if="activeTab === 'tenants'" class="space-y-4">
      <div
        v-for="tenant in tenants"
        :key="tenant.id"
        class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <div
          class="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100"
        >
          <div>
            <div class="flex items-center gap-2.5">
              <Building2 :size="20" class="text-orange-500" />
              <h3 class="text-lg font-black text-slate-900">
                {{ tenant.tradeName }}
              </h3>
              <span class="text-xs text-slate-400">({{ tenant.companyName }})</span>
              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-xs font-bold',
                  tenant.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700',
                ]"
              >
                {{ tenant.status === "ACTIVE" ? "CONTRATO ATIVO" : "SUSPENSO" }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              👤 Proprietário: <strong>{{ tenant.ownerName }}</strong> · 📄 Doc:
              {{ tenant.documentNumber || "N/A" }} · 📞 {{ tenant.phone || "N/A" }} · 💰 MRR:
              <strong>{{ formatCurrency(tenant.activeMonthlyFee) }}/mês</strong>
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="toggleTenantStatus(tenant)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <PauseCircle v-if="tenant.status === 'ACTIVE'" :size="15" />
              <PlayCircle v-else :size="15" />
              <span>{{
                tenant.status === "ACTIVE" ? "Suspender Cliente" : "Reativar Cliente"
              }}</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="store in tenant.stores"
            :key="store.id"
            class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="font-bold text-sm text-slate-900">{{ store.name }}</span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1',
                    store.syncMode === 'EDGE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-sky-100 text-sky-800',
                  ]"
                >
                  <HardDrive v-if="store.syncMode === 'EDGE'" :size="13" />
                  <Cloud v-else :size="13" />
                  {{ store.syncMode }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                CNPJ: <strong>{{ store.cnpj || "Não informado" }}</strong> · ID:
                <code class="text-[11px] bg-white px-1.5 py-0.5 rounded border">{{
                  store.id
                }}</code>
              </p>
            </div>

            <div
              class="flex items-center justify-between pt-3 border-t border-slate-200/80"
            >
              <button
                @click="inspectStore(store.id)"
                class="flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline"
              >
                <ExternalLink :size="14" />
                <span>Inspecionar Loja</span>
              </button>

              <button
                v-if="store.syncMode === 'EDGE'"
                @click="
                  openEdgeTokenModal(store.name, store.id, store.edgeDeviceToken)
                "
                class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 hover:border-orange-400 text-slate-700"
              >
                <Copy :size="13" />
                <span>Ver Kit Edge (.env)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ABA 3: CONTRATOS & MENSALIDADES -->
    <div v-if="activeTab === 'billing'" class="space-y-4">
      <div
        class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h3 class="text-base font-bold text-slate-900">
            Faturas SaaS & Contas a Receber
          </h3>
          <p class="text-xs text-slate-500">
            Gere as mensalidades do mês e dê baixa nos pagamentos recebidos via PIX ou Boleto.
          </p>
        </div>
        <button
          @click="handleGenerateNextMonth"
          class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all"
        >
          ⚡ Gerar Mensalidades do Próximo Mês
        </button>
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
              <th class="py-3.5 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-slate-50/60">
              <td class="py-3.5 px-4 font-bold text-slate-900">
                {{ inv.tenantTradeName }}
              </td>
              <td class="py-3.5 px-4 font-mono text-slate-600">
                {{ inv.referenceMonth }}
              </td>
              <td class="py-3.5 px-4 text-slate-700">{{ inv.description }}</td>
              <td class="py-3.5 px-4 text-slate-600">{{ inv.dueDate }}</td>
              <td class="py-3.5 px-4 font-bold text-slate-900">
                {{ formatCurrency(inv.amount) }}
              </td>
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
                  ⚠️ ATRASADO
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold"
                >
                  ● A VENCER
                </span>
              </td>
              <td class="py-3.5 px-4 text-right">
                <button
                  v-if="inv.status !== 'PAID'"
                  @click="handlePayInvoice(inv.id)"
                  class="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
                >
                  ✓ Dar Baixa (PIX)
                </button>
                <span v-else class="text-slate-400">Liquidado</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: ONBOARDING 1-CLIQUE -->
    <div
      v-if="showOnboardModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span class="text-xs font-bold uppercase text-orange-600"
              >Onboarding 1-Clique</span
            >
            <h3 class="text-lg font-black text-slate-900">
              Cadastrar Novo Cliente + Login do Dono + Lojas + Contrato
            </h3>
          </div>
          <button
            @click="showOnboardModal = false"
            class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs"
          >
            ✕ Fechar
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- 1. Dados do Cliente -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <p class="font-bold text-orange-600 uppercase">
              1. Dados do Cliente & Login Exclusivo do Proprietário
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-600 font-semibold mb-1"
                  >Nome Fantasia *</label
                >
                <input
                  v-model="onboardForm.tradeName"
                  type="text"
                  placeholder="Ex: Chefs Burguer"
                  class="w-full px-3 py-2 rounded-lg bg-white border border-slate-200"
                />
              </div>
              <div>
                <label class="block text-slate-600 font-semibold mb-1"
                  >Razão Social *</label
                >
                <input
                  v-model="onboardForm.companyName"
                  type="text"
                  placeholder="Ex: Chefs Burguer Gastronomia Ltda"
                  class="w-full px-3 py-2 rounded-lg bg-white border border-slate-200"
                />
              </div>
              <div>
                <label class="block text-slate-600 font-semibold mb-1"
                  >Nome do Proprietário *</label
                >
                <input
                  v-model="onboardForm.ownerName"
                  type="text"
                  placeholder="Ex: João da Silva"
                  class="w-full px-3 py-2 rounded-lg bg-white border border-slate-200"
                />
              </div>
              <div>
                <label class="block text-slate-600 font-semibold mb-1"
                  >WhatsApp / Telefone</label
                >
                <input
                  v-model="onboardForm.phone"
                  type="text"
                  placeholder="(11) 99999-9999"
                  class="w-full px-3 py-2 rounded-lg bg-white border border-slate-200"
                />
              </div>
              <div>
                <label class="block text-slate-600 font-semibold mb-1"
                  >Login Exclusivo do Cliente (ADMIN) *</label
                >
                <input
                  v-model="onboardForm.ownerLogin"
                  type="text"
                  placeholder="Ex: chefsburguer"
                  class="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label class="block text-slate-600 font-semibold mb-1"
                  >Senha Inicial do Cliente *</label
                >
                <input
                  v-model="onboardForm.ownerInitialPassword"
                  type="text"
                  placeholder="Ex: Chefs@2026!"
                  class="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <!-- 2. Lojas do Cliente -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div class="flex items-center justify-between">
              <p class="font-bold text-orange-600 uppercase">
                2. Unidades / Lojas deste Cliente (com CNPJ próprio)
              </p>
              <button
                type="button"
                @click="addStoreRowToForm"
                class="text-xs font-bold text-orange-600 hover:underline"
              >
                + Adicionar Outra Loja
              </button>
            </div>

            <div
              v-for="(st, idx) in onboardForm.stores"
              :key="idx"
              class="p-3 rounded-xl bg-white border border-slate-200 space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-800">Unidade {{ idx + 1 }}</span>
                <button
                  v-if="onboardForm.stores.length > 1"
                  type="button"
                  @click="removeStoreRowFromForm(idx)"
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

          <!-- 3. Contrato SaaS -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <p class="font-bold text-orange-600 uppercase">
              3. Contrato & Mensalidade SaaS
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label class="block text-slate-600 font-semibold mb-1">Plano</label>
                <input
                  v-model="onboardForm.contract.planName"
                  type="text"
                  class="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200"
                />
              </div>
              <div>
                <label class="block text-slate-600 font-semibold mb-1"
                  >Mensalidade (R$)</label
                >
                <input
                  v-model.number="onboardForm.contract.monthlyFee"
                  type="number"
                  step="0.01"
                  class="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200"
                />
              </div>
              <div>
                <label class="block text-slate-600 font-semibold mb-1"
                  >Taxa Setup (R$)</label
                >
                <input
                  v-model.number="onboardForm.contract.setupFee"
                  type="number"
                  step="0.01"
                  class="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200"
                />
              </div>
              <div>
                <label class="block text-slate-600 font-semibold mb-1"
                  >Dia Vencimento</label
                >
                <input
                  v-model.number="onboardForm.contract.billingDay"
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
            @click="showOnboardModal = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
          >
            Cancelar
          </button>
          <button
            @click="submitOnboarding"
            :disabled="loading"
            class="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20"
          >
            🚀 Criar Cliente, Login, Lojas & Gerar Token Edge
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: KIT EDGE (.ENV) -->
    <div
      v-if="showEdgeTokenModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl"
      >
        <div class="text-xs font-bold uppercase text-emerald-600">
          ✅ Kit de Implantação Local (Edge Offline-First)
        </div>
        <h3 class="text-base font-black text-slate-900">
          {{ selectedEdgeStore.storeName }}
        </h3>
        <p class="text-xs text-slate-500">
          Copie as variáveis abaixo para o arquivo <code>.env</code> da máquina local do
          balcão desta unidade:
        </p>
        <pre
          class="p-4 rounded-xl bg-slate-900 text-sky-300 text-xs font-mono overflow-x-auto"
        >STORE_ID={{ selectedEdgeStore.storeId }}
BITEFLOW_SYNC_MODE=EDGE
CLOUD_SYNC_URL=https://api.trinusphere.com
EDGE_DEVICE_TOKEN={{ selectedEdgeStore.token }}</pre>
        <div class="flex items-center justify-between pt-2">
          <button
            @click="copyEnvSnippet"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50"
          >
            <Copy :size="14" />
            <span>Copiar variáveis .env</span>
          </button>
          <button
            @click="showEdgeTokenModal = false"
            class="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

