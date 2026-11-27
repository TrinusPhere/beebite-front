import { ref, computed, onMounted, onUnmounted } from "vue";
import { edgeSyncService } from "@/services/edgeSyncService";
import { authState } from "@/utils/auth";

const health = ref(null);
const loading = ref(false);
let pollTimer = null;
let subscribers = 0;

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const fetchHealth = async () => {
  if (!authState.currentUser) {
    health.value = null;
    stopPolling();
    return null;
  }
  loading.value = true;
  try {
    const data = await edgeSyncService.getHealth();
    health.value = data;
    const mode = data?.syncMode?.toUpperCase();
    if (mode !== "EDGE") {
      stopPolling();
    }
    return data;
  } catch (err) {
    console.warn("Não foi possível consultar saúde da sincronização Edge:", err);
    return health.value;
  } finally {
    loading.value = false;
  }
};

export function useEdgeSyncHealth() {
  const isEdgeMode = computed(
    () => health.value?.syncMode?.toUpperCase() === "EDGE",
  );

  const visualState = computed(() => {
    if (!isEdgeMode.value || !health.value) return "HIDDEN";
    if ((health.value.failedCount || 0) > 0) return "FAILED";
    if ((health.value.consecutiveFailures || 0) > 0) return "OFFLINE";
    if ((health.value.pendingCount || 0) > 0) return "PENDING";
    return "SYNCED";
  });

  onMounted(async () => {
    subscribers += 1;
    if (subscribers === 1) {
      const initial = await fetchHealth();
      if (initial?.syncMode?.toUpperCase() === "EDGE" && !pollTimer) {
        pollTimer = setInterval(fetchHealth, 30000);
      }
    }
  });

  onUnmounted(() => {
    subscribers = Math.max(0, subscribers - 1);
    if (subscribers === 0) {
      stopPolling();
    }
  });

  return {
    health,
    loading,
    isEdgeMode,
    visualState,
    refresh: fetchHealth,
  };
}

