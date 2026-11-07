<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
    <!-- Topbar KDS -->
    <header class="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
      <!-- Esquerda: Título + Estações -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🍳</span>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            BiteFlow <span class="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-500/30 font-semibold uppercase">KDS</span>
          </h1>
        </div>

        <!-- Seletor de Estação Touch -->
        <div class="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 overflow-x-auto max-w-xl">
          <button
            @click="selectStation(null)"
            :class="[
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
              !selectedStationId
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            ]"
          >
            Todas as Estações
          </button>
          <button
            v-for="station in stations"
            :key="station.id"
            @click="selectStation(station.id)"
            :class="[
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
              selectedStationId === station.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            ]"
          >
            {{ station.name }}
            <span v-if="station.isExpedition" class="text-[10px] ml-1 opacity-70">(Expedição)</span>
          </button>
        </div>
      </div>

      <!-- Direita: Ações, Alertas e Histórico -->
      <div class="flex items-center gap-3">
        <!-- Status de Conexão SSE -->
        <div class="flex items-center gap-1.5 text-xs text-slate-400">
          <span
            class="w-2.5 h-2.5 rounded-full"
            :class="sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'"
          ></span>
          <span class="hidden sm:inline">{{ sseConnected ? 'Tempo Real' : 'Reconectando...' }}</span>
        </div>

        <!-- Botão Atualizar Manual -->
        <button
          @click="fetchActiveTasks"
          class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Recarregar tarefas"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- Botão Histórico de Itens Produzidos (Solicitado na Q3) -->
        <button
          @click="openHistoryDrawer"
          class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium transition"
        >
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Histórico Produzidos
          <span v-if="completedCount > 0" class="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
            {{ completedCount }}
          </span>
        </button>

        <!-- Botão Tela Cheia -->
        <button
          @click="toggleFullscreen"
          class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Alternar Tela Cheia"
        >
          <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Botão Configurações KDS -->
        <button
          @click="router.push('/kds/configuracoes')"
          class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Configurações do KDS"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <!-- Divisor vertical -->
        <div class="h-6 w-px bg-slate-800"></div>

        <!-- Botão Fechar KDS / Retornar para Pedidos -->
        <button
          @click="exitKds"
          class="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
          title="Fechar tela do KDS e voltar para Pedidos"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Fechar KDS</span>
        </button>
      </div>
    </header>

    <!-- Área de Conteúdo / Cards Touch -->
    <main class="flex-1 p-4 overflow-y-auto">
      <!-- Loading State -->
      <div v-if="loading && tasks.length === 0" class="flex flex-col items-center justify-center py-20 text-slate-500">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-4"></div>
        <p class="text-sm">Carregando tarefas da cozinha...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="tasks.length === 0" class="flex flex-col items-center justify-center py-28 text-center">
        <div class="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-4xl border border-slate-800">
          🍽️
        </div>
        <h2 class="text-xl font-bold text-slate-300">Nenhum item em produção</h2>
        <p class="text-slate-500 text-sm mt-1 max-w-sm">
          A cozinha está em dia! Novos pedidos despachados aparecerão automaticamente nesta tela em tempo real.
        </p>
      </div>

      <!-- Grid de Pedidos KDS (1 Card por Pedido) -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        <div
          v-for="order in groupedOrders"
          :key="order.orderId"
          :class="[
            'flex flex-col justify-between rounded-xl border p-4 shadow-lg transition-all duration-300 bg-slate-900',
            getCardBorderClass(order)
          ]"
        >
          <!-- Cabeçalho do Card: Pedido #, Tipo, Canal e Tempo Decorrido -->
          <div>
            <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="text-xl font-black text-amber-400">
                  #{{ order.displayOrderId || '---' }}
                </span>
                <span
                  :class="[
                    'text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                    getOrderTypeBadgeClass(order.orderType)
                  ]"
                >
                  {{ order.orderType || 'SALÃO' }}
                </span>
                <span
                  v-if="order.orderChannel"
                  :class="[
                    'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border',
                    order.orderChannel === 'IFOOD'
                      ? 'border-red-500/40 text-red-400 bg-red-950/40'
                      : 'border-slate-700 text-slate-400'
                  ]"
                >
                  {{ order.orderChannel }}
                </span>
              </div>

              <!-- Cronômetro de Produção do Pedido com Alerta Visual -->
              <div
                :class="[
                  'text-xs font-mono font-bold px-2 py-1 rounded flex items-center gap-1',
                  getTimerClass(order)
                ]"
              >
                <span>⏱️</span>
                <span>{{ formatElapsedTime(order.createdAt) }}</span>
              </div>
            </div>

            <!-- Cliente (se houver) -->
            <div v-if="order.customerName" class="text-xs text-slate-400 mb-2 truncate">
              👤 {{ order.customerName }}
            </div>

            <!-- Lista de Itens do Pedido no Setor / Estação -->
            <div class="my-2 space-y-2.5 divide-y divide-slate-800/60">
              <div
                v-for="task in order.tasks"
                :key="task.id"
                class="pt-2 first:pt-0"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-start gap-2 flex-1">
                    <span class="text-lg font-black text-amber-500 min-w-[24px]">
                      {{ task.quantity }}x
                    </span>
                    <div class="flex-1">
                      <h3 class="text-sm font-bold text-white leading-tight">
                        {{ task.itemName }}
                      </h3>
                      <!-- Badge de Combo caso seja componente de combo -->
                      <div v-if="task.comboName" class="mt-0.5">
                        <span class="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                          📦 {{ task.comboName }}
                        </span>
                      </div>

                      <!-- Adicionais / Modificadores -->
                      <div v-if="task.modifiersSummary" class="mt-1 text-[11px] text-slate-300 bg-slate-800/60 p-1.5 rounded border border-slate-700/40">
                        <span class="text-slate-400 font-medium">Adicionais:</span> {{ task.modifiersSummary }}
                      </div>

                      <!-- Observações em Destaque (ex: "Sem Cebola") -->
                      <div v-if="task.notes" class="mt-1 text-[11px] font-semibold text-amber-200 bg-amber-500/10 p-1.5 rounded border border-amber-500/30">
                        ⚠️ {{ task.notes }}
                      </div>
                    </div>
                  </div>

                  <!-- Ações rápidas por item -->
                  <div class="flex flex-col items-end gap-1 shrink-0">
                    <span
                      v-if="task.status === 'IN_PREPARATION'"
                      class="bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded text-[10px] animate-pulse"
                    >
                      🔥 Preparo
                    </span>
                    <span
                      v-else
                      class="bg-slate-800 text-slate-400 font-medium px-1.5 py-0.5 rounded text-[10px]"
                    >
                      ⏳ Fila
                    </span>

                    <div class="flex items-center gap-1 mt-0.5">
                      <button
                        v-if="task.status === 'PENDING'"
                        @click="startTask(task)"
                        :disabled="task._loading"
                        title="Iniciar este item"
                        class="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-2 py-1 rounded text-[11px] font-bold transition shadow"
                      >
                        🔥
                      </button>
                      <button
                        @click="completeTask(task)"
                        :disabled="task._loading"
                        title="Concluir este item"
                        class="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-2 py-1 rounded text-[11px] font-bold transition shadow"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rodapé do Card: Resumo do Pedido + Botões de Ação em Lote -->
          <div class="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
            <!-- Resumo de status no setor -->
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>{{ order.tasks.length }} {{ order.tasks.length === 1 ? 'item' : 'itens' }}</span>
              <span class="font-medium text-slate-300">
                {{ order.tasks.filter(t => t.status === 'IN_PREPARATION').length }} em preparo
              </span>
            </div>

            <!-- Botões Grandes de Ação para o Pedido Inteiro no Setor -->
            <div class="grid grid-cols-2 gap-2 mt-1">
              <button
                v-if="order.tasks.some(t => t.status === 'PENDING')"
                @click="startAllOrderTasks(order)"
                class="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1 shadow"
              >
                <span>🔥 Iniciar Todos</span>
              </button>

              <button
                @click="completeAllOrderTasks(order)"
                :class="[
                  'font-bold py-2.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1 shadow active:scale-95 bg-emerald-600 hover:bg-emerald-500 text-white',
                  order.tasks.some(t => t.status === 'PENDING') ? '' : 'col-span-2 py-3 text-sm'
                ]"
              >
                <span>✓ Concluir Todos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Drawer / Modal Lateral: Histórico de Itens Produzidos (Q3) -->
    <div
      v-if="showHistory"
      class="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
      @click.self="showHistory = false"
    >
      <div class="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col p-5 shadow-2xl">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">📋</span>
            <h2 class="text-lg font-bold text-white">Histórico de Produzidos</h2>
          </div>
          <button
            @click="showHistory = false"
            class="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <p class="text-xs text-slate-400 mt-2 mb-4">
          Itens que foram concluídos e saíram da tela de produção ativa. Você pode reabrir um item se foi finalizado por engano.
        </p>

        <!-- Lista do Histórico -->
        <div class="flex-1 overflow-y-auto space-y-3 pr-1">
          <div
            v-if="completedTasks.length === 0"
            class="py-16 text-center text-slate-500 text-sm"
          >
            Nenhum item concluído recentemente.
          </div>

          <div
            v-for="item in completedTasks"
            :key="item.id"
            class="bg-slate-800/80 border border-slate-700/60 rounded-lg p-3 flex items-center justify-between gap-3"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-amber-400">#{{ item.displayOrderId }}</span>
                <span class="text-xs font-semibold text-white">{{ item.quantity }}x {{ item.itemName }}</span>
              </div>
              <div v-if="item.comboName" class="text-[11px] text-amber-300">
                Combo: {{ item.comboName }}
              </div>
              <div class="text-[11px] text-slate-400 mt-1">
                Concluído às: {{ formatTime(item.completedAt) }}
              </div>
            </div>

            <!-- Botão Reabrir Produção -->
            <button
              @click="reopenTask(item)"
              class="px-2.5 py-1.5 bg-slate-700 hover:bg-amber-600 text-slate-200 hover:text-white rounded text-xs font-semibold transition active:scale-95"
              title="Voltar item para a tela de produção"
            >
              ↩ Reabrir
            </button>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-800 flex justify-end">
          <button
            @click="showHistory = false"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import kdsService from "@/services/kdsService";

