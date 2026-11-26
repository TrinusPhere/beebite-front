<script setup>
import { ref, onMounted, computed, watch } from "vue";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  Download,
  Upload,
  Cloud,
  HardDrive,
  ArrowRightLeft,
  BookOpen,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { integrationService } from "@/services/integrationService";
import { authState } from "@/utils/auth";

const loading = ref(false);
const errorMsg = ref("");
const diffData = ref(null);
const decisions = ref({});

const activeStoreId = computed(
  () => authState.currentUser?.storeId || "00000000-0000-0000-0000-000000000001",
);
const activeStore = computed(() =>
  (authState.accessibleStores || []).find((s) => s.id === activeStoreId.value) || null,
);
const isActiveStoreEdge = computed(() => activeStore.value?.syncMode === "EDGE");

const cloudSiblingStore = computed(() => {
  const stores = authState.accessibleStores || [];
  const currentCatalogId = activeStore.value?.catalogId;
  if (currentCatalogId) {
    const sameCatalogCloud = stores.find(
      (s) => s.catalogId === currentCatalogId && s.syncMode === "CLOUD" && s.id !== activeStoreId.value,
    );
    if (sameCatalogCloud) return sameCatalogCloud;
  }
  return stores.find((s) => s.syncMode === "CLOUD" && s.id !== activeStoreId.value) || null;
});

const switchToCloudStore = async () => {
  if (!cloudSiblingStore.value) return;
  await authState.switchStore(cloudSiblingStore.value.id);
};

const loadDiff = async () => {
  if (!activeStoreId.value || isActiveStoreEdge.value) {
    diffData.value = null;
    return;
  }
  loading.value = true;
  errorMsg.value = "";
  try {
    diffData.value = await integrationService.getIfoodCatalogDiff(activeStoreId.value);
    decisions.value = {};

    if (diffData.value && diffData.value.entries) {
      diffData.value.entries.forEach((entry) => {
        let action = "IGNORE";
        if (entry.diffStatus === "MATCH") action = "LINK_ONLY";
        else if (entry.diffStatus === "IFOOD_ONLY") action = "IMPORT";
        else if (entry.diffStatus === "BITEFLOW_ONLY") action = "EXPORT";

        const key = entry.ifoodItem ? entry.ifoodItem.id : entry.biteflowItem.id;
        decisions.value[key] = {
          ifoodItemId: entry.ifoodItem?.id,
          biteflowProductId: entry.biteflowItem?.id,
          action: action,
        };
      });
    }
  } catch (error) {
    console.error("Erro ao carregar diff:", error);
    errorMsg.value =
      error?.response?.data?.message ||
      "Não foi possível carregar a comparação do catálogo iFood para esta unidade.";
  } finally {
    loading.value = false;
  }
};

const hasDifferences = computed(() => {
  if (!diffData.value) return false;
  return (
    diffData.value.totalConflicts > 0 ||
    diffData.value.totalBiteflowOnly > 0 ||
    diffData.value.totalIfoodOnly > 0
  );
});

const isPureBiteflowOnly = computed(() => {
  if (!diffData.value) return false;
  return (
    diffData.value.totalBiteflowOnly > 0 &&
    diffData.value.totalIfoodOnly === 0 &&
    diffData.value.totalConflicts === 0
  );
});

const isPureIfoodOnly = computed(() => {
  if (!diffData.value) return false;
  return (
    diffData.value.totalIfoodOnly > 0 &&
    diffData.value.totalBiteflowOnly === 0 &&
    diffData.value.totalConflicts === 0
  );
});

onMounted(async () => {
  if (!authState.accessibleStores || authState.accessibleStores.length === 0) {
    await authState.refreshAccessibleStores();
  }
  await loadDiff();
});

watch(activeStoreId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await loadDiff();
  }
});

const applyMerge = async () => {
  if (!activeStoreId.value) return;
  loading.value = true;
  errorMsg.value = "";
  try {
    const payload = Object.values(decisions.value);
    await integrationService.mergeIfoodCatalog(activeStoreId.value, payload);
    await loadDiff();
  } catch (error) {
    console.error("Erro ao aplicar merge:", error);
    errorMsg.value = error?.response?.data?.message || "Erro ao aplicar resoluções do catálogo.";
  } finally {
    loading.value = false;
  }
};

const fullImport = async () => {
  if (!activeStoreId.value) return;
  loading.value = true;
  errorMsg.value = "";
  try {
    await integrationService.importCatalogFromIfood(activeStoreId.value);
    await loadDiff();
  } catch (error) {
    console.error("Erro ao importar:", error);
    errorMsg.value = error?.response?.data?.message || "Erro ao importar cardápio do iFood.";
  } finally {
    loading.value = false;
  }
};

