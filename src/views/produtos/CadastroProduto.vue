<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  Save,
  X,
  DollarSign,
  ShoppingBag,
  Trash2,
  Search,
  ChevronLeft,
  Calculator,
  UtensilsCrossed,
  Plus,
  CheckCircle,
  CircleAlert,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import BaseModal from "@/components/BaseModal.vue";
import { productService } from "@/services/productService";
import { ingredientService } from "@/services/ingredientService";
import { modifierGroupService } from "@/services/modifierGroupService";
import categoryService from "@/services/categoryService";
import { productionSectorService } from "@/services/productionSectorService";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/money";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const isEditing = ref(false);

const showIngredientModal = ref(false);
const searchIngredienteModal = ref("");
const selectedIngredientsInModal = ref([]);
const modalQuantities = ref({});

const availableIngredients = ref([]);
const modifierGroups = ref([]);
const availableCategories = ref([]);
const productionSectors = ref([]);
const isCreatingNewCategory = ref(false);
const newCategoryName = ref("");

const showMessageModal = ref(false);
const modalType = ref("success");
const modalTitle = ref("");
const modalMessage = ref("");
const redirectAfterClose = ref(false);

const showNewIngredientModal = ref(false);
const creatingIngredient = ref(false);

const newIngredient = reactive({
  id: null,
  name: "",
  unit: "UN",
  stock: 0,
  minStock: 0,
  costPrice: 0,
});

const handleCategoryChange = (e) => {
  if (e.target.value === "NEW_CATEGORY_OPTION") {
    isCreatingNewCategory.value = true;
    form.categoryId = "";
  } else {
    // Check for default modifiers
    const selectedCat = availableCategories.value.find(
      (c) => c.id === e.target.value,
    );
    if (
      selectedCat &&
      selectedCat.defaultModifierGroupIds &&
      selectedCat.defaultModifierGroupIds.length > 0
    ) {
      if (
        confirm(
          `Esta categoria possui modificadores padrão. Deseja aplicar os adicionais padrão ao produto?`,
        )
      ) {
        form.modifierGroupIds = [
          ...new Set([
            ...form.modifierGroupIds,
            ...selectedCat.defaultModifierGroupIds,
          ]),
        ];
      }
    }
  }
};

const saveNewCategory = async () => {
  if (!newCategoryName.value.trim()) return;
  try {
    const created = await categoryService.createCategory({
      name: newCategoryName.value.trim(),
    });
    availableCategories.value.push(created);
    form.categoryId = created.id;
    isCreatingNewCategory.value = false;
    newCategoryName.value = "";
  } catch (err) {
    alert("Erro ao criar categoria");
  }
};

const form = reactive({
  id: null,
  name: "",
  description: "",
  imageUrl: "",
  active: true,
  productType: "PRODUCED",
  trackStock: false,
  productionSectorId: "",
  saleUnit: "UN",
  availableDigitalMenu: true,
  availablePdv: true,
  categoryId: "",
  price: 0,
  technicalSheet: [],
  modifierGroupIds: [],
  removableItemIds: [],
});

onMounted(async () => {
  try {
    availableIngredients.value = await ingredientService.getAll();
    modifierGroups.value = await modifierGroupService.getAll();
    availableCategories.value = await categoryService.getCategories();
    productionSectors.value = await productionSectorService.getAll();

    if (
      !route.params.id &&
      !route.query.cloneId &&
      !form.productionSectorId &&
      productionSectors.value.length
    ) {
      const kitchen = productionSectors.value.find(
        (s) => String(s.code || "").toUpperCase() === "KITCHEN",
      );
      form.productionSectorId = (kitchen || productionSectors.value[0]).id;
    }

    if (route.params.id) {
      isEditing.value = true;
      const itemToEdit = await productService.getById(route.params.id);
      if (itemToEdit) {
        Object.assign(form, itemToEdit);
        if (itemToEdit.removableItems) {
          form.removableItemIds = itemToEdit.removableItems.map(
            (item) => item.ingredientId,
          );
        }
      }
    } else if (route.query.cloneId) {
      isEditing.value = false;
      const itemToClone = await productService.getById(route.query.cloneId);
      if (itemToClone) {
        Object.assign(form, itemToClone);
        if (itemToClone.removableItems) {
          form.removableItemIds = itemToClone.removableItems.map(
            (item) => item.ingredientId,
          );
        }
        form.id = null; // Ensure it's treated as a new product
        form.name = `${itemToClone.name} (Cópia)`;
      }
    }
  } catch (err) {
    console.error("Erro ao carregar dados", err);
  }
});

