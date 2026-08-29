<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { UserPlus, Edit, Trash2, Users } from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { userService } from "@/services/userService";

const router = useRouter();
const users = ref([]);

const fetchUsers = async () => {
  try {
    users.value = await userService.getAll();
  } catch (error) {
    console.error("Erro ao buscar usuários", error);
  }
};

onMounted(() => {
  fetchUsers();
});

const goToAddUser = () => {
  router.push("/usuarios/novo");
};

const goToEditUser = (user) => {
  router.push(`/usuarios/editar/${user.id}`);
};

const deleteUser = async (userId) => {
  if (confirm("Tem certeza que deseja excluir este usuário?")) {
    try {
      await userService.delete(userId);
      await fetchUsers(); // Atualiza a lista
    } catch (error) {
      console.error("Erro ao excluir usuário", error);
      alert("Erro ao excluir usuário.");
    }
  }
};
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
          Cadastre e gerencie os usuários do sistema.
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
            Usuários Cadastrados
          </h3>
          <p class="text-xs text-slate-400 font-medium mt-0.5">
            Lista de todos os usuários com acesso ao sistema.
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
                Cargo/Role
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
              <td class="p-4 font-medium text-slate-600 text-sm">
                {{ user.login }}
              </td>
              <td class="p-4 font-medium text-slate-600 text-sm">
                {{ user.role }}
              </td>
              <td class="p-4 text-sm">
                <span
                  v-for="perm in user.permissions"
                  :key="perm"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1"
                >
                  {{ perm }}
                </span>
              </td>
              <td class="p-4 text-right">
                <div class="flex justify-end gap-2">
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
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td
                colspan="5"
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
