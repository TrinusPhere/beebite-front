<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  Save,
  X,
  Package,
  DollarSign,
  Database,
  ChevronLeft,
  AlertCircle,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { ingredientService } from "@/services/ingredientService";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/money";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const isEditing = ref(false);

const form = reactive({
  id: null,
  name: "",
  stock: "",
  unit: "UN",
  costPrice: "",
  minStock: "",
  active: true,
});

onMounted(async () => {
  if (route.params.id) {
    isEditing.value = true;
    try {
      const itemToEdit = await ingredientService.getById(route.params.id);
      if (itemToEdit) {
        Object.assign(form, itemToEdit);
      }
    } catch (err) {
      console.error("Erro ao carregar ingrediente para edição", err);
      alert("Ingrediente não encontrado!");
      router.push("/ingredientes");
    }
  }
});

const handleSubmit = async () => {
  loading.value = true;
  try {
    const payload = { ...form };
    if (isEditing.value) {
      await ingredientService.update(form.id, payload);
      alert("Ingrediente atualizado com sucesso!");
    } else {
      delete payload.id;
      await ingredientService.create(payload);
      alert("Ingrediente cadastrado com sucesso!");
    }
    router.push("/ingredientes");
  } catch (err) {
    console.error("Erro ao salvar ingrediente", err);
    alert("Erro ao salvar ingrediente. Verifique os dados.");
  } finally {
    loading.value = false;
  }
};

const handlePriceInput = (event) => {
  const hasDigits = /\d/.test(event.target.value);
  form.costPrice = parseCurrencyInput(event.target.value);
  event.target.value = hasDigits ? formatCurrencyInput(form.costPrice) : "";
};
const handleStockInput = (event, field) => {
  let value = event.target.value;

  // UN, G e ML: somente inteiro
  if (["UN", "G", "ML"].includes(form.unit)) {
    value = value.replace(/\D/g, "");

    const number = parseInt(value, 10);

    form[field] = isNaN(number) ? null : number;

    return;
  }

  // KG e L: começa pelas casas decimais
  if (["KG", "L"].includes(form.unit)) {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
      form[field] = null;
      return;
    }

    form[field] = Number(digits) / 100;
  }
};
const formatStockValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);

  if (isNaN(number)) {
    return "";
  }

  if (["KG", "L"].includes(form.unit)) {
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return Math.trunc(number).toLocaleString("pt-BR");
};
const stockPlaceholder = computed(() => {
  switch (form.unit) {
    case "UN":
      return "Ex: 10";

    case "KG":
      return "Ex: 1,500";

    case "G":
      return "Ex: 500";

    case "L":
      return "Ex: 2,000";

    case "ML":
      return "Ex: 500";

    default:
      return "0";
  }
});

