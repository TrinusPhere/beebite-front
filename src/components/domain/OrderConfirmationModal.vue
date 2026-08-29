<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50"
      >
        <h3 class="font-black text-slate-800 text-lg flex items-center gap-2">
          <CheckCircle2 class="text-orange-500" :size="24" /> Confirmar Pedido
        </h3>
        <button
          @click="$emit('update:modelValue', false)"
          class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-200"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto space-y-6">
        <div class="text-center">
          <p class="text-slate-600 font-medium">
            Deseja realmente finalizar este pedido no valor de
          </p>
          <p class="text-3xl font-black text-emerald-500 mt-1">
            R$ {{ totalOrderPrice.toFixed(2) }}
          </p>
        </div>

        <div
          class="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3"
        >
          <div class="flex items-center gap-3 text-sm text-slate-700">
            <User :size="16" class="text-slate-400" />
            <span class="font-bold">{{
              order.customer.name || "Cliente Padrão"
            }}</span>
          </div>
          <div
            v-if="order.type === 'delivery'"
            class="flex items-center gap-3 text-sm text-slate-700"
          >
            <MapPin :size="16" class="text-slate-400" />
            <span>{{
              order.customer.address || "Endereço não informado"
            }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-700">
            <CreditCard :size="16" class="text-slate-400" />
            <span class="uppercase font-bold">{{ paymentMethodLabel }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-700">
            <Package :size="16" class="text-slate-400" />
            <span>{{ order.items.length }} itens selecionados</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="p-6 border-t border-slate-100 bg-slate-50 shrink-0 grid grid-cols-2 gap-3"
      >
        <button
          @click="$emit('update:modelValue', false)"
          class="px-4 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Revisar
        </button>
        <button
          @click="$emit('confirm')"
          class="px-4 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <Save :size="18" /> Finalizar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import {
  X,
  CheckCircle2,
  User,
  MapPin,
  CreditCard,
  Package,
  Save,
} from "lucide-vue-next";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  order: { type: Object, required: true },
  totalOrderPrice: { type: Number, required: true },
});

defineEmits(["update:modelValue", "confirm"]);

const paymentMethodLabel = computed(() => {
  const map = {
    pix: "PIX",
    credito: "Cartão de Crédito",
    debito: "Cartão de Débito",
    dinheiro: "Dinheiro",
  };
  return map[props.order.paymentMethod] || props.order.paymentMethod;
});
</script>
