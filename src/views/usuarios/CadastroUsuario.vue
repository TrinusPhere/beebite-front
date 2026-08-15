<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { UserPlus, Edit, Save, XCircle, KeyRound, Lock, User, CheckSquare, ArrowLeft } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import { userService } from '@/services/userService'

const router = useRouter()
const route = useRoute()

const isEditing = ref(false)
const currentUserForm = reactive({
  id: null,
  name: '',
  login: '',
  password: '',
  role: '',
  permissions: []
})

const allPermissions = [
  'dashboard',
  'pedidos',
  'clientes',
  'ingredientes',
  'produtos',
  'entregadores',
  'financeiro',
  'acerto_entregadores',
  'usuarios'
]

const selectAll = ref(false)

const toggleSelectAll = () => {
  if (selectAll.value) {
    currentUserForm.permissions = [...allPermissions]
  } else {
    currentUserForm.permissions = []
  }
}

const areAllPermissionsSelected = computed(() => {
  return allPermissions.every(perm => currentUserForm.permissions.includes(perm))
})

const updateSelectAllCheckbox = () => {
  selectAll.value = areAllPermissionsSelected.value
}

onMounted(() => {
  updateSelectAllCheckbox()
})

onMounted(async () => {
  if (route.params.id) {
    isEditing.value = true
    try {
      const userToEdit = await userService.getById(route.params.id)
      if (userToEdit) {
        Object.assign(currentUserForm, { ...userToEdit })
        currentUserForm.password = '' // Limpar a senha ao editar
        updateSelectAllCheckbox()
      }
    } catch (error) {
      console.error("Erro ao carregar usuário", error)
      router.push('/usuarios')
    }
  }
})

const saveUser = async () => {
  try {
    const dataToSave = { ...currentUserForm }
    // Se estiver editando e a senha estiver vazia, não envie a senha
    if (isEditing.value && !dataToSave.password) {
      delete dataToSave.password
    }
    
    if (isEditing.value) {
      await userService.update(currentUserForm.id, dataToSave)
    } else {
      await userService.create(dataToSave)
    }
    router.push('/usuarios')
  } catch (error) {
    console.error("Erro ao salvar usuário", error)
    alert("Erro ao salvar o usuário.")
  }
}

const cancel = () => {
  router.push('/usuarios')
}
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <BaseButton @click="cancel" variant="ghost" size="sm" class="p-2">
        <ArrowLeft :size="20" />
      </BaseButton>
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ isEditing ? 'Editar Usuário' : 'Novo Usuário' }}</h1>
        <p class="text-slate-500 text-sm font-medium">Preencha os dados para {{ isEditing ? 'editar' : 'cadastrar' }} o usuário.</p>
      </div>
    </div>

    <!-- Formulário de Cadastro/Edição de Usuário -->
    <div class="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
      <form @submit.prevent="saveUser" class="space-y-5">
        <div class="space-y-2">
          <label class="text-sm font-bold text-slate-700 ml-1">Nome</label>
          <div class="relative group">
            <User class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" :size="20" />
            <input v-model="currentUserForm.name" type="text" placeholder="Nome Completo" required
              class="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
            >
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-700 ml-1">Login</label>
            <div class="relative group">
              <KeyRound class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" :size="20" />
              <input v-model="currentUserForm.login" type="text" placeholder="login.usuario" required
                class="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
              >
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-700 ml-1">Senha</label>
            <div class="relative group">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" :size="20" />
              <input v-model="currentUserForm.password" type="password" placeholder="••••••••" :required="!isEditing"
                class="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
              >
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-bold text-slate-700 ml-1">Cargo/Role</label>
          <div class="relative group">
            <select v-model="currentUserForm.role" required
              class="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-4 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
            >
              <option value="" disabled>Selecione um cargo</option>
              <option value="admin">Administrador</option>
              <option value="gerente">Gerente</option>
              <option value="caixa">Caixa</option>
            </select>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center mb-3">
            <input type="checkbox" id="selectAllPermissions" v-model="selectAll" @change="toggleSelectAll"
              class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
            >
            <label for="selectAllPermissions" class="ml-2 text-sm text-slate-700 font-bold">Permissões</label>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-for="perm in allPermissions" :key="perm" class="flex items-center">
              <input type="checkbox" :id="`perm-${perm}`" :value="perm"
                v-model="currentUserForm.permissions"
                @change="updateSelectAllCheckbox"
                class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
              >
              <label :for="`perm-${perm}`" class="ml-2 text-sm text-slate-700 capitalize">{{ perm.replace('_', ' ') }}</label>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <BaseButton @click="cancel" variant="ghost" type="button">
            Cancelar
          </BaseButton>
          <BaseButton type="submit" variant="primary">
            <Save :size="20" />
            {{ isEditing ? 'Salvar Alterações' : 'Adicionar Usuário' }}
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>