<script setup>
import { ref, onMounted } from "vue";
import { X, Save, Clock, Power } from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { storeService } from "@/services/storeService";

const emit = defineEmits(["close"]);

const loading = ref(false);
const saving = ref(false);

const storeInfo = ref({
  name: "",
  logoUrl: "",
  isOpen: false,
  address: "",
  openingHours: "",
});

const autoSchedule = ref(false);
const schedule = ref({
  MONDAY: { start: "08:00", end: "22:00", active: true },
  TUESDAY: { start: "08:00", end: "22:00", active: true },
  WEDNESDAY: { start: "08:00", end: "22:00", active: true },
  THURSDAY: { start: "08:00", end: "22:00", active: true },
  FRIDAY: { start: "08:00", end: "22:00", active: true },
  SATURDAY: { start: "08:00", end: "22:00", active: true },
  SUNDAY: { start: "08:00", end: "22:00", active: false },
});

const dayLabels = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo"
};

const fetchStore = async () => {
  loading.value = true;
  try {
    const res = await storeService.getStore();
    storeInfo.value = res;
    if (res.openingHours) {
      try {
        const parsed = JSON.parse(res.openingHours);
        if (parsed.schedule) schedule.value = parsed.schedule;
        if (typeof parsed.autoSchedule === "boolean") autoSchedule.value = parsed.autoSchedule;
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  saving.value = true;
  try {
    storeInfo.value.openingHours = JSON.stringify({
      autoSchedule: autoSchedule.value,
      schedule: schedule.value
    });
    
    await storeService.updateStore(storeInfo.value);
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
    emit("close");
  }
};

const toggleStoreOpen = async () => {
  storeInfo.value.isOpen = !storeInfo.value.isOpen;
};

onMounted(() => {
  fetchStore();
});
</script>

<template>
  <teleport to="body">
    <div class="fixed inset-0 flex items-start justify-center p-4 sm:p-8 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" style="z-index: 99999;">
      <div class="bg-white rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl shrink-0 my-auto overflow-hidden">
        <div class="px-4 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0 rounded-t-2xl">
          <div>
            <h2 class="text-lg sm:text-xl font-bold text-slate-800">Configurações da Loja</h2>
            <p class="text-xs sm:text-sm text-slate-500">Horários e funcionamento</p>
          </div>
          <button @click="emit('close')" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X :size="20" />
          </button>
        </div>

        <div class="p-4 sm:p-6 space-y-6 sm:space-y-8" v-if="!loading">
          <!-- Manual Toggle -->
          <div class="p-4 sm:p-5 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors" :class="storeInfo.isOpen ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'">
            <div>
              <h3 class="font-bold text-base sm:text-lg" :class="storeInfo.isOpen ? 'text-emerald-700' : 'text-rose-700'">
                {{ storeInfo.isOpen ? 'Loja Aberta' : 'Loja Fechada' }}
              </h3>
              <p class="text-xs sm:text-sm mt-1" :class="storeInfo.isOpen ? 'text-emerald-600' : 'text-rose-600'">
                {{ storeInfo.isOpen ? 'Recebendo pedidos.' : 'Nenhum pedido pode ser feito agora.' }}
              </p>
            </div>
            <button @click="toggleStoreOpen" class="w-full sm:w-auto justify-center px-4 py-2 sm:py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm" :class="storeInfo.isOpen ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'">
              <Power :size="18" />
              {{ storeInfo.isOpen ? 'Fechar Loja' : 'Abrir Loja' }}
            </button>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <h3 class="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                  <Clock :size="18" class="text-orange-500" />
                  Horário Automático
                </h3>
                <p class="text-xs sm:text-sm text-slate-500 mt-1 max-w-[280px] sm:max-w-none">
                  Abre e fecha a loja sozinho.
                </p>
              </div>
              <div @click="autoSchedule = !autoSchedule" class="w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center shrink-0" :class="autoSchedule ? 'bg-emerald-500' : 'bg-rose-500'">
                <div class="bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ease-in-out" :style="autoSchedule ? 'transform: translateX(20px);' : 'transform: translateX(0px);'"></div>
              </div>
            </div>

            <div class="space-y-3 mt-4" :class="!autoSchedule ? 'opacity-50 pointer-events-none' : ''">
              <div v-for="(dayData, dayKey) in schedule" :key="dayKey" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div class="flex items-center justify-between sm:justify-start gap-4 sm:w-40">
                  <div class="font-semibold text-slate-700 text-sm">
                    {{ dayLabels[dayKey] }}
                  </div>
                  <div @click="dayData.active = !dayData.active" class="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center shrink-0" :class="dayData.active ? 'bg-emerald-500' : 'bg-rose-500'">
                    <div class="bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ease-in-out" :style="dayData.active ? 'transform: translateX(16px);' : 'transform: translateX(0px);'"></div>
                  </div>
                </div>

                <div class="flex items-center gap-2 sm:gap-4 justify-start" v-if="dayData.active">
                  <input type="time" v-model="dayData.start" class="w-28 sm:w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-center">
                  <span class="text-slate-400 text-xs sm:text-sm font-medium">até</span>
                  <input type="time" v-model="dayData.end" class="w-28 sm:w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-center">
                </div>
                <div class="flex-1 text-sm text-slate-400 italic bg-slate-50 px-3 py-2 rounded-lg text-center" v-else>
                  Fechado
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 sm:p-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-slate-100 bg-slate-50 shrink-0 rounded-b-2xl">
          <BaseButton variant="secondary" @click="emit('close')" class="w-full sm:w-auto justify-center">Cancelar</BaseButton>
          <BaseButton variant="primary" @click="save" :loading="saving" class="w-full sm:w-auto justify-center">
            <Save :size="18" class="mr-2" />
            Salvar Configurações
          </BaseButton>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
/* Bulletproof classes bypassing Tailwind JIT cache */
.bg-rose-500 { background-color: #f43f5e !important; }
.bg-emerald-500 { background-color: #10b981 !important; }
</style>
