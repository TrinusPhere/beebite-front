<template>
  <div
    class="max-w-[1600px] mx-auto space-y-4 pb-10 h-[calc(100vh-6rem)] flex flex-col"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0"
    >
      <div class="flex items-center gap-4">
        <button
          @click="router.push('/pedidos')"
          class="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors"
        >
          <ChevronLeft :size="20" />
        </button>
        <div>
          <h1
            class="text-xl font-black text-slate-800 tracking-tight leading-none"
          >
            {{ isEditMode ? "Editar Pedido" : "Novo Pedido" }}
          </h1>
          <p class="text-slate-500 text-xs font-medium mt-1">
            {{
              isEditMode
                ? `Editando pedido ${editOrderId}`
                : "Selecione os produtos e adicione ao carrinho"
            }}
          </p>
        </div>
      </div>

      <!-- Contexto operacional do pedido -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-[520px]">
        <select
          v-model="order.operation"
          @change="onOperationChange"
          class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
        >
          <option
            v-for="item in OPERATION_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </option>
        </select>
        <select
          v-model="order.channel"
          @change="onChannelChange"
          class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
        >
          <option
            v-for="item in CHANNEL_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </option>
        </select>
        <select
          v-model="order.serviceType"
          class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
        >
          <option
            v-for="item in serviceOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
      <!-- Área Principal (Cardápio e Cliente) -->
      <div
        class="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto pr-2 custom-scrollbar"
      >
        <!-- Info do Cliente -->
        <div
          class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 shrink-0"
        >
          <div class="flex items-center gap-2 mb-3">
            <User :size="16" class="text-orange-500" />
            <h2
              class="text-xs font-bold text-slate-700 uppercase tracking-widest"
            >
              Dados do Cliente
            </h2>
            <span
              v-if="order.customer.id"
              class="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider"
              >Cadastrado</span
            >
            <span
              v-else
              class="ml-auto text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider"
              >Avulso</span
            >
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="relative">
              <input
                type="text"
                v-model="customerSearchQuery"
                @input="onCustomerSearch"
                @focus="showCustomerDropdown = true"
                placeholder="Buscar ou digitar nome do cliente..."
                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all mb-3"
              />
              <input
                type="text"
                v-model="order.customer.phone"
                placeholder="Telefone (Opcional)"
                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              <!-- Dropdown de sugestões -->
              <div
                v-if="showCustomerDropdown && customerSuggestions.length > 0"
                class="absolute z-20 top-12 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
              >
                <button
                  v-for="c in customerSuggestions"
                  :key="c.id"
                  @mousedown.prevent="selectCustomer(c)"
                  class="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
                >
                  <div
                    class="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-black text-xs shrink-0"
                  >
                    {{ c.name.charAt(0) }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-slate-700 truncate">
                      {{ c.name }}
                    </p>
                    <p class="text-[10px] text-slate-400 truncate">
                      {{ c.phone || "" }} · {{ c.address || "Sem endereço" }}
                    </p>
                  </div>
                </button>
              </div>
              <!-- Limpar seleção -->
              <button
                v-if="order.customer.id"
                @click="clearCustomerSelection"
                class="absolute right-3 top-[1.3rem] -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X :size="14" />
              </button>
            </div>
            <div v-if="order.serviceType === SERVICE_TYPES.ENTREGA" class="space-y-3">
              <input
                type="text"
                v-model="order.customer.address"
                placeholder="Endereço Completo"
                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              <div class="flex gap-3">
                <input
                  type="text"
                  v-model="order.customer.complement"
                  placeholder="Complemento"
                  class="w-1/2 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
                <input
                  type="text"
                  v-model="order.customer.reference"
                  placeholder="Referência"
                  class="w-1/2 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>
            <div v-else class="space-y-3">
              <!-- Espaço reservado para manter alinhamento se não for entrega -->
            </div>
            
            <div class="col-span-1 md:col-span-2 flex gap-4 mt-2">
              <input
                type="text"
                v-model="order.notes"
                placeholder="Observações do pedido (Opcional)"
                class="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              <input
                type="number"
                v-if="order.paymentMethod === 'dinheiro'"
                v-model="order.cashChangeFor"
                placeholder="Troco para (R$)"
                step="0.01"
                class="w-40 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>

        <!-- Categorias e Produtos -->
        <div
          class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0"
        >
          <!-- Abas de Categorias (Scroll Horizontal) -->
          <div
            class="flex items-center gap-2 overflow-x-auto pb-2 mb-4 shrink-0 hide-scrollbar border-b border-slate-100"
          >
            <button
              @click="selectedCategory = null"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border',
                selectedCategory === null
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:bg-orange-50',
              ]"
            >
              Todos os Itens
            </button>
            <button
              v-for="cat in productCategories"
              :key="cat"
              @click="selectedCategory = cat"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border',
                selectedCategory === cat
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:bg-orange-50',
              ]"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Grid de Produtos -->
          <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div
              class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
            >
              <PosProductCard
                v-for="product in filteredProducts"
                :key="product.id"
                :product="product"
                @click="openCustomizationModal(product)"
              />
            </div>
            <div
              v-if="filteredProducts.length === 0"
              class="text-center py-12 text-slate-400 flex flex-col items-center"
            >
              <PackageX :size="48" class="mb-3 opacity-20" />
              <p class="text-sm font-medium">
                Nenhum produto encontrado nesta categoria.
              </p>
            </div>
          </div>
        </div>
      </div>

      <OrderSummarySidebar
        :order="sidebarOrder"
        :itemsTotalPrice="itemsTotalPrice"
        :deliveryCost="deliveryCost"
        :totalOrderPrice="totalOrderPrice"
        :loading="loading"
        @remove-item="removeItemFromOrder"
        @edit-item="editItemFromOrder"
        @update:paymentMethod="order.paymentMethod = $event"
        @finish="requestOrderConfirmation"
        @cancel="cancelOrder"
      />
    </div>

    <!-- Modais -->
    <ItemCustomizationModal
      v-model="showCustomizationModal"
      :product="selectedProductForModal"
      :initial-item="itemToEdit"
      :all-modifier-groups="allModifierGroups"
      @confirm="onModalConfirm"
      @cancel="
        showCustomizationModal = false;
        editItemIndex = -1;
        itemToEdit = null;
      "
    />

    <OrderConfirmationModal
      v-model="showConfirmationModal"
      :order="sidebarOrder"
      :totalOrderPrice="totalOrderPrice"
      @confirm="placeOrder"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ChevronLeft, User, PackageX, X } from "lucide-vue-next";
