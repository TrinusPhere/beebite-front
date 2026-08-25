<script setup>
import { ref, onMounted } from "vue";
import { Printer, Plus, TestTube2, Trash2 } from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { printingService } from "@/services/printingService";
import { productionSectorService } from "@/services/productionSectorService";
const printers = ref([]),
  rules = ref([]),
  sectors = ref([]);
const printer = ref({
  name: "",
  connectionType: "NETWORK",
  address: "",
  active: true,
});
const rule = ref({
  name: "",
  operation: "DELIVERY",
  documentType: "KITCHEN",
  sectorId: "",
  printerId: "",
});
const load = async () => {
  [printers.value, rules.value, sectors.value] = await Promise.all([
    printingService.getPrinters(),
    printingService.getRules(),
    productionSectorService.getAll(),
  ]);
  if (!rule.value.sectorId && sectors.value.length) {
    const kitchen = sectors.value.find(
      (s) => String(s.code || "").toUpperCase() === "KITCHEN",
    );
    rule.value.sectorId = (kitchen || sectors.value[0]).id;
  }
};
onMounted(load);
const savePrinter = async () => {
  if (!printer.value.name) return;
  await printingService.savePrinter(printer.value);
  printer.value = {
    name: "",
    connectionType: "NETWORK",
    address: "",
    active: true,
  };
  await load();
};
const saveRule = async () => {
  if (!rule.value.name || !rule.value.printerId) return;
  await printingService.saveRule(rule.value);
  rule.value = {
    name: "",
    operation: "DELIVERY",
    documentType: "KITCHEN",
    sectorId:
      sectors.value.find(
        (s) => String(s.code || "").toUpperCase() === "KITCHEN",
      )?.id ||
      sectors.value[0]?.id ||
      "",
    printerId: "",
  };
  await load();
};
const del = async (id) => {
  await printingService.deletePrinter(id);
  await load();
};
const test = async (p) => {
  const r = await printingService.testPrint(p);
  alert(
    r.simulated
      ? "Teste simulado: backend de impressão ainda não disponível."
      : "Teste enviado para a impressora.",
  );
};
</script>
<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <div>
      <h1 class="text-2xl font-black text-slate-800">
        Impressoras e Roteamento
      </h1>
      <p class="text-sm text-slate-500">
        Configure impressoras por operação, setor e tipo de comanda.
      </p>
    </div>
    <div class="grid lg:grid-cols-2 gap-6">
      <section class="bg-white border rounded-3xl p-6 space-y-4">
        <h2 class="font-black flex items-center gap-2">
          <Printer :size="18" /> Impressoras
        </h2>
        <input
          v-model="printer.name"
          class="w-full border bg-slate-50 p-3 rounded-xl"
          placeholder="Nome da impressora"
        />
        <div class="grid grid-cols-2 gap-3">
          <select
            v-model="printer.connectionType"
            class="border bg-slate-50 p-3 rounded-xl"
          >
            <option>NETWORK</option>
            <option>USB</option>
            <option>LOCAL_AGENT</option></select
          ><input
            v-model="printer.address"
            class="border bg-slate-50 p-3 rounded-xl"
            placeholder="IP/porta ou identificador"
          />
        </div>
        <BaseButton class="w-full" @click="savePrinter"
          ><Plus :size="18" /> Adicionar</BaseButton
        >
        <div
          v-for="p in printers"
          :key="p.id"
          class="p-4 border rounded-2xl flex justify-between gap-3"
        >
          <div>
            <b>{{ p.name }}</b>
            <p class="text-xs text-slate-500">
              {{ p.connectionType }} • {{ p.address || "sem endereço" }}
            </p>
          </div>
          <div class="flex">
            <button @click="test(p)" class="p-2 text-orange-600">
              <TestTube2 :size="18" /></button
            ><button @click="del(p.id)" class="p-2 text-red-500">
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
      </section>
      <section class="bg-white border rounded-3xl p-6 space-y-4">
        <h2 class="font-black">Regras de impressão</h2>
        <input
          v-model="rule.name"
          class="w-full border bg-slate-50 p-3 rounded-xl"
          placeholder="Ex.: Cozinha Delivery"
        />
        <div class="grid grid-cols-2 gap-3">
          <select
            v-model="rule.operation"
            class="border bg-slate-50 p-3 rounded-xl"
          >
            <option value="DELIVERY">Delivery</option>
            <option value="SALAO">Salão</option></select
          ><select
            v-model="rule.documentType"
            class="border bg-slate-50 p-3 rounded-xl"
          >
            <option value="KITCHEN">Via cozinha</option>
            <option value="EXPEDITION">Via expedição</option>
            <option value="SECTOR">Por setor</option></select
          ><select
            v-model="rule.sectorId"
            class="border bg-slate-50 p-3 rounded-xl"
          >
            <option v-for="s in sectors" :key="s.id" :value="s.id">
              {{ s.name }}
            </option></select
          ><select
            v-model="rule.printerId"
            class="border bg-slate-50 p-3 rounded-xl"
          >
            <option value="">Selecione impressora</option>
            <option v-for="p in printers" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>
        <BaseButton class="w-full" @click="saveRule">Salvar regra</BaseButton>
        <div v-for="r in rules" :key="r.id" class="p-4 border rounded-2xl">
          <b>{{ r.name }}</b>
          <p class="text-xs text-slate-500">
            {{ r.operation }} • {{ r.documentType }} •
            {{ sectors.find((s) => s.id === r.sectorId)?.name || r.sectorId }}
          </p>
        </div>
      </section>
    </div>
    <div
      class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800"
    >
      <b>Regra de segurança:</b> o frontend apenas configura as regras. A
      decisão final de impressão deve ser executada pelo backend/serviço local
      de impressão, nunca pelo filtro visual do painel.
    </div>
  </div>
</template>
