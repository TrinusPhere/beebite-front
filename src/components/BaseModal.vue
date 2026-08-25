<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
    @click.self="close"
  >
    <div class="bg-white p-6 rounded-3xl shadow-xl w-full" :class="maxWidth">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  maxWidth: {
    type: String,
    default: "max-w-md",
  },
});

const emit = defineEmits(["close"]);

const close = () => {
  emit("close");
};
</script>
