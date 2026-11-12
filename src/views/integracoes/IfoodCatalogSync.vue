<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { RefreshCw, CheckCircle2, AlertCircle, Save, Download, Upload } from 'lucide-vue-next';
import BaseButton from '@/components/BaseButton.vue';
import { integrationService } from '@/services/integrationService';
import { authState } from '@/utils/auth';

const route = useRoute();
const loading = ref(false);
const diffData = ref(null);
const storeId = authState.currentUser?.storeId || "00000000-0000-0000-0000-000000000001";

const decisions = ref({}); // ifoodItemId or biteflowProductId -> decision object

const loadDiff = async () => {
  if (!storeId) return;
  loading.value = true;
  try {
    diffData.value = await integrationService.getIfoodCatalogDiff(storeId);
    
    // Auto-preencher decisões padrão
    if (diffData.value && diffData.value.entries) {
      diffData.value.entries.forEach(entry => {
        let action = 'IGNORE';
        if (entry.diffStatus === 'MATCH') action = 'LINK_ONLY';
        else if (entry.diffStatus === 'IFOOD_ONLY') action = 'IMPORT';
        else if (entry.diffStatus === 'BITEFLOW_ONLY') action = 'EXPORT';
        
        const key = entry.ifoodItem ? entry.ifoodItem.id : entry.biteflowItem.id;
        decisions.value[key] = {
          ifoodItemId: entry.ifoodItem?.id,
          biteflowProductId: entry.biteflowItem?.id,
          action: action
        };
      });
    }
  } catch (error) {
    console.error('Erro ao carregar diff:', error);
  } finally {
    loading.value = false;
  }
};

const hasDifferences = computed(() => {
  if (!diffData.value) return false;
  return diffData.value.totalConflicts > 0 || 
         diffData.value.totalBiteflowOnly > 0 || 
         diffData.value.totalIfoodOnly > 0;
});

const isPureBiteflowOnly = computed(() => {
  if (!diffData.value) return false;
  return diffData.value.totalBiteflowOnly > 0 && 
         diffData.value.totalIfoodOnly === 0 && 
         diffData.value.totalConflicts === 0;
});

const isPureIfoodOnly = computed(() => {
  if (!diffData.value) return false;
  return diffData.value.totalIfoodOnly > 0 && 
         diffData.value.totalBiteflowOnly === 0 && 
         diffData.value.totalConflicts === 0;
});

const isMixed = computed(() => {
  return hasDifferences.value && !isPureBiteflowOnly.value && !isPureIfoodOnly.value;
});

onMounted(loadDiff);

const applyMerge = async () => {
  if (!storeId) return;
  loading.value = true;
  try {
    const payload = Object.values(decisions.value);
    await integrationService.mergeIfoodCatalog(storeId, payload);
    await loadDiff();
  } catch (error) {
    console.error('Erro ao aplicar merge:', error);
  } finally {
    loading.value = false;
  }
};

const fullImport = async () => {
  if (!storeId) return;
  loading.value = true;
  try {
    await integrationService.importCatalogFromIfood(storeId);
    await loadDiff();
  } catch (error) {
    console.error('Erro ao importar:', error);
  } finally {
    loading.value = false;
  }
};

const fullExport = async () => {
  if (!storeId) return;
  loading.value = true;
  try {
    await integrationService.exportCatalogToIfood(storeId);
    await loadDiff();
  } catch (error) {
    console.error('Erro ao exportar:', error);
  } finally {
    loading.value = false;
  }
};

const formatPrice = (price) => {
  return price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price) : 'R$ 0,00';
};

const formatStatus = (status) => {
  if (status === 'AVAILABLE') return 'Ativo';
  if (status === 'UNAVAILABLE') return 'Pausado';
  return status;
};
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-black text-slate-800">Sincronização de Cardápio iFood</h1>
        <p class="text-sm text-slate-500">Resolva conflitos e gerencie a sincronização de itens entre o PDV e o iFood.</p>
      </div>
      <div class="flex gap-2">
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

    <div v-if="loading" class="flex justify-center p-12">
      <RefreshCw class="animate-spin text-slate-400" :size="32" />
    </div>

    <template v-else-if="diffData">
      <div v-if="!hasDifferences" class="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
          <CheckCircle2 class="text-emerald-600" :size="32" />
        </div>
        <h2 class="text-xl font-black text-slate-800 mb-2">Tudo Sincronizado!</h2>
        <p class="text-slate-500 max-w-md mx-auto">
          Não há conflitos ou itens pendentes entre o seu PDV e o iFood. Abaixo estão listados os itens que já estão mapeados corretamente.
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
          <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Apenas no PDV</div>
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
                <th class="px-6 py-4 font-bold w-1/3">Item no BeeBite (PDV)</th>
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
                    Somente PDV
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
                      Preço (iFood): {{ formatPrice(entry.biteflowItem.channelPrices?.find(c => c.channel === 'IFOOD')?.price || entry.biteflowItem.price) }}
                    </div>
                    <div class="text-xs text-slate-500" :class="{'text-amber-600 font-bold': entry.conflictFields?.includes('status')}">
                      Status: <span :class="entry.biteflowItem.status === 'AVAILABLE' ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'">{{ formatStatus(entry.biteflowItem.status) }}</span>
                    </div>
                  </div>
                  <div v-else class="text-slate-400 italic">Não existe no PDV</div>
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
                    <option v-if="entry.diffStatus === 'CONFLICT'" value="USE_BITEFLOW">Substituir iFood pelo PDV</option>
                    <option v-if="entry.diffStatus === 'CONFLICT'" value="USE_IFOOD">Substituir PDV pelo iFood</option>
                    <option v-if="entry.diffStatus === 'BITEFLOW_ONLY'" value="EXPORT">Publicar no iFood</option>
                    <option v-if="entry.diffStatus === 'IFOOD_ONLY'" value="IMPORT">Importar para PDV</option>
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
