<script setup>
import { RouterView } from "vue-router";
import GlobalMessageModal from "@/components/GlobalMessageModal.vue";
</script>

<template>
  <div class="min-h-screen bg-slate-950">
    <RouterView />
    <GlobalMessageModal />
  </div>
</template>

<style>
/* Reset básico e transições globais */
body {
  margin: 0;
  font-family: "Inter", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
