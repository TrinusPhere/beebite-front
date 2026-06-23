<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Edit2, Trash2, ShoppingBag, Layers, BarChart3 } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'

const router = useRouter()
const searchQuery = ref('')
const products = ref([
  { id: 1, name: 'X-Bacon Especial', category: 'Hambúrgueres', price: 35.00, cost: 12.50, stock: 45 },
  { id: 2, name: 'Combo Família', category: 'Combos', price: 120.00, cost: 45.00, stock: 10 },
  { id: 3, name: 'Coca-Cola 600ml', category: 'Bebidas', price: 8.50, cost: 3.20, stock: 150 },
])

const filteredProducts = computed(() => {
  return products.value.filter(p =>
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const removeProduct = (id) => {
  if (confirm('Tem certeza que deseja excluir este produto?')) {
    products.value = products.value.filter(item => item.id !== id)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Produtos & Cardápio</h1>
        <p class="text-slate-500 text-sm font-medium">Gestão de itens e fichas técnicas</p>
      </div>

      <BaseButton variant="primary" @click="router.push('/produtos/novo')">
        <Plus :size="20" />
        Novo Produto
      </BaseButton>
    </div>

    <!-- Tabela Padronizada -->
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100">
        <div class="relative max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="20" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nome ou categoria..."
            class="w-full bg-slate-50 border border-slate-200 text-sm pl-10 p-2.5 rounded-xl outline-none"
          >
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th class="px-6 py-4">Nome do Produto</th>
              <th class="px-6 py-4">Categoria</th>
              <th class="px-6 py-4">Venda</th>
              <th class="px-6 py-4 text-center">Lucro</th>
              <th class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="item in filteredProducts" :key="item.id" class="hover:bg-slate-50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-orange-50 rounded-xl text-orange-600">
                    <ShoppingBag :size="16" />
                  </div>
                  <span class="font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{{ item.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                  {{ item.category }}
                </span>
              </td>
              <td class="px-6 py-4 font-black text-slate-700 text-sm">
                R$ {{ item.price.toFixed(2) }}
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex flex-col items-center">
                  <span class="text-xs font-black text-emerald-600">
                    R$ {{ (item.price - item.cost).toFixed(2) }}
                  </span>
                  <span class="text-[9px] font-bold text-slate-400">
                    {{ (((item.price - item.cost) / item.price) * 100).toFixed(0) }}% margem
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="router.push(`/produtos/editar/${item.id}`)" class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 :size="16" />
                  </button>
                  <button @click="removeProduct(item.id)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredProducts.length === 0" class="py-12 text-center text-slate-400 text-sm font-medium">
        Nenhum produto cadastrado.
      </div>
    </div>
  </div>
</template>
