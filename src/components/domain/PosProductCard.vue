<template>
  <button
    @click="$emit('click', product)"
    class="text-left border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md hover:border-orange-400 transition-all duration-200 bg-white active:scale-[0.98] w-full min-h-[100px]"
  >
    <h3 class="font-bold text-slate-800 text-sm leading-tight line-clamp-2 mb-2">{{ product.name }}</h3>
    
    <div class="flex items-center justify-between w-full mt-auto">
      <span class="text-sm font-black text-orange-600">R$ {{ product.price.toFixed(2) }}</span>
      <div v-if="product.modifierGroupIds && product.modifierGroupIds.length > 0" class="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
        <SlidersHorizontal :size="12" />
      </div>
      <div v-else class="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
        <Plus :size="14" />
      </div>
    </div>
  </button>
</template>

<script setup>
import { SlidersHorizontal, Plus } from 'lucide-vue-next'

defineProps({
  product: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])
</script>
