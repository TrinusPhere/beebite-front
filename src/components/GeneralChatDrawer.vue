<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { MessageCircle, Send, X } from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { chatService } from "@/services/chatService";

const props = defineProps({ show: Boolean });
const emit = defineEmits(["close", "updated"]);
const channels = ["WHATSAPP", "IFOOD", "BRENDI"];
const labels = { WHATSAPP: "WhatsApp", IFOOD: "iFood", BRENDI: "Brendi" };
const conversations = ref([]);
const activeChannel = ref("WHATSAPP");
const activeConversationId = ref(null);
const messageInput = ref("");
const loading = ref(false);
const sending = ref(false);
const messageArea = ref(null);

const channelConversations = computed(() =>
  conversations.value.filter(
    (conversation) =>
      String(conversation.channel || "").toUpperCase() === activeChannel.value,
  ),
);
const activeConversation = computed(() =>
  conversations.value.find(
    (conversation) => conversation.id === activeConversationId.value,
  ),
);
const unreadByChannel = (channel) =>
  conversations.value
    .filter((conversation) => String(conversation.channel).toUpperCase() === channel)
    .reduce((total, conversation) => total + Number(conversation.unread || 0), 0);
const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
const scrollToBottom = async () => {
  await nextTick();
  if (messageArea.value)
    messageArea.value.scrollTop = messageArea.value.scrollHeight;
};
const load = async () => {
  loading.value = true;
  try {
    conversations.value = await chatService.list();
    const currentStillExists = channelConversations.value.some(
      (conversation) => conversation.id === activeConversationId.value,
    );
    if (!currentStillExists)
      activeConversationId.value = channelConversations.value[0]?.id || null;
    await scrollToBottom();
  } finally {
    loading.value = false;
  }
};
const selectConversation = async (conversation) => {
  activeConversationId.value = conversation.id;
  if (Number(conversation.unread || 0) > 0) {
    conversation.unread = 0;
    await chatService.update(conversation.id, { unread: 0 });
    emit("updated");
  }
  await scrollToBottom();
};
const send = async () => {
  const content = messageInput.value.trim();
  if (!content || !activeConversation.value) return;
  sending.value = true;
  try {
    await chatService.send(activeConversation.value.id, content);
    messageInput.value = "";
    await load();
    emit("updated");
  } finally {
    sending.value = false;
  }
};

watch(
  () => props.show,
  (open) => open && load(),
);
watch(activeChannel, () => {
  activeConversationId.value = channelConversations.value[0]?.id || null;
  scrollToBottom();
});
</script>

<template>
  <transition
    enter-active-class="transition duration-300"
    enter-from-class="translate-x-full"
    leave-active-class="transition duration-200"
    leave-to-class="translate-x-full"
  >
    <div v-if="show" class="fixed inset-0 z-[85] flex justify-end sm:items-end sm:p-4">
      <button class="absolute inset-0 bg-slate-950/15" @click="$emit('close')" />
      <aside class="relative w-full sm:w-[440px] h-full sm:h-[500px] sm:max-h-[calc(100dvh-2rem)] bg-white shadow-2xl flex flex-col sm:rounded-3xl overflow-hidden border border-slate-200">
        <header class="p-3 border-b border-slate-200">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-black text-base text-slate-800 flex items-center gap-2">
                <MessageCircle class="text-orange-500" :size="20" /> Central de conversas
              </h2>
              <p class="text-xs text-slate-500 mt-1">Todos os chats das integrações</p>
            </div>
            <button class="p-2 rounded-xl hover:bg-slate-100" @click="$emit('close')">
              <X :size="22" />
            </button>
          </div>
          <div class="grid grid-cols-3 gap-2 mt-3">
            <button
              v-for="channel in channels"
              :key="channel"
              @click="activeChannel = channel"
              :class="[
                'relative px-3 py-2 rounded-xl text-xs font-black border transition-all',
                activeChannel === channel
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-orange-300',
              ]"
            >
              {{ labels[channel] }}
              <span
                v-if="unreadByChannel(channel)"
                class="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px]"
              >{{ unreadByChannel(channel) }}</span>
            </button>
          </div>
        </header>

        <div class="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[160px_minmax(0,1fr)]">
          <section class="border-r border-slate-200 overflow-y-auto bg-slate-50 md:self-start md:max-h-[240px]">
            <p v-if="loading" class="p-5 text-sm text-slate-400">Carregando...</p>
            <button
              v-for="conversation in channelConversations"
              :key="conversation.id"
              @click="selectConversation(conversation)"
              :class="[
                'w-full h-[60px] text-left px-2.5 py-2 border-b border-slate-200 transition-colors overflow-hidden',
                activeConversationId === conversation.id
                  ? 'bg-orange-50 border-l-4 border-l-orange-500'
                  : 'hover:bg-white',
              ]"
            >
              <div class="flex justify-between gap-2">
                <strong class="text-sm text-slate-800 truncate">
                  {{ conversation.customerName || 'Cliente avulso' }}
                </strong>
                <span v-if="conversation.unread" class="bg-red-500 text-white text-[9px] rounded-full px-2 py-0.5">
                  {{ conversation.unread }}
                </span>
              </div>
              <p class="text-[11px] text-slate-500 mt-1">Pedido {{ conversation.orderId || '—' }}</p>
            </button>
            <p v-if="!loading && !channelConversations.length" class="p-8 text-center text-sm text-slate-400">
              Nenhuma conversa no {{ labels[activeChannel] }}.
            </p>
          </section>

          <section class="min-h-0 flex flex-col">
            <template v-if="activeConversation">
              <div class="px-5 py-3 border-b border-slate-200">
                <strong class="text-slate-800">{{ activeConversation.customerName || 'Cliente avulso' }}</strong>
                <p class="text-xs text-slate-500">Pedido {{ activeConversation.orderId }}</p>
              </div>
              <div ref="messageArea" class="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
                <div
                  v-for="message in activeConversation.messages || []"
                  :key="message.id"
                  :class="message.direction === 'OUTBOUND' ? 'flex justify-end' : 'flex justify-start'"
                >
                  <div
                    :class="[
                      'max-w-[82%] px-4 py-3 rounded-2xl text-sm',
                      message.direction === 'OUTBOUND'
                        ? 'bg-orange-500 text-white rounded-br-md'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md',
                    ]"
                  >
                    <p class="whitespace-pre-wrap">{{ message.content }}</p>
                    <small class="block opacity-70 text-right mt-1">{{ formatTime(message.createdAt || message.timestamp) }}</small>
                  </div>
                </div>
              </div>
              <footer class="p-4 border-t border-slate-200 flex items-end gap-2">
                <textarea
                  v-model="messageInput"
                  rows="2"
                  class="flex-1 resize-none border border-slate-300 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-400"
                  :placeholder="`Responder pelo ${labels[activeChannel]}...`"
                  @keydown.enter.exact.prevent="send"
                />
                <BaseButton :loading="sending" :disabled="!messageInput.trim()" @click="send">
                  <Send :size="18" />
                </BaseButton>
              </footer>
            </template>
            <div v-else class="flex-1 grid place-items-center text-sm text-slate-400">
              Selecione uma conversa.
            </div>
          </section>
        </div>
      </aside>
    </div>
  </transition>
</template>
