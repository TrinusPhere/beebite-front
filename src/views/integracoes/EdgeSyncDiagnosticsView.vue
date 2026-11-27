<script setup>
import { ref, computed, onMounted } from "vue";
import {
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  WifiOff,
  RotateCcw,
  ArrowLeft,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { edgeSyncService } from "@/services/edgeSyncService";
import { useEdgeSyncHealth } from "@/composables/useEdgeSyncHealth";

const { health, loading: healthLoading, refresh: refreshHealth } =
  useEdgeSyncHealth();

const failedEvents = ref([]);
const failedLoading = ref(false);
const page = ref(0);
const pageSize = 20;
const retryingId = ref(null);

const todayStr = () => new Date().toISOString().slice(0, 10);
const daysAgoStr = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const reconcileFrom = ref(daysAgoStr(6));
const reconcileTo = ref(todayStr());
const reconciling = ref(false);
const reconcileResult = ref(null);
const feedbackError = ref("");
const feedbackSuccess = ref("");

const isEdgeNode = computed(
  () => health.value?.syncMode?.toUpperCase() === "EDGE",
);

const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
};

const loadFailed = async () => {
  failedLoading.value = true;
  try {
    const data = await edgeSyncService.listFailed(page.value, pageSize);
    failedEvents.value = Array.isArray(data) ? data : [];
  } catch (err) {
    feedbackError.value =
      err?.response?.data?.message ||
      "Não foi possível carregar a lista de eventos rejeitados.";
  } finally {
    failedLoading.value = false;
  }
};

const reloadAll = async () => {
  feedbackError.value = "";
  await Promise.all([refreshHealth(), loadFailed()]);
};

onMounted(async () => {
  await reloadAll();
});

const handleRetry = async (item) => {
  if (!item?.id) return;
  retryingId.value = item.id;
  feedbackError.value = "";
  feedbackSuccess.value = "";
  try {
    const res = await edgeSyncService.retryFailed(item.id);
    feedbackSuccess.value =
      res?.requeued > 0
        ? `Snapshot atualizado reenfileirado para o evento #${item.sequence || "—"}.`
        : "Agregado não encontrado localmente para reenfileirar.";
    await reloadAll();
  } catch (err) {
    feedbackError.value =
      err?.response?.data?.message || "Falha ao reenviar o evento selecionado.";
  } finally {
    retryingId.value = null;
  }
};

const handleReconcile = async () => {
  feedbackError.value = "";
  feedbackSuccess.value = "";
  reconcileResult.value = null;

  if (!reconcileFrom.value || !reconcileTo.value) {
    feedbackError.value = "Selecione as datas inicial e final.";
    return;
  }
  if (reconcileFrom.value > reconcileTo.value) {
    feedbackError.value = "A data inicial não pode ser maior que a data final.";
    return;
  }
  const diffDays =
    Math.floor(
      (new Date(reconcileTo.value) - new Date(reconcileFrom.value)) /
        (1000 * 60 * 60 * 24),
    ) + 1;
  if (diffDays > 31) {
    feedbackError.value = "A janela máxima permitida é de 31 dias.";
    return;
  }

  reconciling.value = true;
  try {
    const result = await edgeSyncService.triggerReconciliation(
      reconcileFrom.value,
      reconcileTo.value,
    );
    reconcileResult.value = result;
    await refreshHealth();
  } catch (err) {
    if (err?.response?.status === 409) {
      feedbackError.value =
        err?.response?.data?.message ||
        "Aguarde o envio dos eventos pendentes antes de iniciar a conferência.";
    } else {
      feedbackError.value =
        err?.response?.data?.message ||
        "Falha ao executar a conferência com a nuvem.";
    }
  } finally {
    reconciling.value = false;
  }
};

const changePage = async (delta) => {
  const next = Math.max(0, page.value + delta);
  if (next === page.value) return;
  page.value = next;
  await loadFailed();
};
</script>