import PosProductCard from "@/components/domain/PosProductCard.vue";
import OrderSummarySidebar from "@/components/domain/OrderSummarySidebar.vue";
import OrderConfirmationModal from "@/components/domain/OrderConfirmationModal.vue";
import ItemCustomizationModal from "@/components/ItemCustomizationModal.vue";
import { orderService } from "@/services/orderService";
import { productService } from "@/services/productService";
import { modifierGroupService } from "@/services/modifierGroupService";
import { customerService } from "@/services/customerService";
import { confirmAction, notify } from "@/services/notificationService";
import {
  OPERATIONS,
  CHANNELS,
  SERVICE_TYPES,
  OPERATION_OPTIONS,
  CHANNEL_OPTIONS,
  SERVICE_OPTIONS_BY_OPERATION,
  inferLegacyType,
  inferSource,
  normalizeOrderContext,
} from "@/utils/orderContext";

const router = useRouter();
const route = useRoute();
const loading = ref(false);

// ── Modo edição ──
const isEditMode = computed(() => !!route.params.id);
const editOrderId = computed(() => route.params.id || null);

// Referência ao pedido original (para atualizar)
let originalOrderRef = null;
let originalColRef = null;
const originalTotal = ref(0); // total do pedido original em modo edição
const originalItemsText = ref(""); // descrição dos itens originais

// ── Estado do pedido ──
const order = ref({
  type: "balcao", // legado para compatibilidade com o backend atual
  operation: OPERATIONS.SALAO,
  channel: CHANNELS.PDV,
  serviceType: SERVICE_TYPES.CONSUMO_LOCAL,
  source: "PDV_CAIXA",
  customer: { id: null, name: "", address: "", phone: "", complement: "", reference: "" },
  items: [],
  paymentMethod: "pix",
  notes: "",
  cashChangeFor: null,
});

