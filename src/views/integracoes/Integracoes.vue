<script setup>
import { ref, onMounted } from "vue";
import {
  MessageSquare,
  Utensils,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { integrationService } from "@/services/integrationService";
const integrations = ref({ whatsapp: {}, ifood: {} });
const saving = ref(false);
const whatsapp = ref({
  provider: "META_CLOUD_API",
  phoneNumber: "",
  businessAccountId: "",
  accessToken: "",
});
const ifood = ref({ clientId: "", clientSecret: "", merchantId: "" });
const load = async () => {
  integrations.value = await integrationService.getAll();
  whatsapp.value = { ...whatsapp.value, ...integrations.value.whatsapp };
  ifood.value = { ...ifood.value, ...integrations.value.ifood };
};
onMounted(load);
const saveWhatsapp = async () => {
  saving.value = true;
  await integrationService.saveWhatsapp(whatsapp.value);
  await load();
  saving.value = false;
};
const saveIfood = async () => {
  saving.value = true;
  await integrationService.saveIfood(ifood.value);
  await integrationService.authorizeIfood();
  await load();
  saving.value = false;
};
const toggleStore = async () => {
  await integrationService.toggleIfoodStore(
    integrations.value.ifood.storeStatus !== "open",
  );
  await load();
};
</script>
<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <div>
      <h1 class="text-2xl font-black text-slate-800">Integrações</h1>
      <p class="text-sm text-slate-500">
        Configure canais externos sem misturar as regras específicas com o
        núcleo do PDV.
      </p>
    </div>
    <div class="grid lg:grid-cols-2 gap-6">
      <section class="bg-white border rounded-3xl p-6 space-y-5">
        <div class="flex justify-between">
          <h2 class="font-black flex gap-2 items-center text-emerald-700">
            <MessageSquare :size="19" /> WhatsApp Business
          </h2>
          <span
            :class="[
              'text-xs font-black px-3 py-1 rounded-full',
              integrations.whatsapp?.status === 'connected'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500',
            ]"
            >{{ integrations.whatsapp?.status || "disconnected" }}</span
          >
        </div>
        <div
          class="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800"
        >
          Preparado para integração oficial via WhatsApp Business Platform. O
          token é enviado ao backend e deve ser armazenado de forma segura no
          servidor. O navegador não mantém uma cópia local como contingência.
        </div>
        <label class="block text-xs font-bold"
          >Provedor<select
            v-model="whatsapp.provider"
            class="mt-1 w-full border p-3 rounded-xl bg-slate-50"
          >
            <option value="META_CLOUD_API">Meta Cloud API</option>
            <option value="BSP">BSP homologado</option>
          </select></label
        ><label class="block text-xs font-bold"
          >Telefone<input
            v-model="whatsapp.phoneNumber"
            class="mt-1 w-full border p-3 rounded-xl bg-slate-50"
            placeholder="+55 85 ..." /></label
        ><label class="block text-xs font-bold"
          >Business Account ID<input
            v-model="whatsapp.businessAccountId"
            class="mt-1 w-full border p-3 rounded-xl bg-slate-50" /></label
        ><label class="block text-xs font-bold"
          >Token / referência segura<input
            v-model="whatsapp.accessToken"
            type="password"
            class="mt-1 w-full border p-3 rounded-xl bg-slate-50"
            placeholder="Não persistir no browser em produção" /></label
        ><BaseButton class="w-full" :loading="saving" @click="saveWhatsapp"
          ><CheckCircle2 :size="18" /> Salvar configuração</BaseButton
        >
      </section>
      <section class="bg-white border rounded-3xl p-6 space-y-5">
        <div class="flex justify-between">
          <h2 class="font-black flex gap-2 items-center text-red-600">
            <Utensils :size="19" /> iFood
          </h2>
          <span
            :class="[
              'text-xs font-black px-3 py-1 rounded-full',
              integrations.ifood?.status === 'connected'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500',
            ]"
            >{{ integrations.ifood?.status || "disconnected" }}</span
          >
        </div>
        <div
          class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800"
        >
          O frontend está preparado para autorização, status da loja, pedidos e
          mapeamento. OAuth, secrets, eventos e webhooks devem ficar no backend.
        </div>
        <label class="block text-xs font-bold"
          >Client ID<input
            v-model="ifood.clientId"
            class="mt-1 w-full border p-3 rounded-xl bg-slate-50" /></label
        ><label class="block text-xs font-bold"
          >Client Secret<input
            v-model="ifood.clientSecret"
            type="password"
            class="mt-1 w-full border p-3 rounded-xl bg-slate-50" /></label
        ><label class="block text-xs font-bold"
          >Merchant ID<input
            v-model="ifood.merchantId"
            class="mt-1 w-full border p-3 rounded-xl bg-slate-50"
            placeholder="Preenchido após autorização" /></label
        ><BaseButton class="w-full" :loading="saving" @click="saveIfood"
          ><ExternalLink :size="18" /> Salvar e autorizar</BaseButton
        >
        <div
          v-if="integrations.ifood?.status === 'connected'"
          class="flex items-center justify-between p-4 border rounded-2xl"
        >
          <div>
            <b>Loja iFood</b>
            <p class="text-xs text-slate-500">
              {{
                integrations.ifood.storeStatus === "open" ? "Aberta" : "Fechada"
              }}
            </p>
          </div>
          <button
            @click="toggleStore"
            class="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
          >
            {{ integrations.ifood.storeStatus === "open" ? "Fechar" : "Abrir" }}
          </button>
        </div>
      </section>
    </div>
    <div class="bg-white border rounded-3xl p-6">
      <h2 class="font-black mb-3">Contrato de integração previsto</h2>
      <div class="grid md:grid-cols-4 gap-3 text-sm">
        <div class="bg-slate-50 p-3 rounded-xl">Pedidos e eventos</div>
        <div class="bg-slate-50 p-3 rounded-xl">Catálogo/mapeamento</div>
        <div class="bg-slate-50 p-3 rounded-xl">Disponibilidade</div>
        <div class="bg-slate-50 p-3 rounded-xl">Chat oficial suportado</div>
      </div>
    </div>
  </div>
</template>
