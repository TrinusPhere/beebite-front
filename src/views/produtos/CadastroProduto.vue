<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Save, X, ShoppingBag, Trash2, Search, ChevronLeft, Calculator, UtensilsCrossed, Plus } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import { productService } from '@/services/productService'
import { ingredientService } from '@/services/ingredientService'
import { modifierGroupService } from '@/services/modifierGroupService'
import categoryService from '@/services/categoryService'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const isEditing = ref(false)

const showIngredientModal = ref(false)
const searchIngredienteModal = ref('')
const selectedIngredientsInModal = ref([])
const modalQuantities = ref({})

const availableIngredients = ref([])
const modifierGroups = ref([])
const availableCategories = ref([])
const isCreatingNewCategory = ref(false)
const newCategoryName = ref('')

const handleCategoryChange = (e) => {
  if (e.target.value === 'NEW_CATEGORY_OPTION') {
    isCreatingNewCategory.value = true
    form.categoryId = ''
  } else {
    // Check for default modifiers
    const selectedCat = availableCategories.value.find(c => c.id === e.target.value)
    if (selectedCat && selectedCat.defaultModifierGroupIds && selectedCat.defaultModifierGroupIds.length > 0) {
      if (confirm(`Esta categoria possui modificadores padrão. Deseja aplicar os adicionais padrão ao produto?`)) {
        form.modifierGroupIds = [...new Set([...form.modifierGroupIds, ...selectedCat.defaultModifierGroupIds])]
      }
    }
  }
}

const saveNewCategory = async () => {
  if (!newCategoryName.value.trim()) return
  try {
    const created = await categoryService.createCategory({ name: newCategoryName.value.trim() })
    availableCategories.value.push(created)
    form.categoryId = created.id
    isCreatingNewCategory.value = false
    newCategoryName.value = ''
  } catch (err) {
    alert('Erro ao criar categoria')
  }
}

const form = reactive({
  id: null,
  name: '',
  categoryId: '',
  price: 0,
  technicalSheet: [],
  modifierGroupIds: [],
  removableItemIds: []
})

onMounted(async () => {
  try {
    availableIngredients.value = await ingredientService.getAll()
    modifierGroups.value = await modifierGroupService.getAll()
    availableCategories.value = await categoryService.getCategories()

    if (route.params.id) {
      isEditing.value = true
      const itemToEdit = await productService.getById(route.params.id)
      if (itemToEdit) {
        Object.assign(form, itemToEdit)
        if (itemToEdit.removableItems) {
          form.removableItemIds = itemToEdit.removableItems.map(item => item.ingredientId)
        }
      }
    } else if (route.query.cloneId) {
      isEditing.value = false
      const itemToClone = await productService.getById(route.query.cloneId)
      if (itemToClone) {
        Object.assign(form, itemToClone)
        if (itemToClone.removableItems) {
          form.removableItemIds = itemToClone.removableItems.map(item => item.ingredientId)
        }
        form.id = null // Ensure it's treated as a new product
        form.name = `${itemToClone.name} (Cópia)`
      }
    }
  } catch (err) {
    console.error('Erro ao carregar dados', err)
  }
})

const totalCost = computed(() => {
  return form.technicalSheet.reduce((acc, item) => {
    const ing = availableIngredients.value.find(i => i.id === item.ingredientId || i.id === item.id)
    if (ing) {
      return acc + (ing.costPrice * item.quantity)
    }
    return acc
  }, 0)
})

const profit = computed(() => form.price - totalCost.value)

const removeIngredient = (index) => form.technicalSheet.splice(index, 1)

const openIngredientModal = () => {
  selectedIngredientsInModal.value = form.technicalSheet.map(item => item.ingredientId || item.id)
  modalQuantities.value = {}
  form.technicalSheet.forEach(item => {
    modalQuantities.value[item.ingredientId || item.id] = item.quantity
  })
  showIngredientModal.value = true
}

const closeIngredientModal = () => {
  showIngredientModal.value = false
  searchIngredienteModal.value = ''
  selectedIngredientsInModal.value = []
}