const totalCost = computed(() => {
  return form.technicalSheet.reduce((acc, item) => {
    const ing = availableIngredients.value.find(
      (i) => i.id === item.ingredientId || i.id === item.id,
    );
    if (ing) {
      return acc + ing.costPrice * item.quantity;
    }
    return acc;
  }, 0);
});

const profit = computed(() => form.price - totalCost.value);

const removeIngredient = (index) => form.technicalSheet.splice(index, 1);

const openIngredientModal = () => {
  selectedIngredientsInModal.value = form.technicalSheet.map(
    (item) => item.ingredientId || item.id,
  );
  modalQuantities.value = {};
  form.technicalSheet.forEach((item) => {
    modalQuantities.value[item.ingredientId || item.id] = item.quantity;
  });
  showIngredientModal.value = true;
};

const closeIngredientModal = () => {
  showIngredientModal.value = false;
  searchIngredienteModal.value = "";
  selectedIngredientsInModal.value = [];
};
const addSelectedIngredientsToSheet = () => {
  form.technicalSheet = form.technicalSheet.filter((item) =>
    selectedIngredientsInModal.value.includes(item.ingredientId ?? item.id),
  );

  selectedIngredientsInModal.value.forEach((ingredientId) => {
    const ingredientToAdd = availableIngredients.value.find(
      (ing) => ing.id === ingredientId,
    );

    if (!ingredientToAdd) {
      return;
    }

    const existingItem = form.technicalSheet.find(
      (item) => (item.ingredientId ?? item.id) === ingredientId,
    );

    // Pega exatamente o valor digitado no modal
    const modalQuantity = modalQuantities.value[ingredientId];

    // Só coloca 1 se realmente não tiver sido informado nada
    const quantity =
      modalQuantity === null ||
      modalQuantity === undefined ||
      modalQuantity === ""
        ? 1
        : Number(modalQuantity);

    if (existingItem) {
      existingItem.quantity = quantity;

      existingItem.unit = ingredientToAdd.unit;

      existingItem.name = ingredientToAdd.name;
      existingItem.cost = ingredientToAdd.costPrice || 0;
    } else {
      form.technicalSheet.push({
        ingredientId: ingredientToAdd.id,
        id: ingredientToAdd.id,
        name: ingredientToAdd.name,
        unit: ingredientToAdd.unit,
        cost: ingredientToAdd.costPrice || 0,
        quantity: quantity,
      });
    }
  });

  closeIngredientModal();
};

const handleSubmit = async () => {
  loading.value = true;

  try {
    const payload = { ...form };

    payload.technicalSheet = payload.technicalSheet.map((i) => ({
      ingredientId: i.ingredientId || i.id,
      quantity: i.quantity,
    }));

    if (isEditing.value) {
      await productService.update(form.id, payload);

      modalType.value = "success";
      modalTitle.value = "Produto atualizado!";
      modalMessage.value = "Produto atualizado com sucesso.";
    } else {
      delete payload.id;
      await productService.create(payload);

      modalType.value = "success";
      modalTitle.value = "Produto cadastrado!";
      modalMessage.value = "Produto cadastrado com sucesso.";
    }

    redirectAfterClose.value = true;
    showMessageModal.value = true;
  } catch (err) {
    console.error("Erro ao salvar produto", err);

    modalType.value = "error";
    modalTitle.value = "Erro ao salvar";
    modalMessage.value =
      "Não foi possível salvar o produto. Verifique os dados.";

    redirectAfterClose.value = false;
    showMessageModal.value = true;
  } finally {
    loading.value = false;
  }
};

