<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import {
  Calculator,
  DollarSign,
  ShoppingBag,
  UtensilsCrossed,
  Search,
  AlertCircle,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { cmvService } from "@/services/financialService";
import { productService } from "@/services/productService";
import categoryService from "@/services/categoryService";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/money";

const activeTab = ref("geral"); // 'geral' ou 'por-produto'

// --- Aba 1: CMV Geral ---
const cmvGeralForm = reactive({
  dataInicio: "",
  dataFim: "",
  estoqueInicial: 0,
  comprasPeriodo: 0,
  estoqueFinal: 0,
});

const cmvGeralResult = ref(null);
const loadingGeral = ref(false);

const calcularCmvGeral = async () => {
  if (!cmvGeralForm.dataInicio || !cmvGeralForm.dataFim) {
    alert("Preencha a data de início e fim.");
    return;
  }

  loadingGeral.value = true;
  try {
    const payload = {
      startDate: new Date(cmvGeralForm.dataInicio).getTime(),
      endDate: new Date(cmvGeralForm.dataFim).getTime(),
      initialStock: cmvGeralForm.estoqueInicial,
      purchasesInPeriod: cmvGeralForm.comprasPeriodo,
      finalStock: cmvGeralForm.estoqueFinal,
    };
    const result = await cmvService.getGeneralCmv(payload);
    cmvGeralResult.value = result;
  } catch (error) {
    console.error("Erro ao calcular CMV Geral:", error);
    alert("Erro ao calcular CMV Geral.");
  } finally {
    loadingGeral.value = false;
  }
};

const handleCurrencyInput = (event, field) => {
  const hasDigits = /\d/.test(event.target.value);
  cmvGeralForm[field] = parseCurrencyInput(event.target.value);
  event.target.value = hasDigits ? formatCurrencyInput(cmvGeralForm[field]) : "";
};

const mapAlertColor = (level) => {
  if (level === "GREEN") return "text-emerald-600";
  if (level === "YELLOW") return "text-orange-600";
  return "text-red-600";
};

// --- Aba 2: CMV por Produto ---
const searchProduto = ref("");
const allProducts = ref([]);
const allCategories = ref([]);
const selectedCategory = ref("");
const produtoSelecionado = ref(null);
const loadingProduto = ref(false);
const cmvProdutoResult = ref(null);

const carregarProdutos = async () => {
  try {
    const data = await productService.getAll();
    allProducts.value = data.content || data; // Adapting for both paged and unpaged responses
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
  }
};

const carregarCategorias = async () => {
  try {
    const data = await categoryService.getCategories();
    allCategories.value = data.content || data;
  } catch (error) {
    console.error("Erro ao carregar categorias:", error);
  }
};

onMounted(() => {
  carregarProdutos();
  carregarCategorias();
});

const produtosFiltradosCMV = computed(() => {
  let filtered = allProducts.value || [];

  if (selectedCategory.value) {
    filtered = filtered.filter(
      (p) =>
        p.categoryId === selectedCategory.value ||
        p.category?.id === selectedCategory.value ||
        p.category === selectedCategory.value,
    );
  }

  if (searchProduto.value) {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(searchProduto.value.toLowerCase()),
    );
  }

  return filtered;
});