const fullExport = async () => {
  if (!activeStoreId.value) return;
  loading.value = true;
  errorMsg.value = "";
  try {
    await integrationService.exportCatalogToIfood(activeStoreId.value);
    await loadDiff();
  } catch (error) {
    console.error("Erro ao exportar:", error);
    errorMsg.value = error?.response?.data?.message || "Erro ao exportar cardápio para o iFood.";
  } finally {
    loading.value = false;
  }
};

const formatPrice = (price) => {
  return price
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price)
    : "R$ 0,00";
};

const formatStatus = (status) => {
  if (status === "AVAILABLE") return "Ativo";
  if (status === "UNAVAILABLE") return "Pausado";
  return status;
};
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <div class="flex flex-wrap justify-between items-center gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800">Sincronização de Cardápio iFood</h1>
        <p class="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
          <BookOpen :size="15" class="text-violet-600" />
          <span>
            Cardápio vinculado:
            <strong>{{ activeStore?.catalogName || "Cardápio Principal" }}</strong>
            — compartilhado com todas as unidades da marca.
          </span>
        </p>
      </div>
      <div v-if="!isActiveStoreEdge" class="flex gap-2">
        <BaseButton v-if="isPureIfoodOnly" @click="fullImport" :loading="loading" class="bg-blue-600 hover:bg-blue-700">
          <Download :size="18" /> Importar Tudo
        </BaseButton>
        <BaseButton v-if="isPureBiteflowOnly" @click="fullExport" :loading="loading" class="bg-purple-600 hover:bg-purple-700">
          <Upload :size="18" /> Publicar Tudo
        </BaseButton>
        <BaseButton @click="loadDiff" :loading="loading" class="bg-slate-200 text-slate-800 hover:bg-slate-300">
          <RefreshCw :size="18" /> Atualizar Diff
        </BaseButton>
      </div>
    </div>

    <div
      v-if="errorMsg"
      class="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold"
    >
      {{ errorMsg }}
    </div>

    <!-- Aviso se estiver na loja EDGE -->
    <div
      v-if="isActiveStoreEdge"
      class="bg-amber-50 border border-amber-300 rounded-3xl p-6 space-y-4 text-amber-900"
    >
      <div class="flex items-center gap-2 font-black text-base text-amber-800">
        <HardDrive :size="20" />
        <span>Unidade Local (EDGE) selecionada</span>
      </div>
      <p class="text-sm leading-relaxed">
        A sincronização direta com o iFood é gerenciada pela unidade <strong>Cloud / Delivery</strong>. Qualquer item importado ou atualizado lá aparece automaticamente nesta unidade pelo cardápio compartilhado!
      </p>
      <button
        v-if="cloudSiblingStore"
        @click="switchToCloudStore"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors"
      >
        <Cloud :size="16" />
        <span>Alternar para {{ cloudSiblingStore.name }} (Cloud)</span>
        <ArrowRightLeft :size="14" />
      </button>
    </div>

    <div v-else-if="loading" class="flex justify-center p-12">
      <RefreshCw class="animate-spin text-slate-400" :size="32" />
    </div>

    <template v-else-if="diffData">
      <div v-if="!hasDifferences" class="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
          <CheckCircle2 class="text-emerald-600" :size="32" />
        </div>
        <h2 class="text-xl font-black text-slate-800 mb-2">Tudo Sincronizado!</h2>
        <p class="text-slate-500 max-w-md mx-auto">
          Não há conflitos ou itens pendentes entre o seu Cardápio Compartilhado e o iFood.
        </p>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div class="bg-white border rounded-2xl p-4 text-center shadow-sm">
          <div class="text-3xl font-black text-emerald-600">{{ diffData.totalMatches }}</div>
          <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Sincronizados</div>
        </div>
        <div class="bg-white border rounded-2xl p-4 text-center shadow-sm border-amber-200">
          <div class="text-3xl font-black text-amber-600">{{ diffData.totalConflicts }}</div>
          <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Conflitos</div>
        </div>
        <div class="bg-white border rounded-2xl p-4 text-center shadow-sm">
          <div class="text-3xl font-black text-blue-600">{{ diffData.totalBiteflowOnly }}</div>
          <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Apenas no BeeBite</div>
        </div>
        <div class="bg-white border rounded-2xl p-4 text-center shadow-sm">
          <div class="text-3xl font-black text-red-600">{{ diffData.totalIfoodOnly }}</div>
          <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Apenas no iFood</div>
        </div>
      </div>

      <div class="bg-white border rounded-3xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 text-slate-500 border-b">
              <tr>
                <th class="px-6 py-4 font-bold">Status</th>
                <th class="px-6 py-4 font-bold w-1/3">Item no BeeBite (Cardápio Compartilhado)</th>
                <th class="px-6 py-4 font-bold w-1/3">Item no iFood</th>
                <th class="px-6 py-4 font-bold text-right">Ação</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="(entry, index) in diffData.entries" :key="index" class="hover:bg-slate-50 transition-colors">
                <!-- Status Badge -->
                <td class="px-6 py-4 align-top">
                  <span v-if="entry.diffStatus === 'MATCH'" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    <CheckCircle2 :size="14" /> OK
                  </span>
                  <span v-else-if="entry.diffStatus === 'CONFLICT'" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                    <AlertCircle :size="14" /> Conflito
                  </span>
                  <span v-else-if="entry.diffStatus === 'BITEFLOW_ONLY'" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    Somente BeeBite
                  </span>
                  <span v-else-if="entry.diffStatus === 'IFOOD_ONLY'" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    Somente iFood
                  </span>
                </td>

                <!-- BiteFlow Item -->
                <td class="px-6 py-4 align-top border-r">
                  <div v-if="entry.biteflowItem">
                    <div class="font-bold text-slate-800" :class="{'text-amber-600': entry.conflictFields?.includes('name')}">
                      {{ entry.biteflowItem.name }}
                    </div>
                    <div class="text-xs text-slate-500 mt-1" :class="{'text-amber-600 font-bold': entry.conflictFields?.includes('price')}">
                      Preço Canal iFood: {{ formatPrice(entry.biteflowItem.channelPrices?.find(c => c.channel === 'IFOOD')?.price || entry.biteflowItem.price) }}
                      <span class="text-slate-400">· Base Balcão: {{ formatPrice(entry.biteflowItem.price) }}</span>
                    </div>
                    <div class="text-xs text-slate-500" :class="{'text-amber-600 font-bold': entry.conflictFields?.includes('status')}">
                      Status Global: <span :class="(entry.biteflowItem.globalStatus || entry.biteflowItem.status) === 'AVAILABLE' ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'">{{ formatStatus(entry.biteflowItem.globalStatus || entry.biteflowItem.status) }}</span>
                    </div>
                  </div>
                  <div v-else class="text-slate-400 italic">Não existe no BeeBite</div>
                </td>

                <!-- iFood Item -->
                <td class="px-6 py-4 align-top">
                  <div v-if="entry.ifoodItem">
                    <div class="font-bold text-slate-800" :class="{'text-amber-600': entry.conflictFields?.includes('name')}">
                      {{ entry.ifoodItem.name }}
                    </div>
                    <div class="text-xs text-slate-500 mt-1" :class="{'text-amber-600 font-bold': entry.conflictFields?.includes('price')}">
                      Preço: {{ formatPrice(entry.ifoodItem.price?.value) }}
                    </div>
                    <div class="text-xs text-slate-500" :class="{'text-amber-600 font-bold': entry.conflictFields?.includes('status')}">
                      Status: <span :class="entry.ifoodItem.status === 'AVAILABLE' ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'">{{ formatStatus(entry.ifoodItem.status) }}</span>
                    </div>
                  </div>
                  <div v-else class="text-slate-400 italic">Não publicado no iFood</div>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 align-top text-right">
                  <select
                    v-model="decisions[entry.ifoodItem?.id || entry.biteflowItem?.id].action"
                    class="border border-slate-300 rounded-lg text-sm p-2 bg-white focus:ring-2 focus:ring-slate-200 outline-none"
                  >
                    <option v-if="entry.diffStatus === 'MATCH' || entry.diffStatus === 'CONFLICT'" value="LINK_ONLY">Manter como está (Apenas Vínculo)</option>
                    <option v-if="entry.diffStatus === 'CONFLICT'" value="USE_BITEFLOW">Enviar preço/dados BeeBite para iFood</option>
                    <option v-if="entry.diffStatus === 'CONFLICT'" value="USE_IFOOD">Atualizar preço canal iFood (mantém preço Balcão)</option>
                    <option v-if="entry.diffStatus === 'BITEFLOW_ONLY'" value="EXPORT">Publicar no iFood</option>
                    <option v-if="entry.diffStatus === 'IFOOD_ONLY'" value="IMPORT">Importar para Cardápio Compartilhado</option>
                    <option value="IGNORE">Ignorar</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="hasDifferences" class="p-6 bg-slate-50 border-t flex justify-end">
          <BaseButton @click="applyMerge" :loading="loading" class="bg-emerald-600 hover:bg-emerald-700">
            <Save :size="18" /> Aplicar Resoluções
          </BaseButton>
        </div>
      </div>
    </template>
  </div>
</template>
