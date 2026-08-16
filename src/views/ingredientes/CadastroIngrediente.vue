<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Save, X, Package, DollarSign, Database, ChevronLeft, AlertCircle } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import { ingredientService } from '@/services/ingredientService'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const isEditing = ref(false)

const form = reactive({
  id: null,
  name: '',
  stock: '',
  unit: 'UN',
  costPrice: '',
  minStock: ''
})

onMounted(async () => {
  if (route.params.id) {
    isEditing.value = true
    try {
      const itemToEdit = await ingredientService.getById(route.params.id)
      if (itemToEdit) {
        Object.assign(form, itemToEdit)
      }
    } catch (err) {
      console.error('Erro ao carregar ingrediente para edição', err)
      alert('Ingrediente não encontrado!')
      router.push('/ingredientes')
    }
  }
})

const handleSubmit = async () => {
  loading.value = true
  try {
    const payload = { ...form }
    if (isEditing.value) {
      await ingredientService.update(form.id, payload)
      alert('Ingrediente atualizado com sucesso!')
    } else {
      delete payload.id
      await ingredientService.create(payload)
      alert('Ingrediente cadastrado com sucesso!')
    }
    router.push('/ingredientes')
  } catch (err) {
    console.error('Erro ao salvar ingrediente', err)
    alert('Erro ao salvar ingrediente. Verifique os dados.')
  } finally {
    loading.value = false
  }
}
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
            {{ isEditing ? 'Editar Ingrediente' : 'Novo Ingrediente' }}
          </h1>
          <p class="text-slate-500 text-sm font-medium">
            {{ isEditing ? `Editando: ${form.name}` : 'Cadastre um novo insumo no sistema' }}
          </p>
        </div>
      </div>

      <!-- Badge de Edição -->
      <div v-if="isEditing" class="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-200">
        Modo Edição
      </div>
    </div>

    <!-- Info Alert -->
    <div class="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
      <AlertCircle class="text-blue-500 shrink-0" :size="20" />
      <p class="text-blue-700 text-xs leading-relaxed font-bold">
        {{ isEditing ? 'As alterações afetarão o cálculo de custo de todos os produtos que utilizam este ingrediente.' : 'Lembre-se de cadastrar o custo unitário corretamente para cálculos de lucro automático.' }}
      </p>
    </div>

    <!-- Form Card -->
    <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <form @submit.prevent="handleSubmit" class="p-8 space-y-8">

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Nome -->
          <div class="md:col-span-2 space-y-2">
            <label class="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Nome do Ingrediente</label>
            <div class="relative">
              <Package class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
              <input v-model="form.name" type="text" placeholder="Ex: Hambúrguer de Carne 150g" required class="w-full bg-slate-50 border border-slate-200 text-sm pl-10 p-3.5 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium">
            </div>
          </div>

          <!-- Estoque -->
          <div class="space-y-2">
            <label class="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Estoque Atual</label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <Database class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                <input v-model="form.stock" type="number" step="0.01" placeholder="0.00" required class="w-full bg-slate-50 border border-slate-200 text-sm pl-10 p-3.5 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold">
              </div>
              <select v-model="form.unit" class="bg-slate-50 border border-slate-200 text-sm px-4 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none font-black text-slate-700 uppercase">
                <option value="UN">UN</option>
                <option value="KG">KG</option>
                <option value="G">G</option>
                <option value="L">L</option>
                <option value="ML">ML</option>
              </select>
            </div>
          </div>

          <!-- Alerta Mínimo -->
          <div class="space-y-2">
            <label class="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Alerta de Estoque Mínimo</label>
            <input v-model="form.minStock" type="number" placeholder="Ex: 5" class="w-full bg-slate-50 border border-slate-200 text-sm p-3.5 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium">
          </div>

          <!-- Preço de Custo -->
          <div class="space-y-2">
            <label class="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Custo Unitário (R$)</label>
            <div class="relative">
              <DollarSign class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
              <input v-model="form.costPrice" type="number" step="0.01" placeholder="0,00" required class="w-full bg-slate-50 border border-slate-200 text-sm pl-10 p-3.5 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-orange-600">
            </div>
          </div>
        </div>

        <!-- Botões -->
        <div class="pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4">
          <BaseButton type="submit" variant="primary" class="flex-1 py-4" :loading="loading">
            <Save :size="20" />
            {{ isEditing ? 'Atualizar Ingrediente' : 'Cadastrar Ingrediente' }}
          </BaseButton>
          <BaseButton type="button" variant="secondary" @click="router.push('/ingredientes')" class="md:w-48 py-4">
            <X :size="20" />
            Cancelar
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>