const selecionarProduto = async (produto) => {
  produtoSelecionado.value = produto;
  loadingProduto.value = true;
  cmvProdutoResult.value = null;
  try {
    const result = await cmvService.getProductCmv(produto.id);
    cmvProdutoResult.value = result;
  } catch (error) {
    console.error("Erro ao calcular CMV do produto:", error);
  } finally {
    loadingProduto.value = false;
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <div
      class="flex items-center justify-between border-b border-slate-100 pb-4"
    >
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">
          Controle de CMV
        </h1>
        <p class="text-slate-500 text-sm font-medium">
          Gerencie o Custo da Mercadoria Vendida da sua lanchonete
        </p>
      </div>
    </div>

    <!-- Abas de Navegação -->
    <div class="flex border-b border-slate-200">
      <button
        @click="activeTab = 'geral'"
        :class="[
          'py-2 px-4 text-sm font-medium',
          activeTab === 'geral'
            ? 'border-b-2 border-orange-500 text-orange-600'
            : 'text-slate-500 hover:text-slate-700',
        ]"
      >
        CMV Geral
      </button>
      <button
        @click="activeTab = 'por-produto'"
        :class="[
          'py-2 px-4 text-sm font-medium',
          activeTab === 'por-produto'
            ? 'border-b-2 border-orange-500 text-orange-600'
            : 'text-slate-500 hover:text-slate-700',
        ]"
      >
        CMV por Produto
      </button>
    </div>

    <!-- Conteúdo da Aba 1: CMV Geral -->
    <div
      v-if="activeTab === 'geral'"
      class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6"
    >
      <div class="flex items-center justify-between">
        <div
          class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest"
        >
          <Calculator :size="16" /> Cálculo de CMV Geral
        </div>
        <BaseButton
          variant="primary"
          @click="calcularCmvGeral"
          :disabled="loadingGeral"
        >
          {{ loadingGeral ? "Calculando..." : "Calcular CMV" }}
        </BaseButton>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 ml-1"
            >Data Início</label
          >
          <input
            v-model="cmvGeralForm.dataInicio"
            type="date"
            class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 ml-1">Data Fim</label>
          <input
            v-model="cmvGeralForm.dataFim"
            type="date"
            class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 ml-1"
            >Estoque Inicial (R$)</label
          >
          <input
            :value="formatCurrencyInput(cmvGeralForm.estoqueInicial)"
            @input="handleCurrencyInput($event, 'estoqueInicial')"
            type="text"
            inputmode="numeric"
            placeholder="R$ 0,00"
            class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 ml-1"
            >Compras do Período (R$)</label
          >
          <input
            :value="formatCurrencyInput(cmvGeralForm.comprasPeriodo)"
            @input="handleCurrencyInput($event, 'comprasPeriodo')"
            type="text"
            inputmode="numeric"
            placeholder="R$ 0,00"
            class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div class="md:col-span-2 space-y-1">
          <label class="text-xs font-bold text-slate-700 ml-1"
            >Estoque Final (R$)</label
          >
          <input
            :value="formatCurrencyInput(cmvGeralForm.estoqueFinal)"
            @input="handleCurrencyInput($event, 'estoqueFinal')"
            type="text"
            inputmode="numeric"
            placeholder="R$ 0,00"
            class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </div>

      <div
        v-if="cmvGeralResult"
        class="pt-6 border-t border-slate-100 space-y-4"
      >
        <h3 class="text-lg font-bold text-slate-800">Resultados</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">
              Faturamento Bruto
            </p>
            <p class="text-xl font-black text-orange-600">
              {{
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(cmvGeralResult.grossRevenue)
              }}
            </p>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">
              CMV Calculado
            </p>
            <p class="text-xl font-black text-slate-800">
              {{
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(cmvGeralResult.cmvValue)
              }}
            </p>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">CMV em %</p>
            <p
              :class="[
                'text-xl font-black',
                mapAlertColor(cmvGeralResult.alertLevel),
              ]"
            >
              {{ cmvGeralResult.cmvPercentage.toFixed(2) }}%
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Conteúdo da Aba 2: CMV por Produto -->
    <div
      v-if="activeTab === 'por-produto'"
      class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6"
    >
      <div
        class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest"
      >
        <ShoppingBag :size="16" /> CMV por Produto
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 ml-1"
            >Filtrar por Categoria</label
          >
          <select
            v-model="selectedCategory"
            class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Todas as categorias</option>
            <option
              v-for="cat in allCategories"
              :key="cat.id"
              :value="cat.id || cat.name"
            >
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 ml-1"
            >Buscar Produto</label
          >
          <div class="relative">
            <Search
              :size="20"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              v-model="searchProduto"
              type="text"
              placeholder="Nome do produto..."
              class="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <div
          v-if="searchProduto && produtosFiltradosCMV.length > 0"
          class="bg-white border border-slate-200 rounded-xl shadow-md max-h-48 overflow-y-auto mt-2"
        >
          <button
            v-for="produto in produtosFiltradosCMV"
            :key="produto.id"
            @click="selecionarProduto(produto)"
            class="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
          >
            {{ produto.name }} ({{
              produto.category?.name || produto.category
            }})
          </button>
        </div>
        <p
          v-else-if="searchProduto && produtosFiltradosCMV.length === 0"
          class="text-slate-500 text-sm mt-2"
        >
          Nenhum produto encontrado.
        </p>
        <div
          v-else-if="
            selectedCategory &&
            !searchProduto &&
            produtosFiltradosCMV.length > 0
          "
          class="bg-white border border-slate-200 rounded-xl shadow-md max-h-48 overflow-y-auto mt-2"
        >
          <button
            v-for="produto in produtosFiltradosCMV"
            :key="produto.id"
            @click="selecionarProduto(produto)"
            class="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
          >
            {{ produto.name }}
          </button>
        </div>
        <p
          v-else-if="
            selectedCategory &&
            !searchProduto &&
            produtosFiltradosCMV.length === 0
          "
          class="text-slate-500 text-sm mt-2"
        >
          Nenhum produto encontrado nesta categoria.
        </p>
      </div>

      <div
        v-if="loadingProduto"
        class="pt-6 border-t border-slate-100 space-y-4"
      >
        <p class="text-center text-slate-400 font-medium text-sm">
          Carregando ficha técnica...
        </p>
      </div>
      <div
        v-else-if="cmvProdutoResult"
        class="pt-6 border-t border-slate-100 space-y-4"
      >
        <h3 class="text-lg font-bold text-slate-800">
          Ficha Técnica de {{ cmvProdutoResult.productName }}
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr
                class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest"
              >
                <th class="px-4 py-2">Insumo</th>
                <th class="px-4 py-2 text-center">Qtd</th>
                <th class="px-4 py-2">Unidade</th>
                <th class="px-4 py-2 text-right">Custo Proporcional</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="(item, index) in cmvProdutoResult.ingredients"
                :key="index"
              >
                <td class="px-4 py-2 text-sm font-medium text-slate-700">
                  {{ item.name }}
                </td>
                <td class="px-4 py-2 text-center text-sm text-slate-600">
                  {{ item.quantity }}
                </td>
                <td class="px-4 py-2 text-sm text-slate-600">
                  {{ item.unit }}
                </td>
                <td class="px-4 py-2 text-right text-sm text-slate-600">
                  {{
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.proportionalCost)
                  }}
                </td>
              </tr>
              <tr
                v-if="
                  !cmvProdutoResult.ingredients ||
                  cmvProdutoResult.ingredients.length === 0
                "
              >
                <td colspan="4" class="text-center py-4 text-slate-500 text-sm">
                  Nenhum insumo na ficha técnica.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100"
        >
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">
              Preço de Venda
            </p>
            <p class="text-xl font-black text-orange-600">
              {{
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(cmvProdutoResult.sellingPrice)
              }}
            </p>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">
              Custo Total de Produção
            </p>
            <p class="text-xl font-black text-slate-800">
              {{
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(cmvProdutoResult.productionCost)
              }}
            </p>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">
              Margem de Contribuição
            </p>
            <p class="text-xl font-black text-emerald-600">
              {{
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(cmvProdutoResult.contributionMargin)
              }}
            </p>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">
              CMV Unitário em %
            </p>
            <p
              :class="[
                'text-xl font-black',
                mapAlertColor(cmvProdutoResult.alertLevel),
              ]"
            >
              {{ cmvProdutoResult.cmvPercentage.toFixed(2) }}%
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos se necessário */
</style>
