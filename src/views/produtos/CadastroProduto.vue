<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Save, X, ShoppingBag, Trash2, Search, ChevronLeft, Calculator, UtensilsCrossed, Plus } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import { productsDB, ingredientsDB } from '@/utils/mockData'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const isEditing = ref(false)

// Estado para controlar o modal de ingredientes
const showIngredientModal = ref(false)
const searchIngredienteModal = ref('') // Para busca dentro do modal
const selectedIngredientsInModal = ref([]) // IDs dos ingredientes selecionados no modal
const modalQuantities = ref({}) // Quantidades informadas no modal

const form = reactive({
  id: null,
  name: '',
  category: 'Hambúrgueres',
  price: 0,
  technicalSheet: []
})

const availableIngredients = ingredientsDB.value

onMounted(() => {
  if (route.params.id) {
    isEditing.value = true
    const productId = parseInt(route.params.id)
    const product = productsDB.value.find(p => p.id === productId)
    if (product) {
      Object.assign(form, JSON.parse(JSON.stringify(product))) // Deep copy
    }
  }
})

const totalCost = computed(() => {
  return form.technicalSheet.reduce((acc, item) => {
    // Assumindo que item.cost é o custo por item.unit e item.quantity é a quantidade nessa unidade.
    // Se precisar de conversão (ex: gramas para kg), isso deve ser feito na quantity ou no cost antes de adicionar à technicalSheet.
    return acc + (item.cost * item.quantity)
  }, 0)
})

const profit = computed(() => form.price - totalCost.value)

const removeIngredient = (index) => form.technicalSheet.splice(index, 1)

const openIngredientModal = () => {
  // Pre-seleciona os que já estão na ficha técnica do produto
  selectedIngredientsInModal.value = form.technicalSheet.map(item => item.id);
  
  // Pre-popula as quantidades do que já está na ficha técnica
  modalQuantities.value = {}
  form.technicalSheet.forEach(item => {
    modalQuantities.value[item.id] = item.quantity
  })
  
  showIngredientModal.value = true
}

const closeIngredientModal = () => {
  showIngredientModal.value = false
  searchIngredienteModal.value = '' // Limpa a busca ao fechar
  selectedIngredientsInModal.value = [] // Limpa as seleções ao fechar
}

const addSelectedIngredientsToSheet = () => {
  // Remove os que foram desmarcados
  form.technicalSheet = form.technicalSheet.filter(item => 
    selectedIngredientsInModal.value.includes(item.id)
  )

  // Adiciona os novos que foram marcados ou atualiza quantidade
  selectedIngredientsInModal.value.forEach(ingredientId => {
    const existingItem = form.technicalSheet.find(item => item.id === ingredientId)
    const quantity = modalQuantities.value[ingredientId] || 1 // default 1

    if (existingItem) {
      existingItem.quantity = quantity
    } else {
      const ingredientToAdd = availableIngredients.find(ing => ing.id === ingredientId)
      if (ingredientToAdd) {
        form.technicalSheet.push({
          id: ingredientToAdd.id,
          name: ingredientToAdd.name,
          unit: ingredientToAdd.unit,
          cost: ingredientToAdd.price || 0, // Usar price do mockData
          quantity: quantity
        })
      }
    }
  })
  closeIngredientModal()
}

const handleSubmit = () => {
  loading.value = true
  setTimeout(() => {
    if (isEditing.value) {
      const index = productsDB.value.findIndex(p => p.id === form.id)
      if (index !== -1) {
        productsDB.value[index] = { ...form } // Atualiza o produto
      }
      alert('Produto atualizado com sucesso!')
    } else {
      const newId = productsDB.value.length > 0 ? Math.max(...productsDB.value.map(p => p.id)) + 1 : 1
      productsDB.value.push({ ...form, id: newId }) // Adiciona novo produto
      alert('Produto cadastrado com sucesso!')
    }
    loading.value = false
    router.push('/produtos')
  }, 1000)
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
              <label class="text-xs font-bold text-slate-700 ml-1">Preço de Venda</label>
              <input v-model="form.price" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-orange-600">
            </div>
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