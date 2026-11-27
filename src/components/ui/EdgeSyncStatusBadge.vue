<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
  CheckCircle2,
  RefreshCw,
  WifiOff,
  AlertTriangle,
} from "lucide-vue-next";
import { useEdgeSyncHealth } from "@/composables/useEdgeSyncHealth";
import { authState } from "@/utils/auth";

const router = useRouter();
const { health, isEdgeMode, visualState } = useEdgeSyncHealth();
const isPopoverOpen = ref(false);

const canOpenDiagnostics = computed(() =>
  authState.hasPermission("integracoes"),
);

// FE-4: passar referências diretas de componentes Lucide, nunca strings
const badgeConfig = computed(() => {
  const h = health.value || {};
  switch (visualState.value) {
    case "FAILED": {
      const n = h.failedCount || 0;
      return {
        icon: AlertTriangle,
        spin: false,
        label: n === 1 ? "1 rejeitado" : `${n} rejeitados`,
        detail:
          "Existem eventos rejeitados pela nuvem que exigem atenção do gerente.",
        classes:
          "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 shadow-sm",
        dotClasses: "bg-red-500",
      };
    }
    case "OFFLINE": {
      return {
        icon: WifiOff,
        spin: false,
        label: `Sem nuvem (${h.consecutiveFailures}x)`,
        detail:
          h.lastError ||
          "Sem conexão com a nuvem. Os dados estão salvos no balcão e serão reenviados automaticamente.",
        classes:
          "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300",
        dotClasses: "bg-amber-500",
      };
    }
    case "PENDING": {
      const n = h.pendingCount || 0;
      return {
        icon: RefreshCw,
        spin: true,
        label: n === 1 ? "1 pendente" : `${n} pendentes`,
        detail: "Sincronizando alterações recentes do balcão com a nuvem.",
        classes: "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200",
        dotClasses: "bg-sky-500",
      };
    }
    default:
      return {
        icon: CheckCircle2,
        spin: false,
        label: "Sincronizado",
        detail: "Todos os dados operacionais do balcão estão confirmados na nuvem.",
        classes:
          "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200",
        dotClasses: "bg-emerald-500",
      };
  }
});

const handleClick = () => {
  if (canOpenDiagnostics.value) {
    isPopoverOpen.value = false;
    router.push("/integracoes/edge-sync");
  } else {
    isPopoverOpen.value = !isPopoverOpen.value;
  }
};
</script>

<template>
  <div v-if="isEdgeMode" class="relative">
    <button
      data-testid="edge-sync-badge"
      @click="handleClick"
      :class="[
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors',
        badgeConfig.classes,
      ]"
      :title="badgeConfig.detail"
    >
      <component
        :is="badgeConfig.icon"
        :size="15"
        :class="{ 'animate-spin': badgeConfig.spin }"
      />
      <span class="hidden sm:inline">{{ badgeConfig.label }}</span>
    </button>

    <!-- Popover somente leitura para operadores sem permissão 'integracoes' (ex.: CAIXA) -->
    <div
      v-if="isPopoverOpen && !canOpenDiagnostics"
      class="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 text-xs text-slate-700 space-y-2"
    >
      <div class="flex items-center justify-between font-bold text-slate-900">
        <span class="flex items-center gap-1.5">
          <span :class="['w-2 h-2 rounded-full', badgeConfig.dotClasses]"></span>
          Sincronização do Balcão
        </span>
        <button
          @click="isPopoverOpen = false"
          class="text-slate-400 hover:text-slate-700"
        >
          ✕
        </button>
      </div>
      <p class="leading-relaxed text-slate-600">{{ badgeConfig.detail }}</p>
      <p v-if="visualState === 'FAILED'" class="font-bold text-red-600">
        Solicite ao gerente para verificar em Integrações → Diagnóstico Edge.
      </p>
    </div>
  </div>
</template>

