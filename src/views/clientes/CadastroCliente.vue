<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Save, X, User, Phone, MapPin, Mail, ChevronLeft, AlertCircle } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import { customerService } from '@/services/customerService'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const isEditing = ref(false)

const form = reactive({
  id: null,
  name: '',
  phone: '',
  email: '',
  zipCode: '',
  address: '',
  number: '',
  complement: '',
  neighborhood: ''
})

onMounted(async () => {
  if (route.params.id) {
    isEditing.value = true
    try {
      const client = await customerService.getById(route.params.id)
      if (client) {
        Object.assign(form, client)
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      alert('Erro ao carregar cliente.')
      router.push('/clientes')
    }
  }
})

const handleSubmit = async () => {
  loading.value = true
  try {
    if (isEditing.value) {
      await customerService.update(form.id, form)
      alert('Cliente atualizado com sucesso!')
    } else {
      await customerService.create(form)
      alert('Cliente cadastrado com sucesso!')
    }
    router.push('/clientes')
  } catch (error) {
    console.error('Erro ao salvar cliente:', error)
    alert('Erro ao salvar cliente.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-12">
    <!-- Header Dinâmico -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button @click="router.push('/clientes')" class="p-2 hover:bg-white rounded-xl text-slate-400 border border-transparent hover:border-slate-200 transition-all">
          <ChevronLeft :size="24" />
        </button>
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">
            {{ isEditing ? 'Editar Cliente' : 'Novo Cliente' }}
          </h1>
          <p class="text-slate-500 text-sm font-medium">
            {{ isEditing ? `Atualizando dados de: ${form.name}` : 'Cadastre um novo cliente no sistema' }}
          </p>
        </div>
      </div>
      <div v-if="isEditing" class="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-200">
        Modo Edição
      </div>
    </div>

    <!-- Form Card -->
    <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <form @submit.prevent="handleSubmit" class="p-8 space-y-8">
        <!-- Dados Pessoais -->
        <div class="space-y-6">
          <div class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest">
            <User :size="16" /> Dados Pessoais
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1">Nome Completo</label>
              <input v-model="form.name" type="text" required class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none">
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1">Telefone</label>
              <input v-model="form.phone" type="text" required class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none">
            </div>
          </div>
        </div>

        <!-- Endereço -->
        <div class="pt-8 border-t border-slate-100 space-y-6">
          <div class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest">
            <MapPin :size="16" /> Endereço de Entrega
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2 space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1">Rua/Logradouro</label>
              <input v-model="form.address" type="text" required class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none">
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1">Número</label>
              <input v-model="form.number" type="text" required class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none">
            </div>
          </div>
        </div>

        <!-- Botões -->
        <div class="pt-8 border-t border-slate-100 flex gap-4">
          <BaseButton type="submit" variant="primary" class="flex-1 py-4" :loading="loading">
            <Save :size="20" /> {{ isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente' }}
          </BaseButton>
          <BaseButton type="button" variant="secondary" @click="router.push('/clientes')" class="md:w-48 py-4">
            <X :size="20" /> Cancelar
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>