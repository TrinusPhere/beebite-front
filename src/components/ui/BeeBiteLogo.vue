<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'horizontal', // 'horizontal' | 'stacked' | 'icon'
    validator: (v) => ['horizontal', 'stacked', 'icon'].includes(v)
  },
  dark: {
    type: Boolean,
    default: false
  },
  alt: {
    type: String,
    default: 'BeeBite'
  }
})

const logoSrc = computed(() => {
  if (props.variant === 'icon') {
    return '/logo/beebite-icon.png'
  }
  if (props.variant === 'stacked') {
    return '/logo/beebite-stacked.png'
  }
  // horizontal
  return props.dark ? '/logo/beebite-horizontal-dark.png' : '/logo/beebite-horizontal.png'
})

const classes = computed(() => {
  if (props.variant === 'icon') {
    return 'h-11 w-11 object-contain'
  }
  if (props.variant === 'stacked') {
    return 'h-32 sm:h-36 w-auto object-contain'
  }
  // horizontal
  return 'h-11 sm:h-12 w-auto object-contain'
})
</script>

<template>
  <div class="inline-flex items-center justify-center select-none">
    <img 
      :src="logoSrc" 
      :alt="alt" 
      :class="classes"
      loading="eager"
    />
  </div>
</template>
