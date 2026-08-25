<script setup>
import { ref, onMounted } from "vue";
import { Factory, Plus, Trash2, Save } from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { productionSectorService } from "@/services/productionSectorService";
const sectors = ref([]);
const form = ref({ name: "", active: true });
const loading = ref(false);
const load = async () =>
  (sectors.value = await productionSectorService.getAll());
onMounted(load);
const save = async () => {
  if (!form.value.name.trim()) return;
  loading.value = true;
  await productionSectorService.save({
    ...form.value,
    name: form.value.name.trim(),
  });
  form.value = { name: "", active: true };
  await load();
  loading.value = false;
};
const remove = async (id) => {
  await productionSectorService.remove(id);
  await load();
};
</script>
<template>
  <div class="max-w-6xl mx-auto space-y-6 pb-20">
    <div>
      <h1 class="text-2xl font-black text-slate-800">Setores de Produção</h1>
      <p class="text-sm text-slate-500">
        Defina os destinos de produção e impressão dos produtos.
      </p>
    </div>
    <div class="grid lg:grid-cols-[360px_1fr] gap-6">
      <div class="bg-white border rounded-3xl p-6 space-y-4">
        <div class="flex items-center gap-2 font-bold text-orange-600">
          <Factory :size="18" /> Novo setor
        </div>
        <input
          v-model="form.name"
          class="w-full bg-slate-50 border p-3 rounded-xl"
          placeholder="Ex.: Cozinha, Bar, Expedição"
        /><label class="flex gap-2 text-sm"
          ><input v-model="form.active" type="checkbox" /> Ativo</label
        ><BaseButton class="w-full" :loading="loading" @click="save"
          ><Save :size="18" /> Salvar setor</BaseButton
        >
      </div>
      <div class="bg-white border rounded-3xl p-6">
        <div v-if="!sectors.length" class="text-slate-400">
          Nenhum setor cadastrado.
        </div>
        <div
          v-for="s in sectors"
          :key="s.id"
          class="flex items-center justify-between p-4 border-b last:border-b-0"
        >
          <div>
            <p class="font-bold text-slate-800">{{ s.name }}</p>
            <p
              class="text-xs"
              :class="
                s.active !== false ? 'text-emerald-600' : 'text-slate-400'
              "
            >
              {{ s.active !== false ? "Ativo" : "Inativo" }}
            </p>
          </div>
          <button class="text-red-500 p-2" @click="remove(s.id)">
            <Trash2 :size="18" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
