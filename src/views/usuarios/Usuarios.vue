<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { UserPlus, Edit, Trash2, Users, Store } from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { userService } from "@/services/userService";
import { authState } from "@/utils/auth";

const router = useRouter();
const users = ref([]);
const actionError = ref("");

const fetchUsers = async () => {
  try {
    users.value = await userService.getAll();
  } catch (error) {
    console.error("Erro ao buscar usuários", error);
  }
};

onMounted(async () => {
  if (!authState.accessibleStores?.length && authState.currentUser) {
    await authState.refreshAccessibleStores();
  }
  await fetchUsers();
});

const storeNameById = computed(() => {
  const map = {};
  const stores = Array.isArray(authState.accessibleStores)
    ? authState.accessibleStores
    : [];
  for (const s of stores) {
    if (s.storeId) {
      map[s.storeId] = s.storeName;
    }
  }
  return map;
});

const resolveStoreNames = (user) => {
  const ids =
    Array.isArray(user.storeIds) && user.storeIds.length > 0
      ? user.storeIds
      : user.storeId
        ? [user.storeId]
        : [];
  return ids.map((id) => storeNameById.value[id] || id);
};

const canManageUser = (targetUser) => {
  if (!targetUser) return false;
  if (targetUser.role === "SUPER_ADMIN") return false;
  const callerRole = authState.currentUser?.role;
  if (callerRole === "GERENTE" && targetUser.role === "ADMIN") {
    return false;
  }
  return true;
};

const goToAddUser = () => {
  router.push("/usuarios/novo");
};

const goToEditUser = (user) => {
  router.push(`/usuarios/editar/${user.id}`);
};

const deleteUser = async (userId) => {
  actionError.value = "";
  if (
    confirm(
      "Tem certeza que deseja excluir este usuário? (Para remover o acesso apenas de uma loja, use Editar.)",
    )
  ) {
    try {
      await userService.delete(userId);
      await fetchUsers();
    } catch (error) {
      console.error("Erro ao excluir usuário", error);
      actionError.value =
        error.response?.data?.message || "Erro ao excluir usuário.";
    }
  }
};

const roleLabels = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  GERENTE: "Gerente",
  CAIXA: "Caixa / Operador",
};

const permissionLabels = {
  dashboard: "Dashboard",
  caixa: "Caixa PDV",
  pedidos: "Pedidos",
  kds: "KDS (Cozinha)",
  produtos: "Produtos",
  ingredientes: "Ingredientes",
  clientes: "Clientes",
  entregadores: "Entregadores",
  acerto_entregadores: "Acerto Entregadores",
  financeiro: "Financeiro",
  integracoes: "Integrações",
  usuarios: "Usuários",
};

const getPermissionLabel = (perm) => permissionLabels[perm] || perm;
const getRoleLabel = (role) => roleLabels[role] || role;
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">
          Gestão de Usuários 👥
        </h1>
        <p class="text-slate-500 text-sm font-medium">
          Cadastre operadores, caixas e gerentes com acesso às suas lojas.
        </p>
      </div>
      <BaseButton
        @click="goToAddUser"
        variant="primary"
        class="w-full md:w-auto"
      >
        <UserPlus :size="20" />
        Novo Usuário
      </BaseButton>
    </div>

    <div
      v-if="actionError"
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-semibold"
    >
      {{ actionError }}
    </div>

    <!-- Lista de Usuários -->
    <div
      class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
    >
      <div class="p-6 border-b border-slate-50 flex items-center gap-3">
        <div class="p-2 bg-blue-50 text-blue-600 rounded-xl">
          <Users :size="20" />
        </div>
        <div>
          <h3
            class="font-black text-slate-800 text-sm uppercase tracking-widest"
          >
            Usuários da Unidade
          </h3>
          <p class="text-xs text-slate-400 font-medium mt-0.5">
            Colaboradores com acesso ativo a esta unidade.
          </p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50">
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
              >
                Nome
              </th>
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
              >
                Login
              </th>
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
              >
                Cargo / Perfil
              </th>
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
              >
                Lojas
              </th>
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100"
              >
                Permissões
              </th>
              <th
                class="p-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right"
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="p-4 font-bold text-slate-800 text-sm">
                {{ user.name }}
              </td>
              <td class="p-4 font-medium text-slate-600 text-sm font-mono">
                {{ user.login }}
              </td>
              <td class="p-4 font-medium text-slate-600 text-sm">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border',
                    user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : user.role === 'GERENTE'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200',
                  ]"
                >
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              <td class="p-4 text-xs max-w-[200px]">
                <span
                  v-for="storeName in resolveStoreNames(user)"
                  :key="storeName"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mr-1 mb-1"
                >
                  <Store :size="11" />
                  {{ storeName }}
                </span>
              </td>
              <td class="p-4 text-sm max-w-xs">
                <span
                  v-if="user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200"
                >
                  ⚡ Acesso Total (Admin)
                </span>
                <template v-else>
                  <span
                    v-for="perm in user.permissions"
                    :key="perm"
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 mr-1 mb-1"
                  >
                    {{ getPermissionLabel(perm) }}
                  </span>
                  <span
                    v-if="!user.permissions || user.permissions.length === 0"
                    class="text-xs text-slate-400 italic"
                  >
                    Nenhuma permissão atribuída
                  </span>
                </template>
              </td>
              <td class="p-4 text-right">
                <div v-if="canManageUser(user)" class="flex justify-end gap-2">
                  <BaseButton
                    @click="goToEditUser(user)"
                    variant="ghost"
                    size="sm"
                  >
                    <Edit :size="16" />
                  </BaseButton>
                  <BaseButton
                    @click="deleteUser(user.id)"
                    variant="ghost"
                    size="sm"
                    color="red"
                  >
                    <Trash2 :size="16" />
                  </BaseButton>
                </div>
                <span v-else class="text-[11px] text-slate-400 font-medium">
                  Protegido
                </span>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td
                colspan="6"
                class="p-8 text-center text-slate-400 font-medium text-sm"
              >
                Nenhum usuário cadastrado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
