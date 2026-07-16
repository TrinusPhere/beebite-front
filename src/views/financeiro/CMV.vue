<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { Calculator, DollarSign, ShoppingBag, UtensilsCrossed, Search, AlertCircle } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import { financialRecordsDB, productsDB, ingredientsDB } from '@/utils/mockData'

const activeTab = ref('geral') // 'geral' ou 'por-produto'

// --- Aba 1: CMV Geral ---
const cmvGeralForm = reactive({
  dataInicio: '',
  dataFim: '',
  estoqueInicial: 0,
  comprasPeriodo: 0,
  estoqueFinal: 0,
})

const faturamentoBruto = computed(() => {
  const inicio = cmvGeralForm.dataInicio ? new Date(cmvGeralForm.dataInicio) : null
  const fim = cmvGeralForm.dataFim ? new Date(cmvGeralForm.dataFim) : null

  return financialRecordsDB.value.reduce((sum, record) => {
    const recordDate = new Date(record.date)
    if ((!inicio || recordDate >= inicio) && (!fim || recordDate <= fim)) {
      return sum + record.totalValue
    }
    return sum
  }, 0)
})

const cmvGeralCalculado = computed(() => {
  const { estoqueInicial, comprasPeriodo, estoqueFinal } = cmvGeralForm
  return estoqueInicial + comprasPeriodo - estoqueFinal
})

const cmvGeralPercentual = computed(() => {
  if (faturamentoBruto.value <= 0) return 0
  return (cmvGeralCalculado.value / faturamentoBruto.value) * 100
})

const cmvGeralAlerta = computed(() => {
  if (cmvGeralPercentual.value < 30) return 'verde'
  if (cmvGeralPercentual.value >= 30 && cmvGeralPercentual.value <= 35) return 'amarelo'
  return 'vermelho'
})

// --- Aba 2: CMV por Produto ---
const searchProduto = ref('')
const produtoSelecionado = ref(null)

const produtosFiltradosCMV = computed(() => {
  if (!searchProduto.value) return productsDB.value
  return productsDB.value.filter(p => p.name.toLowerCase().includes(searchProduto.value.toLowerCase()))
})

const selecionarProduto = (produto) => {
  produtoSelecionado.value = produto
}

const custoTotalProducao = computed(() => {
  if (!produtoSelecionado.value || !produtoSelecionado.value.technicalSheet) return 0
  return produtoSelecionado.value.technicalSheet.reduce((acc, item) => {
    const ingredient = ingredientsDB.value.find(ing => ing.id === item.id)
    if (!ingredient) return acc

    // Assumindo que item.cost é o custo por item.unit e item.quantity é a quantidade nessa unidade.
    // Se precisar de conversão (ex: gramas para kg), isso deve ser feito na quantity ou no cost antes de adicionar à technicalSheet.
    return acc + (ingredient.costPrice * item.quantity)
  }, 0)
})

const margemContribuicao = computed(() => {
  if (!produtoSelecionado.value) return 0
  return produtoSelecionado.value.price - custoTotalProducao.value
})

const lucroBruto = computed(() => margemContribuicao.value) // Simplificado para este contexto

const cmvUnitarioPercentual = computed(() => {
  if (!produtoSelecionado.value || produtoSelecionado.value.price <= 0) return 0
  return (custoTotalProducao.value / produtoSelecionado.value.price) * 100
})

