<template>
  <!-- Overlay -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="handleCancel"
      >
        <!-- Backdrop blur -->
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" @click="handleCancel" />

        <!-- Modal Panel -->
        <Transition name="modal-slide">
          <div
            v-if="modelValue"
            class="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden border border-slate-200/60"
          >
            <!-- ── Header com foto e info do produto ── -->
            <div class="relative shrink-0">
              <!-- Imagem do produto -->
              <div class="h-36 sm:h-44 bg-gradient-to-br from-orange-400 to-amber-500 overflow-hidden">
                <img
                  v-if="product?.imageUrl"
                  :src="product.imageUrl"
                  :alt="product.name"
                  class="w-full h-full object-cover opacity-90"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UtensilsCrossed :size="48" class="text-white/50" />
                </div>
                <!-- Gradiente overlay na imagem -->
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              </div>

              <!-- Botão fechar -->
              <button
                @click="handleCancel"
                class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all"
                aria-label="Fechar"
              >
                <X :size="16" />
              </button>

              <!-- Info sobre a imagem -->
              <div class="absolute bottom-0 left-0 right-0 px-5 pb-4">
                <span class="text-xs font-bold text-orange-300 uppercase tracking-widest">Personalizar</span>
                <h2 class="text-xl font-black text-white leading-tight">{{ product?.name }}</h2>
              </div>
            </div>

            <!-- Preço base + descrição -->
            <div class="px-5 pt-4 pb-2 shrink-0 flex items-center justify-between gap-3 border-b border-slate-100">
              <p class="text-sm text-slate-500 leading-snug flex-1">{{ product?.description }}</p>
              <div class="text-right shrink-0">
                <p class="text-xs text-slate-400 font-medium">Preço base</p>
                <p class="text-lg font-black text-slate-800">R$ {{ (product?.price || 0).toFixed(2) }}</p>
              </div>
            </div>

            <!-- ── Corpo scrollável com as seções ── -->
            <div class="flex-1 overflow-y-auto px-5 py-4 space-y-6 custom-scroll">

              <!-- Seção: Grupos de modificadores vinculados ao produto (ex: Ponto da Carne) -->
              <template v-for="group in activeModifierGroups" :key="group.id">
                <div class="space-y-3">
                  <!-- Cabeçalho do grupo -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-lg leading-none">{{ group.icon }}</span>
                      <h3 class="font-bold text-slate-800 text-sm">{{ group.name }}</h3>
                    </div>
                    <span
                      :class="group.required
                        ? 'bg-red-100 text-red-600 border-red-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'"
                      class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                    >
                      {{ group.required ? 'Obrigatório' : 'Opcional' }}
                    </span>
                  </div>

                  <!-- Erro de validação do grupo -->
                  <Transition name="error-fade">
                    <p v-if="validationErrors[group.id]" class="text-xs text-red-500 font-semibold flex items-center gap-1">
                      <AlertCircle :size="12" /> {{ validationErrors[group.id] }}
                    </p>
                  </Transition>

                  <!-- Opções: Radio (type === 'radio') -->
                  <div v-if="group.type === 'radio'" class="space-y-2">
                    <label
                      v-for="option in group.options"
                      :key="option.id"
                      :class="[
                        'flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200',
                        selectedRadio[group.id] === option.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-slate-100 bg-slate-50 hover:border-orange-200 hover:bg-orange-50/40'
                      ]"
                    >
                      <input
                        type="radio"
                        :name="group.id"
                        :value="option.id"
                        v-model="selectedRadio[group.id]"
                        class="hidden"
                      />
                      <!-- Custom radio indicator -->
                      <div :class="[
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                        selectedRadio[group.id] === option.id
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-slate-300'
                      ]">
                        <div v-if="selectedRadio[group.id] === option.id" class="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <span class="text-sm font-semibold text-slate-700 flex-1">{{ option.name }}</span>
                      <span v-if="option.price > 0" class="text-xs font-bold text-orange-600">
                        +R$ {{ option.price.toFixed(2) }}
                      </span>
                    </label>
                  </div>

                  <!-- Opções: Checkbox (type === 'checkbox') -->
                  <div v-else-if="group.type === 'checkbox'" class="space-y-2">
                    <label
                      v-for="option in group.options"
                      :key="option.id"
                      :class="[
                        'flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200',
                        isCheckboxSelected(group.id, option.id)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-slate-100 bg-slate-50 hover:border-orange-200 hover:bg-orange-50/40'
                      ]"
                    >
                      <input
                        type="checkbox"
                        :value="option.id"
                        @change="toggleCheckbox(group.id, option.id)"
                        :checked="isCheckboxSelected(group.id, option.id)"
                        class="hidden"
                      />
                      <!-- Custom checkbox indicator -->
                      <div :class="[
                        'w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all',
                        isCheckboxSelected(group.id, option.id)
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-slate-300'
                      ]">
                        <Check v-if="isCheckboxSelected(group.id, option.id)" :size="12" class="text-white" />
                      </div>
                      <span class="text-sm font-semibold text-slate-700 flex-1">{{ option.name }}</span>
                      <span v-if="option.price > 0" class="text-xs font-bold text-emerald-600">
                        +R$ {{ option.price.toFixed(2) }}
                      </span>
                    </label>
                  </div>
                </div>
              </template>

              <!-- ── Seção: Remoções da Ficha Técnica ── -->
              <div v-if="removableIngredients.length > 0" class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-lg leading-none">🚫</span>
                    <h3 class="font-bold text-slate-800 text-sm">Deseja remover algum item?</h3>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200 uppercase tracking-wider">
                    Opcional
                  </span>
                </div>
                <div class="space-y-2">
                  <label
                    v-for="ingredient in removableIngredients"
                    :key="ingredient.id"
                    :class="[
                      'flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200',
                      selectedRemovals.includes(ingredient.id)
                        ? 'border-red-400 bg-red-50'
                        : 'border-slate-100 bg-slate-50 hover:border-red-200 hover:bg-red-50/40'
                    ]"
                  >
                    <input
                      type="checkbox"
                      :value="ingredient.id"
                      v-model="selectedRemovals"
                      class="hidden"
                    />
                    <div :class="[
                      'w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all',
                      selectedRemovals.includes(ingredient.id)
                        ? 'border-red-500 bg-red-500'
                        : 'border-slate-300'
                    ]">
                      <X v-if="selectedRemovals.includes(ingredient.id)" :size="12" class="text-white" />
                    </div>
                    <span :class="[
                      'text-sm font-semibold flex-1 transition-all',
                      selectedRemovals.includes(ingredient.id) ? 'text-red-500 line-through' : 'text-slate-700'
                    ]">
                      Sem {{ ingredient.name }}
                    </span>
                  </label>
                </div>
              </div>

              <!-- Espaço extra no final do scroll -->
              <div class="h-2" />
            </div>

            <!-- ── Rodapé com total e botões ── -->
            <div class="shrink-0 px-5 py-4 border-t border-slate-100 bg-white/95 backdrop-blur-sm space-y-3">
              <!-- Resumo dos adicionais -->
              <div v-if="additionalsTotal > 0" class="flex items-center justify-between text-xs px-1">
                <span class="text-slate-500 font-medium">Adicionais selecionados</span>
                <span class="font-bold text-emerald-600">+R$ {{ additionalsTotal.toFixed(2) }}</span>
              </div>

              <div class="flex gap-3">
                <button
                  @click="handleCancel"
                  class="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  @click="handleConfirm"
                  class="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag :size="18" />
                  Confirmar Item
                  <span class="bg-white/20 px-2 py-0.5 rounded-xl text-xs font-black">
                    R$ {{ totalItemPrice.toFixed(2) }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { X, Check, ShoppingBag, UtensilsCrossed, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  product: { type: Object, default: null },
  allModifierGroups: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// ── Estado interno das seleções ──
const selectedRadio = ref({})     // { groupId: optionId }
const selectedCheckboxes = ref({}) // { groupId: [optionId, ...] }
const selectedRemovals = ref([])   // [ingredientId, ...]
const validationErrors = ref({})   // { groupId: 'mensagem de erro' }

// Reset estado ao abrir o modal com um novo produto
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedRadio.value = {}
    selectedCheckboxes.value = {}
    selectedRemovals.value = []
    validationErrors.value = {}
  }
})

