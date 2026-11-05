<template>
  <div class="p-6 max-w-6xl mx-auto space-y-8">
    <!-- Cabeçalho -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          ⚙️ Configurações do KDS
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gerencie telas da cozinha, estações de trabalho e regras de direcionamento e alertas.
        </p>
      </div>

      <button
        @click="openStationModal()"
        class="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 shadow"
      >
        <span>+ Nova Estação</span>
      </button>
    </div>

    <!-- Seção 1: Configurações Gerais da Loja -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <h2 class="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
        Regras de Despacho e Alertas de Tempo
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Modo de Despacho -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">
            Modo de Despacho
          </label>
          <select
            v-model="settings.dispatchMode"
            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="AUTO">Automático (Ao entrar em Preparo)</option>
            <option value="MANUAL">Manual / Seletivo por Item</option>
          </select>
          <p class="text-xs text-slate-400 mt-1">
            No modo automático, pedidos que mudam para PREPARO geram fichas KDS instantaneamente.
          </p>
        </div>

        <!-- Alerta Amarelo -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">
            Alerta Amarelo (Minutos)
          </label>
          <input
            v-model.number="settings.warningAlertMinutes"
            type="number"
            min="1"
            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
          <p class="text-xs text-slate-400 mt-1">Tempo de espera para indicar atenção moderada.</p>
        </div>

        <!-- Alerta Vermelho -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">
            Alerta Crítico / Vermelho (Minutos)
          </label>
          <input
            v-model.number="settings.criticalAlertMinutes"
            type="number"
            min="2"
            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
          <p class="text-xs text-slate-400 mt-1">Tempo limite após o qual o card pulsa em vermelho.</p>
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <button
          @click="saveSettings"
          :disabled="savingSettings"
          class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-5 py-2 rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {{ savingSettings ? 'Salvando...' : 'Salvar Regras' }}
        </button>
      </div>
    </div>

    <!-- Seção 2: Lista de Estações KDS -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          Estações Cadastradas (Telas da Cozinha)
        </h2>
        <span class="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
          {{ stations.length }} estações
        </span>
      </div>

      <div v-if="stations.length === 0" class="py-12 text-center text-slate-400 text-sm">
        Nenhuma estação cadastrada. Clique no botão acima para adicionar telas (ex: Chapa, Frituras, Expedição).
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="station in stations"
          :key="station.id"
          class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex flex-col justify-between"
        >
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="text-base font-bold text-slate-900 dark:text-white">
                {{ station.name }}
              </h3>
              <span
                v-if="station.isExpedition"
                class="bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/30 uppercase"
              >
                Expedição Geral
              </span>
            </div>

            <!-- Setores Vinculados -->
            <div class="mt-2 text-xs">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Setores Produzidos:</span>
              <div v-if="station.isExpedition" class="text-slate-600 dark:text-slate-300 italic mt-0.5">
                Exibe itens de todos os setores para montagem final.
              </div>
              <div v-else-if="!station.sectorIds || station.sectorIds.length === 0" class="text-amber-500 italic mt-0.5">
                Nenhum setor associado (visão geral).
              </div>
              <div v-else class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="secId in station.sectorIds"
                  :key="secId"
                  class="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[11px] font-medium"
                >
                  {{ getSectorName(secId) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Ações -->
          <div class="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/50">
            <button
              @click="openStationModal(station)"
              class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
            >
              Editar
            </button>
            <button
              @click="deleteStation(station)"
              class="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Criação / Edição de Estação -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-lg shadow-2xl">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">
          {{ editingStation ? 'Editar Estação KDS' : 'Nova Estação KDS' }}
        </h3>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Nome da Estação
            </label>
            <input
              v-model="form.name"
              placeholder="Ex: Chapa & Grelhados"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <!-- Checkbox Expedição Geral -->
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="isExpedition"
              v-model="form.isExpedition"
              class="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
            <label for="isExpedition" class="text-sm font-medium text-slate-700 dark:text-slate-300">
              Esta é uma tela de Expedição Geral (vê todos os itens finalizados)
            </label>
          </div>

          <!-- Seleção Múltipla de Setores -->
          <div v-if="!form.isExpedition">
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">
              Setores de Produção Direcionados
            </label>
            <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <label
                v-for="sector in availableSectors"
                :key="sector.id"
                class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <input
                  type="checkbox"
                  :value="sector.id"
                  v-model="form.sectorIds"
                  class="rounded text-amber-500 focus:ring-amber-500"
                />
                <span>{{ sector.name }}</span>
              </label>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">
              A tela exibirá apenas os itens cadastrados nestes setores.
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            @click="showModal = false"
            class="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Cancelar
          </button>
          <button
            @click="saveStation"
            class="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-5 py-2 rounded-lg text-sm transition"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import kdsService from "@/services/kdsService";
import productionSectorService from "@/services/productionSectorService";

const stations = ref([]);
const availableSectors = ref([]);
const showModal = ref(false);
const editingStation = ref(null);
const savingSettings = ref(false);

const settings = ref({
  dispatchMode: "AUTO",
  warningAlertMinutes: 10,
  criticalAlertMinutes: 20,
  autoCompleteOnExpedition: false,
});

const form = ref({
  name: "",
  isExpedition: false,
  sectorIds: [],
});

async function loadData() {
  try {
    const [stationsData, sectorsData, settingsData] = await Promise.all([
      kdsService.listStations(),
      productionSectorService ? productionSectorService.getAll().catch(() => []) : [],
      kdsService.getSettings().catch(() => null),
    ]);

    stations.value = stationsData || [];
    availableSectors.value = sectorsData || [];
    if (settingsData) {
      settings.value = settingsData;
    }
  } catch (err) {
    console.error("Erro ao carregar configurações KDS:", err);
  }
}

function getSectorName(id) {
  const s = availableSectors.value.find((sec) => sec.id === id);
  return s ? s.name : "Setor";
}

function openStationModal(station = null) {
  editingStation.value = station;
  if (station) {
    form.value = {
      name: station.name,
      isExpedition: station.isExpedition,
      sectorIds: station.sectorIds ? [...station.sectorIds] : [],
    };
  } else {
    form.value = {
      name: "",
      isExpedition: false,
      sectorIds: [],
    };
  }
  showModal.value = true;
}

async function saveStation() {
  if (!form.value.name.trim()) return;

  try {
    const payload = {
      name: form.value.name,
      isExpedition: form.value.isExpedition,
      sectorIds: form.value.isExpedition ? [] : form.value.sectorIds,
    };

    if (editingStation.value) {
      await kdsService.updateStation(editingStation.value.id, payload);
    } else {
      await kdsService.createStation(payload);
    }

    showModal.value = false;
    await loadData();
  } catch (err) {
    console.error("Erro ao salvar estação:", err);
  }
}

async function deleteStation(station) {
  if (!confirm(`Deseja realmente excluir a estação "${station.name}"?`)) return;
  try {
    await kdsService.deleteStation(station.id);
    await loadData();
  } catch (err) {
    console.error("Erro ao excluir estação:", err);
  }
}

async function saveSettings() {
  savingSettings.value = true;
  try {
    await kdsService.updateSettings(settings.value);
    alert("Configurações do KDS atualizadas com sucesso!");
  } catch (err) {
    console.error("Erro ao salvar configurações KDS:", err);
    alert("Falha ao atualizar configurações.");
  } finally {
    savingSettings.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>
