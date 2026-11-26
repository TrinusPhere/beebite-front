<script setup>
import { ref, computed, onMounted, watch } from "vue";
import {
  MessageSquare,
  Utensils,
  CheckCircle2,
  ExternalLink,
  Cloud,
  HardDrive,
  ArrowRightLeft,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { integrationService } from "@/services/integrationService";
import { authState } from "@/utils/auth";

const integrations = ref({ whatsapp: {}, ifood: {} });
const saving = ref(false);
const errorMsg = ref("");
const whatsapp = ref({
  provider: "META_CLOUD_API",
  phoneNumber: "",
  businessAccountId: "",
  accessToken: "",
});
const ifood = ref({ clientId: "", clientSecret: "", merchantId: "" });

const activeStoreId = computed(
  () => authState.currentUser?.storeId || "00000000-0000-0000-0000-000000000001",
);
const activeStore = computed(() =>
  (authState.accessibleStores || []).find((s) => s.id === activeStoreId.value) || null,
);
const isActiveStoreEdge = computed(() => activeStore.value?.syncMode === "EDGE");

const cloudSiblingStore = computed(() => {
  const stores = authState.accessibleStores || [];
  const currentCatalogId = activeStore.value?.catalogId;
  if (currentCatalogId) {
    const sameCatalogCloud = stores.find(
      (s) => s.catalogId === currentCatalogId && s.syncMode === "CLOUD" && s.id !== activeStoreId.value,
    );
    if (sameCatalogCloud) return sameCatalogCloud;
  }
  return stores.find((s) => s.syncMode === "CLOUD" && s.id !== activeStoreId.value) || null;
});

const load = async () => {
  errorMsg.value = "";
  try {
    integrations.value = await integrationService.getAll();
    whatsapp.value = {
      provider: "META_CLOUD_API",
      phoneNumber: "",
      businessAccountId: "",
      accessToken: "",
      ...(integrations.value.whatsapp || {}),
    };
    ifood.value = {
      clientId: "",
      clientSecret: "",
      merchantId: "",
      ...(integrations.value.ifood || {}),
    };
  } catch (err) {
    console.error("Erro ao carregar integrações", err);
  }
};

onMounted(async () => {
  if (!authState.accessibleStores || authState.accessibleStores.length === 0) {
    await authState.refreshAccessibleStores();
  }
  await load();
});

watch(activeStoreId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await load();
  }
});

const switchToCloudStore = async () => {
  if (!cloudSiblingStore.value) return;
  await authState.switchStore(cloudSiblingStore.value.id);
};

const saveWhatsapp = async () => {
  saving.value = true;
  errorMsg.value = "";
  try {
    await integrationService.saveWhatsapp(whatsapp.value);
    await load();
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || "Erro ao salvar configuração do WhatsApp.";
  } finally {
    saving.value = false;
  }
};

const saveIfood = async () => {
  if (isActiveStoreEdge.value) return;
  saving.value = true;
  errorMsg.value = "";
  try {
    await integrationService.saveIfood(ifood.value);
    await integrationService.authorizeIfood(activeStoreId.value, ifood.value);
    await load();
  } catch (e) {
    console.error(e);
    errorMsg.value =
      e?.response?.data?.message ||
      "Erro ao autorizar no iFood. Verifique suas credenciais e o Merchant ID.";
  } finally {
    saving.value = false;
  }
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

    <div
      v-if="errorMsg"
      class="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold"
    >
      {{ errorMsg }}
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
          servidor.
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
        <div class="flex justify-between items-center">
          <h2 class="font-black flex gap-2 items-center text-red-600">
            <Utensils :size="19" /> iFood
          </h2>
          <span
            :class="[
              'text-xs font-black px-3 py-1 rounded-full',
              integrations.ifood?.status === 'configured'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500',
            ]"
            >{{ integrations.ifood?.status || "disconnected" }}</span
          >
        </div>

        <!-- Orientação inteligente quando a unidade selecionada for EDGE -->
        <div
          v-if="isActiveStoreEdge"
          class="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3 text-xs text-amber-900"
        >
          <div class="flex items-center gap-2 font-black text-amber-800 text-sm">
            <HardDrive :size="17" />
            <span>Esta unidade é Local / Balcão (EDGE)</span>
          </div>
          <p class="leading-relaxed">
            A conexão oficial do iFood (pedidos em tempo real e credenciais OAuth) deve ser vinculada à
            <strong>unidade Cloud / Delivery</strong> da sua marca. Como o cardápio
            <strong>({{ activeStore?.catalogName || "Cardápio Principal" }})</strong> é compartilhado, todos os produtos
            cadastrados aqui no Balcão já sincronizam automaticamente com a loja Delivery e com o iFood!
          </p>
          <button
            v-if="cloudSiblingStore"
            @click="switchToCloudStore"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors"
          >
            <Cloud :size="15" />
            <span>Alternar para {{ cloudSiblingStore.name }} (Cloud)</span>
            <ArrowRightLeft :size="14" />
          </button>
        </div>

        <template v-else>
          <div
            class="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-900 leading-relaxed"
          >
            <strong>Unidade Cloud ativa:</strong> {{ activeStore?.name || "Loja Principal" }} ·
            Cardápio vinculado: <strong>{{ activeStore?.catalogName || "Cardápio Principal" }}</strong>.
            Os pedidos do iFood cairão nesta unidade e os itens sincronizam com todas as lojas do mesmo cardápio.
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
              placeholder="UUID da loja no Portal do Parceiro iFood" /></label
          ><BaseButton class="w-full" :loading="saving" @click="saveIfood"
            ><ExternalLink :size="18" /> Salvar e autorizar</BaseButton
          >
          <div
            v-if="integrations.ifood?.status === 'configured'"
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
          <div v-if="integrations.ifood?.status === 'configured'" class="mt-4">
            <router-link to="/integracoes/ifood-sync" class="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
              Sincronizar Cardápio Compartilhado (iFood ↔ BeeBite)
            </router-link>
          </div>
        </template>
      </section>
    </div>

    <div class="bg-white border rounded-3xl p-6">
      <h2 class="font-black mb-3">Contrato de integração previsto</h2>
      <div class="grid md:grid-cols-4 gap-3 text-sm">
        <div class="bg-slate-50 p-3 rounded-xl">Pedidos e eventos</div>
        <div class="bg-slate-50 p-3 rounded-xl">Catálogo compartilhado</div>
        <div class="bg-slate-50 p-3 rounded-xl">Disponibilidade global</div>
        <div class="bg-slate-50 p-3 rounded-xl">Chat oficial suportado</div>
      </div>
    </div>
  </div>
</template>
