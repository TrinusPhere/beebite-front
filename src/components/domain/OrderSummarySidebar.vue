<template>
  <div
    class="w-full lg:w-80 shrink-0 space-y-6 lg:sticky lg:top-8 order-2 lg:order-1 h-[calc(100vh-8rem)] flex flex-col"
  >
    <div
      class="bg-slate-900 rounded-3xl p-6 shadow-xl text-white flex flex-col flex-1 border border-slate-800 overflow-hidden"
    >
      <!-- Cabeçalho -->
      <div class="flex items-center justify-between mb-4 shrink-0">
        <div
          class="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-widest"
        >
          <ShoppingBag :size="16" /> Resumo do Pedido
        </div>
        <span
          v-if="order.items.length"
          class="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full"
        >
          {{ order.items.length }} itens
        </span>
      </div>

      <!-- Lista de Itens (Scrollável) -->
      <div class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        <div
          v-if="order.items.length === 0"
          class="text-center py-10 text-slate-500"
        >
          <p class="text-sm">O carrinho está vazio.</p>
        </div>

        <div
          v-for="(item, index) in order.items"
          :key="index"
          class="bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:border-orange-500/50 cursor-pointer transition-colors"
          @click="$emit('edit-item', index)"
        >
          <div class="flex justify-between items-start gap-2">
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-bold text-slate-100 leading-tight flex items-center gap-1.5"
              >
                <span class="text-orange-400">{{ item.quantity }}x</span>
                <span class="truncate">{{ item.product.name }}</span>
              </p>

              <!-- Mods & Removals em texto simples menor para poupar espaço -->
              <p
                v-if="
                  item.modifiers.length ||
                  item.removals.length ||
                  item.observation
                "
                class="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-3"
              >
                <template v-if="item.modifiers.length">
                  {{ item.modifiers.map((m) => m.optionName).join(", ") }}.
                </template>
                <template v-if="item.removals.length">
                  Sem: {{ item.removals.map((r) => r.name).join(", ") }}.
                </template>
                <template v-if="item.observation">
                  Obs: {{ item.observation }}
                </template>
              </p>
            </div>

            <div class="flex flex-col items-end gap-1 shrink-0">
              <span class="text-xs font-bold text-emerald-400"
                >R$ {{ (item.totalPrice * item.quantity).toFixed(2) }}</span
              >
              <button
                @click.stop="$emit('remove-item', index)"
                class="text-slate-500 hover:text-red-400"
                title="Remover item"
              >
                <Trash2 :size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Resumo Fixo -->
      <div class="shrink-0 pt-4 mt-4 border-t border-slate-800 space-y-4">
        <div class="space-y-2">
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-400">Subtotal</span>
            <span class="font-bold">R$ {{ itemsTotalPrice.toFixed(2) }}</span>
          </div>
          <div
            v-if="order.type === 'delivery'"
            class="flex justify-between items-center text-xs"
          >
            <span class="text-slate-400">Taxa de Entrega</span>
            <span class="font-bold">R$ {{ deliveryCost.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center pt-2">
            <span
              class="text-slate-300 text-xs font-bold uppercase tracking-wider"
              >Total</span
            >
            <span class="text-xl font-black text-emerald-400">
              R$ {{ totalOrderPrice.toFixed(2) }}
            </span>
          </div>
        </div>

        <div class="space-y-2">
          <label
            class="text-[10px] text-slate-400 font-bold uppercase tracking-widest"
            >Pagamento</label
          >
          <select
            :value="order.paymentMethod"
            @input="$emit('update:paymentMethod', $event.target.value)"
            class="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-white text-xs font-medium"
          >
            <option value="pix">PIX</option>
            <option value="credito">Cartão de Crédito</option>
            <option value="debito">Cartão de Débito</option>
            <option value="dinheiro">Dinheiro</option>
          </select>
        </div>

        <div class="grid grid-cols-1 gap-2">
          <BaseButton
            variant="primary"
            class="w-full py-3"
            :loading="loading"
            @click="$emit('finish')"
          >
            <Save :size="16" /> Confirmar Pedido
          </BaseButton>
          <button
            @click="$emit('cancel')"
            class="text-xs font-bold text-slate-400 hover:text-white transition-colors py-2 text-center w-full"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ShoppingBag, Trash2, Save } from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";

defineProps({
  order: { type: Object, required: true },
  itemsTotalPrice: { type: Number, required: true },
  deliveryCost: { type: Number, required: true },
  totalOrderPrice: { type: Number, required: true },
  loading: { type: Boolean, default: false },
});

defineEmits([
  "remove-item",
  "edit-item",
  "update:paymentMethod",
  "finish",
  "cancel",
]);
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #334155;
  border-radius: 10px;
}
</style>
