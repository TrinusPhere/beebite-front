<script setup>
import { CheckCircle, CircleAlert, Info } from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import BaseModal from "@/components/BaseModal.vue";
import {
  closeNotification,
  notificationState,
  resolveConfirmation,
} from "@/services/notificationService";
</script>

<template>
  <BaseModal :show="notificationState.show" @close="closeNotification">
    <div class="flex flex-col items-center text-center">
      <div
        v-if="notificationState.type === 'success'"
        class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
      >
        <CheckCircle class="text-emerald-600" :size="36" />
      </div>
      <div
        v-else-if="notificationState.type === 'error'"
        class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4"
      >
        <CircleAlert class="text-red-600" :size="36" />
      </div>
      <div
        v-else
        class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4"
      >
        <Info class="text-blue-600" :size="36" />
      </div>

      <h3 class="text-xl font-bold text-slate-800 mb-2">
        {{ notificationState.title }}
      </h3>

      <p class="text-sm text-slate-500 mb-6">
        {{ notificationState.message }}
      </p>

      <div class="w-full flex justify-end gap-3">
        <template v-if="notificationState.confirmation">
          <BaseButton variant="secondary" @click="resolveConfirmation(false)">
            {{ notificationState.cancelLabel }}
          </BaseButton>
          <BaseButton variant="primary" @click="resolveConfirmation(true)">
            {{ notificationState.confirmLabel }}
          </BaseButton>
        </template>
        <BaseButton v-else variant="primary" @click="closeNotification">
          Fechar
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