const minStockPlaceholder = computed(() => {
  switch (form.unit) {
    case "UN":
      return "Ex: 5";

    case "KG":
      return "Ex: 0,500";

    case "G":
      return "Ex: 100";

    case "L":
      return "Ex: 0,500";

    case "ML":
      return "Ex: 250";

    default:
      return "0";
  }
});
const handleUnitChange = () => {
  if (form.unit === "UN") {
    if (form.stock) {
      form.stock = Math.max(1, Math.trunc(Number(form.stock)));
    }

    if (form.minStock) {
      form.minStock = Math.max(1, Math.trunc(Number(form.minStock)));
    }
  }

  if (["G", "ML"].includes(form.unit)) {
    if (form.stock) {
      form.stock = Math.trunc(Number(form.stock));
    }

    if (form.minStock) {
      form.minStock = Math.trunc(Number(form.minStock));
    }
  }
};
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 pb-12">
    <!-- Header Dinâmico -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          @click="router.push('/ingredientes')"
          class="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
        >
          <ChevronLeft :size="24" />
        </button>
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">
            {{ isEditing ? "Editar Ingrediente" : "Novo Ingrediente" }}
          </h1>
          <p class="text-slate-500 text-sm font-medium">
            {{
              isEditing
                ? `Editando: ${form.name}`
                : "Cadastre um novo insumo no sistema"
            }}
          </p>
        </div>
      </div>

      <!-- Badge de Edição -->
      <div
        v-if="isEditing"
        class="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-200"
      >
        Modo Edição
      </div>
    </div>

    <!-- Info Alert -->
    <div
      class="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3"
    >
      <AlertCircle class="text-blue-500 shrink-0" :size="20" />
      <p class="text-blue-700 text-xs leading-relaxed font-bold">
        {{
          isEditing
            ? "O saldo de estoque é somente leitura nesta tela. Use Movimentações de Estoque para entradas, saídas, perdas e ajustes. Alterações de custo afetam os produtos que utilizam este ingrediente."
            : "O valor informado em estoque será tratado como estoque inicial. Depois do cadastro, altere o saldo por Movimentações de Estoque."
        }}
      </p>
    </div>

    <!-- Form Card -->
    <div
      class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
    >
      <form @submit.prevent="handleSubmit" class="p-8 space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Nome -->
          <div class="md:col-span-2 space-y-2">
            <label
              class="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider"
              >Nome do Ingrediente</label
            >
            <div class="relative">
              <Package
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                :size="18"
              />
              <input
                v-model="form.name"
                type="text"
                placeholder="Ex: Hambúrguer de Carne 150g"
                required
                class="w-full bg-slate-50 border border-slate-200 text-sm pl-10 p-3.5 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium"
              />
            </div>
          </div>
          <!-- Estoque -->
          <div class="space-y-2">
            <label
              class="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider"
            >
              {{ isEditing ? "Estoque Atual" : "Estoque Inicial" }}
            </label>

            <div class="flex gap-2">
              <div class="relative flex-1">
                <Database
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  :size="18"
                />
                <input
                  :value="formatStockValue(form.stock)"
                  @input="handleStockInput($event, 'stock')"
                  type="text"
                  inputmode="decimal"
                  :placeholder="stockPlaceholder"
                  :disabled="isEditing"
                  required
                  :class="[
                    'w-full border border-slate-200 text-sm pl-10 p-3.5 rounded-xl outline-none transition-all font-bold',
                    isEditing
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500',
                  ]"
                />
              </div>

              <select
                v-model="form.unit"
                @change="handleUnitChange"
                class="bg-slate-50 border border-slate-200 text-sm px-4 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none font-black text-slate-700 uppercase"
              >
                <option value="UN">UN</option>
                <option value="KG">KG</option>
                <option value="G">G</option>
                <option value="L">L</option>
                <option value="ML">ML</option>
              </select>
            </div>
          </div>

          <!-- Estoque Mínimo -->
          <div class="space-y-2">
            <label
              class="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider"
            >
              Alerta de Estoque Mínimo
            </label>

            <input
              :value="formatStockValue(form.minStock)"
              @input="handleStockInput($event, 'minStock')"
              type="text"
              inputmode="decimal"
              :placeholder="minStockPlaceholder"
              class="w-full bg-slate-50 border border-slate-200 text-sm p-3.5 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium"
            />
          </div>
          <!-- Status -->
          <div class="space-y-2">
            <label
              class="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider"
              >Status</label
            >
            <label
              class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3.5 cursor-pointer"
            >
              <div>
                <p class="text-sm font-bold text-slate-700">
                  Ingrediente ativo
                </p>
                <p class="text-[10px] text-slate-400">
                  Itens inativos permanecem no histórico, mas não devem ser
                  usados em novos cadastros.
                </p>
              </div>
              <input
                v-model="form.active"
                type="checkbox"
                class="w-5 h-5 rounded border-slate-300 text-orange-600"
              />
            </label>
          </div>

          <!-- Preço de Custo -->
          <div class="space-y-2">
            <label
              class="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider"
              >Custo Unitário (R$)</label
            >
            <div class="relative">
              <DollarSign
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                :size="18"
              />
              <input
                :value="formatCurrencyInput(form.costPrice)"
                @input="handlePriceInput"
                type="text"
                inputmode="numeric"
                class="w-full bg-slate-50 border border-slate-200 text-sm pl-10 p-3.5 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-orange-600"
              />
            </div>
          </div>
        </div>

        <!-- Botões -->
        <div
          class="pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4"
        >
          <BaseButton
            type="submit"
            variant="primary"
            class="flex-1 py-4"
            :loading="loading"
          >
            <Save :size="20" />
            {{ isEditing ? "Atualizar Ingrediente" : "Cadastrar Ingrediente" }}
          </BaseButton>
          <BaseButton
            type="button"
            variant="secondary"
            @click="router.push('/ingredientes')"
            class="md:w-48 py-4"
          >
            <X :size="20" />
            Cancelar
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
