<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { X, Send, MessageSquare, Utensils, User } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue' // Importar BaseButton

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  platform: { // Agora recebe apenas a plataforma
    type: String,
    default: '' // 'whatsapp' ou 'ifood'
  }
})

const emit = defineEmits(['close', 'sendMessage'])

const messageInput = ref('')
const messages = ref([]) // Mock de mensagens
const chatContainer = ref(null)

const platformIcon = computed(() => {
  if (props.platform === 'whatsapp') return MessageSquare
  if (props.platform === 'ifood') return Utensils
  return User // Fallback
})

const platformName = computed(() => {
  if (props.platform === 'whatsapp') return 'WhatsApp'
  if (props.platform === 'ifood') return 'iFood'
  return 'Chat'
})

// Simula o carregamento de mensagens ao abrir o chat
watch(() => props.show, (newVal) => {
  if (newVal && props.platform) {
    messages.value = [] // Limpa mensagens anteriores
    setTimeout(() => {
      messages.value = [
        { id: 1, sender: 'client', content: `Olá, sou um cliente do ${platformName.value}.`, timestamp: '10:00' },
        { id: 2, sender: 'operator', content: `Olá! Como posso ajudar com seu pedido via ${platformName.value}?`, timestamp: '10:01' },
        { id: 3, sender: 'client', content: `Gostaria de saber sobre o status do meu pedido.`, timestamp: '10:02' },
      ]
      scrollToBottom()
    }, 500)
  }
})

const sendMessage = () => {
  if (messageInput.value.trim() === '') return

  const newMessage = {
    id: messages.value.length + 1,
    sender: 'operator',
    content: messageInput.value,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  messages.value.push(newMessage)
  emit('sendMessage', {
    platform: props.platform,
    content: messageInput.value
  })
  messageInput.value = ''
  scrollToBottom()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}
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
    <div
      v-if="show"
      class="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-lg z-50 flex flex-col"
    >
      <!-- Header do Drawer -->
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <component :is="platformIcon" :size="24" :class="[platform === 'whatsapp' ? 'text-emerald-500' : 'text-red-500']" />
          <div>
            <h2 class="text-lg font-bold text-gray-800">Chat {{ platformName }}</h2>
            <p class="text-sm text-gray-500">Comunicação com clientes via {{ platformName }}</p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-800">
          <X :size="24" />
        </button>
      </div>

      <!-- Área de Mensagens -->
      <div ref="chatContainer" class="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['flex', msg.sender === 'operator' ? 'justify-end' : 'justify-start']"
        >
          <div
            :class="[
              'max-w-[70%] p-3 rounded-lg shadow-sm',
              msg.sender === 'operator' ? 'bg-orange-500 text-white' : 'bg-white text-gray-800 border border-gray-200'
            ]"
          >
            <p class="text-sm">{{ msg.content }}</p>
            <span :class="['block text-xs mt-1', msg.sender === 'operator' ? 'text-orange-100' : 'text-gray-400']">{{ msg.timestamp }}</span>
          </div>
        </div>
      </div>

      <!-- Input de Mensagem -->
      <div class="p-4 border-t border-gray-200 bg-white flex items-center gap-3">
        <input
          v-model="messageInput"
          @keyup.enter="sendMessage"
          type="text"
          placeholder="Digite sua mensagem..."
          class="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
        >
        <BaseButton @click="sendMessage" :disabled="messageInput.trim() === ''">
          <Send :size="20" />
        </BaseButton>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Estilos para o scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
