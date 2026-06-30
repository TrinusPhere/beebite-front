<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import { ingredientsDB } from '@/utils/mockData'

const router = useRouter()
const searchQuery = ref('')
const ingredients = ingredientsDB

const filteredIngredients = computed(() => {
  return ingredients.value.filter(item =>
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const removeIngredient = (id) => {
  if (confirm('Tem certeza que deseja excluir este ingrediente?')) {
    ingredients.value = ingredients.value.filter(item => item.id !== id)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Ingredientes</h1>
        <p class="text-slate-500 text-sm font-medium">Controle de estoque e custo de insumos</p>
      </div>

      <BaseButton variant="primary" @click="router.push('/ingredientes/novo')">
        <Plus :size="20" />
        Novo Ingrediente
      </BaseButton>
    </div>

    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100">
        <div class="relative max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="20" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar ingredientes..."
            class="w-full bg-slate-50 border border-slate-200 text-sm pl-10 p-2.5 rounded-xl outline-none"
          >
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th class="px-6 py-4">Ingrediente</th>
              <th class="px-6 py-4 text-center">Estoque</th>
              <th class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="item in filteredIngredients" :key="item.id" class="hover:bg-slate-50">
              <td class="px-6 py-4 font-bold text-slate-700">{{ item.name }}</td>
              <td class="px-6 py-4 text-center">
                <span class="px-3 py-1 rounded-full text-[10px] font-black" :class="item.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'">
                  {{ item.stock }} {{ item.unit }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="router.push(`/ingredientes/editar/${item.id}`)" class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit2 :size="16" />
                  </button>
                  <button @click="removeIngredient(item.id)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>