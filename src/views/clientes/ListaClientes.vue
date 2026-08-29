<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  Phone,
  MapPin,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { customerService } from "@/services/customerService";

const router = useRouter();
const searchQuery = ref("");
const clients = ref([]);
const loading = ref(true);

const fetchClients = async () => {
  loading.value = true;
  try {
    clients.value = await customerService.getAll();
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    alert("Erro ao carregar clientes. Tente novamente.");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchClients();
});

const filteredClients = computed(() => {
  if (!searchQuery.value) return clients.value;

  return clients.value.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery.value)),
  );
});

const removeClient = async (id) => {
  if (confirm("Tem certeza que deseja excluir este cliente?")) {
    try {
      await customerService.delete(id);
      clients.value = clients.value.filter((item) => item.id !== id);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      alert("Erro ao excluir cliente.");
    }
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
          Clientes
        </h1>
        <p class="text-slate-500 text-sm font-medium">
          Gerencie sua base de clientes fiéis
        </p>
      </div>

      <BaseButton variant="primary" @click="router.push('/clientes/novo')">
        <Plus :size="20" />
        Novo Cliente
      </BaseButton>
    </div>

    <!-- Tabela Padronizada -->
    <div
      class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div class="p-4 border-b border-slate-100">
        <div class="relative max-w-md">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            :size="20"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nome ou telefone..."
            class="w-full bg-slate-50 border border-slate-200 text-sm pl-10 p-2.5 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr
              class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest"
            >
              <th class="px-6 py-4">Nome do Cliente</th>
              <th class="px-6 py-4">Contato</th>
              <th class="px-6 py-4 text-center">Pedidos</th>
              <th class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr
              v-for="item in filteredClients"
              :key="item.id"
              class="hover:bg-slate-50 transition-colors group"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 font-black text-xs"
                  >
                    {{ item.name.charAt(0) }}
                  </div>
                  <span
                    class="font-bold text-slate-700 group-hover:text-orange-600 transition-colors"
                    >{{ item.name }}</span
                  >
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col gap-1">
                  <span
                    class="text-xs font-bold text-slate-600 flex items-center gap-1.5"
                  >
                    <Phone :size="12" class="text-slate-400" /> {{ item.phone }}
                  </span>
                  <span
                    class="text-[10px] font-medium text-slate-400 flex items-center gap-1.5"
                  >
                    <MapPin :size="12" class="text-slate-300" />
                    {{ item.address }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span
                  class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter"
                >
                  {{ item.totalOrders }} Pedidos
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    @click="router.push(`/clientes/editar/${item.id}`)"
                    class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit2 :size="16" />
                  </button>
                  <button
                    @click="removeClient(item.id)"
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
        v-if="loading"
        class="py-12 text-center text-slate-400 text-sm font-medium"
      >
        Carregando clientes...
      </div>
      <div
        v-else-if="filteredClients.length === 0"
        class="py-12 text-center text-slate-400 text-sm font-medium"
      >
        Nenhum cliente encontrado.
      </div>
    </div>
  </div>
</template>
