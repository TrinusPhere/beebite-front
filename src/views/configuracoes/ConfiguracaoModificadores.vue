<template>
  <div class="max-w-6xl mx-auto space-y-6 pb-20">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <div class="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <SlidersHorizontal :size="18" class="text-white" />
          </div>
          Configuração de Modificadores
        </h1>
        <p class="text-slate-500 text-sm font-medium mt-1">
          Configure grupos, adicionais e itens removíveis que aparecem no modal de pedidos
        </p>
      </div>
    </div>

    <!-- Abas de navegação -->
    <div class="flex gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
          activeTab === tab.id
            ? 'bg-white text-orange-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <component :is="tab.icon" :size="16" />
        {{ tab.label }}
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- ABA 1: Grupos de Modificadores                  -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="activeTab === 'grupos'" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-slate-500 text-sm">Grupos definem conjuntos de opções que aparecem no modal de customização. Um grupo pode ser de seleção única (radio) ou múltipla (checkbox).</p>
        <button @click="openGroupModal(null)" class="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-sm shadow-orange-500/20 hover:shadow-orange-500/40 shrink-0 ml-4">
          <Plus :size="16" /> Novo Grupo
        </button>
      </div>

      <!-- Cards de grupos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="group in modifierGroupsDB"
          :key="group.id"
          class="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all space-y-4"
        >
          <!-- Cabeçalho do grupo -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl leading-none">{{ group.icon }}</span>
              <div>
                <h3 class="font-black text-slate-800">{{ group.name }}</h3>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span :class="group.type === 'RADIO' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'" class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {{ group.type === 'RADIO' ? 'Seleção Única' : 'Múltipla Seleção' }}
                  </span>
                  <span :class="group.required ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'" class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {{ group.required ? 'Obrigatório' : 'Opcional' }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-medium">Min: {{ group.minSelections }} / Max: {{ group.maxSelections }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button @click="openGroupModal(group)" class="p-2 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
                <Pencil :size="15" />
              </button>
              <button @click="deleteGroup(group.id)" class="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                <Trash2 :size="15" />
              </button>
            </div>
          </div>

          <!-- Opções do grupo -->
          <div class="space-y-1.5">
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Opções</p>
            <div v-for="opt in group.options" :key="opt.id" class="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
              <div class="flex items-center gap-2">
                <div :class="group.type === 'RADIO' ? 'rounded-full' : 'rounded-md'" class="w-3.5 h-3.5 border-2 border-slate-300" />
                <span class="text-sm text-slate-700 font-medium">{{ opt.name }}</span>
              </div>
              <span v-if="opt.price > 0" class="text-xs font-bold text-emerald-600">+R$ {{ opt.price.toFixed(2) }}</span>
              <span v-else class="text-xs text-slate-400">Incluso</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!modifierGroupsDB.length" class="text-center py-16 text-slate-400">
        <Layers :size="40" class="mx-auto mb-3 opacity-30" />
        <p class="font-medium">Nenhum grupo cadastrado.</p>
        <p class="text-sm mt-1">Clique em "Novo Grupo" para começar.</p>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- ABA 2: Adicionais Globais                       -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="activeTab === 'adicionais'" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-slate-500 text-sm">Catálogo global de adicionais que podem ser usados em qualquer grupo de modificadores.</p>
        <button @click="openAdditionalModal(null)" class="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-sm shadow-orange-500/20 shrink-0 ml-4">
          <Plus :size="16" /> Novo Adicional
        </button>
      </div>

      <!-- Tabela de adicionais -->
      <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50">
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Nome</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Categoria</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Preço</th>
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th class="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="add in additionalsDB" :key="add.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-5 py-3.5 font-semibold text-slate-800">{{ add.name }}</td>
              <td class="px-5 py-3.5">
                <span class="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-medium">{{ add.category }}</span>
              </td>
              <td class="px-5 py-3.5 font-black text-emerald-600">+R$ {{ add.price.toFixed(2) }}</td>
              <td class="px-5 py-3.5">
                <button @click="toggleAdditionalStatus(add)" :class="add.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'" class="text-xs font-bold px-2.5 py-1 rounded-lg transition-all hover:opacity-80">
                  {{ add.active ? '● Ativo' : '○ Inativo' }}
                </button>
              </td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openAdditionalModal(add)" class="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
                    <Pencil :size="14" />
                  </button>
                  <button @click="deleteAdditional(add.id)" class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!additionalsDB.length" class="text-center py-16 text-slate-400">
          <p class="font-medium">Nenhum adicional cadastrado.</p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- ABA 3: Remoções por Produto                     -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="activeTab === 'remocoes'" class="space-y-5">
      <p class="text-slate-500 text-sm">
        Selecione um produto e configure quais ingredientes da ficha técnica o cliente pode solicitar para remover.
        Itens como "pão" e "carne" podem ser desativados para evitar remoções indevidas.
      </p>

      <!-- Selector de produto -->
      <div class="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <label class="block text-sm font-bold text-slate-700">Selecione o Produto</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <button
            v-for="product in productsWithSheet"
            :key="product.id"
            @click="selectedProductForRemoval = product"
            :class="[
              'p-3 rounded-2xl border-2 text-left transition-all',
              selectedProductForRemoval?.id === product.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-slate-100 bg-slate-50 hover:border-orange-200'
            ]"
          >
            <p class="font-bold text-xs text-slate-700 leading-tight">{{ product.name }}</p>
            <p class="text-[10px] text-slate-400 mt-0.5">{{ product.technicalSheet.length }} ingredientes</p>
          </button>
        </div>
        <p v-if="!productsWithSheet.length" class="text-slate-400 text-sm">Nenhum produto com ficha técnica cadastrada.</p>
      </div>

      <!-- Configuração de removíveis do produto selecionado -->
      <Transition name="section-fade">
        <div v-if="selectedProductForRemoval" class="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-black text-slate-800">{{ selectedProductForRemoval.name }}</h3>
              <p class="text-xs text-slate-400 mt-0.5">Ative o toggle para permitir que o cliente remova o ingrediente</p>
            </div>
            <span class="text-xs bg-orange-100 text-orange-600 font-bold px-3 py-1 rounded-xl">
              {{ countRemovable(selectedProductForRemoval) }} removíveis
            </span>
          </div>

          <div class="space-y-2">
            <div
              v-for="ingredient in selectedProductForRemoval.technicalSheet"
              :key="ingredient.id"
              class="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/60 transition-all"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-sm">🥬</div>
                <div>
                  <p class="font-semibold text-sm text-slate-800">{{ ingredient.name }}</p>
                  <p class="text-xs text-slate-400">{{ ingredient.quantity }} {{ ingredient.unit }}</p>
                </div>
              </div>

              <!-- Toggle switch -->
              <button
                @click="toggleRemovable(selectedProductForRemoval, ingredient.id)"
                :class="[
                  'relative w-11 h-6 rounded-full transition-all duration-300 shrink-0',
                  isRemovable(selectedProductForRemoval, ingredient.id) ? 'bg-orange-500' : 'bg-slate-200'
                ]"
                :aria-label="isRemovable(selectedProductForRemoval, ingredient.id) ? 'Desativar' : 'Ativar'"
              >
                <span :class="[
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300',
                  isRemovable(selectedProductForRemoval, ingredient.id) ? 'translate-x-5' : 'translate-x-0'
                ]" />
              </button>
            </div>
          </div>

          <!-- Aviso de ingredientes sem ficha técnica -->
          <div class="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <Info :size="14" class="text-amber-500 shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700 font-medium">
              Ingredientes sem ficha técnica (como bebidas ou acompanhamentos) não aparecem aqui.
              Para exibir remoções, o produto precisa ter a ficha técnica cadastrada.
            </p>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ══════════════════════════════════════════════════ -->
    <!-- MODAL: Grupo de Modificadores (criar/editar)       -->
    <!-- ══════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showGroupModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="closeGroupModal" />
          <Transition name="modal-slide">
            <div v-if="showGroupModal" class="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
              <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 class="font-black text-slate-800 text-lg">{{ editingGroup?.id ? 'Editar Grupo' : 'Novo Grupo' }}</h3>
                <button @click="closeGroupModal" class="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X :size="18" /></button>
              </div>
              <div class="flex-1 overflow-y-auto p-6 space-y-5">
                <!-- Nome e ícone -->
                <div class="grid grid-cols-3 gap-3">
                  <div class="col-span-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nome do Grupo *</label>
                    <input v-model="groupForm.name" type="text" placeholder="Ex: Ponto da Carne" class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Ícone</label>
                    <input v-model="groupForm.icon" type="text" placeholder="🥩" maxlength="2" class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center text-2xl focus:border-orange-400 outline-none" />
                  </div>
                </div>

                <!-- Tipo de seleção -->
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Tipo de Seleção *</label>
                  <div class="flex gap-3">
                    <label v-for="t in [{ v: 'RADIO', l: 'Única (Radio)' }, { v: 'CHECKBOX', l: 'Múltipla (Checkbox)' }]" :key="t.v" :class="['flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all', groupForm.type === t.v ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-orange-200']">
                      <input type="radio" :value="t.v" v-model="groupForm.type" class="hidden" />
                      <div :class="['w-4 h-4 border-2 flex items-center justify-center shrink-0 transition-all', groupForm.type === t.v ? 'border-orange-500 bg-orange-500 rounded-full' : 'border-slate-300 rounded-full']">
                        <div v-if="groupForm.type === t.v" class="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      <span class="text-sm font-semibold text-slate-700">{{ t.l }}</span>
                    </label>
                  </div>
                </div>

                <!-- Obrigatório + limites -->
                <div class="grid grid-cols-3 gap-3">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">Obrigatório</label>
                    <button @click="groupForm.required = !groupForm.required" :class="['relative w-11 h-6 rounded-full transition-all', groupForm.required ? 'bg-orange-500' : 'bg-slate-200']">
                      <span :class="['absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', groupForm.required ? 'translate-x-5' : 'translate-x-0']" />
                    </button>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Mín.</label>
                    <input v-model.number="groupForm.minSelections" type="number" min="0" class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-orange-400 outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Máx.</label>
                    <input v-model.number="groupForm.maxSelections" type="number" min="1" class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-orange-400 outline-none" />
                  </div>
                </div>

                <!-- Opções do grupo -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">Opções do Grupo</label>
                    <button @click="addOption" class="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                      <Plus :size="12" /> Adicionar opção
                    </button>
                  </div>
                  <div class="space-y-2">
                    <div v-for="(opt, i) in groupForm.options" :key="i" class="flex items-center gap-2">
                      <input v-model="opt.name" type="text" placeholder="Nome da opção" class="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-orange-400 outline-none" />
                      <div class="flex items-center gap-1 border border-slate-200 rounded-xl px-3 py-2 text-sm w-28">
                        <span class="text-slate-400 text-xs">R$</span>
                        <input v-model.number="opt.price" type="number" min="0" step="0.5" placeholder="0,00" class="w-full text-sm outline-none" />
                      </div>
                      <button @click="removeOption(i)" class="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                        <X :size="14" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="p-6 border-t border-slate-100 flex gap-3">
                <button @click="closeGroupModal" class="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50">Cancelar</button>
                <button @click="saveGroup" class="flex-[2] py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all">Salvar Grupo</button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════ -->
    <!-- MODAL: Adicional (criar/editar)                    -->
    <!-- ══════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showAdditionalModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="closeAdditionalModal" />
          <Transition name="modal-slide">
            <div v-if="showAdditionalModal" class="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 class="font-black text-slate-800">{{ editingAdditional?.id ? 'Editar Adicional' : 'Novo Adicional' }}</h3>
                <button @click="closeAdditionalModal" class="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X :size="18" /></button>
              </div>
              <div class="p-6 space-y-4">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nome *</label>
                  <input v-model="additionalForm.name" type="text" placeholder="Ex: Queijo Coalho" class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-orange-400 outline-none" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Categoria</label>
                  <input v-model="additionalForm.category" type="text" placeholder="Ex: Queijos, Carnes..." class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-orange-400 outline-none" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Preço (R$) *</label>
                  <input v-model.number="additionalForm.price" type="number" min="0" step="0.5" placeholder="0.00" class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-orange-400 outline-none" />
                </div>
              </div>
              <div class="px-6 pb-6 flex gap-3">
                <button @click="closeAdditionalModal" class="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50">Cancelar</button>
                <button @click="saveAdditional" class="flex-[2] py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600">Salvar</button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  SlidersHorizontal, Plus, Pencil, Trash2, Layers,
  X, Info, Boxes, ListChecks, MinusCircle
} from 'lucide-vue-next'
import { modifierGroupService } from '@/services/modifierGroupService'
import { additionalService } from '@/services/additionalService'
import { productService } from '@/services/productService'

