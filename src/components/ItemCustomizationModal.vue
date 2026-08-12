<template>
  <!-- Overlay -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="handleCancel"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" @click="handleCancel" />

        <!-- Modal Panel -->
        <Transition name="modal-slide">
          <div
            v-if="modelValue"
            class="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/60"
            style="max-height: min(92vh, 680px);"
          >
            <!-- ── Header compacto ── -->
            <div class="relative shrink-0 flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
              <!-- Thumbnail -->
              <div class="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-amber-500 shrink-0">
                <img
                  v-if="product?.imageUrl"
                  :src="product.imageUrl"
                  :alt="product.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UtensilsCrossed :size="28" class="text-white/50" />
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <span class="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Personalizar</span>
                <h2 class="text-base font-black text-white leading-tight truncate">{{ product?.name }}</h2>
                <p class="text-xs text-slate-400 mt-0.5 line-clamp-1">{{ product?.description }}</p>
              </div>

              <!-- Preço base + fechar -->
              <div class="flex flex-col items-end gap-2 shrink-0">
                <button
                  @click="handleCancel"
                  class="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
                >
                  <X :size="14" />
                </button>
                <div class="text-right">
                  <p class="text-[10px] text-slate-400">Base</p>
                  <p class="text-sm font-black text-white">R$ {{ (product?.price || 0).toFixed(2) }}</p>
                </div>
              </div>
            </div>

            <!-- ── Corpo: duas colunas (esq: opções / dir: remoções + obs) ── -->
            <div class="flex flex-1 min-h-0 overflow-hidden">

              <!-- Coluna esquerda: modificadores + quantidade -->
              <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scroll border-r border-slate-100">

                <!-- Quantidade -->
                <div class="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200">
                  <div class="flex items-center gap-2">
                    <Hash :size="15" class="text-orange-500" />
                    <span class="text-sm font-bold text-slate-700">Quantidade</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <button
                      @click="decreaseQty"
                      class="w-8 h-8 rounded-xl bg-white border-2 border-slate-200 hover:border-orange-400 hover:text-orange-600 flex items-center justify-center text-slate-500 font-bold transition-all active:scale-95"
                    >
                      <Minus :size="14" />
                    </button>
                    <span class="text-lg font-black text-slate-800 w-6 text-center">{{ quantity }}</span>
                    <button
                      @click="increaseQty"
                      class="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white font-bold transition-all active:scale-95 shadow-sm"
                    >
                      <Plus :size="14" />
                    </button>
                  </div>
                </div>

                <!-- Grupos de Modificadores -->
                <template v-for="group in activeModifierGroups" :key="group.id">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1.5">
                        <span class="text-base leading-none">{{ group.icon }}</span>
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

                    <!-- Erro de validação -->
                    <Transition name="error-fade">
                      <p v-if="validationErrors[group.id]" class="text-xs text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle :size="12" /> {{ validationErrors[group.id] }}
                      </p>
                    </Transition>

                    <!-- Radio -->
                    <div v-if="group.type === 'radio'" class="grid grid-cols-1 gap-1.5">
                      <label
                        v-for="option in group.options"
                        :key="option.id"
                        :class="[
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all',
                          selectedRadio[group.id] === option.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-slate-100 bg-slate-50 hover:border-orange-200 hover:bg-orange-50/40'
                        ]"
                      >
                        <input type="radio" :name="group.id" :value="option.id" v-model="selectedRadio[group.id]" class="hidden" />
                        <div :class="[
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                          selectedRadio[group.id] === option.id ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                        ]">
                          <div v-if="selectedRadio[group.id] === option.id" class="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                        <span class="text-sm font-semibold text-slate-700 flex-1">{{ option.name }}</span>
                        <span v-if="option.price > 0" class="text-xs font-bold text-orange-600">+R$ {{ option.price.toFixed(2) }}</span>
                      </label>
                    </div>

                    <!-- Checkbox -->
                    <div v-else-if="group.type === 'checkbox'" class="grid grid-cols-1 gap-1.5">
                      <label
                        v-for="option in group.options"
                        :key="option.id"
                        :class="[
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all',
                          isCheckboxSelected(group.id, option.id)
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-slate-100 bg-slate-50 hover:border-orange-200 hover:bg-orange-50/40'
                        ]"
                      >
                        <input type="checkbox" :value="option.id" @change="toggleCheckbox(group.id, option.id)" :checked="isCheckboxSelected(group.id, option.id)" class="hidden" />
                        <div :class="[
                          'w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                          isCheckboxSelected(group.id, option.id) ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                        ]">
                          <Check v-if="isCheckboxSelected(group.id, option.id)" :size="10" class="text-white" />
                        </div>
                        <span class="text-sm font-semibold text-slate-700 flex-1">{{ option.name }}</span>
                        <span v-if="option.price > 0" class="text-xs font-bold text-emerald-600">+R$ {{ option.price.toFixed(2) }}</span>
                      </label>
                    </div>
                  </div>
                </template>

                <!-- Placeholder quando não há modificadores -->
                <div v-if="activeModifierGroups.length === 0" class="text-center py-4 text-slate-400">
                  <UtensilsCrossed :size="28" class="mx-auto mb-2 opacity-30" />
                  <p class="text-xs font-medium">Nenhuma opção disponível</p>
                </div>
              </div>

              <!-- Coluna direita: remoções + observação -->
              <div class="w-52 shrink-0 overflow-y-auto px-4 py-4 space-y-5 custom-scroll bg-slate-50/60">

                <!-- Remoções -->
                <div v-if="removableIngredients.length > 0" class="space-y-2">
                  <div class="flex items-center gap-1.5">
                    <span class="text-base leading-none">🚫</span>
                    <h3 class="font-bold text-slate-700 text-sm">Remover</h3>
                  </div>
                  <div class="space-y-1.5">
                    <label
                      v-for="ingredient in removableIngredients"
                      :key="ingredient.id"
                      :class="[
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 cursor-pointer transition-all text-xs',
                        selectedRemovals.includes(ingredient.id)
                          ? 'border-red-400 bg-red-50'
                          : 'border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/40'
                      ]"
                    >
                      <input type="checkbox" :value="ingredient.id" v-model="selectedRemovals" class="hidden" />
                      <div :class="[
                        'w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0',
                        selectedRemovals.includes(ingredient.id) ? 'border-red-500 bg-red-500' : 'border-slate-300'
                      ]">
                        <X v-if="selectedRemovals.includes(ingredient.id)" :size="9" class="text-white" />
                      </div>
                      <span :class="[
                        'font-semibold flex-1 transition-all',
                        selectedRemovals.includes(ingredient.id) ? 'text-red-500 line-through' : 'text-slate-600'
                      ]">
                        Sem {{ ingredient.name }}
                      </span>
                    </label>
                  </div>
                </div>

                <!-- Observação -->
                <div class="space-y-2">
                  <div class="flex items-center gap-1.5">
                    <span class="text-base leading-none">📝</span>
                    <h3 class="font-bold text-slate-700 text-sm">Observação</h3>
                  </div>
                  <textarea
                    v-model="observation"
                    placeholder="Ex: capricha no molho..."
                    rows="4"
                    class="w-full text-xs bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all resize-none text-slate-600 placeholder:text-slate-400"
                  />
                </div>

                <!-- Mini resumo das seleções -->
                <div v-if="additionalsTotal > 0 || selectedRemovals.length > 0" class="bg-white rounded-xl border border-slate-200 p-3 space-y-1.5">
                  <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resumo</p>
                  <div v-if="additionalsTotal > 0" class="flex justify-between text-xs">
                    <span class="text-slate-500">Adicionais</span>
                    <span class="font-bold text-emerald-600">+R$ {{ additionalsTotal.toFixed(2) }}</span>
                  </div>
                  <div v-if="selectedRemovals.length > 0" class="flex justify-between text-xs">
                    <span class="text-slate-500">Removidos</span>
                    <span class="font-bold text-red-500">{{ selectedRemovals.length }} item(s)</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── Rodapé com total e botões ── -->
            <div class="shrink-0 px-5 py-4 border-t border-slate-100 bg-white flex items-center gap-3">
              <!-- Subtotal visível -->
              <div class="flex-1">
                <p class="text-[10px] text-slate-400 font-medium">Total do item</p>
                <p class="text-lg font-black text-slate-800">
                  R$ {{ (totalItemPrice * quantity).toFixed(2) }}
                  <span v-if="quantity > 1" class="text-xs font-medium text-slate-400">
                    ({{ quantity }}x R$ {{ totalItemPrice.toFixed(2) }})
                  </span>
                </p>
              </div>

              <button
                @click="handleCancel"
                class="px-5 py-3 rounded-2xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                @click="handleConfirm"
                class="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <ShoppingBag :size="16" />
                Adicionar {{ quantity > 1 ? quantity + 'x' : '' }} ao Pedido
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { X, Check, ShoppingBag, UtensilsCrossed, AlertCircle, Plus, Minus, Hash } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  product: { type: Object, default: null },
  allModifierGroups: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// ── Estado interno das seleções ──
const selectedRadio = ref({})
const selectedCheckboxes = ref({})
const selectedRemovals = ref([])
const validationErrors = ref({})
const quantity = ref(1)
const observation = ref('')

// Reset estado ao abrir o modal com um novo produto
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedRadio.value = {}
    selectedCheckboxes.value = {}
    selectedRemovals.value = []
    validationErrors.value = {}
    quantity.value = 1
    observation.value = ''
  }
})

// ── Controle de quantidade ──
const increaseQty = () => { quantity.value++ }
const decreaseQty = () => { if (quantity.value > 1) quantity.value-- }

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

// ── Cálculo do total de adicionais ──
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

// ── Preço total do item com adicionais (unitário) ──
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
    cartItemId: `${props.product.id}-${Date.now()}`,
    product: props.product,
    quantity: quantity.value,        // ← quantidade selecionada
    modifiers: chosenModifiers,
    removals: removals,
    observation: observation.value,
    extraPrice: additionalsTotal.value,
    totalPrice: totalItemPrice.value, // preço unitário
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

/* Animação do painel */
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
    transform: scale(0.94) translateY(16px);
  }
  .modal-slide-leave-to {
    transform: scale(0.94) translateY(16px);
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
