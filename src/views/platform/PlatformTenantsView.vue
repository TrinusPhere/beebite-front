<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Eye,
  Cloud,
  HardDrive,
  PauseCircle,
  PlayCircle,
  Copy,
  Download,
  Check,
  RefreshCw,
  KeyRound,
} from "lucide-vue-next";
import { platformService } from "@/services/platformService";
import { authState } from "@/utils/auth";
import { downloadWindowsEdgeInstaller } from "@/utils/edgeInstallerGenerator";
import OnboardingClientModal from "@/components/platform/OnboardingClientModal.vue";

const router = useRouter();
const loading = ref(false);
const errorMsg = ref("");
const searchQuery = ref("");
const tenants = ref([]);

const showOnboardModal = ref(false);
const showEditTenantModal = ref(false);
const showAddStoreModal = ref(false);
const showEditStoreModal = ref(false);
const showEdgeTokenModal = ref(false);

const editTenantForm = ref({
  id: "",
  companyName: "",
  tradeName: "",
  ownerName: "",
  documentNumber: "",
  email: "",
  phone: "",
  notes: "",
});

const addStoreForm = ref({
  tenantId: "",
  tenantTradeName: "",
  name: "",
  cnpj: "",
  address: "",
  publicSlug: "",
  syncMode: "CLOUD",
  ownerLoginToLink: "",
});

const editStoreForm = ref({
  id: "",
  name: "",
  cnpj: "",
  address: "",
  publicSlug: "",
  syncMode: "CLOUD",
  active: true,
});

const edgeStoreInfo = ref({
  storeId: "",
  storeName: "",
  publicSlug: "",
  address: "",
  ownerLogin: "",
  token: "",
});
const copiedEnvFeedback = ref(false);

const formatCurrency = (val) =>
  Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const loadTenants = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    tenants.value = await platformService.listTenants();
    await authState.refreshAccessibleStores();
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao carregar clientes e lojas.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadTenants();
});

const filteredTenants = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return tenants.value;
  return tenants.value.filter((t) => {
    const matchTenant =
      (t.tradeName || "").toLowerCase().includes(q) ||
      (t.companyName || "").toLowerCase().includes(q) ||
      (t.ownerName || "").toLowerCase().includes(q) ||
      (t.ownerLogin || "").toLowerCase().includes(q) ||
      (t.documentNumber || "").toLowerCase().includes(q);
    const matchStore = (t.stores || []).some(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.cnpj || "").toLowerCase().includes(q),
    );
    return matchTenant || matchStore;
  });
});

const handleOnboarded = async (result) => {
  showOnboardModal.value = false;
  await loadTenants();
  const edgeStore = (result.stores || []).find(
    (s) => s.syncMode === "EDGE" && s.generatedEdgeDeviceToken,
  );
  if (edgeStore) {
    openEdgeTokenModal(
      edgeStore.storeId,
      edgeStore.storeName,
      edgeStore.generatedEdgeDeviceToken,
      "",
      "",
      result.ownerLogin || "admin",
    );
  }
};

const openEditTenant = (tenant) => {
  editTenantForm.value = {
    id: tenant.id,
    companyName: tenant.companyName || "",
    tradeName: tenant.tradeName || "",
    ownerName: tenant.ownerName || "",
    documentNumber: tenant.documentNumber || "",
    email: tenant.email || "",
    phone: tenant.phone || "",
    notes: tenant.notes || "",
  };
  showEditTenantModal.value = true;
};

const saveTenant = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    await platformService.updateTenant(editTenantForm.value.id, {
      companyName: editTenantForm.value.companyName,
      tradeName: editTenantForm.value.tradeName,
      ownerName: editTenantForm.value.ownerName,
      documentNumber: editTenantForm.value.documentNumber,
      email: editTenantForm.value.email,
      phone: editTenantForm.value.phone,
      notes: editTenantForm.value.notes,
    });
    showEditTenantModal.value = false;
    await loadTenants();
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao atualizar cliente.";
  } finally {
    loading.value = false;
  }
};