const closeMessageModal = () => {
  showMessageModal.value = false;

  if (redirectAfterClose.value) {
    router.push("/produtos");
  }
};

const openNewIngredientModal = () => {
  newIngredient.id = null;
  newIngredient.name = "";
  newIngredient.unit = "UN";
  newIngredient.stock = 0;
  newIngredient.minStock = 0;
  newIngredient.costPrice = 0;

  showNewIngredientModal.value = true;
};

const closeNewIngredientModal = () => {
  showNewIngredientModal.value = false;
};

const saveNewIngredient = async () => {
  if (!newIngredient.name.trim()) {
    modalType.value = "error";
    modalTitle.value = "Nome obrigatório";
    modalMessage.value = "Informe o nome do ingrediente.";
    redirectAfterClose.value = false;
    showMessageModal.value = true;
    return;
  }

  creatingIngredient.value = true;

  try {
    const payload = {
      name: newIngredient.name.trim(),
      unit: newIngredient.unit,
      stock: Number(newIngredient.stock || 0),
      minStock: Number(newIngredient.minStock || 0),
      costPrice: Number(newIngredient.costPrice || 0),
    };

    let savedIngredient;

    /*
     * IMPORTANTE:
     * Dentro desta tela, form.id é o ID do PRODUTO.
     * Portanto, para atualizar um ingrediente usamos newIngredient.id.
     *
     * O equivalente correto da sua chamada:
     * await ingredientService.update(form.id, payload)
     *
     * neste contexto é:
     * await ingredientService.update(newIngredient.id, payload)
     */
    if (newIngredient.id) {
      savedIngredient = await ingredientService.update(
        newIngredient.id,
        payload,
      );
    } else {
      // Cadastro de um ingrediente novo.
      // O service precisa possuir o método create para a rota de inclusão.
      savedIngredient = await ingredientService.create(payload);
    }

    /*
     * Alguns backends não retornam o objeto criado no POST/PUT.
     * Por isso recarregamos a lista após salvar.
     */
    availableIngredients.value = await ingredientService.getAll();

    let ingredientSaved = null;

    if (savedIngredient?.id) {
      ingredientSaved =
        availableIngredients.value.find(
          (ing) => ing.id === savedIngredient.id,
        ) || savedIngredient;
    }

    if (!ingredientSaved) {
      ingredientSaved = availableIngredients.value.find(
        (ing) =>
          ing.name?.trim().toLowerCase() ===
          newIngredient.name.trim().toLowerCase(),
      );
    }

    /*
     * Se localizamos o ingrediente recém-cadastrado,
     * já o marcamos na lista do modal.
     */
    if (ingredientSaved?.id) {
      if (!selectedIngredientsInModal.value.includes(ingredientSaved.id)) {
        selectedIngredientsInModal.value.push(ingredientSaved.id);
      }

      // Quantidade inicial de acordo com a unidade.
      modalQuantities.value[ingredientSaved.id] = ["KG", "L"].includes(
        ingredientSaved.unit,
      )
        ? 0.01
        : 1;
    }

    closeNewIngredientModal();

    modalType.value = "success";
    modalTitle.value = newIngredient.id
      ? "Ingrediente atualizado!"
      : "Ingrediente cadastrado!";
    modalMessage.value = newIngredient.id
      ? "Ingrediente atualizado com sucesso."
      : "Ingrediente cadastrado com sucesso.";

    redirectAfterClose.value = false;
    showMessageModal.value = true;
  } catch (err) {
    console.error("Erro ao salvar ingrediente", err);

    modalType.value = "error";
    modalTitle.value = "Erro ao salvar ingrediente";
    modalMessage.value =
      err?.response?.data?.message ||
      "Não foi possível salvar o ingrediente. Verifique os dados.";

    redirectAfterClose.value = false;
    showMessageModal.value = true;
  } finally {
    creatingIngredient.value = false;
  }
};

