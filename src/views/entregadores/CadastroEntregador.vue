<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Save, X, Bike, ChevronLeft } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import { driverService } from '@/services/driverService'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const isEditing = ref(false)

const form = reactive({
  id: null,
  name: '',
  phone: '',
  status: 'ATIVO',
  isFixed: false,
  isDaily: false,
  allowance: 0,
  hasFixedDeliveryValue: false,
  fixedDeliveryValue: 0
})

onMounted(async () => {
  if (route.params.id) {
    isEditing.value = true
    const motoboyId = route.params.id
    try {
      loading.value = true
      const motoboy = await driverService.getById(motoboyId)
      if (motoboy) {
        Object.assign(form, {
          ...motoboy,
          status: motoboy.status?.toUpperCase() || 'ATIVO',
          allowance: motoboy.allowance || 0,
          fixedDeliveryValue: motoboy.fixedDeliveryValue || 0
        })
      }
    } catch (error) {
      console.error('Erro ao buscar entregador:', error)
      alert('Entregador não encontrado.')
      router.push('/entregadores')
    } finally {
      loading.value = false
    }
  }
})

const handleSubmit = async () => {
  loading.value = true
  try {
    const payload = {
      ...form,
      allowance: Number(form.allowance),
      fixedDeliveryValue: Number(form.fixedDeliveryValue)
    }
    
    if (isEditing.value) {
      await driverService.update(form.id, payload)
      alert('Entregador atualizado com sucesso!')
    } else {
      await driverService.create(payload)
      alert('Entregador cadastrado com sucesso!')
    }
    router.push('/entregadores')
  } catch (error) {
    console.error('Erro ao salvar entregador:', error)
    alert('Erro ao salvar entregador.')
  } finally {
    loading.value = false
  }
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
        form.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-red-100 text-red-600 border-red-200'
      ]">
        {{ form.status }}
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 items-start">
      <!-- Formulário Principal -->
      <div class="flex-1 space-y-6 order-1 lg:order-2">
        <form @submit.prevent="handleSubmit" class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
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
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
            
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1">Ajuda de Custo (R$)</label>
              <input v-model="form.allowance" type="number" step="0.01" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="0.00">
            </div>

            <div class="md:col-span-2 space-y-2 mt-2">
              <label class="text-xs font-bold text-slate-700 ml-1">Tipo de Entregador</label>
              <div class="flex gap-6">
                <label class="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" v-model="form.isFixed" @change="form.isFixed ? form.isDaily = false : null" class="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 accent-orange-600">
                  Fixo
                </label>
                <label class="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" v-model="form.isDaily" @change="form.isDaily ? form.isFixed = false : null" class="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 accent-orange-600">
                  Diarista
                </label>
              </div>
            </div>

            <div class="md:col-span-2 space-y-2 mt-4 pt-4 border-t border-slate-100">
              <label class="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" v-model="form.hasFixedDeliveryValue" class="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 accent-orange-600">
                Valor Fixo por Entrega?
              </label>
              
              <div v-if="form.hasFixedDeliveryValue" class="space-y-1 mt-3 transition-all">
                <label class="text-xs font-bold text-slate-700 ml-1">Valor da Entrega (R$)</label>
                <input v-model="form.fixedDeliveryValue" type="number" step="0.01" class="w-full md:w-1/2 bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="0.00">
              </div>
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
        </form>
      </div>
    </div>
  </div>
</template>