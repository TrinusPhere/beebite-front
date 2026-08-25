<template>
  <div class="flex items-center gap-1">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      @click="setRating(star)"
      @mouseenter="hoverRating = star"
      @mouseleave="hoverRating = 0"
      class="p-1 focus:outline-none transition-transform hover:scale-110"
    >
      <Star
        :size="size"
        :class="[
          'transition-colors',
          star <= (hoverRating || modelValue)
            ? 'fill-orange-400 text-orange-400'
            : 'fill-transparent text-slate-300',
        ]"
      />
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Star } from "lucide-vue-next";

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  size: { type: Number, default: 24 },
});

const emit = defineEmits(["update:modelValue"]);
const hoverRating = ref(0);

const setRating = (val) => {
  emit("update:modelValue", val);
};
</script>