const handlePriceInput = (event) => {
  const hasDigits = /\d/.test(event.target.value);
  form.price = parseCurrencyInput(event.target.value);
  event.target.value = hasDigits ? formatPrice(form.price) : "";
};

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};
const handleIngredientQuantity = (event, ingredient) => {
  const input = event.target;
  const digits = input.value.replace(/\D/g, "");

  if (!digits) {
    modalQuantities.value[ingredient.id] = null;
    input.value = "";
    return;
  }

  // UN, G e ML = inteiro
  if (["UN", "G", "ML"].includes(ingredient.unit)) {
    const value = parseInt(digits, 10);

    modalQuantities.value[ingredient.id] = value;
    input.value = value.toLocaleString("pt-BR");

    console.log(
      "SALVANDO:",
      ingredient.id,
      modalQuantities.value[ingredient.id],
    );
    return;
  }

  // KG e L = decimal com máscara
  if (["KG", "L"].includes(ingredient.unit)) {
    const value = Number(digits) / 100;

    modalQuantities.value[ingredient.id] = value;

    input.value = value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    console.log(
      "SALVANDO:",
      ingredient.id,
      modalQuantities.value[ingredient.id],
    );
  }
};
const formatIngredientQuantity = (value, unit) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);

  if (isNaN(number)) {
    return "";
  }

  if (["KG", "L"].includes(unit)) {
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return Math.trunc(number).toString();
};
const handleNewIngredientStock = (event, field) => {
  const input = event.target;
  const digits = input.value.replace(/\D/g, "");

  if (!digits) {
    newIngredient[field] = null;
    input.value = "";
    return;
  }

  // UN, G e ML = inteiro
  if (["UN", "G", "ML"].includes(newIngredient.unit)) {
    const value = parseInt(digits, 10);

    newIngredient[field] = value;
    input.value = value.toLocaleString("pt-BR");

    return;
  }

  // KG e L = decimal com máscara
  if (["KG", "L"].includes(newIngredient.unit)) {
    const value = Number(digits) / 100;

    newIngredient[field] = value;

    input.value = value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
};
const formatNewIngredientStock = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);

  if (isNaN(number)) {
    return "";
  }

  if (["KG", "L"].includes(newIngredient.unit)) {
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return Math.trunc(number).toLocaleString("pt-BR");
};
const handleNewIngredientUnitChange = () => {
  if (["UN", "G", "ML"].includes(newIngredient.unit)) {
    if (newIngredient.stock !== null) {
      newIngredient.stock = Math.trunc(Number(newIngredient.stock || 0));
    }

    if (newIngredient.minStock !== null) {
      newIngredient.minStock = Math.trunc(Number(newIngredient.minStock || 0));
    }
  }
};
const formatPrice = formatCurrencyInput;
const formatNewIngredientCost = formatCurrencyInput;