const openAddStore = (tenant) => {
  addStoreForm.value = {
    tenantId: tenant.id,
    tenantTradeName: tenant.tradeName,
    name: "",
    cnpj: "",
    address: "",
    publicSlug: "",
    syncMode: "CLOUD",
    ownerLoginToLink: tenant.ownerLogin || "",
  };
  showAddStoreModal.value = true;
};

const submitAddStore = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    const created = await platformService.addStoreToTenant(addStoreForm.value.tenantId, {
      name: addStoreForm.value.name,
      cnpj: addStoreForm.value.cnpj,
      address: addStoreForm.value.address,
      publicSlug: addStoreForm.value.publicSlug,
      syncMode: addStoreForm.value.syncMode,
      ownerLoginToLink: addStoreForm.value.ownerLoginToLink,
    });
    showAddStoreModal.value = false;
    await loadTenants();
    if (created.syncMode === "EDGE" && created.generatedEdgeDeviceToken) {
      openEdgeTokenModal(
        created.storeId,
        created.storeName,
        created.generatedEdgeDeviceToken,
        addStoreForm.value.publicSlug || "",
        addStoreForm.value.address || "",
        addStoreForm.value.ownerLoginToLink || "admin",
      );
    }
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao adicionar loja.";
  } finally {
    loading.value = false;
  }
};

const openEditStore = (store) => {
  editStoreForm.value = {
    id: store.id,
    name: store.name || "",
    cnpj: store.cnpj || "",
    address: store.address || "",
    publicSlug: store.publicSlug || "",
    syncMode: store.syncMode || "CLOUD",
    active: store.active !== false,
  };
  showEditStoreModal.value = true;
};

const saveEditStore = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    await platformService.updateStore(editStoreForm.value.id, {
      name: editStoreForm.value.name,
      cnpj: editStoreForm.value.cnpj,
      address: editStoreForm.value.address,
      publicSlug: editStoreForm.value.publicSlug,
      syncMode: editStoreForm.value.syncMode,
      active: editStoreForm.value.active,
    });
    showEditStoreModal.value = false;
    await loadTenants();
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao editar loja.";
  } finally {
    loading.value = false;
  }
};

const toggleTenantStatus = async (tenant) => {
  const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  try {
    await platformService.changeTenantStatus(tenant.id, nextStatus);
    await loadTenants();
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao alterar status do cliente.";
  }
};

const visualizeStoreReadOnly = async (storeId) => {
  const switched = await authState.switchStore(storeId);
  if (switched) {
    router.push("/dashboard");
  }
};

const openEdgeTokenModal = (
  storeId,
  storeName,
  token,
  publicSlug = "",
  address = "",
  ownerLogin = "",
) => {
  copiedEnvFeedback.value = false;
  edgeStoreInfo.value = {
    storeId,
    storeName,
    publicSlug: publicSlug || "",
    address: address || "",
    ownerLogin: ownerLogin || "",
    token: token || "Token ainda não gerado",
  };
  showEdgeTokenModal.value = true;
};

const hasValidEdgeToken = computed(
  () =>
    Boolean(edgeStoreInfo.value.token) &&
    edgeStoreInfo.value.token !== "Token ainda não gerado",
);

const handleDownloadWindowsInstaller = () => {
  if (!hasValidEdgeToken.value) {
    errorMsg.value = "Gere ou rotacione o Token Edge antes de baixar o instalador.";
    return;
  }
  downloadWindowsEdgeInstaller({
    storeId: edgeStoreInfo.value.storeId,
    storeName: edgeStoreInfo.value.storeName,
    publicSlug: edgeStoreInfo.value.publicSlug,
    address: edgeStoreInfo.value.address,
    adminLogin: edgeStoreInfo.value.ownerLogin || "admin",
    token: edgeStoreInfo.value.token,
  });
};

const handleRegenerateToken = async () => {
  try {
    const updated = await platformService.regenerateEdgeToken(edgeStoreInfo.value.storeId);
    edgeStoreInfo.value.token = updated.edgeDeviceToken;
    await loadTenants();
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao rotacionar token Edge.";
  }
};

