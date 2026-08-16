<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Edit2, Trash2, ShoppingBag, Layers, BarChart3 } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import categoryService from '@/services/categoryService'
import { modifierGroupService } from '@/services/modifierGroupService'

const router = useRouter()
const searchQuery = ref('')
const products = ref([])
const availableCategories = ref([])
const selectedCategoryId = ref('')
const modifierGroups = ref([])

// Configuração de Categoria
const showCategorySettings = ref(false)
const categorySettings = ref({
  id: '',
  name: '',
  defaultModifierGroupIds: []
})
const savingCategory = ref(false)

onMounted(async () => {
  try {
    products.value = await productService.getAll()
    availableCategories.value = await categoryService.getCategories()
    modifierGroups.value = await modifierGroupService.getAll()
  } catch (err) {
    console.error('Erro ao carregar produtos', err)
  }
})

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          (p.categoryName && p.categoryName.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchesCategory = selectedCategoryId.value === '' || p.categoryId === selectedCategoryId.value
    return matchesSearch && matchesCategory
  })
})

const removeProduct = async (id) => {
  if (confirm('Tem certeza que deseja excluir este produto?')) {
    try {
      await productService.delete(id)
      products.value = products.value.filter(item => item.id !== id)
    } catch (err) {
      console.error('Erro ao excluir produto', err)
      alert('Erro ao excluir produto.')
    }
  }
}

const openCategorySettings = () => {
  const cat = availableCategories.value.find(c => c.id === selectedCategoryId.value)
  if (cat) {
    categorySettings.value = {
      id: cat.id,
      name: cat.name,
      defaultModifierGroupIds: cat.defaultModifierGroupIds ? [...cat.defaultModifierGroupIds] : []
    }
    showCategorySettings.value = true
  }
}

const applyCategorySettings = async () => {
  if (!confirm('Deseja salvar estas configurações? Para aplicar as opções em lote a todos os produtos já existentes, usaremos esta lista padrão.')) return
  savingCategory.value = true
  try {
    await categoryService.updateCategory(categorySettings.value.id, {
      name: categorySettings.value.name,
      defaultModifierGroupIds: categorySettings.value.defaultModifierGroupIds
    })
    
    // update in list
    const index = availableCategories.value.findIndex(c => c.id === categorySettings.value.id)
    if (index !== -1) {
      availableCategories.value[index].defaultModifierGroupIds = [...categorySettings.value.defaultModifierGroupIds]
    }
    
    showCategorySettings.value = false
  } catch (err) {
    alert('Erro ao salvar categoria')
  } finally {
    savingCategory.value = false
  }
}

const applyModifiersToAllProducts = async () => {
  if (!confirm('ATENÇÃO: Esta ação irá sobrescrever as configurações de modificadores de TODOS os produtos desta categoria para usar APENAS os itens selecionados aqui. Deseja continuar?')) return
  savingCategory.value = true
  try {
    // We'll call the new bulk apply endpoint
    await categoryService.bulkApplyModifiers(categorySettings.value.id)
    alert('Modificadores aplicados com sucesso a todos os produtos da categoria!')
    showCategorySettings.value = false
    // Refresh products
    products.value = await productService.getAll()
  } catch (err) {
    alert('Erro ao aplicar modificadores em lote')
  } finally {
    savingCategory.value = false
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
      <div class="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="20" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nome..."
            class="w-full bg-slate-50 border border-slate-200 text-sm pl-10 p-2.5 rounded-xl outline-none"
          >
        </div>
        <div class="flex gap-2 items-center">
          <select v-model="selectedCategoryId" class="bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-xl outline-none font-medium text-slate-600">
            <option value="">Todas as Categorias</option>
            <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
          <button v-if="selectedCategoryId" @click="openCategorySettings" class="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all" title="Configurar Categoria">
            <Edit2 :size="18" />
          </button>
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
                  {{ item.categoryName || 'S/ Categoria' }}
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
        Nenhum produto encontrado.
      </div>
    </div>

    <!-- Modal de Configuração de Categoria -->
    <div v-if="showCategorySettings" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-3xl shadow-xl w-full max-w-lg">
        <h3 class="text-xl font-bold text-slate-800 mb-2">Configurar Categoria</h3>
        <p class="text-slate-500 text-sm mb-6">Defina os opcionais padrão para a categoria <span class="font-bold">{{ categorySettings.name }}</span>.</p>
        
        <div class="space-y-4 max-h-[50vh] overflow-y-auto mb-6 pr-2">
          <label v-for="group in modifierGroups" :key="group.id" :class="[
            'flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all',
            categorySettings.defaultModifierGroupIds.includes(group.id) ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:bg-slate-50'
          ]">
            <input type="checkbox" :value="group.id" v-model="categorySettings.defaultModifierGroupIds" class="form-checkbox text-orange-600 rounded">
            <div class="flex-1">
              <span class="font-bold text-slate-800 text-sm">{{ group.name }}</span>
            </div>
          </label>
          <div v-if="modifierGroups.length === 0" class="text-slate-400 text-sm text-center">
            Nenhum grupo cadastrado.
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <BaseButton variant="primary" :loading="savingCategory" @click="applyCategorySettings" class="w-full">
            Salvar Opcionais Padrão
          </BaseButton>
          <button @click="applyModifiersToAllProducts" :disabled="savingCategory" class="w-full py-2.5 bg-orange-100 text-orange-600 font-bold rounded-xl text-sm hover:bg-orange-200 transition-colors">
            Aplicar Opcionais em Lote aos Produtos Existentes
          </button>
          <BaseButton variant="secondary" @click="showCategorySettings = false" class="w-full">
            Cancelar
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>