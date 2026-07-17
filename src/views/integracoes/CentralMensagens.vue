<template>
  <div class="h-[calc(100vh-100px)] flex flex-col md:flex-row bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
    <!-- Lista de Conversas (Sidebar) -->
    <div class="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50 shrink-0">
      <div class="p-4 border-b border-slate-100 bg-white">
        <h2 class="text-lg font-black text-slate-800">Mensagens</h2>
        
        <div class="relative mt-4">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
          <input 
            type="text" 
            placeholder="Buscar conversa..." 
            class="w-full bg-slate-50 border border-slate-200 text-sm pl-10 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
          >
        </div>

        <div class="flex gap-2 mt-4">
          <button class="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300">Todos</button>
          <button class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 flex items-center gap-1">
            <MessageSquare :size="12" /> WhatsApp
          </button>
          <button class="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 flex items-center gap-1">
            <Utensils :size="12" /> iFood
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div 
          v-for="chat in chats" 
          :key="chat.id"
          @click="activeChatId = chat.id"
          :class="[
            'p-4 border-b border-slate-100 cursor-pointer transition-colors',
            activeChatId === chat.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : 'hover:bg-slate-100 border-l-4 border-l-transparent'
          ]"
        >
          <div class="flex justify-between items-start mb-1">
            <h4 class="font-bold text-slate-800 text-sm">{{ chat.customer }}</h4>
            <span class="text-[10px] font-bold text-slate-400">{{ chat.time }}</span>
          </div>
          <div class="flex items-center gap-2">
            <component 
              :is="chat.platform === 'whatsapp' ? MessageSquare : Utensils" 
              :size="14" 
              :class="chat.platform === 'whatsapp' ? 'text-emerald-500' : 'text-red-500'" 
            />
            <p class="text-xs text-slate-500 truncate">{{ chat.lastMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Área Principal de Chat -->
    <div class="flex-1 flex flex-col bg-white">
      <template v-if="activeChat">
        <!-- Chat Header -->
        <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500">
              {{ activeChat.customer.charAt(0) }}
            </div>
            <div>
              <h3 class="font-black text-slate-800">{{ activeChat.customer }}</h3>
              <div class="flex items-center gap-1 text-xs font-bold" :class="activeChat.platform === 'whatsapp' ? 'text-emerald-600' : 'text-red-600'">
                <component :is="activeChat.platform === 'whatsapp' ? MessageSquare : Utensils" :size="12" />
                {{ activeChat.platform === 'whatsapp' ? 'WhatsApp' : 'iFood' }}
              </div>
            </div>
          </div>
          
          <button class="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-lg">
            <MoreVertical :size="20" />
          </button>
        </div>

        <!-- Chat Messages -->
        <div class="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4">
          <div v-for="msg in activeChat.messages" :key="msg.id" :class="['flex', msg.sender === 'bot' ? 'justify-end' : 'justify-start']">
            <div :class="[
              'max-w-[70%] p-4 rounded-2xl shadow-sm text-sm',
              msg.sender === 'bot' ? 'bg-orange-500 text-white rounded-tr-sm' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm'
            ]">
              <p>{{ msg.text }}</p>
              <span :class="['block text-[10px] mt-2 font-bold text-right', msg.sender === 'bot' ? 'text-orange-200' : 'text-slate-400']">
                {{ msg.time }}
              </span>
            </div>
          </div>
        </div>

        <!-- Chat Input -->
        <div class="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
          <button class="text-slate-400 hover:text-orange-500 p-2 transition-colors">
            <Paperclip :size="20" />
          </button>
          <input 
            v-model="newMessage"
            @keyup.enter="sendMessage"
            type="text" 
            placeholder="Digite sua mensagem..." 
            class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
          >
          <button @click="sendMessage" class="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center">
            <Send :size="18" />
          </button>
        </div>
      </template>

      <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-400">
        <MessageSquare :size="64" class="mb-4 opacity-20" />
        <h3 class="text-lg font-bold text-slate-500">Selecione uma conversa</h3>
        <p class="text-sm">As mensagens de todas as plataformas aparecem aqui.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, MessageSquare, Utensils, Send, Paperclip, MoreVertical } from 'lucide-vue-next'

const chats = ref([
  {
    id: 1,
    customer: 'João Paulo',
    platform: 'whatsapp',
    lastMessage: 'Muito obrigado, estava ótimo!',
    time: '10:45',
    messages: [
      { id: 1, sender: 'customer', text: 'Bom dia, o pedido demora muito?', time: '10:00' },
      { id: 2, sender: 'bot', text: 'Bom dia João! Seu pedido está em preparo e deve sair em 15 minutos.', time: '10:02' },
      { id: 3, sender: 'customer', text: 'Muito obrigado, estava ótimo!', time: '10:45' }
    ]
  },
  {
    id: 2,
    customer: 'Maria Silva (iFood)',
    platform: 'ifood',
    lastMessage: 'Pode tirar a cebola do lanche?',
    time: '11:15',
    messages: [
      { id: 1, sender: 'customer', text: 'Pode tirar a cebola do lanche?', time: '11:15' }
    ]
  }
])

const activeChatId = ref(null)
const newMessage = ref('')

const activeChat = computed(() => chats.value.find(c => c.id === activeChatId.value))

const sendMessage = () => {
  if (!newMessage.value.trim() || !activeChat.value) return

  activeChat.value.messages.push({
    id: Date.now(),
    sender: 'bot',
    text: newMessage.value,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })
  
  activeChat.value.lastMessage = newMessage.value
  activeChat.value.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  newMessage.value = ''
}
</script>