const modifierGroupsDB = ref([])
const additionalsDB = ref([])
const productsDB = ref([])

onMounted(async () => {
  try {
    modifierGroupsDB.value = await modifierGroupService.getAll()
    additionalsDB.value = await additionalService.getAll()
    const pResponse = await productService.getAll()
    productsDB.value = pResponse.content || []
  } catch (err) {
    console.error('Erro ao carregar configurações:', err)
  }
})

// ── Abas ──
const tabs = [
  { id: 'grupos', label: 'Grupos de Modificadores', icon: Layers },
  { id: 'adicionais', label: 'Adicionais Globais', icon: Boxes },
  { id: 'remocoes', label: 'Remoções por Produto', icon: MinusCircle },
]
const activeTab = ref('grupos')

// ─────────────────────────────────────────
// ABA 1: Grupos de Modificadores
// ─────────────────────────────────────────
const showGroupModal = ref(false)
const editingGroup = ref(null)

const groupForm = ref({
  name: '',
  icon: '🔧',
  type: 'RADIO',
  required: false,
  minSelections: 0,
  maxSelections: 1,
  options: [{ name: '', price: 0 }],
})

const openGroupModal = (group) => {
  editingGroup.value = group
  if (group) {
    groupForm.value = {
      name: group.name,
      icon: group.icon,
      type: group.type,
      required: group.required,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      options: group.options.map(o => ({ ...o })),
    }
  } else {
    groupForm.value = {
      name: '',
      icon: '🔧',
      type: 'RADIO',
      required: false,
      minSelections: 0,
      maxSelections: 1,
      options: [{ name: '', price: 0 }],
    }
  }
  showGroupModal.value = true
}