const addSelectedIngredientsToSheet = () => {
  form.technicalSheet = form.technicalSheet.filter(item => 
    selectedIngredientsInModal.value.includes(item.ingredientId || item.id)
  )

  selectedIngredientsInModal.value.forEach(ingredientId => {
    const existingItem = form.technicalSheet.find(item => (item.ingredientId || item.id) === ingredientId)
    const quantity = modalQuantities.value[ingredientId] || 1

    if (existingItem) {
      existingItem.quantity = quantity
    } else {
      const ingredientToAdd = availableIngredients.value.find(ing => ing.id === ingredientId)
      if (ingredientToAdd) {
        form.technicalSheet.push({
          ingredientId: ingredientToAdd.id,
          id: ingredientToAdd.id,
          name: ingredientToAdd.name,
          unit: ingredientToAdd.unit,
          cost: ingredientToAdd.costPrice || 0,
          quantity: quantity
        })
      }
    }
  })
  closeIngredientModal()
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const payload = { ...form }
    
    // map the frontend format to backend format if necessary
    payload.technicalSheet = payload.technicalSheet.map(i => ({
      ingredientId: i.ingredientId || i.id,
      quantity: i.quantity
    }))

    if (isEditing.value) {
      await productService.update(form.id, payload)
      alert('Produto atualizado com sucesso!')
    } else {
      delete payload.id
      await productService.create(payload)
      alert('Produto cadastrado com sucesso!')
    }
    router.push('/produtos')
  } catch (err) {
    console.error('Erro ao salvar produto', err)
    alert('Erro ao salvar produto. Verifique os dados.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <!-- Header Dinâmico -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-4">
      <div class="flex items-center gap-4">
        <button @click="router.push('/produtos')" class="p-2 hover:bg-white rounded-xl text-slate-400">
          <ChevronLeft :size="24" />
        </button>
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">
            {{ isEditing ? 'Editar Produto' : 'Novo Produto' }}
          </h1>
          <p class="text-slate-500 text-sm font-medium">
            {{ isEditing ? `Editando ficha técnica: ${form.name}` : 'Cadastre um novo item no cardápio' }}
          </p>
        </div>
      </div>
      <div v-if="isEditing" class="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm">
        Produto Ativo
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 items-start">
      <!-- Painel Financeiro -->
      <div class="w-full lg:w-72 shrink-0 space-y-6 lg:sticky lg:top-8 order-2 lg:order-1">
        <div class="bg-slate-900 rounded-3xl p-6 shadow-xl text-white space-y-6 border border-slate-800">
          <div class="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-widest mb-2">
            <Calculator :size="16" /> Resumo de Lucro
          </div>
          <div class="space-y-4">
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400">Custo Total</span>
              <span class="font-bold">R$ {{ totalCost.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400">Venda</span>
              <span class="font-bold">R$ {{ Number(form.price).toFixed(2) }}</span>
            </div>
            <div class="pt-4 border-t border-slate-800">
              <div class="flex justify-between items-center mb-1">
                <span class="text-slate-400 text-xs font-bold uppercase tracking-wider">Lucro Real</span>
                <span :class="['text-xl font-black', profit > 0 ? 'text-emerald-400' : 'text-red-400']">
                  R$ {{ profit.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
          <div class="pt-4 space-y-3">
            <BaseButton variant="primary" class="w-full" :loading="loading" @click="handleSubmit">
              <Save :size="18" /> {{ isEditing ? 'Salvar Alterações' : 'Finalizar Cadastro' }}
            </BaseButton>
            <BaseButton type="button" variant="secondary" class="w-full border-slate-700 text-slate-400" @click="router.push('/produtos')">
              <X :size="18" /> Cancelar
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Formulário -->
      <div class="flex-1 space-y-6 order-1 lg:order-2">
        <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest">
            <ShoppingBag :size="16" /> Dados Gerais
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2 space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1">Nome do Produto</label>
              <input v-model="form.name" type="text" required class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20">
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1">Categoria</label>
              
              <!-- Select para categorias existentes -->
              <select 
                v-if="!isCreatingNewCategory" 
                v-model="form.categoryId" 
                @change="handleCategoryChange"
                class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-medium text-slate-700"
              >
                <option value="" disabled>Selecione uma categoria</option>
                <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                <option value="NEW_CATEGORY_OPTION" class="font-bold text-orange-600">➕ Nova categoria...</option>
              </select>

              <div v-else class="flex gap-2">
                <input 
                  v-model="newCategoryName" 
                  type="text" 
                  placeholder="Nome da nova categoria..." 
                  class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
                  autofocus
                  @keyup.enter="saveNewCategory"
                >
                <button 
                  @click="saveNewCategory"
                  type="button" 
                  class="px-4 bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-xl transition-all"
                  title="Salvar"
                >
                  <Save :size="18" />
                </button>
                <button 
                  @click="isCreatingNewCategory = false; form.categoryId = availableCategories[0]?.id || ''" 
                  type="button" 
                  class="px-4 bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                  title="Cancelar e voltar a selecionar"
                >
                  <X :size="18" />
                </button>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1">Preço de Venda</label>
              <input v-model="form.price" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-orange-600">
            </div>
          </div>
        </div>

        <!-- Adicionais e Opções (Modificadores) -->
        <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest">
            <Plus :size="16" /> Adicionais e Opções
          </div>
          <p class="text-slate-500 text-sm">Selecione quais grupos de opcionais estarão disponíveis para este produto.</p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label v-for="group in modifierGroups" :key="group.id" :class="[
              'flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all',
              form.modifierGroupIds.includes(group.id) ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200 bg-white'
            ]">
              <input type="checkbox" :value="group.id" v-model="form.modifierGroupIds" class="mt-0.5 form-checkbox text-orange-600 rounded">
              <div class="flex flex-col">
                <span class="font-bold text-slate-800 text-sm">{{ group.name }}</span>
                <span class="text-[10px] font-black mt-1 uppercase tracking-wider" :class="group.required ? 'text-red-500' : 'text-slate-400'">
                  {{ group.required ? 'Obrigatório' : 'Opcional' }}
                </span>
                <span class="text-xs text-slate-500 mt-1 font-medium">{{ group.options?.length || 0 }} opções</span>
              </div>
            </label>
          </div>
          
          <div v-if="modifierGroups.length === 0" class="text-slate-400 text-sm font-medium text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Nenhum grupo de modificadores cadastrado no sistema.
          </div>
        </div>

        <!-- Ficha Técnica -->
        <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest">
              <UtensilsCrossed :size="16" /> Composição
            </div>
            <BaseButton type="button" variant="secondary" size="sm" @click="openIngredientModal">
              <Plus :size="16" /> Criar Ficha Técnica
            </BaseButton>
          </div>

          <div v-if="form.technicalSheet.length > 0" class="space-y-3">
            <div v-for="(item, index) in form.technicalSheet" :key="item.id" class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div class="flex-1 font-bold text-slate-800 text-sm">{{ item.name }}</div>
              <div class="flex items-center gap-2">
                <input v-model="item.quantity" type="number" class="w-16 p-2 text-center text-sm font-black bg-white border border-slate-200 rounded-lg">
                <span class="text-[10px] font-black text-slate-400 uppercase">{{ item.unit }}</span>
                <button @click="removeIngredient(index)" class="p-2 text-slate-300 hover:text-red-500"><Trash2 :size="18" /></button>
              </div>
            </div>
          </div>
          <div v-else class="text-slate-400 text-sm font-medium text-center py-4">
            Nenhum ingrediente adicionado à ficha técnica.
          </div>
        </div>

        <!-- Ingredientes Removíveis -->
        <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest">
            <Trash2 :size="16" /> Ingredientes Removíveis
          </div>
          <p class="text-slate-500 text-sm">Marque quais itens da ficha técnica o cliente pode optar por remover.</p>
          
          <div v-if="form.technicalSheet.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label v-for="item in form.technicalSheet" :key="item.id || item.ingredientId" :class="[
              'flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all',
              form.removableItemIds.includes(item.ingredientId || item.id) ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-red-200 bg-white'
            ]">
              <input type="checkbox" :value="item.ingredientId || item.id" v-model="form.removableItemIds" class="form-checkbox text-red-500 rounded">
              <span class="font-bold text-slate-800 text-sm">{{ item.name }}</span>
            </label>
          </div>
          <div v-else class="text-slate-400 text-sm font-medium text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Adicione itens na ficha técnica primeiro.
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Seleção de Ingredientes -->
    <div v-if="showIngredientModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <h3 class="text-xl font-bold text-slate-800 mb-4">Selecionar Ingredientes</h3>
        <div class="relative mb-4">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="20" />
          <input
              type="text"
              placeholder="Buscar ingrediente..."
              class="w-full bg-slate-50 border border-slate-200 pl-10 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
              v-model="searchIngredienteModal"
          >
        </div>

        <div class="flex-1 overflow-y-auto space-y-2 pr-2">
          <label v-for="ingredient in availableIngredients.filter(ing => ing.name.toLowerCase().includes(searchIngredienteModal.toLowerCase()))" :key="ingredient.id" class="flex items-center p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors gap-3">
            <input type="checkbox" :value="ingredient.id" v-model="selectedIngredientsInModal" class="form-checkbox text-orange-600 rounded">
            
            <div class="flex-1 flex flex-col">
              <span class="text-slate-700 font-bold">{{ ingredient.name }}</span>
              <span class="text-xs text-slate-500">
                Estoque: <strong :class="ingredient.stock > 0 ? 'text-emerald-600' : 'text-red-500'">{{ ingredient.stock }}</strong> {{ ingredient.unit }} | Custo: R$ {{ (ingredient.price || 0).toFixed(2) }} / {{ ingredient.unit }}
              </span>
            </div>
            
            <div class="flex items-center gap-2" @click.stop>
              <input 
                type="number" 
                v-model="modalQuantities[ingredient.id]" 
                class="w-20 p-2 text-center text-sm font-black bg-white border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                placeholder="Qtd"
                min="0"
                step="any"
              >
              <span class="text-[10px] font-black text-slate-400 uppercase w-6">{{ ingredient.unit }}</span>
            </div>
          </label>
          <p v-if="availableIngredients.filter(ing => ing.name.toLowerCase().includes(searchIngredienteModal.toLowerCase())).length === 0" class="text-slate-400 text-sm text-center py-4">
            Nenhum ingrediente encontrado.
          </p>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <BaseButton variant="secondary" @click="closeIngredientModal">Cancelar</BaseButton>
          <BaseButton variant="primary" @click="addSelectedIngredientsToSheet">Adicionar</BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>