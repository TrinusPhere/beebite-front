<script setup>
import { reactive, ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  Save,
  KeyRound,
  Lock,
  User,
  ArrowLeft,
  Store,
  ShieldAlert,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { userService } from "@/services/userService";
import { authState } from "@/utils/auth";

const router = useRouter();
const route = useRoute();

const isEditing = ref(false);
const saving = ref(false);
const errorMessage = ref("");

const currentUserForm = reactive({
  id: null,
  name: "",
  login: "",
  password: "",
  role: "",
  permissions: [],
  storeIds: [],
});

const permissionList = [
  {
    value: "dashboard",
    label: "Dashboard",
    description: "Visualização de métricas e painéis de desempenho",
  },
  {
    value: "caixa",
    label: "Caixa PDV",
    description: "Abertura, fechamento, sangrias e conferência de caixa",
  },
  {
    value: "pedidos",
    label: "Pedidos",
    description: "Gestão do Kanban de pedidos, chat e status operacional",
  },
  {
    value: "kds",
    label: "KDS (Cozinha)",
    description: "Telas de preparo touch e configurações de estações KDS",
  },
  {
    value: "produtos",
    label: "Produtos & Cardápio",
    description: "Cadastro de produtos, categorias, adicionais e impressoras",
  },
  {
    value: "ingredientes",
    label: "Ingredientes & Estoque",
    description: "Insumos, fichas técnicas e movimentações de estoque",
  },
  {
    value: "clientes",
    label: "Clientes",
    description: "Cadastro e histórico de compras de clientes",
  },
  {
    value: "entregadores",
    label: "Entregadores",
    description: "Gestão e cadastro de motoboys para entrega",
  },
  {
    value: "acerto_entregadores",
    label: "Acerto de Entregadores",
    description: "Fechamento de diárias e acerto financeiro de entregadores",
  },
  {
    value: "financeiro",
    label: "Financeiro & CMV",
    description: "Relatórios de vendas, DRE, fluxo e inteligência financeira",
  },
  {
    value: "integracoes",
    label: "Integrações",
    description: "Conexão com iFood, WhatsApp e cardápio digital",
  },
  {
    value: "usuarios",
    label: "Gestão de Usuários",
    description: "Criação e edição de operadores e gerentes da unidade",
  },
];

const callerRole = computed(() => authState.currentUser?.role || "");
const canAssignAdmin = computed(
  () => callerRole.value === "ADMIN" || callerRole.value === "SUPER_ADMIN",
);

const activeStore = computed(() => {
  const stores = Array.isArray(authState.accessibleStores)
    ? authState.accessibleStores
    : [];
  return (
    stores.find((s) => s.activeContext) ||
    stores.find(
      (s) => authState.currentUser && s.storeId === authState.currentUser.storeId,
    ) ||
    stores[0] ||
    null
  );
});

const tenantStores = computed(() => {
  const stores = Array.isArray(authState.accessibleStores)
    ? authState.accessibleStores
    : [];
  const active = activeStore.value;
  if (!active) return [];
  if (!active.tenantId) return [active];
  return stores.filter(
    (s) => s.tenantId === active.tenantId && s.storeActive !== false,
  );
});

const visiblePermissionList = computed(() =>
  currentUserForm.role === "CAIXA"
    ? permissionList.filter((p) => p.value !== "usuarios")
    : permissionList,
);

const visiblePermissionValues = computed(() =>
  visiblePermissionList.value.map((p) => p.value),
);

const selectAll = ref(false);

const toggleSelectAll = () => {
  if (selectAll.value) {
    currentUserForm.permissions = [...visiblePermissionValues.value];
  } else {
    currentUserForm.permissions = [];
  }
};

const areAllPermissionsSelected = computed(() => {
  const values = visiblePermissionValues.value;
  return (
    values.length > 0 &&
    values.every((perm) => currentUserForm.permissions.includes(perm))
  );
});

const updateSelectAllCheckbox = () => {
  selectAll.value = areAllPermissionsSelected.value;
};

const handleRoleChange = () => {
  if (currentUserForm.role === "ADMIN") {
    currentUserForm.permissions = permissionList.map((p) => p.value);
  } else if (currentUserForm.role === "CAIXA") {
    currentUserForm.permissions = currentUserForm.permissions.filter(
      (p) => p !== "usuarios",
    );
  }
  updateSelectAllCheckbox();
};

const toggleAllStores = () => {
  const allIds = tenantStores.value.map((s) => s.storeId);
  if (currentUserForm.storeIds.length === allIds.length) {
    const activeId = activeStore.value?.storeId || allIds[0];
    currentUserForm.storeIds = activeId ? [activeId] : [];
  } else {
    currentUserForm.storeIds = allIds;
  }
};

onMounted(async () => {
  if (!authState.accessibleStores?.length && authState.currentUser) {
    await authState.refreshAccessibleStores();
  }

  if (route.params.id) {
    isEditing.value = true;
    try {
      const userToEdit = await userService.getById(route.params.id);
      if (userToEdit) {
        Object.assign(currentUserForm, {
          id: userToEdit.id,
          name: userToEdit.name || "",
          login: userToEdit.login || "",
          password: "",
          role: userToEdit.role || "",
          permissions: Array.isArray(userToEdit.permissions)
            ? [...userToEdit.permissions]
            : [],
          storeIds:
            Array.isArray(userToEdit.storeIds) && userToEdit.storeIds.length > 0
              ? [...userToEdit.storeIds]
              : userToEdit.storeId
                ? [userToEdit.storeId]
                : [],
        });
        if (
          currentUserForm.role === "ADMIN" &&
          currentUserForm.permissions.length === 0
        ) {
          currentUserForm.permissions = permissionList.map((p) => p.value);
        }
        updateSelectAllCheckbox();
      }
    } catch (error) {
      console.error("Erro ao carregar usuário", error);
      router.push("/usuarios");
    }
  } else {
    const defaultStoreId =
      activeStore.value?.storeId || authState.currentUser?.storeId;
    if (defaultStoreId) {
      currentUserForm.storeIds = [defaultStoreId];
    }
    updateSelectAllCheckbox();
  }
});

const saveUser = async () => {
  errorMessage.value = "";
  const effectiveStoreIds =
    currentUserForm.storeIds.length > 0
      ? currentUserForm.storeIds
      : activeStore.value?.storeId
        ? [activeStore.value.storeId]
        : authState.currentUser?.storeId
          ? [authState.currentUser.storeId]
          : [];

  if (effectiveStoreIds.length === 0) {
    errorMessage.value = "Selecione pelo menos uma unidade para o usuário.";
    return;
  }

  saving.value = true;
  try {
    const dataToSave = {
      name: currentUserForm.name,
      login: currentUserForm.login,
      role: currentUserForm.role,
      permissions:
        currentUserForm.role === "CAIXA"
          ? currentUserForm.permissions.filter((p) => p !== "usuarios")
          : currentUserForm.permissions,
      storeIds: effectiveStoreIds,
    };

    if (!isEditing.value || currentUserForm.password) {
      dataToSave.password = currentUserForm.password;
    }

    if (isEditing.value) {
      await userService.update(currentUserForm.id, dataToSave);
    } else {
      await userService.create(dataToSave);
    }
    router.push("/usuarios");
  } catch (error) {
    console.error("Erro ao salvar usuário", error);
    errorMessage.value =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Erro ao salvar o usuário. Verifique os dados informados.";
  } finally {
    saving.value = false;
  }
};

const cancel = () => {
  router.push("/usuarios");
};
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <BaseButton @click="cancel" variant="ghost" size="sm" class="p-2">
        <ArrowLeft :size="20" />
      </BaseButton>
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">
          {{ isEditing ? "Editar Usuário" : "Novo Usuário" }}
        </h1>
        <p class="text-slate-500 text-sm font-medium">
          Preencha os dados, lojas permitidas e módulos para
          {{ isEditing ? "editar" : "cadastrar" }} o usuário.
        </p>
      </div>
    </div>

    <!-- Formulário de Cadastro/Edição de Usuário -->
    <div class="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
      <div
        v-if="errorMessage"
        class="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-semibold"
      >
        <ShieldAlert :size="18" class="shrink-0 mt-0.5" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="saveUser" class="space-y-6">
        <div class="space-y-2">
          <label class="text-sm font-bold text-slate-700 ml-1">Nome</label>
          <div class="relative group">
            <User
              class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
              :size="20"
            />
            <input
              v-model="currentUserForm.name"
              type="text"
              placeholder="Nome Completo"
              required
              class="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-700 ml-1">Login</label>
            <div class="relative group">
              <KeyRound
                class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                :size="20"
              />
              <input
                v-model="currentUserForm.login"
                type="text"
                placeholder="login.usuario"
                required
                :disabled="isEditing"
                class="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-700 ml-1">Senha</label>
            <div class="relative group">
              <Lock
                class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                :size="20"
              />
              <input
                v-model="currentUserForm.password"
                type="password"
                :placeholder="isEditing ? 'Deixe em branco para manter' : '••••••••'"
                :required="!isEditing"
                class="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-bold text-slate-700 ml-1"
            >Cargo / Perfil</label
          >
          <div class="relative group">
            <select
              v-model="currentUserForm.role"
              @change="handleRoleChange"
              required
              class="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-4 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
            >
              <option value="" disabled>Selecione um cargo</option>
              <option v-if="canAssignAdmin" value="ADMIN">Administrador</option>
              <option value="GERENTE">Gerente</option>
              <option value="CAIXA">Caixa / Operador de PDV</option>
            </select>
          </div>
          <p
            v-if="currentUserForm.role === 'GERENTE'"
            class="text-xs text-slate-500 ml-1"
          >
            Gerentes têm acesso controlado pelos módulos selecionados abaixo.
          </p>
        </div>

        <!-- Seleção Multi-Loja do Mesmo Cliente -->
        <div v-if="tenantStores.length > 0" class="space-y-3 pt-2">
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100"
          >
            <div>
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Store :size="16" class="text-orange-500" />
                Unidades (Lojas) com Acesso
              </h3>
              <p class="text-xs text-slate-400">
                Escolha em quais unidades da sua empresa este usuário poderá operar.
              </p>
            </div>
            <button
              v-if="tenantStores.length > 1"
              type="button"
              @click="toggleAllStores"
              class="bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition text-xs font-bold text-slate-700 self-start sm:self-auto"
            >
              {{
                currentUserForm.storeIds.length === tenantStores.length
                  ? "Manter Apenas Loja Atual"
                  : "Selecionar Todas as Lojas"
              }}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label
              v-for="st in tenantStores"
              :key="st.storeId"
              :class="[
                'flex items-start gap-3 p-3.5 border rounded-2xl cursor-pointer transition-all',
                currentUserForm.storeIds.includes(st.storeId)
                  ? 'border-orange-500 bg-orange-50/60 shadow-xs ring-1 ring-orange-500/30'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50',
              ]"
            >
              <input
                type="checkbox"
                :value="st.storeId"
                v-model="currentUserForm.storeIds"
                :disabled="tenantStores.length === 1"
                class="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded disabled:opacity-70"
              />
              <div class="flex flex-col select-none min-w-0">
                <span class="text-sm font-bold text-slate-800 truncate">
                  {{ st.storeName }}
                </span>
                <span class="text-xs text-slate-500 mt-0.5">
                  {{ st.syncMode === "EDGE" ? "PDV Local (Edge)" : "Online (Cloud)" }}
                </span>
              </div>
            </label>
          </div>
        </div>

        <div class="space-y-4 pt-2">
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100"
          >
            <div>
              <h3 class="text-sm font-bold text-slate-800">
                Módulos e Permissões de Acesso
              </h3>
              <p class="text-xs text-slate-400">
                Selecione quais áreas do BeeBite este usuário terá permissão para
                acessar.
              </p>
            </div>
            <label
              class="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition text-xs font-bold text-slate-700 self-start sm:self-auto"
            >
              <input
                type="checkbox"
                id="selectAllPermissions"
                v-model="selectAll"
                @change="toggleSelectAll"
                class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
              />
              Marcar Todas
            </label>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label
              v-for="perm in visiblePermissionList"
              :key="perm.value"
              :class="[
                'flex items-start gap-3 p-3.5 border rounded-2xl cursor-pointer transition-all',
                currentUserForm.permissions.includes(perm.value)
                  ? 'border-orange-500 bg-orange-50/60 shadow-xs ring-1 ring-orange-500/30'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50',
              ]"
            >
              <input
                type="checkbox"
                :id="`perm-${perm.value}`"
                :value="perm.value"
                v-model="currentUserForm.permissions"
                @change="updateSelectAllCheckbox"
                class="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
              />
              <div class="flex flex-col select-none">
                <span class="text-sm font-bold text-slate-800">{{
                  perm.label
                }}</span>
                <span class="text-xs text-slate-500 leading-tight mt-0.5">{{
                  perm.description
                }}</span>
              </div>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <BaseButton @click="cancel" variant="ghost" type="button">
            Cancelar
          </BaseButton>
          <BaseButton type="submit" variant="primary" :disabled="saving">
            <Save :size="20" />
            {{
              saving
                ? "Salvando..."
                : isEditing
                  ? "Salvar Alterações"
                  : "Adicionar Usuário"
            }}
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