// ── Grupos de modificadores ativos para este produto ──
const activeModifierGroups = computed(() => {
  if (!props.product?.modifierGroupIds?.length) return []
  return props.allModifierGroups.filter(g => props.product.modifierGroupIds.includes(g.id))
})

// ── Ingredientes removíveis deste produto ──
const removableIngredients = computed(() => {
  if (!props.product?.technicalSheet?.length || !props.product?.removableItems?.length) return []
  return props.product.technicalSheet.filter(i => props.product.removableItems.includes(i.id))
})

// ── Helpers para checkbox ──
const isCheckboxSelected = (groupId, optionId) => {
  return (selectedCheckboxes.value[groupId] || []).includes(optionId)
}

const toggleCheckbox = (groupId, optionId) => {
  if (!selectedCheckboxes.value[groupId]) {
    selectedCheckboxes.value[groupId] = []
  }
  const idx = selectedCheckboxes.value[groupId].indexOf(optionId)
  if (idx === -1) {
    selectedCheckboxes.value[groupId].push(optionId)
  } else {
    selectedCheckboxes.value[groupId].splice(idx, 1)
  }
}

// ── Cálculo do total de adicionais (soma de opções com preço > 0) ──
const additionalsTotal = computed(() => {
  let total = 0
  for (const group of activeModifierGroups.value) {
    if (group.type === 'radio') {
      const optId = selectedRadio.value[group.id]
      if (optId) {
        const opt = group.options.find(o => o.id === optId)
        if (opt?.price) total += opt.price
      }
    } else if (group.type === 'checkbox') {
      const selected = selectedCheckboxes.value[group.id] || []
      for (const optId of selected) {
        const opt = group.options.find(o => o.id === optId)
        if (opt?.price) total += opt.price
      }
    }
  }
  return total
})