const handleNewIngredientCost = (event) => {
  const hasDigits = /\d/.test(event.target.value);
  newIngredient.costPrice = parseCurrencyInput(event.target.value);
  event.target.value = hasDigits ? formatNewIngredientCost(newIngredient.costPrice) : "";
};
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <!-- Header Dinâmico -->
    <div
      class="flex items-center justify-between border-b border-slate-100 pb-4"
    >
      <div class="flex items-center gap-4">
        <button
          @click="router.push('/produtos')"
          class="p-2 hover:bg-white rounded-xl text-slate-400"
        >
          <ChevronLeft :size="24" />
        </button>
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">
            {{ isEditing ? "Editar Produto" : "Novo Produto" }}
          </h1>
          <p class="text-slate-500 text-sm font-medium">
            {{
              isEditing
                ? `Editando ficha técnica: ${form.name}`
                : "Cadastre um novo item no cardápio"
            }}
          </p>
        </div>
      </div>
      <div
        v-if="isEditing"
        class="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm"
      >
        Produto Ativo
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 items-start">
      <!-- Painel Financeiro -->
      <div
        class="w-full lg:w-72 shrink-0 space-y-6 lg:sticky lg:top-8 order-2 lg:order-1"
      >
        <div
          class="bg-slate-900 rounded-3xl p-6 shadow-xl text-white space-y-6 border border-slate-800"
        >
          <div
            class="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-widest mb-2"
          >
            <Calculator :size="16" /> Resumo de Lucro
          </div>
          <div class="space-y-4">
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400">Custo Total</span>
              <span class="font-bold">R$ {{ totalCost.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400">Venda</span>
              <span class="font-bold"
                >R$ {{ Number(form.price).toFixed(2) }}</span
              >
            </div>
            <div class="pt-4 border-t border-slate-800">
              <div class="flex justify-between items-center mb-1">
                <span
                  class="text-slate-400 text-xs font-bold uppercase tracking-wider"
                  >Lucro Real</span
                >
                <span
                  :class="[
                    'text-xl font-black',
                    profit > 0 ? 'text-emerald-400' : 'text-red-400',
                  ]"
                >
                  {{ formatCurrency(profit) }}
                </span>
              </div>
            </div>
          </div>
          <div class="pt-4 space-y-3">
            <BaseButton
              variant="primary"
              class="w-full"
              :loading="loading"
              @click="handleSubmit"
            >
              <Save :size="18" />
              {{ isEditing ? "Salvar Alterações" : "Finalizar Cadastro" }}
            </BaseButton>
            <BaseButton
              type="button"
              variant="secondary"
              class="w-full border-slate-700 text-slate-400"
              @click="router.push('/produtos')"
            >
              <X :size="18" /> Cancelar
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Formulário -->
      <div class="flex-1 space-y-6 order-1 lg:order-2">
        <div
          class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div
            class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest"
          >
            <ShoppingBag :size="16" /> Dados Gerais
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2 space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1"
                >Nome do Produto</label
              >
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1"
                >Categoria</label
              >

              <!-- Select para categorias existentes -->
              <select
                v-if="!isCreatingNewCategory"
                v-model="form.categoryId"
                @change="handleCategoryChange"
                class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-medium text-slate-700"
              >
                <option value="" disabled>Selecione uma categoria</option>
                <option
                  v-for="cat in availableCategories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }}
                </option>
                <option
                  value="NEW_CATEGORY_OPTION"
                  class="font-bold text-orange-600"
                >
                  ➕ Nova categoria...
                </option>
              </select>

              <div v-else class="flex gap-2">
                <input
                  v-model="newCategoryName"
                  type="text"
                  placeholder="Nome da nova categoria..."
                  class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
                  autofocus
                  @keyup.enter="saveNewCategory"
                />
                <button
                  @click="saveNewCategory"
                  type="button"
                  class="px-4 bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-xl transition-all"
                  title="Salvar"
                >
                  <Save :size="18" />
                </button>
                <button
                  @click="
                    isCreatingNewCategory = false;
                    form.categoryId = availableCategories[0]?.id || '';
                  "
                  type="button"
                  class="px-4 bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                  title="Cancelar e voltar a selecionar"
                >
                  <X :size="18" />
                </button>
              </div>
            </div>
            <div class="md:col-span-2 space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1"
                >Descrição</label
              >
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="Descrição exibida no cardápio digital"
              ></textarea>
            </div>
            <div class="md:col-span-2 space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1"
                >URL da imagem</label
              >
              <input
                v-model="form.imageUrl"
                type="text"
                class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl"
                placeholder="https://..."
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1"
                >Tipo de produto</label
              >
              <select
                v-model="form.productType"
                class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl"
              >
                <option value="PRODUCED">Produzido / ficha técnica</option>
                <option value="RESALE">Revenda / estoque próprio</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1"
                >Setor de produção</label
              >
              <select
                v-model="form.productionSectorId"
                class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl"
              >
                <option
                  v-for="sector in productionSectors"
                  :key="sector.id"
                  :value="sector.id"
                >
                  {{ sector.name }}
                </option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1"
                >Unidade de venda</label
              >
              <select
                v-model="form.saleUnit"
                class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl"
              >
                <option
                  v-for="u in ['UN', 'KG', 'G', 'L', 'ML', 'CX', 'PCT']"
                  :key="u"
                >
                  {{ u }}
                </option>
              </select>
            </div>
            <div class="space-y-3 p-3 rounded-xl border bg-slate-50">
              <label class="flex items-center gap-2 text-sm font-bold"
                ><input v-model="form.active" type="checkbox" /> Produto
                ativo</label
              >
              <label class="flex items-center gap-2 text-sm font-bold"
                ><input v-model="form.trackStock" type="checkbox" /> Controlar
                estoque próprio</label
              >
              <label class="flex items-center gap-2 text-sm font-bold"
                ><input v-model="form.availablePdv" type="checkbox" />
                Disponível no PDV</label
              >
              <label class="flex items-center gap-2 text-sm font-bold"
                ><input v-model="form.availableDigitalMenu" type="checkbox" />
                Disponível no cardápio digital</label
              >
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 ml-1"
                >Preço de Venda</label
              >
              <input
                :value="formatPrice(form.price)"
                @input="handlePriceInput"
                type="text"
                inputmode="numeric"
                class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-orange-600"
              />
            </div>
          </div>
        </div>

        <!-- Adicionais e Opções (Modificadores) -->
        <div
          class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div
            class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest"
          >
            <Plus :size="16" /> Adicionais e Opções
          </div>
          <p class="text-slate-500 text-sm">
            Selecione quais grupos de opcionais estarão disponíveis para este
            produto.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label
              v-for="group in modifierGroups"
              :key="group.id"
              :class="[
                'flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all',
                form.modifierGroupIds.includes(group.id)
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-slate-200 hover:border-orange-200 bg-white',
              ]"
            >
              <input
                type="checkbox"
                :value="group.id"
                v-model="form.modifierGroupIds"
                class="mt-0.5 form-checkbox text-orange-600 rounded"
              />
              <div class="flex flex-col">
                <span class="font-bold text-slate-800 text-sm">{{
                  group.name
                }}</span>
                <span
                  class="text-[10px] font-black mt-1 uppercase tracking-wider"
                  :class="group.required ? 'text-red-500' : 'text-slate-400'"
                >
                  {{ group.required ? "Obrigatório" : "Opcional" }}
                </span>
                <span class="text-xs text-slate-500 mt-1 font-medium"
                  >{{ group.options?.length || 0 }} opções</span
                >
              </div>
            </label>
          </div>

          <div
            v-if="modifierGroups.length === 0"
            class="text-slate-400 text-sm font-medium text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
          >
            Nenhum grupo de modificadores cadastrado no sistema.
          </div>
        </div>

        <!-- Ficha Técnica -->
        <div
          class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div class="flex items-center justify-between">
            <div
              class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest"
            >
              <UtensilsCrossed :size="16" /> Composição
            </div>
            <BaseButton
              type="button"
              variant="secondary"
              size="sm"
              @click="openIngredientModal"
            >
              <Plus :size="16" /> Criar Ficha Técnica
            </BaseButton>
          </div>

          <div v-if="form.technicalSheet.length > 0" class="space-y-3">
            <div
              v-for="(item, index) in form.technicalSheet"
              :key="item.id"
              class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"
            >
              <div class="flex-1 font-bold text-slate-800 text-sm">
                {{ item.name }}
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="item.quantity"
                  type="number"
                  class="w-16 p-2 text-center text-sm font-black bg-white border border-slate-200 rounded-lg"
                />
                <span class="text-[10px] font-black text-slate-400 uppercase">{{
                  item.unit
                }}</span>
                <button
                  @click="removeIngredient(index)"
                  class="p-2 text-slate-300 hover:text-red-500"
                >
                  <Trash2 :size="18" />
                </button>
              </div>
            </div>
          </div>
          <div
            v-else
            class="text-slate-400 text-sm font-medium text-center py-4"
          >
            Nenhum ingrediente adicionado à ficha técnica.
          </div>
        </div>

        <!-- Ingredientes Removíveis -->
        <div
          class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div
            class="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest"
          >
            <Trash2 :size="16" /> Ingredientes Removíveis
          </div>
          <p class="text-slate-500 text-sm">
            Marque quais itens da ficha técnica o cliente pode optar por
            remover.
          </p>

          <div
            v-if="form.technicalSheet.length > 0"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <label
              v-for="item in form.technicalSheet"
              :key="item.id || item.ingredientId"
              :class="[
                'flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all',
                form.removableItemIds.includes(item.ingredientId || item.id)
                  ? 'border-red-500 bg-red-50'
                  : 'border-slate-200 hover:border-red-200 bg-white',
              ]"
            >
              <input
                type="checkbox"
                :value="item.ingredientId || item.id"
                v-model="form.removableItemIds"
                class="form-checkbox text-red-500 rounded"
              />
              <span class="font-bold text-slate-800 text-sm">{{
                item.name
              }}</span>
            </label>
          </div>
          <div
            v-else
            class="text-slate-400 text-sm font-medium text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
          >
            Adicione itens na ficha técnica primeiro.
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Seleção de Ingredientes -->
    <BaseModal
      :show="showIngredientModal"
      maxWidth="max-w-2xl"
      @close="closeIngredientModal"
    >
      <div class="max-h-[90vh] flex flex-col">
        <h3 class="text-xl font-bold text-slate-800 mb-4">
          Selecionar Ingredientes
        </h3>
        <div class="relative mb-4">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            :size="20"
          />
          <input
            type="text"
            placeholder="Buscar ingrediente..."
            class="w-full bg-slate-50 border border-slate-200 pl-10 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
            v-model="searchIngredienteModal"
          />
        </div>

        <div class="flex-1 overflow-y-auto space-y-2 pr-2">
          <label
            v-for="ingredient in availableIngredients.filter((ing) =>
              ing.name
                .toLowerCase()
                .includes(searchIngredienteModal.toLowerCase()),
            )"
            :key="ingredient.id"
            class="flex items-center p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors gap-3"
          >
            <input
              type="checkbox"
              :value="ingredient.id"
              v-model="selectedIngredientsInModal"
              class="form-checkbox text-orange-600 rounded"
            />

            <div class="flex-1 flex flex-col">
              <span class="text-slate-700 font-bold">{{
                ingredient.name
              }}</span>
              <span class="text-xs text-slate-500">
                Estoque:
                <strong
                  :class="
                    ingredient.stock > 0 ? 'text-emerald-600' : 'text-red-500'
                  "
                  >{{ ingredient.stock }}</strong
                >
                {{ ingredient.unit }} | Custo: R$
                {{ (ingredient.price || 0).toFixed(2) }} / {{ ingredient.unit }}
              </span>
            </div>

            <div class="flex items-center gap-2" @click.stop>
              <input
                type="text"
                inputmode="numeric"
                :value="
                  formatIngredientQuantity(
                    modalQuantities[ingredient.id],
                    ingredient.unit,
                  )
                "
                @input="handleIngredientQuantity($event, ingredient)"
                class="w-20 p-2 text-center text-sm font-black bg-white border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                placeholder="Qtd"
              />
              <span class="text-[10px] font-black text-slate-400 uppercase w-6">
                {{ ingredient.unit }}
              </span>
            </div>
          </label>
          <p
            v-if="
              availableIngredients.filter((ing) =>
                ing.name
                  .toLowerCase()
                  .includes(searchIngredienteModal.toLowerCase()),
              ).length === 0
            "
            class="text-slate-400 text-sm text-center py-4"
          >
            Nenhum ingrediente encontrado.
          </p>
        </div>

        <div class="flex justify-between items-center gap-3 mt-6">
          <BaseButton variant="primary" @click="openNewIngredientModal">
            <Plus :size="20" />
            Novo Ingrediente
          </BaseButton>

          <div class="flex gap-3">
            <BaseButton variant="secondary" @click="closeIngredientModal"
              >Cancelar</BaseButton
            >
            <BaseButton variant="primary" @click="addSelectedIngredientsToSheet"
              >Adicionar</BaseButton
            >
          </div>
        </div>
      </div>
    </BaseModal>

    <!-- Modal de Cadastro Rápido de Ingrediente -->
    <BaseModal
      :show="showNewIngredientModal"
      maxWidth="max-w-lg"
      @close="closeNewIngredientModal"
    >
      <div class="space-y-6">
        <div>
          <h3 class="text-xl font-bold text-slate-800">Novo Ingrediente</h3>
          <p class="text-sm text-slate-500 mt-1">
            Cadastre um ingrediente sem sair da ficha técnica.
          </p>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-xs font-black text-slate-700 uppercase"
              >Nome</label
            >
            <input
              v-model="newIngredient.name"
              type="text"
              placeholder="Ex: Queijo Mussarela"
              class="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Estoque Atual -->
            <div class="space-y-2">
              <label class="text-xs font-black text-slate-700 uppercase"
                >Estoque Atual</label
              >
              <input
                :value="formatNewIngredientStock(newIngredient.stock)"
                @input="handleNewIngredientStock($event, 'stock')"
                type="text"
                inputmode="numeric"
                class="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="0"
              />
            </div>
            <!-- Unidade -->
            <div class="space-y-2">
              <label class="text-xs font-black text-slate-700 uppercase"
                >Unidade</label
              >
              <select
                v-model="newIngredient.unit"
                @change="handleNewIngredientUnitChange"
                class="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-slate-700"
              >
                <option value="UN">UN</option>
                <option value="KG">KG</option>
                <option value="G">G</option>
                <option value="L">L</option>
                <option value="ML">ML</option>
              </select>
            </div>

            <!-- Estoque Mínimo -->
            <div class="space-y-2">
              <label class="text-xs font-black text-slate-700 uppercase"
                >Estoque Mínimo</label
              >
              <input
                :value="formatNewIngredientStock(newIngredient.minStock)"
                @input="handleNewIngredientStock($event, 'minStock')"
                type="text"
                inputmode="numeric"
                class="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="0"
              />
            </div>
            <!-- Custo -->
            <div class="space-y-2">
              <label class="text-xs font-black text-slate-700 uppercase"
                >Custo</label
              >
              <DollarSign
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                :size="18"
              />
              <input
                :value="formatNewIngredientCost(newIngredient.costPrice)"
                @input="handleNewIngredientCost"
                type="text"
                inputmode="numeric"
                placeholder="R$ 0,00"
                class="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-orange-600"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="closeNewIngredientModal">
            Cancelar
          </BaseButton>

          <BaseButton
            variant="primary"
            :loading="creatingIngredient"
            @click="saveNewIngredient"
          >
            <Save :size="18" />
            Cadastrar
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal de Sucesso / Erro -->
    <BaseModal :show="showMessageModal" @close="closeMessageModal">
      <div class="flex flex-col items-center text-center">
        <div
          v-if="modalType === 'success'"
          class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
        >
          <CheckCircle class="text-emerald-600" :size="36" />
        </div>

        <div
          v-else
          class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4"
        >
          <CircleAlert class="text-red-600" :size="36" />
        </div>

        <h3 class="text-xl font-bold text-slate-800 mb-2">
          {{ modalTitle }}
        </h3>

        <p class="text-sm text-slate-500 mb-6">
          {{ modalMessage }}
        </p>

        <div class="w-full flex justify-end">
          <BaseButton variant="primary" @click="closeMessageModal">
            Fechar
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
