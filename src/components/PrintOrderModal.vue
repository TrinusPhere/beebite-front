<script setup>
import { ref, onMounted, watch } from "vue";
import { Printer, X, Check, Loader2, Usb, Wifi } from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { printingService } from "@/services/printingService";
import { usbPrinterService } from "@/services/usbPrinterService";

const props = defineProps({
  show: Boolean,
  order: Object,
});

const emit = defineEmits(["close"]);

const printers = ref([]);
const selectedPrinterId = ref("");
const selectedDocType = ref("KITCHEN");
const loading = ref(false);
const printing = ref(false);
const statusMessage = ref("");
const statusError = ref(false);

const loadPrinters = async () => {
  loading.value = true;
  try {
    const list = await printingService.getPrinters();
    printers.value = list.filter((p) => p.active);
    if (printers.value.length > 0 && !selectedPrinterId.value) {
      selectedPrinterId.value = printers.value[0].id;
    }
  } catch (err) {
    console.error("Erro ao carregar impressoras:", err);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.show,
  (val) => {
    if (val) {
      statusMessage.value = "";
      statusError.value = false;
      loadPrinters();
    }
  }
);

onMounted(() => {
  if (props.show) loadPrinters();
});

const executePrint = async () => {
  if (!selectedPrinterId.value || !props.order?.id) return;
  printing.value = true;
  statusMessage.value = "";
  statusError.value = false;

  try {
    const result = await printingService.printOrder(
      props.order.id,
      selectedPrinterId.value,
      selectedDocType.value
    );

    if (result.mode === "BROWSER" && result.escPosBase64) {
      statusMessage.value = "Enviando para impressora USB...";
      await usbPrinterService.sendEscPosToUsb(result.escPosBase64);
      statusMessage.value = "Impresso com sucesso via USB!";
    } else {
      statusMessage.value = result.message || "Enviado para a impressora com sucesso!";
    }

    setTimeout(() => {
      emit("close");
    }, 1500);
  } catch (err) {
    statusError.value = true;
    statusMessage.value = err.message || "Erro ao imprimir comanda.";
  } finally {
    printing.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50"
    >
      <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-5">
        <!-- Cabeçalho -->
        <div class="flex items-center justify-between border-b pb-4">
          <div class="flex items-center gap-2.5">
            <div class="p-2.5 bg-orange-50 text-orange-600 rounded-2xl">
              <Printer :size="22" />
            </div>
            <div>
              <h2 class="text-base font-black text-slate-800">Imprimir Comanda</h2>
              <p class="text-xs text-slate-500">
                Pedido #{{ order?.displayId || order?.id?.slice(0, 8) }}
              </p>
            </div>
          </div>
          <button
            class="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
            @click="$emit('close')"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- Formulário -->
        <div class="space-y-4">
          <!-- Tipo de Documento -->
          <div>
            <label class="text-xs font-bold text-slate-600 block mb-1.5">
              Tipo de Comanda / Documento
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                @click="selectedDocType = 'KITCHEN'"
                :class="[
                  'p-2.5 rounded-2xl border text-xs font-bold text-center transition flex flex-col items-center gap-1',
                  selectedDocType === 'KITCHEN'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                ]"
              >
                <span>🍳 Cozinha</span>
                <span class="text-[10px] font-normal text-slate-400">Produção</span>
              </button>

              <button
                type="button"
                @click="selectedDocType = 'EXPEDITION'"
                :class="[
                  'p-2.5 rounded-2xl border text-xs font-bold text-center transition flex flex-col items-center gap-1',
                  selectedDocType === 'EXPEDITION'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                ]"
              >
                <span>📦 Expedição</span>
                <span class="text-[10px] font-normal text-slate-400">Entrega</span>
              </button>

              <button
                type="button"
                @click="selectedDocType = 'CUSTOMER_RECEIPT'"
                :class="[
                  'p-2.5 rounded-2xl border text-xs font-bold text-center transition flex flex-col items-center gap-1',
                  selectedDocType === 'CUSTOMER_RECEIPT'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                ]"
              >
                <span>🧾 Cliente</span>
                <span class="text-[10px] font-normal text-slate-400">Com valores</span>
              </button>
            </div>
          </div>

          <!-- Seleção da Impressora -->
          <div>
            <label class="text-xs font-bold text-slate-600 block mb-1.5">
              Selecione a Impressora
            </label>
            <div v-if="loading" class="text-xs text-slate-400 p-2">
              Carregando impressoras...
            </div>
            <div
              v-else-if="printers.length === 0"
              class="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800"
            >
              Nenhuma impressora ativa encontrada. Cadastre uma impressora em Configurações > Impressoras.
            </div>
            <div v-else class="space-y-2 max-h-48 overflow-y-auto">
              <label
                v-for="p in printers"
                :key="p.id"
                :class="[
                  'flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition',
                  selectedPrinterId === p.id
                    ? 'border-orange-500 bg-orange-50/50'
                    : 'border-slate-200 hover:bg-slate-50',
                ]"
              >
                <div class="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="printer"
                    :value="p.id"
                    v-model="selectedPrinterId"
                    class="text-orange-500 focus:ring-orange-400"
                  />
                  <div>
                    <b class="text-xs text-slate-800 block">{{ p.name }}</b>
                    <span class="text-[10px] text-slate-400">
                      {{ p.paperWidthMm }}mm ({{ p.columns }} col) • {{ p.codePage }}
                    </span>
                  </div>
                </div>

                <span
                  :class="[
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1',
                    p.connectionType === 'NETWORK'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700',
                  ]"
                >
                  <Wifi v-if="p.connectionType === 'NETWORK'" :size="10" />
                  <Usb v-else :size="10" />
                  {{ p.connectionType === 'NETWORK' ? 'Rede' : 'USB' }}
                </span>
              </label>
            </div>
          </div>

          <!-- Mensagem de Status -->
          <div
            v-if="statusMessage"
            :class="[
              'p-3 rounded-2xl text-xs font-semibold flex items-center gap-2',
              statusError
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            ]"
          >
            <Check v-if="!statusError" :size="16" />
            <span>{{ statusMessage }}</span>
          </div>
        </div>

        <!-- Ações -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            @click="$emit('close')"
          >
            Cancelar
          </button>
          <BaseButton
            :disabled="!selectedPrinterId || printing || printers.length === 0"
            @click="executePrint"
          >
            <Loader2 v-if="printing" class="animate-spin" :size="16" />
            <Printer v-else :size="16" />
            <span>{{ printing ? 'Imprimindo...' : 'Imprimir Agora' }}</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