const copyEnvSnippet = async () => {
  const snippet = [
    `BEEBITE_EDGE_STORE_ID=${edgeStoreInfo.value.storeId}`,
    `BEEBITE_EDGE_STORE_NAME=${edgeStoreInfo.value.storeName}`,
    edgeStoreInfo.value.publicSlug ? `BEEBITE_EDGE_STORE_SLUG=${edgeStoreInfo.value.publicSlug}` : null,
    `BEEBITE_EDGE_ADMIN_LOGIN=${edgeStoreInfo.value.ownerLogin || "admin"}`,
    `BEEBITE_SYNC_MODE=EDGE`,
    `CLOUD_SYNC_URL=https://api.trinusphere.com`,
    `EDGE_DEVICE_TOKEN=${edgeStoreInfo.value.token}`,
  ]
    .filter(Boolean)
    .join("\n");
  try {
    await navigator.clipboard.writeText(snippet);
    copiedEnvFeedback.value = true;
    setTimeout(() => {
      copiedEnvFeedback.value = false;
    }, 2500);
  } catch {
    // ignore clipboard errors
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Cabeçalho -->
    <div
      class="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
    >
      <div>
        <h1 class="text-2xl font-black text-slate-900">
          Clientes Contratantes & Lojas (Multi-CNPJ)
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          Edite dados cadastrais, altere modos Cloud/Edge, gerencie tokens e acesse lojas em modo somente leitura.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            :size="16"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar cliente, CNPJ ou login..."
            class="pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs w-64 outline-none focus:border-orange-500"
          />
        </div>
        <button
          @click="loadTenants"
          class="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          title="Recarregar"
        >
          <RefreshCw :size="17" :class="{ 'animate-spin': loading }" />
        </button>
        <button
          @click="showOnboardModal = true"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20"
        >
          <Plus :size="16" />
          <span>Novo Cliente (Onboarding)</span>
        </button>
      </div>
    </div>

    <div
      v-if="errorMsg"
      class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
    >
      {{ errorMsg }}
    </div>

    <!-- Lista de Clientes & Lojas -->
    <div class="space-y-4">
      <div
        v-for="tenant in filteredTenants"
        :key="tenant.id"
        class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <div
          class="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100"
        >
          <div>
            <div class="flex flex-wrap items-center gap-2.5">
              <Building2 :size="20" class="text-orange-500" />
              <h3 class="text-lg font-black text-slate-900">{{ tenant.tradeName }}</h3>
              <span class="text-xs text-slate-400">({{ tenant.companyName }})</span>
              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-xs font-bold',
                  tenant.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700',
                ]"
              >
                {{ tenant.status === "ACTIVE" ? "CONTRATO ATIVO" : tenant.status }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              👤 Dono: <strong>{{ tenant.ownerName }}</strong> ·
              🔑 Login: <code class="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">{{ tenant.ownerLogin || "N/A" }}</code> ·
              📄 Doc: {{ tenant.documentNumber || "N/A" }} ·
              📞 {{ tenant.phone || "N/A" }} ·
              💰 MRR: <strong>{{ formatCurrency(tenant.activeMonthlyFee) }}/mês</strong>
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              @click="openEditTenant(tenant)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <Pencil :size="14" />
              <span>Editar Cliente</span>
            </button>
            <button
              @click="openAddStore(tenant)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200"
            >
              <Plus :size="14" />
              <span>Adicionar Loja</span>
            </button>
            <button
              @click="toggleTenantStatus(tenant)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <PauseCircle v-if="tenant.status === 'ACTIVE'" :size="14" />
              <PlayCircle v-else :size="14" />
              <span>{{ tenant.status === "ACTIVE" ? "Suspender" : "Reativar" }}</span>
            </button>
          </div>
        </div>

        <!-- Lojas deste Cliente -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="store in tenant.stores"
            :key="store.id"
            class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
          >
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-slate-900">{{ store.name }}</span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-[10px] font-bold',
                      store.active !== false
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700',
                    ]"
                  >
                    {{ store.active !== false ? "Ativa" : "Inativa" }}
                  </span>
                </div>
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
              <p class="text-xs text-slate-500">
                CNPJ: <strong>{{ store.cnpj || "Não informado" }}</strong> · Endereço:
                {{ store.address || "Não informado" }}
              </p>
              <p class="text-[11px] text-slate-400 font-mono">
                Slug: {{ store.publicSlug || "-" }} · ID: {{ store.id }}
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/80">
              <div class="flex items-center gap-2">
                <button
                  @click="visualizeStoreReadOnly(store.id)"
                  :class="[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors',
                    tenant.id === '00000000-0000-0000-0000-000000000001'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-slate-900 hover:bg-slate-800',
                  ]"
                  :title="
                    tenant.id === '00000000-0000-0000-0000-000000000001'
                      ? 'Operar Loja Beta / Sandbox da Trinusphere em PRD'
                      : 'Abrir painel da loja em modo visualização (Somente Leitura)'
                  "
                >
                  <Eye :size="13" />
                  <span>{{
                    tenant.id === "00000000-0000-0000-0000-000000000001"
                      ? "Operar Loja Beta"
                      : "Visualizar Loja"
                  }}</span>
                </button>
                <button
                  @click="openEditStore(store)"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 hover:border-orange-400 text-slate-700"
                >
                  <Pencil :size="13" />
                  <span>Editar Loja</span>
                </button>
              </div>

              <button
                v-if="store.syncMode === 'EDGE'"
                @click="openEdgeTokenModal(store.id, store.name, store.edgeDeviceToken, store.publicSlug, store.address, tenant.ownerLogin)"
                class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100"
              >
                <KeyRound :size="13" />
                <span>Kit Edge / Instalador</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: EDITAR CLIENTE -->
    <div
      v-if="showEditTenantModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-black text-slate-900">Editar Dados do Cliente</h3>
          <button @click="showEditTenantModal = false" class="text-xs px-2 py-1 border rounded-lg">✕</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label class="block text-slate-600 font-bold mb-1">Nome Fantasia *</label>
            <input v-model="editTenantForm.tradeName" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Razão Social *</label>
            <input v-model="editTenantForm.companyName" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Proprietário *</label>
            <input v-model="editTenantForm.ownerName" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">CPF / CNPJ Contratante</label>
            <input v-model="editTenantForm.documentNumber" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">E-mail de Cobrança</label>
            <input v-model="editTenantForm.email" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">WhatsApp / Telefone</label>
            <input v-model="editTenantForm.phone" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-slate-600 font-bold mb-1">Observações Internas</label>
            <textarea v-model="editTenantForm.notes" rows="2" class="w-full px-3 py-2 rounded-lg border border-slate-200"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button @click="showEditTenantModal = false" class="px-4 py-2 rounded-xl border text-xs font-bold">Cancelar</button>
          <button @click="saveTenant" :disabled="loading" class="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold">Salvar Cliente</button>
        </div>
      </div>
    </div>

    <!-- MODAL: ADICIONAR LOJA AO CLIENTE -->
    <div
      v-if="showAddStoreModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span class="text-xs font-bold text-orange-600 uppercase">{{ addStoreForm.tenantTradeName }}</span>
            <h3 class="text-base font-black text-slate-900">Adicionar Nova Loja / Filial</h3>
          </div>
          <button @click="showAddStoreModal = false" class="text-xs px-2 py-1 border rounded-lg">✕</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="sm:col-span-2">
            <label class="block text-slate-600 font-bold mb-1">Nome da Unidade *</label>
            <input v-model="addStoreForm.name" placeholder="Ex: Chefs Burguer - Balcão" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">CNPJ da Unidade</label>
            <input v-model="addStoreForm.cnpj" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Modo de Operação *</label>
            <select v-model="addStoreForm.syncMode" class="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="CLOUD">☁️ CLOUD (Online / iFood)</option>
              <option value="EDGE">💻 EDGE (PDV Local Offline)</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-slate-600 font-bold mb-1">Endereço</label>
            <input v-model="addStoreForm.address" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Slug Público</label>
            <input v-model="addStoreForm.publicSlug" placeholder="chefs-balcao" class="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Login do Dono a Vincular</label>
            <input v-model="addStoreForm.ownerLoginToLink" placeholder="ex: chefsburguer" class="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono" />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button @click="showAddStoreModal = false" class="px-4 py-2 rounded-xl border text-xs font-bold">Cancelar</button>
          <button @click="submitAddStore" :disabled="loading" class="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold">Criar Loja</button>
        </div>
      </div>
    </div>

    <!-- MODAL: EDITAR LOJA -->
    <div
      v-if="showEditStoreModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-black text-slate-900">Editar Loja (Metadados SaaS)</h3>
          <button @click="showEditStoreModal = false" class="text-xs px-2 py-1 border rounded-lg">✕</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="sm:col-span-2">
            <label class="block text-slate-600 font-bold mb-1">Nome da Loja *</label>
            <input v-model="editStoreForm.name" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">CNPJ</label>
            <input v-model="editStoreForm.cnpj" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Modo de Operação *</label>
            <select v-model="editStoreForm.syncMode" class="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="CLOUD">☁️ CLOUD (Online / iFood)</option>
              <option value="EDGE">💻 EDGE (PDV Local Offline)</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-slate-600 font-bold mb-1">Endereço</label>
            <input v-model="editStoreForm.address" class="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label class="block text-slate-600 font-bold mb-1">Slug Público</label>
            <input v-model="editStoreForm.publicSlug" class="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono" />
          </div>
          <div class="flex items-center gap-2 pt-5">
            <input id="chk-store-active" type="checkbox" v-model="editStoreForm.active" class="w-4 h-4 accent-orange-500" />
            <label for="chk-store-active" class="font-bold text-slate-700">Unidade Ativa no SaaS</label>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button @click="showEditStoreModal = false" class="px-4 py-2 rounded-xl border text-xs font-bold">Cancelar</button>
          <button @click="saveEditStore" :disabled="loading" class="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold">Salvar Loja</button>
        </div>
      </div>
    </div>

    <!-- MODAL: TOKEN EDGE -->
    <div
      v-if="showEdgeTokenModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div class="text-xs font-bold uppercase text-emerald-600">
          ✅ Kit de Implantação Local (Edge Offline-First)
        </div>
        <h3 class="text-base font-black text-slate-900">{{ edgeStoreInfo.storeName }}</h3>
        <pre class="p-4 rounded-xl bg-slate-900 text-sky-300 text-xs font-mono overflow-x-auto">BEEBITE_EDGE_STORE_ID={{ edgeStoreInfo.storeId }}