const closeGroupModal = () => { showGroupModal.value = false }

const addOption = () => { groupForm.value.options.push({ name: '', price: 0 }) }
const removeOption = (i) => { groupForm.value.options.splice(i, 1) }

const saveGroup = async () => {
  if (!groupForm.value.name.trim()) { alert('Nome do grupo é obrigatório.'); return }
  if (!groupForm.value.options.some(o => o.name.trim())) { alert('Adicione ao menos uma opção.'); return }

  const validOptions = groupForm.value.options
    .filter(o => o.name.trim())
    // Backend creates IDs for options if they are null

  try {
    const payload = {
      ...groupForm.value,
      options: validOptions
    }
    
    if (editingGroup.value) {
      await modifierGroupService.update(editingGroup.value.id, payload)
    } else {
      await modifierGroupService.create(payload)
    }
    modifierGroupsDB.value = await modifierGroupService.getAll()
    closeGroupModal()
  } catch (err) {
    console.error('Erro ao salvar grupo:', err)
    alert('Erro ao salvar grupo')
  }
}

const deleteGroup = async (groupId) => {
  if (!confirm('Deseja excluir este grupo? Ele será removido de todos os produtos vinculados.')) return
  try {
    await modifierGroupService.delete(groupId)
    modifierGroupsDB.value = await modifierGroupService.getAll()
  } catch (err) {
    console.error('Erro ao excluir grupo:', err)
    alert('Erro ao excluir grupo')
  }
}

