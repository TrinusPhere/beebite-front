<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Save,
  Search,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { ingredientService } from "@/services/ingredientService";
import { stockMovementService } from "@/services/stockMovementService";

const ingredients = ref([]);
const movements = ref([]);
const loading = ref(false);
const search = ref("");

const form = reactive({
  ingredientId: "",
  type: "ENTRADA",
  quantity: "",
  reason: "",
  document: "",
});

const movementTypes = [
  ["ENTRADA", "Entrada"],
  ["SAIDA", "Saída"],
  ["PERDA", "Perda"],
  ["QUEBRA", "Quebra"],
  ["AJUSTE", "Ajuste positivo"],
];

const loadData = async () => {
  loading.value = true;
  try {
    const [ingredientData, movementData] = await Promise.all([
      ingredientService.getAll(),
      stockMovementService.getAll(),
    ]);
    ingredients.value = ingredientData;
    movements.value = movementData;
  } catch (error) {
    console.error("Erro ao carregar estoque:", error);
    alert("Não foi possível carregar as movimentações de estoque.");
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

const selectedIngredient = computed(() =>
  ingredients.value.find((i) => String(i.id) === String(form.ingredientId)),
);

const filteredMovements = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return movements.value;
  return movements.value.filter(
    (m) =>
      String(m.ingredientName || "")
        .toLowerCase()
        .includes(q) ||
      String(m.type || "")
        .toLowerCase()
        .includes(q) ||
      String(m.reason || "")
        .toLowerCase()
        .includes(q),
  );
});

const submit = async () => {
  if (
    !form.ingredientId ||
    !Number(form.quantity) ||
    Number(form.quantity) <= 0
  ) {
    alert("Selecione o ingrediente e informe uma quantidade maior que zero.");
    return;
  }
  if (!form.reason.trim()) {
    alert("Informe o motivo da movimentação.");
    return;
  }

  loading.value = true;
  try {
    await stockMovementService.create({
      ingredientId: String(form.ingredientId),
      type: form.type,
      quantity: Number(form.quantity),
      reason: form.reason.trim(),
      document: form.document.trim() || null,
    });
    form.quantity = "";
    form.reason = "";
    form.document = "";
    await loadData();
  } catch (error) {
    console.error("Erro ao movimentar estoque:", error);
    alert(error.response?.data?.message || "Erro ao registrar movimentação.");
  } finally {
    loading.value = false;
  }
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("pt-BR") : "-";
const formatQuantity = (value, unit) =>
  `${Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit || ""}`;
const isOut = (type) => ["SAIDA", "PERDA", "QUEBRA", "VENDA"].includes(type);
</script>

<template>
  <div class="space-y-6 pb-12">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-black text-slate-800">
          Movimentações de Estoque
        </h1>
        <p class="text-sm text-slate-500 font-medium">
          Entradas, saídas, perdas e ajustes com histórico.
        </p>
      </div>
      <BaseButton variant="secondary" @click="loadData" :loading="loading"
        ><RefreshCw :size="18" /> Atualizar</BaseButton
      >
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
      <form
        @submit.prevent="submit"
        class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 h-fit"
      >
        <div>
          <h2 class="font-black text-slate-800">Nova movimentação</h2>
          <p class="text-xs text-slate-400 mt-1">
            Não altere mais o estoque manualmente no cadastro do ingrediente.
          </p>
        </div>

        <div class="space-y-2">
          <label
            class="text-[10px] uppercase tracking-widest font-black text-slate-500"
            >Ingrediente</label
          >
          <select
            v-model="form.ingredientId"
            required
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none"
          >
            <option value="">Selecione...</option>
            <option
              v-for="item in ingredients.filter((i) => i.active !== false)"
              :key="item.id"
              :value="item.id"
            >
              {{ item.name }} — {{ item.stock }} {{ item.unit }}
            </option>
          </select>
          <p v-if="selectedIngredient" class="text-xs text-slate-500">
            Saldo atual:
            <strong
              >{{ selectedIngredient.stock }}
              {{ selectedIngredient.unit }}</strong
            >
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <label
              class="text-[10px] uppercase tracking-widest font-black text-slate-500"
              >Tipo</label
            >
            <select
              v-model="form.type"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none"
            >
              <option
                v-for="[value, label] in movementTypes"
                :key="value"
                :value="value"
              >
                {{ label }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <label
              class="text-[10px] uppercase tracking-widest font-black text-slate-500"
              >Quantidade</label
            >
            <input
              v-model="form.quantity"
              type="number"
              min="0"
              step="0.001"
              required
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label
            class="text-[10px] uppercase tracking-widest font-black text-slate-500"
            >Motivo *</label
          >
          <input
            v-model="form.reason"
            type="text"
            placeholder="Ex: Compra semanal, perda por validade..."
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none"
          />
        </div>

        <div class="space-y-2">
          <label
            class="text-[10px] uppercase tracking-widest font-black text-slate-500"
            >Documento / Referência</label
          >
          <input
            v-model="form.document"
            type="text"
            placeholder="NF, pedido, lote..."
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none"
          />
        </div>

        <BaseButton
          type="submit"
          variant="primary"
          class="w-full"
          :loading="loading"
          ><Save :size="18" /> Registrar movimentação</BaseButton
        >
      </form>

      <div
        class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
      >
        <div class="p-4 border-b border-slate-100 flex items-center gap-3">
          <div class="relative max-w-md w-full">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              :size="18"
            />
            <input
              v-model="search"
              type="text"
              placeholder="Buscar histórico..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm outline-none"
            />
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead
              class="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400"
            >
              <tr>
                <th class="px-5 py-4">Data</th>
                <th class="px-5 py-4">Ingrediente</th>
                <th class="px-5 py-4">Tipo</th>
                <th class="px-5 py-4">Quantidade</th>
                <th class="px-5 py-4">Motivo</th>
                <th class="px-5 py-4">Saldo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="m in filteredMovements"
                :key="m.id"
                class="hover:bg-slate-50"
              >
                <td class="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                  {{ formatDate(m.createdAt) }}
                </td>
                <td class="px-5 py-4 text-sm font-bold text-slate-700">
                  {{ m.ingredientName || `#${m.ingredientId}` }}
                </td>
                <td class="px-5 py-4">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black',
                      isOut(m.type)
                        ? 'bg-red-50 text-red-600'
                        : 'bg-emerald-50 text-emerald-600',
                    ]"
                    ><component
                      :is="isOut(m.type) ? ArrowUpFromLine : ArrowDownToLine"
                      :size="12"
                    />{{ m.type }}</span
                  >
                </td>
                <td class="px-5 py-4 text-xs font-bold">
                  {{ formatQuantity(m.quantity, m.unit) }}
                </td>
                <td class="px-5 py-4 text-xs text-slate-500">
                  {{ m.reason || "-" }}
                </td>
                <td class="px-5 py-4 text-xs font-black text-slate-700">
                  {{ m.resultingStock ?? "-" }}
                </td>
              </tr>
              <tr v-if="filteredMovements.length === 0">
                <td colspan="6" class="p-10 text-center text-sm text-slate-400">
                  Nenhuma movimentação registrada.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
