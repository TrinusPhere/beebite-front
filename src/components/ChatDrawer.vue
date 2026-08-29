<script setup>
import { ref, computed, watch, nextTick } from "vue";
import {
  X,
  Send,
  MessageSquare,
  Utensils,
  AlertCircle,
  Link2,
  User,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { chatService } from "@/services/chatService";
import { normalizeOrderContext, CHANNELS } from "@/utils/orderContext";

const props = defineProps({
  show: Boolean,
  order: Object,
  integrations: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["close", "updated"]);
const messageInput = ref("");
const conversations = ref([]);
const activeChannel = ref("");
const loading = ref(false);
const sending = ref(false);
const chatContainer = ref(null);

const orderContext = computed(() => normalizeOrderContext(props.order || {}));
const orderLabel = computed(
  () => props.order?.displayId || props.order?.id || "—",
);
const isWhatsappConnected = computed(() => {
  const wa = props.integrations?.whatsapp || {};
  return (
    ["connected", "configured"].includes(
      String(wa.status || "").toLowerCase(),
    ) || Boolean(wa.phoneNumber && wa.businessAccountId)
  );
});
const isIfoodConnected = computed(() =>
  ["connected", "configured"].includes(
    String(props.integrations?.ifood?.status || "").toLowerCase(),
  ),
);
const availableChannels = computed(() => {
  const out = [];
  const orderId = String(props.order?.id || "").replace(/^#/, "");
  const existingChannels = new Set(
    conversations.value
      .filter(
        (conversation) =>
          String(conversation.orderId || "").replace(/^#/, "") === orderId,
      )
      .map((conversation) => String(conversation.channel || "").toUpperCase()),
  );
  const preferred = String(orderContext.value.channel || "").toUpperCase();
  if (isWhatsappConnected.value)
    out.push({
      value: CHANNELS.WHATSAPP,
      label: "WhatsApp",
      icon: MessageSquare,
    });
  if (isIfoodConnected.value)
    out.push({ value: CHANNELS.IFOOD, label: "iFood", icon: Utensils });
  if (
    existingChannels.has(CHANNELS.WHATSAPP) &&
    !out.some((channel) => channel.value === CHANNELS.WHATSAPP)
  )
    out.push({
      value: CHANNELS.WHATSAPP,
      label: "WhatsApp",
      icon: MessageSquare,
    });
  if (
    existingChannels.has(CHANNELS.IFOOD) &&
    !out.some((channel) => channel.value === CHANNELS.IFOOD)
  )
    out.push({ value: CHANNELS.IFOOD, label: "iFood", icon: Utensils });
  if (existingChannels.has(CHANNELS.BRENDI) || preferred === CHANNELS.BRENDI)
    out.push({
      value: CHANNELS.BRENDI,
      label: "Brendi",
      icon: MessageSquare,
    });
  return out;
});
const currentConversation = computed(() => {
  const orderId = String(props.order?.id ?? "").replace(/^#/, "");
  return (
    conversations.value.find(
      (c) =>
        String(c.channel || "").toUpperCase() === activeChannel.value &&
        String(c.orderId ?? "").replace(/^#/, "") === orderId,
    ) || null
  );
});
const messages = computed(() => currentConversation.value?.messages || []);
const activeChannelMeta = computed(() =>
  availableChannels.value.find((c) => c.value === activeChannel.value),
);

const chooseInitialChannel = () => {
  const preferred = String(orderContext.value.channel || "").toUpperCase();
  activeChannel.value = availableChannels.value.some(
    (c) => c.value === preferred,
  )
    ? preferred
    : availableChannels.value[0]?.value || "";
};
const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value)
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
};
const loadConversations = async () => {
  loading.value = true;
  try {
    conversations.value = await chatService.list();
    chooseInitialChannel();
    await scrollToBottom();
  } finally {
    loading.value = false;
  }
};
watch(
  () => props.show,
  async (open) => {
    if (open) {
      messageInput.value = "";
      await loadConversations();
    }
  },
);
watch(activeChannel, scrollToBottom);
watch(currentConversation, async (conversation) => {
  if (props.show && conversation && Number(conversation.unread || 0) > 0) {
    conversation.unread = 0;
    await chatService.update(conversation.id, { unread: 0 });
    emit("updated");
  }
});
const sendMessage = async () => {
  const content = messageInput.value.trim();
  if (!content || !activeChannel.value || !props.order) return;
  sending.value = true;
  try {
    let c = currentConversation.value;
    if (!c)
      c = await chatService.getOrCreate({
        orderId: props.order.id,
        channel: activeChannel.value,
        operation: orderContext.value.operation,
        customerName: props.order.customerName || "Cliente Avulso",
        customerPhone: props.order.customerPhone || props.order.phone || "",
      });
    await chatService.send(c.id, content);
    messageInput.value = "";
    conversations.value = await chatService.list();
    emit("updated");
    await scrollToBottom();
  } finally {
    sending.value = false;
  }
};
const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
</script>

<template>
  <transition
    enter-active-class="transition ease-out duration-300 transform"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition ease-in duration-200 transform"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div v-if="show" class="fixed inset-0 z-[80] flex justify-end sm:items-end sm:p-4">
      <button
        class="absolute inset-0 bg-slate-950/15"
        aria-label="Fechar chat"
        @click="$emit('close')"
      ></button>
      <aside
        class="relative w-full sm:w-[330px] bg-white shadow-2xl flex flex-col h-full sm:h-[500px] sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl overflow-hidden border border-slate-200"
      >
        <header class="p-3 border-b border-slate-200 bg-white">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div
                class="flex items-center gap-2 text-orange-600 font-black text-xs uppercase tracking-wider"
              >
                <MessageSquare :size="16" /> Chat do pedido {{ orderLabel }}
              </div>
              <h2 class="mt-1 text-lg font-black text-slate-800">
                {{ order?.customerName || "Cliente Avulso" }}
              </h2>
              <p class="text-xs text-slate-500">
                {{
                  orderContext.operation === "DELIVERY"
                    ? "Operação Delivery"
                    : "Operação Salão"
                }}
                · {{ orderContext.serviceType }}
              </p>
            </div>
            <button
              class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              @click="$emit('close')"
            >
              <X :size="22" />
            </button>
          </div>
          <div
            v-if="availableChannels.length"
            class="flex gap-2 mt-4 overflow-x-auto pb-1"
          >
            <button
              v-for="channel in availableChannels"
              :key="channel.value"
              @click="activeChannel = channel.value"
              :class="[
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black border transition-all whitespace-nowrap',
                activeChannel === channel.value
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400',
              ]"
            >
              <component :is="channel.icon" :size="15" /> {{ channel.label }}
            </button>
          </div>
        </header>

        <div
          v-if="!availableChannels.length"
          class="flex-1 flex items-center justify-center p-8 bg-slate-50"
        >
          <div class="max-w-sm text-center">
            <div
              class="mx-auto w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center"
            >
              <AlertCircle :size="28" />
            </div>
            <h3 class="font-black text-slate-800 mt-4">
              Nenhum chat integrado
            </h3>
            <p class="text-sm text-slate-500 mt-2">
              Configure e conecte WhatsApp ou iFood em Integrações. Somente
              canais já conectados aparecem aqui.
            </p>
          </div>
        </div>
        <template v-else>
          <div
            class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs"
          >
            <div class="flex items-center gap-2 text-slate-600">
              <Link2 :size="14" /><span>Canal ativo:</span
              ><b>{{ activeChannelMeta?.label }}</b>
            </div>
            <span
              v-if="orderContext.channel === activeChannel"
              class="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg font-black"
              >Canal do pedido</span
            >
          </div>
          <div
            ref="chatContainer"
            class="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50"
          >
            <div v-if="loading" class="text-center text-sm text-slate-400 py-8">
              Carregando conversa...
            </div>
            <div v-else-if="!messages.length" class="text-center py-10">
              <User :size="30" class="mx-auto text-slate-300" />
              <p class="mt-3 text-sm font-bold text-slate-600">
                Nenhuma mensagem neste canal para o pedido.
              </p>
              <p class="text-xs text-slate-400 mt-1">
                Você pode iniciar a conversa abaixo quando a política do canal
                permitir.
              </p>
            </div>
            <div
              v-for="msg in messages"
              :key="msg.id"
              :class="[
                'flex',
                msg.direction === 'OUTBOUND' || msg.sender === 'operator'
                  ? 'justify-end'
                  : 'justify-start',
              ]"
            >
              <div
                :class="[
                  'max-w-[82%] px-4 py-3 rounded-2xl shadow-sm',
                  msg.direction === 'OUTBOUND' || msg.sender === 'operator'
                    ? 'bg-orange-500 text-white rounded-br-md'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md',
                ]"
              >
                <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                <span
                  :class="[
                    'block text-[10px] mt-1 text-right',
                    msg.direction === 'OUTBOUND' || msg.sender === 'operator'
                      ? 'text-orange-100'
                      : 'text-slate-400',
                  ]"
                  >{{ formatTime(msg.createdAt || msg.timestamp) }}</span
                >
              </div>
            </div>
          </div>
          <footer class="p-4 border-t border-slate-200 bg-white">
            <div class="flex items-end gap-2">
              <textarea
                v-model="messageInput"
                rows="2"
                @keydown.enter.exact.prevent="sendMessage"
                class="flex-1 resize-none border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                :placeholder="`Responder pelo ${activeChannelMeta?.label || 'canal'}...`"
              ></textarea>
              <BaseButton
                class="min-h-[46px]"
                @click="sendMessage"
                :loading="sending"
                :disabled="!messageInput.trim()"
                ><Send :size="18"
              /></BaseButton>
            </div>
            <p class="text-[10px] text-slate-400 mt-2">
              O envio real depende do backend e das regras oficiais de cada
              plataforma.
            </p>
          </footer>
        </template>
      </aside>
    </div>
  </transition>
</template>
