<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="bg-white max-w-lg w-full rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      <div v-if="submitted" class="p-10 text-center space-y-4">
        <div class="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 :size="40" />
        </div>
        <h2 class="text-2xl font-black text-slate-800">Avaliação Enviada!</h2>
        <p class="text-slate-500">Muito obrigado pelo seu feedback. Ele nos ajuda a melhorar cada vez mais nosso serviço.</p>
      </div>

      <div v-else class="flex flex-col">
        <!-- Header -->
        <div class="bg-slate-900 p-6 text-center shrink-0">
          <h2 class="text-2xl font-black text-white">Avalie seu pedido</h2>
          <p class="text-slate-400 text-sm mt-1">Pedido #{{ orderId }} entregue por {{ driverName }}</p>
        </div>

        <div class="p-6 overflow-y-auto space-y-8 h-full max-h-[70vh]">
          
          <!-- Rating Itens -->
          <div class="space-y-6">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <span class="font-bold text-slate-700">Atendimento</span>
              <StarRating v-model="ratings.atendimento" :size="28" />
            </div>

            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <span class="font-bold text-slate-700">Qualidade da Comida</span>
              <StarRating v-model="ratings.comida" :size="28" />
            </div>

            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <span class="font-bold text-slate-700">Tempo de Entrega</span>
              <StarRating v-model="ratings.tempo" :size="28" />
            </div>

            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <span class="font-bold text-slate-700">Embalagem</span>
              <StarRating v-model="ratings.embalagem" :size="28" />
            </div>

            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <span class="font-black text-slate-800 text-lg">Nota Geral (Entregador e Pedido)</span>
              <StarRating v-model="ratings.geral" :size="32" />
            </div>
          </div>

          <!-- Comentário -->
          <div class="space-y-2">
            <label class="block font-bold text-slate-700 text-sm">Deixe um comentário (opcional)</label>
            <textarea 
              v-model="comment" 
              rows="4" 
              class="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-700 resize-none"
              placeholder="O que achou da sua experiência?"
            ></textarea>
          </div>

        </div>
        
        <!-- Action -->
        <div class="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
          <button 
            @click="submitFeedback"
            :disabled="!isValid"
            :class="[
              'w-full py-4 rounded-xl font-black text-white transition-all shadow-lg flex items-center justify-center gap-2',
              isValid ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' : 'bg-slate-300 shadow-none cursor-not-allowed'
            ]"
          >
            <Send :size="20" /> Enviar Avaliação
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CheckCircle2, Send } from 'lucide-vue-next'
import StarRating from '@/components/ui/StarRating.vue'

// Em um cenário real, estes viriam da rota (params/query)
const orderId = ref('1024')
const driverName = ref('Carlos Silva')

const ratings = ref({
  atendimento: 0,
  comida: 0,
  tempo: 0,
  embalagem: 0,
  geral: 0
})

const comment = ref('')
const submitted = ref(false)

const isValid = computed(() => {
  return ratings.value.geral > 0 // Pelo menos a nota geral é exigida
})

const submitFeedback = () => {
  if (!isValid.value) return
  // Aqui você enviaria os dados para a API
  console.log('Feedback enviado:', {
    orderId: orderId.value,
    driver: driverName.value,
    ratings: ratings.value,
    comment: comment.value
  })
  submitted.value = true
}
</script>
