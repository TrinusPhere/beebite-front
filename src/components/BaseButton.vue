<script setup>
defineProps({
  variant: {
    type: String,
    default: "primary",
  },
  size: {
    type: String,
    default: "md",
  },
  loading: Boolean,
});
</script>

<template>
  <button
    class="group relative inline-flex items-center justify-center font-bold tracking-wide transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none overflow-hidden rounded-2xl"
    :class="[
      size === 'sm' ? 'px-4 py-2 text-xs' : '',
      size === 'md' ? 'px-6 py-3.5 text-sm' : '',
      size === 'lg' ? 'px-8 py-4 text-base' : '',

      variant === 'primary'
        ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)] hover:shadow-[0_12px_25px_-4px_rgba(249,115,22,0.6)] hover:-translate-y-0.5'
        : '',
      variant === 'secondary'
        ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
        : '',
      variant === 'danger'
        ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'
        : '',
      variant === 'ghost'
        ? 'text-slate-400 hover:text-white hover:bg-white/5'
        : '',
    ]"
  >
    <!-- Brilho interno no hover -->
    <div
      class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
    ></div>

    <span class="relative z-10 flex items-center gap-2">
      <slot v-if="!loading"></slot>
      <span v-else class="flex items-center gap-2">
        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
            fill="none"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Processando...
      </span>
    </span>
  </button>
</template>
