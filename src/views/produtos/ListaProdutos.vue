<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ShoppingBag,
  Copy,
  PauseCircle,
  PlayCircle,
  BookOpen,
  Store as StoreIcon,
  Globe,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import categoryService from "@/services/categoryService";
import { modifierGroupService } from "@/services/modifierGroupService";
import { productService } from "@/services/productService";
import { authState } from "@/utils/auth";

const router = useRouter();
const searchQuery = ref("");
const products = ref([]);
const availableCategories = ref([]);
const selectedCategoryId = ref("");
const pendingCostFilter = ref(false);
const modifierGroups = ref([]);

// Paginação
const currentPage = ref(0);
const totalPages = ref(1);
const totalElements = ref(0);

// Configuração de Categoria
const showCategorySettings = ref(false);
const categorySettings = ref({
  id: "",
  name: "",
  defaultModifierGroupIds: [],
});
const savingCategory = ref(false);

// Modal de Disponibilidade (Pausa Local vs. Global + iFood)
const showAvailabilityModal = ref(false);
const availabilityTarget = ref(null);
const availabilityNextStatus = ref("UNAVAILABLE");
const availabilityScope = ref("STORE_ONLY");
const savingAvailability = ref(false);

const activeStoreId = computed(() => authState.currentUser?.storeId || "");
const activeStore = computed(() =>
  (authState.accessibleStores || []).find((s) => s.id === activeStoreId.value) || null,
);
const sharedCatalogStores = computed(() => {
  const catalogId = activeStore.value?.catalogId;
  if (!catalogId) return [];
  return (authState.accessibleStores || []).filter((s) => s.catalogId === catalogId);
});

const loadProducts = async () => {
  try {
    const response = await productService.getAll(
      selectedCategoryId.value,
      currentPage.value,
      20,
      pendingCostFilter.value,
    );
    products.value = response.content || [];
    currentPage.value = response.page || 0;
    totalPages.value = response.totalPages || 1;
    totalElements.value = response.totalElements || 0;
  } catch (err) {
    console.error("Erro ao carregar produtos", err);
    products.value = [];
  }
};

const loadAll = async () => {
  try {
    await loadProducts();
    availableCategories.value = await categoryService.getCategories();
    modifierGroups.value = await modifierGroupService.getAll();
  } catch (err) {
    console.error("Erro ao carregar categorias ou produtos", err);
  }
};

watch(activeStoreId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    currentPage.value = 0;
    await loadAll();
  }
});

const changePage = async (pageIndex) => {
  if (pageIndex >= 0 && pageIndex < totalPages.value) {
    currentPage.value = pageIndex;
    await loadProducts();
  }
};

onMounted(async () => {
  if (!authState.accessibleStores || authState.accessibleStores.length === 0) {
    await authState.refreshAccessibleStores();
  }
  await loadAll();
});

const openCategorySettings = () => {
  const cat = availableCategories.value.find(
    (c) => c.id === selectedCategoryId.value,
  );
  if (cat) {
    categorySettings.value = {
      id: cat.id,
      name: cat.name,
      defaultModifierGroupIds: cat.defaultModifierGroupIds
        ? [...cat.defaultModifierGroupIds]
        : [],
    };
    showCategorySettings.value = true;
  }
};

const applyCategorySettings = async () => {
  if (
    !confirm(
      "Deseja salvar estas configurações? Para aplicar as opções em lote a todos os produtos já existentes, usaremos esta lista padrão.",
    )
  )
    return;
  savingCategory.value = true;
  try {
    await categoryService.updateCategory(categorySettings.value.id, {
      name: categorySettings.value.name,
      defaultModifierGroupIds: categorySettings.value.defaultModifierGroupIds,
    });

    const index = availableCategories.value.findIndex(
      (c) => c.id === categorySettings.value.id,
    );
    if (index !== -1) {
      availableCategories.value[index].defaultModifierGroupIds = [
        ...categorySettings.value.defaultModifierGroupIds,
      ];
    }

    showCategorySettings.value = false;
  } catch {
    alert("Erro ao salvar categoria");
  } finally {
    savingCategory.value = false;
  }
};

const applyModifiersToAllProducts = async () => {
  if (
    !confirm(
      "ATENÇÃO: Esta ação irá sobrescrever as configurações de modificadores de TODOS os produtos desta categoria para usar APENAS os itens selecionados aqui. Deseja continuar?",
    )
  )
    return;
  savingCategory.value = true;
  try {
    await categoryService.bulkApplyModifiers(categorySettings.value.id);
    alert(
      "Modificadores aplicados com sucesso a todos os produtos da categoria!",
    );
    showCategorySettings.value = false;
    await loadProducts();
  } catch {
    alert("Erro ao aplicar modificadores em lote");
  } finally {
    savingCategory.value = false;
  }
};

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (p.categoryName &&
        p.categoryName.toLowerCase().includes(searchQuery.value.toLowerCase()));
    return matchesSearch;
  });
});