const serviceOptions = computed(
  () => SERVICE_OPTIONS_BY_OPERATION[order.value.operation] || [],
);

const syncLegacyType = () => {
  order.value.type = inferLegacyType(order.value).toLowerCase();
  order.value.source = inferSource(order.value.channel);
};

const onOperationChange = () => {
  const options = SERVICE_OPTIONS_BY_OPERATION[order.value.operation] || [];
  if (!options.some((item) => item.value === order.value.serviceType)) {
    order.value.serviceType = options[0]?.value || SERVICE_TYPES.CONSUMO_LOCAL;
  }
  if (
    order.value.operation === OPERATIONS.SALAO &&
    [CHANNELS.IFOOD, CHANNELS.RAPPI].includes(order.value.channel)
  ) {
    order.value.channel = CHANNELS.PDV;
  }
  syncLegacyType();
};

const onChannelChange = () => {
  if (
    [
      CHANNELS.IFOOD,
      CHANNELS.RAPPI,
      CHANNELS.CARDAPIO_PROPRIO,
      CHANNELS.WHATSAPP,
    ].includes(order.value.channel)
  ) {
    order.value.operation = OPERATIONS.DELIVERY;
    if (
      ![SERVICE_TYPES.ENTREGA, SERVICE_TYPES.RETIRADA].includes(
        order.value.serviceType,
      )
    ) {
      order.value.serviceType = SERVICE_TYPES.ENTREGA;
    }
  }
  syncLegacyType();
};

watch(() => order.value.serviceType, syncLegacyType);

// ── Autocomplete de Cliente ──
const customerSearchQuery = ref("");
const customerSuggestions = ref([]);
const showCustomerDropdown = ref(false);
let customerSearchTimeout = null;

const onCustomerSearch = () => {
  order.value.customer.id = null; // Limpa vínculo ao digitar
  order.value.customer.name = customerSearchQuery.value;
  clearTimeout(customerSearchTimeout);
  if (customerSearchQuery.value.length < 2) {
    customerSuggestions.value = [];
    return;
  }
  customerSearchTimeout = setTimeout(async () => {
    try {
      customerSuggestions.value = await customerService.getAll(
        customerSearchQuery.value,
      );
    } catch (e) {
      console.error("Erro ao buscar clientes:", e);
      customerSuggestions.value = [];
    }
  }, 300);
};

const selectCustomer = (customer) => {
  order.value.customer.id = customer.id;
  order.value.customer.name = customer.name;
  order.value.customer.address = customer.address || "";
  order.value.customer.phone = customer.phone || "";
  order.value.customer.complement = customer.complement || "";
  order.value.customer.reference = customer.reference || "";
  customerSearchQuery.value = customer.name;
  showCustomerDropdown.value = false;
  customerSuggestions.value = [];
};

const clearCustomerSelection = () => {
  order.value.customer.id = null;
  order.value.customer.name = "";
  order.value.customer.address = "";
  order.value.customer.phone = "";
  order.value.customer.complement = "";
  order.value.customer.reference = "";
  customerSearchQuery.value = "";
  customerSuggestions.value = [];
};

// ── Carregar dados ──
onMounted(async () => {
  await loadCatalog();

  if (isEditMode.value) {
    try {
      const found = await orderService.getById(editOrderId.value);
      if (found) {
        originalOrderRef = found;
        const context = normalizeOrderContext(found);
        order.value.operation = context.operation;
        order.value.channel = context.channel;
        order.value.serviceType = context.serviceType;
        order.value.source = context.source;
        order.value.type = inferLegacyType(context).toLowerCase();
        order.value.paymentMethod = found.paymentMethod?.toLowerCase() || "pix";
        order.value.customer.id = found.customerId || null;
        order.value.customer.name = found.customerName || "";
        order.value.customer.address = found.customerAddress || "";
        order.value.customer.phone = found.customerPhone || "";
        order.value.customer.complement = found.customerAddressComplement || "";
        order.value.customer.reference = found.customerAddressReference || "";
        order.value.notes = found.notes || "";
        order.value.cashChangeFor = found.cashChangeFor || null;
        customerSearchQuery.value = found.customerName || "";

        originalTotal.value = found.totalValue || 0;
        originalItemsText.value = found.items
          .map((item) => `${item.quantity}x ${item.productName}`)
          .join(", ");
      }
    } catch (error) {
      console.error("Erro ao carregar pedido:", error);
      notify({ type: "error", message: "Erro ao carregar pedido." });
      router.push("/pedidos");
    }
  }
});