const router = useRouter();

const stations = ref([]);
const selectedStationId = ref(null);
const tasks = ref([]);
const completedTasks = ref([]);
const completedCount = ref(0);
const loading = ref(false);
const sseConnected = ref(false);
const isFullscreen = ref(false);
const showHistory = ref(false);

// Agrupamento de tarefas por Pedido (1 Card por Pedido no KDS)
const groupedOrders = computed(() => {
  const map = new Map();
  for (const task of tasks.value) {
    if (!map.has(task.orderId)) {
      map.set(task.orderId, {
        orderId: task.orderId,
        displayOrderId: task.displayOrderId,
        orderType: task.orderType,
        orderChannel: task.orderChannel,
        customerName: task.customerName,
        createdAt: task.createdAt,
        tasks: [],
      });
    }
    const orderGroup = map.get(task.orderId);
    orderGroup.tasks.push(task);
    // Preservar o createdAt mais antigo para o cronômetro do pedido
    if (new Date(task.createdAt) < new Date(orderGroup.createdAt)) {
      orderGroup.createdAt = task.createdAt;
    }
  }
  return Array.from(map.values());
});

const settings = ref({
  warningAlertMinutes: 10,
  criticalAlertMinutes: 20,
});

let timerInterval = null;
let sseSource = null;
let pollingInterval = null;
const currentTime = ref(Date.now());