const removeProduct = async (id) => {
  const warningMsg =
    sharedCatalogStores.value.length > 1
      ? "Este produto faz parte do cardápio compartilhado e será removido de todas as unidades vinculadas e pausado no iFood. Deseja continuar?"
      : "Tem certeza que deseja excluir este produto?";
  if (confirm(warningMsg)) {
    try {
      await productService.delete(id);
      products.value = products.value.filter((item) => item.id !== id);
    } catch (err) {
      console.error("Erro ao excluir produto", err);
      alert("Erro ao excluir produto.");
    }
  }
};

const openAvailabilityChoice = (item) => {
  const isAvailable = item.status === "AVAILABLE";
  availabilityTarget.value = item;
  availabilityNextStatus.value = isAvailable ? "UNAVAILABLE" : "AVAILABLE";

  // Se estava pausado globalmente e vamos reativar, sugere reativar globalmente
  if (!isAvailable && item.globalStatus === "UNAVAILABLE") {
    availabilityScope.value = "CATALOG_GLOBAL";
  } else if (sharedCatalogStores.value.length > 1) {
    availabilityScope.value = "STORE_ONLY";
  } else {
    availabilityScope.value = "CATALOG_GLOBAL";
  }
  showAvailabilityModal.value = true;
};

const confirmAvailabilityChange = async () => {
  if (!availabilityTarget.value) return;
  savingAvailability.value = true;
  try {
    const item = availabilityTarget.value;
    const newStatus = availabilityNextStatus.value;
    const updated = await productService.updateAvailability(item.id, {
      status: newStatus,
      scope: availabilityScope.value,
      availableDigitalMenu: newStatus === "AVAILABLE",
      availablePdv: newStatus === "AVAILABLE",
    });

    item.status = updated?.status || newStatus;
    item.globalStatus =
      updated?.globalStatus ||
      (availabilityScope.value === "CATALOG_GLOBAL" ? newStatus : item.globalStatus);
    item.localStatus =
      updated?.localStatus ||
      (availabilityScope.value === "STORE_ONLY" ? newStatus : item.localStatus);
    item.availableDigitalMenu = updated?.availableDigitalMenu ?? newStatus === "AVAILABLE";
    item.availablePdv = updated?.availablePdv ?? newStatus === "AVAILABLE";
    showAvailabilityModal.value = false;
  } catch (err) {
    console.error("Erro ao alterar status do produto", err);
    alert(err?.response?.data?.message || "Erro ao alterar disponibilidade do produto.");
  } finally {
    savingAvailability.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">
          Produtos & Cardápio
        </h1>
        <p class="text-slate-500 text-sm font-medium">
          Gestão de itens, preços por canal e fichas técnicas
        </p>
      </div>

      <BaseButton variant="primary" @click="router.push('/produtos/novo')">
        <Plus :size="20" />
        Novo Produto
      </BaseButton>
    </div>

    <!-- Banner de Cardápio Compartilhado -->
    <div
      v-if="sharedCatalogStores.length > 1"
      class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-violet-50 border border-violet-200 text-xs text-violet-900"
    >
      <div class="flex items-center gap-2.5">
        <BookOpen :size="18" class="text-violet-600 shrink-0" />
        <span>
          <strong>{{ activeStore?.catalogName || "Cardápio Compartilhado" }}</strong> —
          sincronizado entre <strong>{{ sharedCatalogStores.length }} unidades</strong>
          ({{ sharedCatalogStores.map((s) => s.name).join(", ") }}). Estoque e pausa local são independentes por loja.
        </span>
      </div>
    </div>

    <!-- Tabela Padronizada -->
    <div
      class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div
        class="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4"
      >
        <div class="relative flex-1 max-w-md">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            :size="20"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nome..."
            class="w-full bg-slate-50 border border-slate-200 text-sm pl-10 p-2.5 rounded-xl outline-none"
          />
        </div>
        <div class="flex gap-2 items-center">
          <select
            v-model="selectedCategoryId"
            @change="
              currentPage = 0;
              loadProducts();
            "
            class="bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 rounded-xl outline-none font-medium text-slate-600"
          >
            <option value="">Todas as Categorias</option>
            <option
              v-for="cat in availableCategories"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.name }}
            </option>
          </select>
          <button
            v-if="selectedCategoryId"
            @click="openCategorySettings"
            class="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
            title="Configurar Categoria"
          >
            <Edit2 :size="18" />
          </button>
          <label class="flex items-center gap-2 text-sm text-slate-600 ml-2 cursor-pointer font-medium hover:text-slate-900">
            <input
              type="checkbox"
              v-model="pendingCostFilter"
              @change="currentPage = 0; loadProducts();"
              class="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
            />
            Pendentes de Custo
          </label>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr
              class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest"
            >
              <th class="px-6 py-4">Nome do Produto</th>
              <th class="px-6 py-4">Categoria</th>
              <th class="px-6 py-4">Venda</th>
              <th class="px-6 py-4 text-center">Lucro</th>
              <th class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr
              v-for="item in filteredProducts"
              :key="item.id"
              class="hover:bg-slate-50 transition-colors group"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-orange-50 rounded-xl text-orange-600" :class="{ 'opacity-50 grayscale': item.status === 'UNAVAILABLE' }">
                    <ShoppingBag :size="16" />
                  </div>
                  <div class="flex flex-col">
                    <span
                      class="font-bold text-slate-700 group-hover:text-orange-600 transition-colors"
                      :class="{ 'line-through text-slate-400': item.status === 'UNAVAILABLE' }"
                      >{{ item.name }}</span
                    >
                    <span
                      v-if="item.globalStatus === 'UNAVAILABLE'"
                      class="text-[10px] font-bold text-red-600 uppercase tracking-wider"
                    >
                      Pausado em todas as lojas + iFood
                    </span>
                    <span
                      v-else-if="item.status === 'UNAVAILABLE'"
                      class="text-[10px] font-bold text-amber-600 uppercase tracking-wider"
                    >
                      Pausado só nesta unidade
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md"
                >
                  {{ item.categoryName || "S/ Categoria" }}
                </span>
              </td>
              <td class="px-6 py-4 font-black text-slate-700 text-sm">
                R$ {{ item.price.toFixed(2) }}
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex flex-col items-center">
                  <span class="text-xs font-black text-emerald-600">
                    R$ {{ (item.price - item.totalCost).toFixed(2) }}
                  </span>
                  <span class="text-[9px] font-bold text-slate-400">
                    {{
                      item.price > 0
                        ? (
                            ((item.price - item.totalCost) / item.price) *
                            100
                          ).toFixed(0)
                        : 0
                    }}% margem
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    @click="openAvailabilityChoice(item)"
                    class="p-2 rounded-lg transition-all"
                    :class="item.status === 'AVAILABLE' ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'"
                    :title="item.status === 'AVAILABLE' ? 'Pausar Produto' : 'Ativar Produto'"
                  >
                    <PauseCircle v-if="item.status === 'AVAILABLE'" :size="16" />
                    <PlayCircle v-else :size="16" />
                  </button>
                  <button
                    @click="router.push(`/produtos/novo?cloneId=${item.id}`)"
                    class="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Duplicar Produto"
                  >
                    <Copy :size="16" />
                  </button>
                  <button
                    @click="router.push(`/produtos/editar/${item.id}`)"
                    class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                    title="Editar Produto"
                  >
                    <Edit2 :size="16" />
                  </button>
                  <button
                    @click="removeProduct(item.id)"
                    class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="filteredProducts.length === 0"
        class="py-12 text-center text-slate-400 text-sm font-medium"
      >
        Nenhum produto encontrado.
      </div>

      <!-- Controles de Paginação -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50"
      >
        <span class="text-xs font-medium text-slate-500">
          Mostrando {{ filteredProducts.length }} itens de
          {{ totalElements }} (Página {{ currentPage + 1 }} de {{ totalPages }})
        </span>
        <div class="flex gap-2">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 0"
            class="px-3 py-1.5 text-sm font-bold rounded-lg transition-colors border border-slate-200"
            :class="
              currentPage === 0
                ? 'text-slate-300 bg-slate-100 cursor-not-allowed'
                : 'text-slate-600 bg-white hover:bg-slate-50 hover:text-orange-600'
            "
          >
            Anterior
          </button>

          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= totalPages - 1"
            class="px-3 py-1.5 text-sm font-bold rounded-lg transition-colors border border-slate-200"
            :class="
              currentPage >= totalPages - 1
                ? 'text-slate-300 bg-slate-100 cursor-not-allowed'
                : 'text-slate-600 bg-white hover:bg-slate-50 hover:text-orange-600'
            "
          >
            Próxima
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Escopo de Pausa / Reativação -->
    <div
      v-if="showAvailabilityModal && availabilityTarget"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div>
          <span
            class="text-xs font-black uppercase"
            :class="availabilityNextStatus === 'UNAVAILABLE' ? 'text-amber-600' : 'text-emerald-600'"
          >
            {{ availabilityNextStatus === "UNAVAILABLE" ? "Pausar Produto" : "Reativar Produto" }}
          </span>
          <h3 class="text-lg font-black text-slate-900 mt-0.5">
            {{ availabilityTarget.name }}
          </h3>
          <p class="text-xs text-slate-500 mt-1">
            Escolha onde esta alteração de disponibilidade deve ser aplicada:
          </p>
        </div>

        <div class="space-y-2.5 text-xs">
          <label
            :class="[
              'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
              availabilityScope === 'STORE_ONLY'
                ? 'border-orange-500 bg-orange-50/70'
                : 'border-slate-200 hover:bg-slate-50',
            ]"
          >
            <input
              type="radio"
              value="STORE_ONLY"
              v-model="availabilityScope"
              class="mt-0.5 accent-orange-500"
            />
            <div class="space-y-0.5">
              <div class="flex items-center gap-1.5 font-black text-slate-900">
                <StoreIcon :size="14" class="text-orange-600" />
                <span>Apenas nesta unidade ({{ activeStore?.name || "Loja atual" }})</span>
              </div>
              <p class="text-[11px] text-slate-600">
                Ideal quando acabou um insumo só no balcão. Mantém o item disponível nas outras lojas e no iFood.
              </p>
            </div>
          </label>

          <label
            :class="[
              'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
              availabilityScope === 'CATALOG_GLOBAL'
                ? 'border-orange-500 bg-orange-50/70'
                : 'border-slate-200 hover:bg-slate-50',
            ]"
          >
            <input
              type="radio"
              value="CATALOG_GLOBAL"
              v-model="availabilityScope"
              class="mt-0.5 accent-orange-500"
            />
            <div class="space-y-0.5">
              <div class="flex items-center gap-1.5 font-black text-slate-900">
                <Globe :size="14" class="text-violet-600" />
                <span>Em todas as unidades + iFood (Global)</span>
              </div>
              <p class="text-[11px] text-slate-600">
                Atualiza o cardápio compartilhado inteiro e reflete automaticamente a disponibilidade no iFood.
              </p>
            </div>
          </label>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            @click="showAvailabilityModal = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            @click="confirmAvailabilityChange"
            :disabled="savingAvailability"
            :class="[
              'px-4 py-2 rounded-xl text-white text-xs font-bold transition-colors',
              availabilityNextStatus === 'UNAVAILABLE'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700',
            ]"
          >
            {{
              savingAvailability
                ? "Salvando..."
                : availabilityNextStatus === "UNAVAILABLE"
                  ? "Confirmar Pausa"
                  : "Confirmar Reativação"
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Configuração de Categoria -->
    <div
      v-if="showCategorySettings"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-x-hidden"
    >
      <div class="bg-white p-4 sm:p-6 rounded-3xl shadow-xl w-full max-w-4xl max-h-[calc(100dvh-1rem)] overflow-y-auto overflow-x-hidden">
        <h3 class="text-xl font-bold text-slate-800 mb-2">
          Configurar Categoria
        </h3>
        <p class="text-slate-500 text-sm mb-6">
          Defina os opcionais padrão para a categoria
          <span class="font-bold">{{ categorySettings.name }}</span
          >.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <label
            v-for="group in modifierGroups"
            :key="group.id"
            :class="[
              'flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all',
              categorySettings.defaultModifierGroupIds.includes(group.id)
                ? 'border-orange-500 bg-orange-50'
                : 'border-slate-200 hover:bg-slate-50',
            ]"
          >
            <input
              type="checkbox"
              :value="group.id"
              v-model="categorySettings.defaultModifierGroupIds"
              class="form-checkbox text-orange-600 rounded"
            />
            <div class="flex-1">
              <span class="font-bold text-slate-800 text-sm">{{
                group.name
              }}</span>
            </div>
          </label>
          <div
            v-if="modifierGroups.length === 0"
            class="text-slate-400 text-sm text-center"
          >
            Nenhum grupo cadastrado.
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <BaseButton
            variant="primary"
            :loading="savingCategory"
            @click="applyCategorySettings"
            class="w-full"
          >
            Salvar Opcionais Padrão
          </BaseButton>
          <button
            @click="applyModifiersToAllProducts"
            :disabled="savingCategory"
            class="w-full py-2.5 bg-orange-100 text-orange-600 font-bold rounded-xl text-sm hover:bg-orange-200 transition-colors"
          >
            Aplicar Opcionais em Lote aos Produtos Existentes
          </button>
          <BaseButton
            variant="secondary"
            @click="showCategorySettings = false"
            class="w-full"
          >
            Cancelar
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