BEEBITE_EDGE_STORE_NAME={{ edgeStoreInfo.storeName }}
BEEBITE_EDGE_ADMIN_LOGIN={{ edgeStoreInfo.ownerLogin || "admin" }}
BEEBITE_SYNC_MODE=EDGE
CLOUD_SYNC_URL=https://api.trinusphere.com
EDGE_DEVICE_TOKEN={{ edgeStoreInfo.token }}</pre>
        <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
          <div class="font-bold">⚡ Instalação 1-Clique no Windows do Cliente</div>
          <p class="text-[11px] leading-relaxed text-emerald-800">
            Baixe o instalador já preenchido com o <strong>STORE_ID</strong> e o <strong>Token</strong> desta loja. No computador Windows do caixa, coloque-o na mesma pasta do arquivo <code class="font-mono bg-white/80 px-1 rounded">chave-leitura-ar.json</code> e dê duplo clique.
          </p>
          <button
            @click="handleDownloadWindowsInstaller"
            :disabled="!hasValidEdgeToken"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black shadow-sm transition-colors"
          >
            <Download :size="15" />
            <span>Baixar Instalador Windows (.bat)</span>
          </button>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div class="flex items-center gap-2">
            <button
              @click="copyEnvSnippet"
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50"
            >
              <Check v-if="copiedEnvFeedback" :size="14" class="text-emerald-600" />
              <Copy v-else :size="14" />
              <span>{{ copiedEnvFeedback ? "Copiado!" : "Copiar .env" }}</span>
            </button>
            <button
              @click="handleRegenerateToken"
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100"
            >
              <KeyRound :size="14" />
              <span>Rotacionar Token</span>
            </button>
          </div>
          <button
            @click="showEdgeTokenModal = false"
            class="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold"
          >
            Fechar
          </button>
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