</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <div class="flex items-center justify-between border-b border-slate-100 pb-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Controle de CMV</h1>
        <p class="text-slate-500 text-sm font-medium">Gerencie o Custo da Mercadoria Vendida da sua lanchonete</p>
      </div>
    </div>

    <!-- Abas de Navegação -->
    <div class="flex border-b border-slate-200">
      <button
        @click="activeTab = 'geral'"
        :class="['py-2 px-4 text-sm font-medium', activeTab === 'geral' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-slate-500 hover:text-slate-700']"
      >
        CMV Geral
      </button>
      <button
        @click="activeTab = 'por-produto'"
        :class="['py-2 px-4 text-sm font-medium', activeTab === 'por-produto' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-slate-500 hover:text-slate-700']"
      >
        CMV por Produto
      </button>
    </div>

    <!-- Conteúdo da Aba 1: CMV Geral -->
    <div v-if="activeTab === 'geral'" class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
      <div class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest">
        <Calculator :size="16" /> Cálculo de CMV Geral
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 ml-1">Data Início</label>
          <input v-model="cmvGeralForm.dataInicio" type="date" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20">
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 ml-1">Data Fim</label>
          <input v-model="cmvGeralForm.dataFim" type="date" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20">
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 ml-1">Estoque Inicial (R$)</label>
          <input v-model.number="cmvGeralForm.estoqueInicial" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20">
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 ml-1">Compras do Período (R$)</label>
          <input v-model.number="cmvGeralForm.comprasPeriodo" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20">
        </div>
        <div class="md:col-span-2 space-y-1">
          <label class="text-xs font-bold text-slate-700 ml-1">Estoque Final (R$)</label>
          <input v-model.number="cmvGeralForm.estoqueFinal" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20">
        </div>
      </div>

      <div class="pt-6 border-t border-slate-100 space-y-4">
        <h3 class="text-lg font-bold text-slate-800">Resultados</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">Faturamento Bruto</p>
            <p class="text-xl font-black text-orange-600">R$ {{ faturamentoBruto.toFixed(2) }}</p>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">CMV Calculado</p>
            <p class="text-xl font-black text-slate-800">R$ {{ cmvGeralCalculado.toFixed(2) }}</p>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">CMV em %</p>
            <p :class="['text-xl font-black', {
              'text-emerald-600': cmvGeralAlerta === 'verde',
              'text-orange-600': cmvGeralAlerta === 'amarelo',
              'text-red-600': cmvGeralAlerta === 'vermelho',
            }]">{{ cmvGeralPercentual.toFixed(2) }}%</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Conteúdo da Aba 2: CMV por Produto -->
    <div v-if="activeTab === 'por-produto'" class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
      <div class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest">
        <ShoppingBag :size="16" /> CMV por Produto
      </div>

      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-700 ml-1">Buscar Produto</label>
        <div class="relative">
          <Search :size="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchProduto"
            type="text"
            placeholder="Nome do produto..."
            class="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
          >
        </div>
        <div v-if="searchProduto && produtosFiltradosCMV.length > 0" class="bg-white border border-slate-200 rounded-xl shadow-md max-h-48 overflow-y-auto">
          <button
            v-for="produto in produtosFiltradosCMV"
            :key="produto.id"
            @click="selecionarProduto(produto)"
            class="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
          >
            {{ produto.name }} ({{ produto.category }})
          </button>
        </div>
        <p v-else-if="searchProduto && produtosFiltradosCMV.length === 0" class="text-slate-500 text-sm mt-2">Nenhum produto encontrado.</p>
      </div>

      <div v-if="produtoSelecionado" class="pt-6 border-t border-slate-100 space-y-4">
        <h3 class="text-lg font-bold text-slate-800">Ficha Técnica de {{ produtoSelecionado.name }}</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th class="px-4 py-2">Insumo</th>
                <th class="px-4 py-2 text-center">Qtd</th>
                <th class="px-4 py-2">Unidade</th>
                <th class="px-4 py-2 text-right">Custo Proporcional</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="(item, index) in produtoSelecionado.technicalSheet" :key="index">
                <td class="px-4 py-2 text-sm font-medium text-slate-700">{{ item.name }}</td>
                <td class="px-4 py-2 text-center text-sm text-slate-600">{{ item.quantity }}</td>
                <td class="px-4 py-2 text-sm text-slate-600">{{ item.unit }}</td>
                <td class="px-4 py-2 text-right text-sm text-slate-600">
                  R$ {{ (ingredientsDB.value.find(ing => ing.id === item.id)?.costPrice * item.quantity || 0).toFixed(2) }}
                </td>
              </tr>
              <tr v-if="produtoSelecionado.technicalSheet.length === 0">
                <td colspan="4" class="text-center py-4 text-slate-500 text-sm">Nenhum insumo na ficha técnica.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">Preço de Venda</p>
            <p class="text-xl font-black text-orange-600">R$ {{ produtoSelecionado.price.toFixed(2) }}</p>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">Custo Total de Produção</p>
            <p class="text-xl font-black text-slate-800">R$ {{ custoTotalProducao.toFixed(2) }}</p>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">Margem de Contribuição</p>
            <p class="text-xl font-black text-emerald-600">R$ {{ margemContribuicao.toFixed(2) }}</p>
          </div>
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p class="text-xs font-bold text-slate-500 uppercase">CMV Unitário em %</p>
            <p :class="['text-xl font-black', {
              'text-emerald-600': cmvUnitarioPercentual < 30,
              'text-orange-600': cmvUnitarioPercentual >= 30 && cmvUnitarioPercentual <= 35,
              'text-red-600': cmvUnitarioPercentual > 35,
            }]">{{ cmvUnitarioPercentual.toFixed(2) }}%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos se necessário */
</style>