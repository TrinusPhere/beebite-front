<script setup>
import { ref } from "vue";
import { Bike, MapPin, Phone, ReceiptText, User, X, Printer } from "lucide-vue-next";
import { contextLabel, normalizeOrderContext } from "@/utils/orderContext";
import PrintOrderModal from "@/components/PrintOrderModal.vue";

const props = defineProps({ show: Boolean, order: Object, loading: Boolean });
defineEmits(["close"]);

const showPrintModal = ref(false);
const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
const dateTime = (value) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 overflow-x-hidden"
    >
      <button class="absolute inset-0 bg-slate-950/50" @click="$emit('close')" />
      <section
        class="relative w-full max-w-4xl max-h-[calc(100dvh-1rem)] bg-white rounded-3xl shadow-2xl overflow-y-auto overflow-x-hidden"
      >
        <header class="sticky top-0 z-10 flex items-center justify-between gap-4 p-4 sm:p-5 bg-white border-b border-slate-200">
          <div>
            <p class="text-xs font-black uppercase tracking-wider text-orange-500">Detalhes do pedido</p>
            <h2 class="text-xl font-black text-slate-800">{{ order?.displayId || order?.id || 'Carregando...' }}</h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="order"
              type="button"
              @click="showPrintModal = true"
              class="flex items-center gap-1.5 px-3.5 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-100 transition shadow-sm border border-orange-200"
            >
              <Printer :size="15" />
              <span>Imprimir Comanda</span>
            </button>
            <button class="p-2 rounded-xl hover:bg-slate-100 text-slate-500" @click="$emit('close')">
              <X :size="22" />
            </button>
          </div>
        </header>

        <div v-if="loading" class="p-12 text-center text-slate-400">Carregando informações...</div>
        <div v-else-if="order" class="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-4">
          <div class="space-y-4">
            <article class="rounded-2xl border border-slate-200 p-4 space-y-3">
              <h3 class="font-black text-slate-800 flex items-center gap-2"><User :size="17" class="text-orange-500" /> Cliente</h3>
              <div><p class="text-xs text-slate-400">Nome</p><p class="text-sm font-bold text-slate-700">{{ order.customerName || 'Cliente avulso' }}</p></div>
              <div class="flex items-start gap-2"><Phone :size="15" class="mt-0.5 text-slate-400" /><p class="text-sm text-slate-600">{{ order.customerPhone || 'Telefone não informado' }}</p></div>
              <div class="flex items-start gap-2"><MapPin :size="15" class="mt-0.5 text-slate-400 shrink-0" /><div class="text-sm text-slate-600"><p>{{ order.customerAddress || 'Endereço não informado' }}</p><p v-if="order.customerAddressComplement">{{ order.customerAddressComplement }}</p><p v-if="order.customerAddressReference" class="text-xs text-slate-400">Referência: {{ order.customerAddressReference }}</p></div></div>
            </article>

            <article class="rounded-2xl border border-slate-200 p-4 space-y-2">
              <h3 class="font-black text-slate-800 flex items-center gap-2"><ReceiptText :size="17" class="text-orange-500" /> Informações</h3>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div><p class="text-xs text-slate-400">Operação</p><b>{{ contextLabel(normalizeOrderContext(order).operation) }}</b></div>
                <div><p class="text-xs text-slate-400">Canal</p><b>{{ contextLabel(normalizeOrderContext(order).channel) }}</b></div>
                <div><p class="text-xs text-slate-400">Atendimento</p><b>{{ contextLabel(normalizeOrderContext(order).serviceType) }}</b></div>
                <div><p class="text-xs text-slate-400">Pagamento</p><b>{{ contextLabel(order.paymentMethod) }}</b></div>
                <div><p class="text-xs text-slate-400">Criado em</p><b>{{ dateTime(order.createdAt) }}</b></div>
                <div><p class="text-xs text-slate-400">Status</p><b>{{ contextLabel(order.status) }}</b></div>
              </div>
              <div v-if="order.driverName" class="mt-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 flex items-center gap-2 text-sm font-bold">
                <Bike :size="16" /> Motoboy: {{ order.driverName }}
              </div>
            </article>
          </div>

          <div class="space-y-4">
            <article class="rounded-2xl border border-slate-200 p-4">
              <h3 class="font-black text-slate-800 mb-3">Itens do pedido</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                <div v-for="item in order.items || []" :key="item.id" class="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <div class="flex justify-between gap-3"><b class="text-sm text-slate-800">{{ item.quantity }}x {{ item.productName }}</b><b class="text-sm text-orange-600">{{ money(item.totalPrice) }}</b></div>
                  <p v-if="item.modifiers?.length" class="text-xs text-slate-500 mt-1">Adicionais: {{ item.modifiers.map((modifier) => modifier.optionName).join(', ') }}</p>
                  <p v-if="item.removals?.length" class="text-xs text-red-500 mt-1">Sem: {{ item.removals.map((removal) => removal.ingredientName).join(', ') }}</p>
                  <p v-if="item.observation" class="text-xs text-slate-500 mt-1">Observação: {{ item.observation }}</p>
                </div>
              </div>
            </article>

            <article class="rounded-2xl bg-slate-900 text-white p-4 space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-slate-400">Subtotal</span><b>{{ money(order.subtotal) }}</b></div>
              <div class="flex justify-between"><span class="text-slate-400">Entrega</span><b>{{ money(order.deliveryCost) }}</b></div>
              <div class="flex justify-between pt-2 border-t border-slate-700 text-base"><span>Total</span><b class="text-orange-400">{{ money(order.totalValue) }}</b></div>
            </article>
            <p v-if="order.notes" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><b>Observações gerais:</b> {{ order.notes }}</p>
          </div>
        </div>
      </section>
    </div>
    <PrintOrderModal
      :show="showPrintModal"
      :order="order"
      @close="showPrintModal = false"
    />
  </Teleport>
</template>