// Carregar Estações e Configurações
async function loadInitialData() {
  try {
    const [stationsData, settingsData] = await Promise.all([
      kdsService.listStations(),
      kdsService.getSettings().catch(() => null),
    ]);
    stations.value = stationsData || [];
    if (settingsData) {
      settings.value = settingsData;
    }
  } catch (err) {
    console.error("Erro ao carregar estações/configurações KDS:", err);
  }
}

// Buscar tarefas ativas
async function fetchActiveTasks() {
  loading.value = true;
  try {
    const data = await kdsService.getActiveTasks(selectedStationId.value);
    tasks.value = data || [];
  } catch (err) {
    console.error("Erro ao buscar tarefas KDS:", err);
  } finally {
    loading.value = false;
  }
}

// Buscar histórico de tarefas concluídas
async function fetchCompletedTasks() {
  try {
    const data = await kdsService.getCompletedTasks(selectedStationId.value, 40);
    completedTasks.value = data || [];
    completedCount.value = completedTasks.value.length;
  } catch (err) {
    console.error("Erro ao buscar histórico de concluídos:", err);
  }
}

function selectStation(stationId) {
  selectedStationId.value = stationId;
  fetchActiveTasks();
  fetchCompletedTasks();
}

// Iniciar Preparo
async function startTask(task) {
  task._loading = true;
  try {
    const updated = await kdsService.startTask(task.id);
    const index = tasks.value.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...updated, _loading: false };
    }
  } catch (err) {
    console.error("Erro ao iniciar preparo da tarefa:", err);
    task._loading = false;
  }
}