// ── Preço total do item com adicionais ──
const totalItemPrice = computed(() => {
  return (props.product?.price || 0) + additionalsTotal.value
})

// ── Validação dos grupos obrigatórios ──
const validate = () => {
  validationErrors.value = {}
  let valid = true
  for (const group of activeModifierGroups.value) {
    if (group.required) {
      if (group.type === 'radio' && !selectedRadio.value[group.id]) {
        validationErrors.value[group.id] = `Selecione uma opção para "${group.name}"`
        valid = false
      } else if (group.type === 'checkbox') {
        const count = (selectedCheckboxes.value[group.id] || []).length
        if (count < group.minSelections) {
          validationErrors.value[group.id] = `Selecione ao menos ${group.minSelections} opção(ões) em "${group.name}"`
          valid = false
        }
      }
    }
  }
  return valid
}

// ── Handlers ──
const handleConfirm = () => {
  if (!validate()) return

  // Montar objeto de customização para o carrinho
  const chosenModifiers = []

  for (const group of activeModifierGroups.value) {
    if (group.type === 'radio') {
      const optId = selectedRadio.value[group.id]
      if (optId) {
        const opt = group.options.find(o => o.id === optId)
        chosenModifiers.push({ groupId: group.id, groupName: group.name, optionId: opt.id, optionName: opt.name, price: opt.price })
      }
    } else if (group.type === 'checkbox') {
      const selected = selectedCheckboxes.value[group.id] || []
      for (const optId of selected) {
        const opt = group.options.find(o => o.id === optId)
        chosenModifiers.push({ groupId: group.id, groupName: group.name, optionId: opt.id, optionName: opt.name, price: opt.price })
      }
    }
  }

  const removals = removableIngredients.value.filter(i => selectedRemovals.value.includes(i.id))

  const customizedItem = {
    // id único para tratar como linha separada no carrinho
    cartItemId: `${props.product.id}-${Date.now()}`,
    product: props.product,
    quantity: 1,
    modifiers: chosenModifiers,
    removals: removals,
    extraPrice: additionalsTotal.value,
    totalPrice: totalItemPrice.value,
  }

  emit('confirm', customizedItem)
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* Animação do overlay */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Animação do painel (slide up em mobile, scale em desktop) */
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}
.modal-slide-enter-from {
  transform: translateY(60px);
  opacity: 0;
}
.modal-slide-leave-to {
  transform: translateY(60px);
  opacity: 0;
}

@media (min-width: 640px) {
  .modal-slide-enter-from {
    transform: scale(0.92) translateY(20px);
  }
  .modal-slide-leave-to {
    transform: scale(0.92) translateY(20px);
  }
}

/* Animação de erro */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Scroll customizado */
.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: #fed7aa transparent;
}
.custom-scroll::-webkit-scrollbar {
  width: 4px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background-color: #fed7aa;
  border-radius: 999px;
}
</style>
