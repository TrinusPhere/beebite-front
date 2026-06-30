<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Save, X, Bike, ChevronLeft } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import { motoboysDB } from '@/utils/mockData' // Importar motoboysDB

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const isEditing = ref(false)

const form = reactive({
  id: null,
  name: '',
  phone: '',
  status: 'Ativo' // Default status
})

onMounted(() => {
  if (route.params.id) {
    isEditing.value = true
    const motoboyId = parseInt(route.params.id)
    const motoboy = motoboysDB.value.find(m => m.id === motoboyId)
    if (motoboy) {
      Object.assign(form, JSON.parse(JSON.stringify(motoboy))) // Deep copy para edição
    }
  }
})

const handleSubmit = () => {
  loading.value = true
  setTimeout(() => {
    if (isEditing.value) {
      const index = motoboysDB.value.findIndex(m => m.id === form.id)
      if (index !== -1) {
        motoboysDB.value[index] = { ...form } // Atualiza o motoboy
      }
      alert('Entregador atualizado com sucesso!')
    } else {
      const newId = motoboysDB.value.length > 0 ? Math.max(...motoboysDB.value.map(m => m.id)) + 1 : 1
      motoboysDB.value.push({ ...form, id: newId, totalDeliveries: 0 }) // Adiciona novo motoboy
      alert('Entregador cadastrado com sucesso!')
    }
    loading.value = false
    router.push('/entregadores')
  }, 1000)
}

const handleCancel = () => {
  router.push('/entregadores')
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <!-- Header Dinâmico -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-4">
      <div class="flex items-center gap-4">
        <button @click="router.push('/entregadores')" class="p-2 hover:bg-white rounded-xl text-slate-400">
          <ChevronLeft :size="24" />
        </button>
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">
            {{ isEditing ? 'Editar Entregador' : 'Novo Entregador' }}
          </h1>
          <p class="text-slate-500 text-sm font-medium">
            {{ isEditing ? `Editando: ${form.name}` : 'Cadastre um novo entregador para sua equipe' }}
          </p>
        </div>
      </div>
      <div v-if="isEditing" :class="[
        'px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm',
        form.status === 'Ativo' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-red-100 text-red-600 border-red-200'
      ]">
        {{ form.status }}
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 items-start">
      <!-- Formulário Principal -->
      <div class="flex-1 space-y-6 order-1 lg:order-2">
        <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest">
            <Bike :size="16" /> Dados do Entregador
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2 space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1">Nome Completo</label>
              <input v-model="form.name" type="text" required class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20">
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1">Telefone</label>
              <input v-model="form.phone" type="text" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20">
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1">Status</label>
              <select v-model="form.status" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20">
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
          <!-- Botões -->
          <div class="pt-8 border-t border-slate-100 flex gap-4">
            <BaseButton type="submit" variant="primary" class="flex-1 py-4" :loading="loading">
              <Save :size="20" /> {{ isEditing ? 'Salvar Alterações' : 'Cadastrar Entregador' }}
            </BaseButton>
            <BaseButton type="button" variant="secondary" @click="router.push('/entregadores')" class="md:w-48 py-4">
              <X :size="20" /> Cancelar
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>