// ── Order para o Sidebar: em modo edição, sempre inclui os itens originais como primeiro item virtual ──
const originalSubtotal = computed(() => {
  if (!isEditMode.value || originalTotal.value === 0) return 0;
  // subtotal original = total original menos taxa de entrega (se o tipo original era delivery)
  const origDelivery =
    normalizeOrderContext(originalOrderRef || {}).operation ===
    OPERATIONS.DELIVERY
      ? 10
      : 0;
  return Math.max(0, originalTotal.value - origDelivery);
});

const sidebarOrder = computed(() => {
  if (isEditMode.value && originalItemsText.value) {
    const virtualItem = {
      product: { name: originalItemsText.value },
      quantity: 1,
      totalPrice: originalSubtotal.value,
      modifiers: [],
      removals: [],
      observation: "",
    };
    return {
      ...order.value,
      items: [virtualItem, ...order.value.items],
    };
  }
  return order.value;
});

// ── Cardápio e filtros ──
const availableProducts = ref([]);
const allModifierGroups = ref([]);
const selectedCategory = ref(null);
const loadingProducts = ref(true);

const loadCatalog = async () => {
  loadingProducts.value = true;
  try {
    const [productsResponse, modGroups] = await Promise.all([
      productService.getAll(),
      modifierGroupService.getAll(),
    ]);
    availableProducts.value = productsResponse.content || [];
    allModifierGroups.value = modGroups;
  } catch (error) {
    console.error("Erro ao carregar catálogo:", error);
    notify({
      type: "error",
      message: "Erro ao carregar produtos. Verifique se o backend está rodando.",
    });
  } finally {
    loadingProducts.value = false;
  }
};

const productCategories = computed(() => {
  return [
    ...new Set(
      availableProducts.value.map((p) => p.categoryName).filter(Boolean),
    ),
  ];
});

const filteredProducts = computed(() => {
  if (!selectedCategory.value) return availableProducts.value;
  return availableProducts.value.filter(
    (p) => p.categoryName === selectedCategory.value,
  );
});

const showCustomizationModal = ref(false);
const selectedProductForModal = ref(null);
const itemToEdit = ref(null);
const editItemIndex = ref(-1);

const productAllowsCustomization = (product) =>
  Boolean(
    product?.modifierGroupIds?.length ||
      product?.modifierGroups?.length ||
      product?.removableItems?.length,
  );

const addProductWithoutCustomization = (product) => {
  order.value.items.push({
    cartItemId: `${product.id}-${Date.now()}`,
    product,
    quantity: 1,
    modifiers: [],
    removals: [],
    observation: "",
    extraPrice: 0,
    totalPrice: product.price || 0,
  });
};

const openCustomizationModal = (product) => {
  editItemIndex.value = -1;
  itemToEdit.value = null;

  if (!productAllowsCustomization(product)) {
    addProductWithoutCustomization(product);
    return;
  }

  selectedProductForModal.value = product;
  showCustomizationModal.value = true;
};

const editItemFromOrder = (index) => {
  if (isEditMode.value && originalItemsText.value) {
    if (index === 0) return; // Não pode editar os itens originais do resumo
    editItemIndex.value = index - 1;
  } else {
    editItemIndex.value = index;
  }
  const item = order.value.items[editItemIndex.value];
  itemToEdit.value = item;
  selectedProductForModal.value = item.product;
  showCustomizationModal.value = true;
};

const normalizeCustomizedItems = (customizedItem) =>
  Array.isArray(customizedItem) ? customizedItem : [customizedItem];

const onModalConfirm = (customizedItem) => {
  const customizedItems = normalizeCustomizedItems(customizedItem).map(
    (item) => ({
      ...item,
      observation: item.observation || "",
    }),
  );

  if (editItemIndex.value !== -1) {
    order.value.items.splice(editItemIndex.value, 1, ...customizedItems);
    editItemIndex.value = -1;
    itemToEdit.value = null;
  } else {
    order.value.items.push(...customizedItems);
  }
};

