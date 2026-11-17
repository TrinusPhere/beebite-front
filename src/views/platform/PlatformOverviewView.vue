<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Plus, RefreshCw, ShieldCheck, Building2 } from "lucide-vue-next";
import { platformService } from "@/services/platformService";
import { authState } from "@/utils/auth";
import OnboardingClientModal from "@/components/platform/OnboardingClientModal.vue";

const router = useRouter();
const loading = ref(false);
const errorMsg = ref("");
const showOnboardModal = ref(false);

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

const formatCurrency = (val) =>
  Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const loadData = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    const [ov, tn] = await Promise.all([
      platformService.getOverview(),
      platformService.listTenants(),
    ]);
    overview.value = ov;
    tenants.value = tn;
    await authState.refreshAccessibleStores();
  } catch (err) {
    errorMsg.value =
      err?.response?.data?.message || "Erro ao carregar visão geral da plataforma.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const handleOnboarded = () => {
  showOnboardModal.value = false;
  router.push("/platform/tenants");
};
</script>

<template>
  <div class="space-y-6">
    <!-- Cabeçalho -->
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
            Visão Executiva & Receita Recorrente (MRR)
          </span>
        </div>
        <h1 class="text-2xl font-black text-slate-900 mt-1">
          Visão Geral & Receita Recorrente (MRR)
        </h1>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="loadData"
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

    <div
      v-if="errorMsg"
      class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
    >
      {{ errorMsg }}
    </div>

    <!-- Cards de KPI -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <p class="text-xs font-bold uppercase text-slate-400">
          MRR (Receita Mensal Ativa)
        </p>
        <p class="text-2xl font-black text-emerald-600 mt-1">
          {{ formatCurrency(overview.mrrAmount) }}
        </p>
        <p class="text-xs text-slate-500 mt-1">
          {{ overview.activeTenants }} cliente(s) ativo(s)
        </p>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <p class="text-xs font-bold uppercase text-slate-400">Clientes & Unidades</p>
        <p class="text-2xl font-black text-slate-900 mt-1">
          {{ overview.totalTenants }} Clientes · {{ overview.totalStores }} Lojas
        </p>
        <p class="text-xs text-slate-500 mt-1">
          {{ overview.cloudStores }} Cloud (Online) · {{ overview.edgeStores }} Edge (PDV Local)
        </p>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <p class="text-xs font-bold uppercase text-slate-400">
          Faturas Pagas (Receita)
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
          Inadimplência (Vencidas)
        </p>
        <p class="text-2xl font-black text-amber-600 mt-1">
          {{ formatCurrency(overview.overdueAmount) }}
        </p>
        <p class="text-xs text-slate-500 mt-1">
          {{ overview.overdueInvoicesCount }} fatura(s) em atraso
        </p>
      </div>
    </div>

    <!-- Governança & Isolamento -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
          <ShieldCheck :size="16" />
          <span>Governança SaaS & Isolamento de Contas</span>
        </div>
        <button
          @click="router.push('/platform/tenants')"
          class="text-xs font-bold text-orange-600 hover:underline"
        >
          Gerenciar clientes e editar lojas →
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <p class="font-bold text-orange-700">1. Trinusphere (`SUPER_ADMIN`)</p>
          <p class="text-slate-600">
            Administra clientes, unidades, contratos e mensalidades. Quando visualiza o PDV de uma loja, atua em modo estritamente <strong>Somente Leitura</strong>.
          </p>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <p class="font-bold text-slate-900">2. Usuário Exclusivo por Cliente (`ADMIN`)</p>
          <p class="text-slate-600">
            Cada contratante recebe seu próprio login (ex.: <code>chefsburguer</code>), isolado dos demais clientes e vinculado apenas às lojas da rede dele.
          </p>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <p class="font-bold text-slate-900">3. Operação Híbrida (`CLOUD` + `EDGE`)</p>
          <p class="text-slate-600">
            Unidades online operam direto na nuvem (iFood), enquanto unidades presenciais operam local em &lt; 2ms e sincronizam via <code>EDGE_DEVICE_TOKEN</code>.
          </p>
        </div>
      </div>
    </div>

    <!-- Resumo da Carteira -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Building2 :size="17" class="text-orange-500" />
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Carteira de Clientes Trinusphere
          </h3>
        </div>
        <button
          @click="router.push('/platform/tenants')"
          class="text-xs font-bold text-orange-600 hover:underline"
        >
          Ver todos e editar lojas →
        </button>
      </div>
      <div class="divide-y divide-slate-100">
        <div
          v-for="tenant in tenants"
          :key="tenant.id"
          class="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/60"
        >
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-bold text-slate-900">{{ tenant.tradeName }}</span>
              <span
                v-if="tenant.ownerLogin"
                class="px-2 py-0.5 rounded-lg text-[11px] font-mono bg-slate-100 border border-slate-200 text-slate-700"
              >
                login: {{ tenant.ownerLogin }}
              </span>
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

    <OnboardingClientModal
      v-if="showOnboardModal"
      @close="showOnboardModal = false"
      @created="handleOnboarded"
    />
  </div>
</template>

