<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Save, X, ShoppingBag, Trash2, Search, ChevronLeft, Calculator, UtensilsCrossed } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const isEditing = ref(false)
const searchIngrediente = ref('')

const form = reactive({
  name: '',
  category: 'Hambúrgueres',
  price: 0,
  technicalSheet: []
})

// Simulação de banco de dados para produtos
const productsDB = [
  {
    id: 1,
    name: 'X-Bacon Especial',
    category: 'Hambúrgueres',
    price: 35.00,
    technicalSheet: [
      { id: 1, name: 'Pão Brioche', unit: 'un', cost: 1.50, quantity: 1 },
      { id: 4, name: 'Bacon Fatiado', unit: 'kg', cost: 38.00, quantity: 50 },
    ]
  }
]

const availableIngredients = ref([
  { id: 1, name: 'Pão Brioche', unit: 'un', cost: 1.50 },
  { id: 2, name: 'Hambúrguer 150g', unit: 'un', cost: 4.50 },
  { id: 3, name: 'Queijo Mussarela', unit: 'kg', cost: 45.00 },
  { id: 4, name: 'Bacon Fatiado', unit: 'kg', cost: 38.00 },
])

onMounted(() => {
  if (route.params.id) {
    isEditing.value = true
    const product = productsDB.find(p => p.id === parseInt(route.params.id))
    if (product) {
      Object.assign(form, JSON.parse(JSON.stringify(product))) // Deep copy
    }
  }
})

const totalCost = computed(() => {
  return form.technicalSheet.reduce((acc, item) => {
    let itemCost = 0
    if (item.unit === 'kg' || item.unit === 'lt') {
      itemCost = (item.cost * item.quantity) / 1000
    } else {
      itemCost = item.cost * item.quantity
    }
    return acc + itemCost
  }, 0)
})

const profit = computed(() => form.price - totalCost.value)

const addIngredient = (ing) => {
  form.technicalSheet.push({ ...ing, quantity: 1 })
  searchIngrediente.value = ''
}

const removeIngredient = (index) => form.technicalSheet.splice(index, 1)

const handleSubmit = () => {
  loading.value = true
  setTimeout(() => {
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
            <BaseButton variant="secondary" class="w-full border-slate-700 text-slate-400" @click="router.push('/produtos')">
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
          <div class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest">
            <UtensilsCrossed :size="16" /> Composição
          </div>
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="20" />
            <input v-model="searchIngrediente" type="text" placeholder="Adicionar ingrediente..." class="w-full bg-slate-50 border border-slate-200 pl-10 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20">
          </div>
          <div class="space-y-3">
            <div v-for="(item, index) in form.technicalSheet" :key="item.id" class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div class="flex-1 font-bold text-slate-800 text-sm">{{ item.name }}</div>
              <div class="flex items-center gap-2">
                <input v-model="item.quantity" type="number" class="w-16 p-2 text-center text-sm font-black bg-white border border-slate-200 rounded-lg">
                <span class="text-[10px] font-black text-slate-400 uppercase">{{ item.unit }}</span>
                <button @click="removeIngredient(index)" class="p-2 text-slate-300 hover:text-red-500"><Trash2 :size="18" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
