<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">
          Checklist Diário
        </h1>
        <p class="text-slate-500 text-sm font-medium">
          Controle de abertura e fechamento da loja
        </p>
      </div>

      <div
        class="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200"
      >
        <button
          @click="activeTab = 'abertura'"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
            activeTab === 'abertura'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-50',
          ]"
        >
          Abertura
        </button>
        <button
          @click="activeTab = 'fechamento'"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
            activeTab === 'fechamento'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-50',
          ]"
        >
          Fechamento
        </button>
      </div>
    </div>

    <div
      class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm max-w-2xl"
    >
      <div class="space-y-4">
        <label
          v-for="item in currentTasks"
          :key="item.id"
          class="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors group"
        >
          <input
            type="checkbox"
            v-model="item.done"
            class="mt-1 w-5 h-5 rounded border-slate-300 text-orange-600 transition-all cursor-pointer"
          />
          <div class="flex-1">
            <h4
              :class="[
                'font-bold text-sm transition-colors',
                item.done ? 'text-slate-400 line-through' : 'text-slate-800',
              ]"
            >
              {{ item.task }}
            </h4>
            <p class="text-xs text-slate-500 mt-1 font-medium">
              {{ item.desc }}
            </p>
          </div>
        </label>
      </div>

      <div
        class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between"
      >
        <div class="text-sm font-black text-slate-600">
          Progresso: <span class="text-orange-600">{{ progress }}%</span>
        </div>
        <div
          class="flex-1 max-w-xs ml-4 bg-slate-100 rounded-full h-3 overflow-hidden"
        >
          <div
            class="bg-orange-500 h-full rounded-full transition-all duration-500"
            :style="`width: ${progress}%`"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const activeTab = ref("abertura");

const checklists = ref({
  abertura: [
    {
      id: 1,
      task: "Ligar equipamentos",
      desc: "Fritadeiras, chapas e fornos na temperatura correta.",
      done: false,
    },
    {
      id: 2,
      task: "Conferência de Caixa",
      desc: "Verificar troco inicial e maquininhas.",
      done: false,
    },
    {
      id: 3,
      task: "Pré-preparo (Mise en place)",
      desc: "Cortar ingredientes frescos, porcionar insumos.",
      done: false,
    },
    {
      id: 4,
      task: "Limpeza do Salão e Banheiros",
      desc: "Mesas higienizadas, lixos vazios.",
      done: false,
    },
    {
      id: 5,
      task: "Ligar Integrações",
      desc: "iFood e WhatsApp conectados e online.",
      done: false,
    },
  ],
  fechamento: [
    {
      id: 1,
      task: "Limpeza Pesada",
      desc: "Lavar chão, chapas e coifas.",
      done: false,
    },
    {
      id: 2,
      task: "Armazenamento",
      desc: "Guardar e etiquetar insumos perecíveis.",
      done: false,
    },
    {
      id: 3,
      task: "Fechamento de Caixa",
      desc: "Bater os valores de cartão, dinheiro e Pix.",
      done: false,
    },
    {
      id: 4,
      task: "Desligar Equipamentos",
      desc: "Desconectar tudo da tomada e fechar gás.",
      done: false,
    },
  ],
});

const currentTasks = computed(() => checklists.value[activeTab.value]);

const progress = computed(() => {
  const tasks = currentTasks.value;
  const done = tasks.filter((t) => t.done).length;
  if (tasks.length === 0) return 0;
  return Math.round((done / tasks.length) * 100);
});
</script>