// Concluir Produção (Sai da tela ativa!)
async function completeTask(task) {
  task._loading = true;
  try {
    await kdsService.completeTask(task.id);
    // Remove da tela ativa instantaneamente
    tasks.value = tasks.value.filter((t) => t.id !== task.id);
    completedCount.value++;
    // Atualiza histórico em segundo plano
    fetchCompletedTasks();
  } catch (err) {
    console.error("Erro ao concluir tarefa:", err);
    task._loading = false;
  }
}

// Iniciar todas as tarefas pendentes do pedido
async function startAllOrderTasks(order) {
  const pendings = order.tasks.filter((t) => t.status === "PENDING");
  await Promise.all(pendings.map((t) => startTask(t)));
}

// Concluir todas as tarefas do pedido nesta estação
async function completeAllOrderTasks(order) {
  const currentTasks = [...order.tasks];
  await Promise.all(currentTasks.map((t) => completeTask(t)));
}

// Reabrir Tarefa do Histórico
async function reopenTask(item) {
  try {
    await kdsService.reopenTask(item.id);
    completedTasks.value = completedTasks.value.filter((t) => t.id !== item.id);
    completedCount.value = Math.max(0, completedCount.value - 1);
    fetchActiveTasks();
  } catch (err) {
    console.error("Erro ao reabrir tarefa:", err);
  }
}

function openHistoryDrawer() {
  fetchCompletedTasks();
  showHistory.value = true;
}

// Helpers Visuais de Tempo e Alertas
function formatElapsedTime(createdAt) {
  if (!createdAt) return "00:00";
  const created = new Date(createdAt).getTime();
  const diffSec = Math.max(0, Math.floor((currentTime.value - created) / 1000));
  const m = Math.floor(diffSec / 60);
  const s = diffSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getElapsedMinutes(createdAt) {
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  return Math.floor((currentTime.value - created) / 60000);
}

function getCardBorderClass(task) {
  const mins = getElapsedMinutes(task.createdAt);
  if (mins >= settings.value.criticalAlertMinutes) {
    return "border-red-500/80 shadow-red-950/40 ring-1 ring-red-500/50";
  }
  if (mins >= settings.value.warningAlertMinutes) {
    return "border-amber-500/70 shadow-amber-950/30";
  }
  return "border-slate-800 hover:border-slate-700";
}

function getTimerClass(task) {
  const mins = getElapsedMinutes(task.createdAt);
  if (mins >= settings.value.criticalAlertMinutes) {
    return "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse";
  }
  if (mins >= settings.value.warningAlertMinutes) {
    return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
  }
  return "bg-slate-800 text-slate-300";
}

function getOrderTypeBadgeClass(type) {
  switch (type) {
    case "DELIVERY":
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    case "BALCAO":
    case "BALCÃO":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "SALAO":
    case "MESA":
      return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
    default:
      return "bg-slate-700 text-slate-300";
  }
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    isFullscreen.value = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
      isFullscreen.value = false;
    }
  }
}

function exitKds() {
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
    isFullscreen.value = false;
  }
  router.push({ name: "pedidos" });
}

// Iniciar SSE
function initSSE() {
  try {
    sseSource = kdsService.subscribeToEvents(
      (payload) => {
        sseConnected.value = true;
        if (payload.eventType === "TASKS_DISPATCHED") {
          fetchActiveTasks();
        } else if (payload.eventType === "TASK_UPDATED") {
          const updated = payload.data;
          if (updated && updated.status === "READY") {
            tasks.value = tasks.value.filter((t) => t.id !== updated.id);
            completedCount.value++;
          } else {
            fetchActiveTasks();
          }
        } else if (payload.eventType === "TASKS_CANCELED") {
          fetchActiveTasks();
        }
      },
      (err) => {
        sseConnected.value = false;
      }
    );
  } catch (e) {
    sseConnected.value = false;
  }
}

onMounted(async () => {
  await loadInitialData();
  await fetchActiveTasks();
  await fetchCompletedTasks();

  // Relógio do cronômetro a cada 1s
  timerInterval = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);

  // Polling de segurança a cada 20s
  pollingInterval = setInterval(() => {
    fetchActiveTasks();
  }, 20000);

  initSSE();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (pollingInterval) clearInterval(pollingInterval);
  if (sseSource) sseSource.close();
});
</script>
