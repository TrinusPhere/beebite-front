<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Cotações e Compras</h1>
        <p class="text-slate-500 text-sm font-medium">Controle de preços e fornecedores</p>
      </div>

      <button class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2">
        <Plus :size="18" /> Nova Cotação
      </button>
    </div>

    <!-- Filtros/Busca -->
    <div class="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="20" />
        <input 
          type="text" 
          placeholder="Buscar ingrediente..." 
          class="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
        >
      </div>
      <select class="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-600 outline-none">
        <option>Todos os Fornecedores</option>
        <option>Atacadão</option>
        <option>Assaí</option>
        <option>Distribuidora Z</option>
      </select>
    </div>

    <!-- Tabela de Cotações -->
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th class="px-6 py-4">Ingrediente</th>
              <th class="px-6 py-4">Última Compra</th>
              <th class="px-6 py-4 text-center">Menor Preço Atual</th>
              <th class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="item in mockCotacoes" :key="item.id" class="hover:bg-slate-50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                    <Package :size="20" />
                  </div>
                  <div>
                    <span class="font-bold text-slate-700 block">{{ item.ingrediente }}</span>
                    <span class="text-xs text-slate-500 font-medium">{{ item.unidade }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-slate-700">{{ item.ultimaData }}</span>
                  <span class="text-xs text-slate-500 font-medium">R$ {{ item.ultimoPreco }} ({{ item.ultimoFornecedor }})</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="inline-flex flex-col bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100">
                  <span class="text-sm font-black">R$ {{ item.menorPrecoAtual }}</span>
                  <span class="text-[10px] font-bold uppercase tracking-widest">{{ item.fornecedorMenorPreco }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <button class="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all">
                  <History :size="18" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Plus, Search, Package, History } from 'lucide-vue-next'

const mockCotacoes = ref([
  { 
    id: 1, 
    ingrediente: 'Carne Moída (Patinho)', 
    unidade: 'KG',
    ultimaData: '10/10/2023',
    ultimoPreco: '32,90',
    ultimoFornecedor: 'Açougue Bom Boi',
    menorPrecoAtual: '31,50',
    fornecedorMenorPreco: 'Atacadão'
  },
  { 
    id: 2, 
    ingrediente: 'Queijo Mussarela', 
    unidade: 'KG',
    ultimaData: '08/10/2023',
    ultimoPreco: '45,00',
    ultimoFornecedor: 'Assaí',
    menorPrecoAtual: '45,00',
    fornecedorMenorPreco: 'Assaí'
  },
  { 
    id: 3, 
    ingrediente: 'Pão de Hamburguer', 
    unidade: 'Pacote c/ 6',
    ultimaData: '12/10/2023',
    ultimoPreco: '8,50',
    ultimoFornecedor: 'Padaria Central',
    menorPrecoAtual: '7,90',
    fornecedorMenorPreco: 'Distribuidora Z'
  }
])
</script>