// ─────────────────────────────────────────
// ABA 2: Adicionais Globais
// ─────────────────────────────────────────
const showAdditionalModal = ref(false)
const editingAdditional = ref(null)

const additionalForm = ref({ name: '', category: '', price: 0 })

const openAdditionalModal = (add) => {
  editingAdditional.value = add
  additionalForm.value = add ? { name: add.name, category: add.category, price: add.price } : { name: '', category: '', price: 0 }
  showAdditionalModal.value = true
}

const closeAdditionalModal = () => { showAdditionalModal.value = false }

const saveAdditional = async () => {
  if (!additionalForm.value.name.trim()) { alert('Nome é obrigatório.'); return }
  if (additionalForm.value.price <= 0) { alert('Preço deve ser maior que zero.'); return }

  try {
    if (editingAdditional.value) {
      await additionalService.update(editingAdditional.value.id, additionalForm.value)
    } else {
      await additionalService.create(additionalForm.value)
    }
    additionalsDB.value = await additionalService.getAll()
    closeAdditionalModal()
  } catch (err) {
    console.error('Erro ao salvar adicional:', err)
    alert('Erro ao salvar adicional')
  }
}

const deleteAdditional = async (addId) => {
  if (!confirm('Excluir este adicional?')) return
  try {
    await additionalService.delete(addId)
    additionalsDB.value = await additionalService.getAll()
  } catch (err) {
    console.error('Erro ao excluir adicional:', err)
    alert('Erro ao excluir adicional')
  }
}

