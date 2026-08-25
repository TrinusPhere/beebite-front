<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  ShoppingCart,
  Plus,
  Minus,
  MapPin,
  Bike,
  Store,
  CheckCircle2,
  X,
} from "lucide-vue-next";
import { digitalMenuService } from "@/services/digitalMenuService";
const route = useRoute();
const loading = ref(true);
const menu = ref({ store: { name: "BiteFlow", isOpen: true }, products: [] });
const category = ref("Todos");
const cart = ref([]);
const drawer = ref(false);
const checkout = ref(false);
const success = ref(null);
const submitting = ref(false);
const customer = ref({
  name: "",
  phone: "",
  serviceType: "DELIVERY",
  address: "",
  complement: "",
  reference: "",
  paymentMethod: "PIX",
  cashChangeFor: null,
  notes: "",
});
onMounted(async () => {
  menu.value = await digitalMenuService.getMenu(route.params.storeName);
  loading.value = false;
});
const categories = computed(() => [
  "Todos",
  ...new Set(menu.value.products.map((p) => p.category || "Outros")),
]);
const products = computed(() =>
  category.value === "Todos"
    ? menu.value.products
    : menu.value.products.filter(
        (p) => (p.category || "Outros") === category.value,
      ),
);
const total = computed(() =>
  cart.value.reduce((a, i) => a + Number(i.product.price || 0) * i.quantity, 0),
);
const count = computed(() => cart.value.reduce((a, i) => a + i.quantity, 0));
const add = (p) => {
  const x = cart.value.find((i) => i.product.id === p.id);
  x ? x.quantity++ : cart.value.push({ product: p, quantity: 1 });
};
const dec = (p) => {
  const x = cart.value.find((i) => i.product.id === p.id);
  if (!x) return;
  x.quantity--;
  if (x.quantity <= 0) cart.value = cart.value.filter((i) => i !== x);
};
const finish = async () => {
  if (!customer.value.name || !customer.value.phone || !cart.value.length)
    return alert("Informe nome, telefone e adicione itens.");
  if (customer.value.serviceType === "DELIVERY" && !customer.value.address)
    return alert("Informe o endereço para entrega.");
  submitting.value = true;
  try {
    const payload = {
      customerName: customer.value.name,
      customerPhone: customer.value.phone,
      serviceType: customer.value.serviceType,
      operation: "DELIVERY",
      channel: "CARDAPIO_PROPRIO",
      source: "WEB",
      deliveryAddress:
        customer.value.serviceType === "DELIVERY"
          ? {
              address: customer.value.address,
              complement: customer.value.complement,
              reference: customer.value.reference,
            }
          : null,
      paymentMethod: customer.value.paymentMethod,
      cashChangeFor: customer.value.cashChangeFor,
      notes: customer.value.notes,
      total: total.value,
      items: cart.value.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        unitPrice: i.product.price,
        name: i.product.name,
      })),
    };
    success.value = await digitalMenuService.createOrder(
      route.params.storeName,
      payload,
    );
    cart.value = [];
    checkout.value = false;
    drawer.value = false;
  } catch (e) {
    alert("Não foi possível enviar o pedido.");
  } finally {
    submitting.value = false;
  }
};
const money = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );
</script>
<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-slate-900 text-white">
      <div class="max-w-6xl mx-auto p-6 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-black">{{ menu.store.name }}</h1>
          <p class="text-sm text-slate-300">
            {{ menu.store.openingHours || "Cardápio digital" }}
          </p>
        </div>
        <span
          :class="[
            'px-3 py-1 rounded-full text-xs font-black',
            menu.store.isOpen !== false ? 'bg-emerald-500' : 'bg-red-500',
          ]"
          >{{ menu.store.isOpen !== false ? "ABERTO" : "FECHADO" }}</span
        >
      </div>
    </header>
    <main class="max-w-6xl mx-auto p-5 pb-28">
      <div
        v-if="success"
        class="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-3"
      >
        <CheckCircle2 class="text-emerald-600" />
        <div>
          <b>Pedido recebido!</b>
          <p class="text-sm">
            Número: {{ success.id || success.orderNumber }}. Acompanhe o contato
            da loja para atualizações.
          </p>
        </div>
      </div>
      <div class="flex gap-2 overflow-auto mb-6">
        <button
          v-for="c in categories"
          :key="c"
          @click="category = c"
          :class="[
            'px-4 py-2 rounded-full whitespace-nowrap font-bold text-sm',
            category === c ? 'bg-orange-500 text-white' : 'bg-white border',
          ]"
        >
          {{ c }}
        </button>
      </div>
      <div v-if="loading" class="text-center py-20 text-slate-400">
        Carregando cardápio...
      </div>
      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <article
          v-for="p in products"
          :key="p.id"
          class="bg-white border rounded-3xl overflow-hidden shadow-sm"
        >
          <img :src="p.imageUrl" class="w-full h-44 object-cover" />
          <div class="p-5">
            <h3 class="font-black text-slate-800">{{ p.name }}</h3>
            <p class="text-sm text-slate-500 min-h-10 mt-1">
              {{ p.description || "Produto disponível no cardápio." }}
            </p>
            <div class="mt-4 flex justify-between items-center">
              <b class="text-orange-600">{{ money(p.price) }}</b
              ><button
                @click="add(p)"
                class="bg-orange-500 text-white p-2 rounded-xl"
              >
                <Plus :size="19" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </main>
    <button
      @click="drawer = true"
      class="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-xl flex gap-3 font-bold"
    >
      <ShoppingCart /> {{ count }} item(ns) • {{ money(total) }}
    </button>
    <div
      v-if="drawer"
      class="fixed inset-0 bg-black/40 z-40 flex justify-end"
      @click.self="drawer = false"
    >
      <aside class="w-full max-w-md h-full bg-white p-5 overflow-y-auto">
        <div class="flex justify-between mb-5">
          <h2 class="text-xl font-black">Seu pedido</h2>
          <button @click="drawer = false"><X /></button>
        </div>
        <div
          v-for="i in cart"
          :key="i.product.id"
          class="py-4 border-b flex justify-between gap-3"
        >
          <div>
            <b>{{ i.product.name }}</b>
            <p class="text-sm text-slate-500">{{ money(i.product.price) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button @click="dec(i.product)" class="p-1 border rounded-lg">
              <Minus :size="16" /></button
            ><b>{{ i.quantity }}</b
            ><button @click="add(i.product)" class="p-1 border rounded-lg">
              <Plus :size="16" />
            </button>
          </div>
        </div>
        <div class="flex justify-between text-lg font-black py-5">
          <span>Total</span><span>{{ money(total) }}</span>
        </div>
        <button
          :disabled="!cart.length"
          @click="checkout = true"
          class="w-full bg-orange-500 text-white py-3 rounded-xl font-black disabled:opacity-40"
        >
          Continuar
        </button>
        <section v-if="checkout" class="mt-6 space-y-3 border-t pt-5">
          <h3 class="font-black">Dados do pedido</h3>
          <input
            v-model="customer.name"
            class="w-full border p-3 rounded-xl"
            placeholder="Nome"
          /><input
            v-model="customer.phone"
            class="w-full border p-3 rounded-xl"
            placeholder="Telefone"
          />
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="customer.serviceType = 'DELIVERY'"
              :class="[
                'p-3 rounded-xl border flex gap-2 justify-center',
                customer.serviceType === 'DELIVERY'
                  ? 'border-orange-500 bg-orange-50'
                  : '',
              ]"
            >
              <Bike :size="18" />Entrega</button
            ><button
              @click="customer.serviceType = 'PICKUP'"
              :class="[
                'p-3 rounded-xl border flex gap-2 justify-center',
                customer.serviceType === 'PICKUP'
                  ? 'border-orange-500 bg-orange-50'
                  : '',
              ]"
            >
              <Store :size="18" />Retirada
            </button>
          </div>
          <template v-if="customer.serviceType === 'DELIVERY'"
            ><input
              v-model="customer.address"
              class="w-full border p-3 rounded-xl"
              placeholder="Endereço" /><input
              v-model="customer.complement"
              class="w-full border p-3 rounded-xl"
              placeholder="Complemento" /><input
              v-model="customer.reference"
              class="w-full border p-3 rounded-xl"
              placeholder="Referência" /></template
          ><select
            v-model="customer.paymentMethod"
            class="w-full border p-3 rounded-xl"
          >
            <option>PIX</option>
            <option>CREDIT_CARD</option>
            <option>DEBIT_CARD</option>
            <option>CASH</option></select
          ><input
            v-if="customer.paymentMethod === 'CASH'"
            v-model.number="customer.cashChangeFor"
            type="number"
            class="w-full border p-3 rounded-xl"
            placeholder="Troco para"
          /><textarea
            v-model="customer.notes"
            class="w-full border p-3 rounded-xl"
            placeholder="Observações"
          ></textarea
          ><button
            @click="finish"
            :disabled="submitting"
            class="w-full bg-slate-900 text-white py-3 rounded-xl font-black"
          >
            {{ submitting ? "Enviando..." : "Confirmar pedido" }}
          </button>
        </section>
      </aside>
    </div>
  </div>
</template>