<template>
  <div class="space-y-6">
    <!-- Cabeçalho -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <router-link
          to="/integracoes"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 mb-2"
        >
          <ArrowLeft :size="14" />
          Voltar para Integrações
        </router-link>
        <h1 class="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2.5">
          <HardDrive class="text-orange-500" :size="28" />
          Diagnóstico de Sincronização Edge
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Auditoria da fila local (Outbox), cursor contíguo na nuvem e conferência periódica (anti-entropy).
        </p>
      </div>

      <button
        @click="reloadAll"
        :disabled="healthLoading || failedLoading"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition-all"
      >
        <RefreshCw
          :size="15"
          :class="{ 'animate-spin': healthLoading || failedLoading }"
        />
        Atualizar Status
      </button>
    </div>

    <!-- Aviso se acessado em instância CLOUD -->
    <div
      v-if="health && !isEdgeNode"
      class="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-900 font-medium"
    >
      Este servidor está operando em modo <strong>CLOUD</strong>. As métricas de fila Outbox e reconciliação ativa são executadas diretamente no servidor local do balcão (modo <strong>EDGE</strong>).
    </div>

    <!-- Alertas de feedback -->
    <div
      v-if="feedbackError"
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2"
    >
      <AlertTriangle :size="16" class="shrink-0" />
      <span>{{ feedbackError }}</span>
    </div>

    <div
      v-if="feedbackSuccess"
      class="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2"
    >
      <CheckCircle2 :size="16" class="shrink-0" />
      <span>{{ feedbackSuccess }}</span>
    </div>

    <!-- Banner de Backoff / Sem Conexão -->
    <div
      v-if="health && health.consecutiveFailures > 0"
      class="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 space-y-1"
    >
      <div class="flex items-center gap-2 font-black text-sm text-amber-800">
        <WifiOff :size="17" />
        <span>Fluxo em espera de reconexão ({{ health.consecutiveFailures }} tentativa(s) falha(s))</span>
      </div>
      <p v-if="health.lastError"><strong>Último erro:</strong> {{ health.lastError }}</p>
      <p v-if="health.nextAttemptAt">
        <strong>Próxima tentativa automática:</strong> {{ formatDateTime(health.nextAttemptAt) }}
      </p>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
          Fila Pendente
        </p>
        <p class="text-3xl font-black text-slate-900 mt-2">
          {{ health?.pendingCount ?? 0 }}
        </p>
        <p class="text-xs text-slate-500 mt-1">
          <template v-if="health?.oldestPendingAgeSeconds != null">
            Mais antigo há {{ health.oldestPendingAgeSeconds }}s
          </template>
          <template v-else>Nenhum evento aguardando envio</template>
        </p>
      </div>

      <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
          Rejeitados (FAILED)
        </p>
        <p
          class="text-3xl font-black mt-2"
          :class="(health?.failedCount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'"
        >
          {{ health?.failedCount ?? 0 }}
        </p>
        <p class="text-xs text-slate-500 mt-1">
          Nunca confirmados silenciosamente
        </p>
      </div>

      <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
          Cursor Confirmado na Nuvem
        </p>
        <p class="text-3xl font-black text-slate-900 mt-2">
          #{{ health?.cloudAckSequence ?? 0 }}
        </p>
        <p class="text-xs text-slate-500 mt-1">
          Último envio: {{ formatDateTime(health?.lastSuccessAt) }}
        </p>
      </div>

      <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
          Última Conferência
        </p>
        <p class="text-xl font-black text-slate-900 mt-2">
          {{ health?.lastReconciliation?.status || "Ainda não executada" }}
        </p>
        <p class="text-xs text-slate-500 mt-1">
          <template v-if="health?.lastReconciliation">
            {{ health.lastReconciliation.bucketsCompared }} grupos ·
            {{ health.lastReconciliation.requeuedCount }} reparado(s)
          </template>
          <template v-else>Automática a cada 6h</template>
        </p>
      </div>
    </div>

    <!-- Conferir Agora (Reconciliação Manual) -->
    <section class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 class="text-lg font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck class="text-emerald-600" :size="20" />
            Conferir Agora com a Nuvem (Checksum Anti-Entropy)
          </h2>
          <p class="text-xs text-slate-500 mt-1">
            Compara pedidos, pagamentos, sessões/movimentos de caixa e registros financeiros entre o balcão e a nuvem, reenfileirando automaticamente qualquer divergência.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-end gap-3">
        <label class="text-xs font-bold text-slate-700">
          De
          <input
            v-model="reconcileFrom"
            type="date"
            class="mt-1 block border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
          />
        </label>

        <label class="text-xs font-bold text-slate-700">
          Até
          <input
            v-model="reconcileTo"
            type="date"
            class="mt-1 block border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
          />
        </label>

        <BaseButton size="sm" :loading="reconciling" @click="handleReconcile">
          <ShieldCheck :size="16" />
          Conferir agora
        </BaseButton>
      </div>

      <div
        v-if="reconcileResult"
        class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-1"
      >
        <p class="font-bold text-slate-900">
          Resultado: {{ reconcileResult.status }}
        </p>
        <p>
          {{ reconcileResult.bucketsCompared }} grupo(s) verificado(s) ·
          {{ reconcileResult.bucketsMismatched }} divergente(s) ·
          <strong>{{ reconcileResult.requeuedCount }} registro(s) reenfileirado(s)</strong>
          <template v-if="reconcileResult.extraInCloudCount > 0">
            · {{ reconcileResult.extraInCloudCount }} presente(s) apenas na nuvem
          </template>
        </p>
      </div>
    </section>

    <!-- Tabela de Eventos Rejeitados -->
    <section class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-black text-slate-900">
            Eventos Rejeitados pela Nuvem (FAILED)
          </h2>
          <p class="text-xs text-slate-500">
            Ao clicar em Reenviar, o balcão gera um novo evento com o estado atual do registro.
          </p>
        </div>
      </div>

      <div
        v-if="failedEvents.length === 0 && !failedLoading"
        class="text-center py-8 text-xs text-slate-400 font-medium"
      >
        Nenhum evento rejeitado para esta loja.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
              <th class="py-2.5 pr-3">Seq</th>
              <th class="py-2.5 pr-3">Tipo</th>
              <th class="py-2.5 pr-3">Agregado</th>
              <th class="py-2.5 pr-3">Motivo da Rejeição</th>
              <th class="py-2.5 pr-3">Criado em</th>
              <th class="py-2.5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in failedEvents" :key="item.id">
              <td class="py-3 pr-3 font-mono font-bold text-slate-800">
                #{{ item.sequence ?? "—" }}
              </td>
              <td class="py-3 pr-3 font-semibold text-slate-700">
                {{ item.eventType }}
              </td>
              <td class="py-3 pr-3 font-mono text-slate-500">
                {{ item.aggregateId }}
              </td>
              <td class="py-3 pr-3 text-red-600 font-medium max-w-md">
                {{ item.rejectedReason || "Rejeitado pela nuvem" }}
              </td>
              <td class="py-3 pr-3 text-slate-500">
                {{ formatDateTime(item.createdAt) }}
              </td>
              <td class="py-3 text-right">
                <button
                  @click="handleRetry(item)"
                  :disabled="retryingId === item.id"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold transition-colors disabled:opacity-50"
                >
                  <RotateCcw :size="13" />
                  <span>{{ retryingId === item.id ? "Enviando..." : "Reenviar" }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="page > 0 || failedEvents.length === pageSize"
        class="flex items-center justify-end gap-2 pt-2"
      >
        <button
          @click="changePage(-1)"
          :disabled="page === 0"
          class="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-40"
        >
          Anterior
        </button>
        <span class="text-xs text-slate-500 font-semibold">Página {{ page + 1 }}</span>
        <button
          @click="changePage(1)"
          :disabled="failedEvents.length < pageSize"
          class="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </section>
  </div>
</template>