const removeItemFromOrder = (index) => {
  if (isEditMode.value && originalItemsText.value) {
    // O índice 0 é o item virtual dos itens originais — não pode ser removido aqui
    if (index === 0) return;
    order.value.items.splice(index - 1, 1);
  } else {
    order.value.items.splice(index, 1);
  }
};

// ── Cálculos de preço ──
const deliveryCost = computed(() =>
  order.value.serviceType === SERVICE_TYPES.ENTREGA ? 10.0 : 0.0,
);

const itemsTotalPrice = computed(() => {
  const newItemsTotal = order.value.items.reduce(
    (sum, item) => sum + item.totalPrice * item.quantity,
    0,
  );
  // Em modo edição, soma o subtotal original com os novos itens adicionados
  if (isEditMode.value && originalSubtotal.value > 0) {
    return originalSubtotal.value + newItemsTotal;
  }
  return newItemsTotal;
});

const totalOrderPrice = computed(
  () => itemsTotalPrice.value + deliveryCost.value,
);

// ── Ações do Pedido ──
const cancelOrder = async () => {
  const confirmed = await confirmAction({
    title: "Cancelar pedido?",
    message: "Todas as informações preenchidas serão perdidas. Deseja continuar?",
    confirmLabel: "Sim, cancelar",
  });

  if (confirmed) {
    router.push({ name: "pedidos" });
  }
};

const showConfirmationModal = ref(false);

const requestOrderConfirmation = () => {
  if (
    order.value.serviceType === SERVICE_TYPES.ENTREGA &&
    !order.value.customer.address
  ) {
    notify({
      type: "warning",
      title: "Endereço obrigatório",
      message: "Por favor, informe o endereço de entrega.",
    });
    return;
  }
  // Em modo edição, permite salvar mesmo sem adicionar novos itens (mantém os originais)
  if (!isEditMode.value && order.value.items.length === 0) {
    notify({
      type: "warning",
      title: "Pedido sem itens",
      message: "Adicione pelo menos um item ao pedido.",
    });
    return;
  }
  showConfirmationModal.value = true;
};

const placeOrder = async () => {
  loading.value = true;
  showConfirmationModal.value = false;

  try {
    const orderItemsDto = order.value.items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      observation: item.observation || null,
      modifiers:
        item.modifiers?.map((m) => ({
          groupId: m.groupId,
          optionId: m.optionId,
        })) || [],
      removalIds: item.removals?.map((r) => r.id || r.ingredientId) || [],
    }));

    const customerInfo = {
      id: order.value.customer.id || null,
      name: order.value.customer.name || customerSearchQuery.value,
      address: order.value.customer.address,
      phone: order.value.customer.phone,
      complement: order.value.customer.complement,
      reference: order.value.customer.reference,
    };

    if (isEditMode.value) {
      const updateData = {
        type: inferLegacyType(order.value),
        operation: order.value.operation,
        channel: order.value.channel,
        serviceType: order.value.serviceType,
        source: order.value.source,
        customer: customerInfo,
        paymentMethod: order.value.paymentMethod.toUpperCase(),
        newItems: orderItemsDto,
        notes: order.value.notes,
        cashChangeFor: order.value.cashChangeFor,
      };
      await orderService.update(editOrderId.value, updateData);
      notify({ type: "success", message: "Pedido atualizado com sucesso!" });
    } else {
      const createData = {
        type: inferLegacyType(order.value),
        operation: order.value.operation,
        channel: order.value.channel,
        serviceType: order.value.serviceType,
        source: order.value.source,
        customer: customerInfo,
        paymentMethod: order.value.paymentMethod.toUpperCase(),
        items: orderItemsDto,
        deliveryCost: deliveryCost.value,
        notes: order.value.notes,
        cashChangeFor: order.value.cashChangeFor,
      };
      await orderService.create(createData);
      notify({ type: "success", message: "Pedido criado com sucesso!" });
    }

    router.push({ name: "pedidos" });
  } catch (error) {
    console.error("Erro ao salvar pedido:", error);
    const msg = error.response?.data?.message || "Erro ao salvar pedido.";
    notify({ type: "error", title: "Erro ao salvar pedido", message: msg });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