const toggleAdditionalStatus = async (add) => { 
  try {
    await additionalService.toggleStatus(add.id)
    additionalsDB.value = await additionalService.getAll()
  } catch (err) {
    console.error('Erro ao alternar status do adicional:', err)
    alert('Erro ao alterar status')
  }
}

// ─────────────────────────────────────────
// ABA 3: Remoções por Produto
// ─────────────────────────────────────────
const selectedProductForRemoval = ref(null)

const productsWithSheet = computed(() =>
  productsDB.value.filter(p => p.technicalSheet?.length > 0)
)

const isRemovable = (product, ingredientId) =>
  (product.removableItemIds || []).includes(ingredientId)

const toggleRemovable = async (product, ingredientId) => {
  if (!product.removableItemIds) product.removableItemIds = []
  
  // Create a copy of current removables
  const currentRemovables = [...product.removableItemIds]
  const idx = currentRemovables.indexOf(ingredientId)
  
  if (idx === -1) {
    currentRemovables.push(ingredientId)
  } else {
    currentRemovables.splice(idx, 1)
  }
  
  try {
    await productService.updateRemovableItems(product.id, currentRemovables)
    // Update local state after success
    product.removableItemIds = currentRemovables
  } catch (err) {
    console.error('Erro ao atualizar item removível:', err)
    alert('Erro ao atualizar permissão de remoção')
  }
}

const countRemovable = (product) => (product.removableItemIds || []).length
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.modal-slide-enter-active, .modal-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}
.modal-slide-enter-from, .modal-slide-leave-to { transform: scale(0.93) translateY(20px); opacity: 0; }

.section-fade-enter-active, .section-fade-leave-active { transition: all 0.3s ease; }
.section-fade-enter-from, .section-fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
