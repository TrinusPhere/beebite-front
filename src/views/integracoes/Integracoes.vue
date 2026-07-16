<script setup>
import { ref, computed } from 'vue'
import { QrCode, Wifi, WifiOff, MessageSquare, Utensils, CheckCircle, XCircle, Lock, Unlock, Loader2 } from 'lucide-vue-next'
import BaseButton from '@/components/BaseButton.vue'
import { integrationsDB } from '@/utils/mockData' // Importar dados mockados de integrações

// --- Dados Mockados de Integrações ---
const whatsappIntegration = integrationsDB.value.whatsapp
const ifoodIntegration = integrationsDB.value.ifood

// --- WhatsApp ---
const whatsappLoading = ref(false)
const whatsappQrCode = ref('') // Simula o QR Code recebido do backend
const whatsappQrExpiresAt = ref(null) // Simula expiração do QR Code

const connectWhatsapp = () => {
  whatsappLoading.value = true
  whatsappQrCode.value = ''
  whatsappQrExpiresAt.value = null
  // Simula chamada ao backend para gerar QR Code
  setTimeout(() => {
    const newQrCode = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=whatsapp_mock_qr_code_data'
    whatsappQrCode.value = newQrCode
    whatsappQrExpiresAt.value = Date.now() + 60 * 1000 // QR expira em 60 segundos
    whatsappIntegration.status = 'pending_qr'
    whatsappLoading.value = false

    // Simula conexão automática após QR (para mock)
    setTimeout(() => {
      whatsappIntegration.status = 'connected'
      whatsappQrCode.value = ''
      whatsappQrExpiresAt.value = null
      alert('WhatsApp conectado com sucesso! (Simulado)')
    }, 10000) // Conecta após 10 segundos
  }, 2000) // Simula tempo de geração do QR
}

const disconnectWhatsapp = () => {
  whatsappLoading.value = true
  // Simula chamada ao backend para desconectar
  setTimeout(() => {
    whatsappIntegration.status = 'disconnected'
    whatsappLoading.value = false
    alert('WhatsApp desconectado. (Simulado)')
  }, 1500)
}

// --- iFood ---
const ifoodLoading = ref(false)
const ifoodClientId = ref(ifoodIntegration.credentials.clientId || '')
const ifoodClientSecret = ref(ifoodIntegration.credentials.clientSecret || '')

const ifoodStoreStatusLoading = ref(false)

const saveAndAuthorizeIfood = () => {
  ifoodLoading.value = true
  // Simula chamada ao backend para salvar credenciais e iniciar OAuth
  setTimeout(() => {
    ifoodIntegration.credentials.clientId = ifoodClientId.value
    ifoodIntegration.credentials.clientSecret = ifoodClientSecret.value
    ifoodIntegration.status = 'connected' // Simula sucesso da autorização
    ifoodIntegration.merchantId = 'mock_merchant_id_123' // Simula obtenção do Merchant ID
    ifoodIntegration.storeStatus = 'open' // Simula status inicial da loja

    ifoodLoading.value = false
    alert('iFood autorizado e conectado com sucesso! (Simulado)')
  }, 2000)
}

const toggleIfoodStoreStatus = () => {
  ifoodStoreStatusLoading.value = true
  // Simula chamada ao backend para alterar status da loja
  setTimeout(() => {
    ifoodIntegration.storeStatus = ifoodIntegration.storeStatus === 'open' ? 'closed' : 'open'
    ifoodStoreStatusLoading.value = false
    alert(`Status da loja iFood alterado para: ${ifoodIntegration.storeStatus === 'open' ? 'Aberta' : 'Fechada'} (Simulado)`)
  }, 1000)
}

</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <div class="flex items-center justify-between border-b border-slate-100 pb-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Integrações</h1>
        <p class="text-slate-500 text-sm font-medium">Conecte sua lanchonete com plataformas externas</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Card de Integração WhatsApp -->
      <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div class="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
          <MessageSquare :size="16" /> Integração WhatsApp
        </div>

        <div class="flex items-center justify-between">
          <span class="text-lg font-bold text-slate-700">Status da Conexão:</span>
          <span :class="[
            'px-3 py-1 rounded-full text-sm font-black uppercase tracking-tighter',
            whatsappIntegration.status === 'connected' ? 'bg-emerald-100 text-emerald-600' :
            whatsappIntegration.status === 'pending_qr' ? 'bg-orange-100 text-orange-600' :
            'bg-red-100 text-red-600'
          ]">
            {{ whatsappIntegration.status === 'connected' ? 'Conectado' :
               whatsappIntegration.status === 'pending_qr' ? 'Aguardando QR' :
               'Desconectado' }}
          </span>
        </div>

        <div v-if="whatsappIntegration.status === 'disconnected' || whatsappIntegration.status === 'pending_qr'" class="text-center space-y-4">
          <div v-if="whatsappQrCode && whatsappIntegration.status === 'pending_qr'">
            <p class="text-slate-600 text-sm mb-2">Escaneie o QR Code com seu celular para conectar:</p>
            <img :src="whatsappQrCode" alt="QR Code WhatsApp" class="mx-auto w-48 h-48 border border-slate-200 p-2 rounded-lg">
            <p class="text-xs text-slate-500 mt-2">O QR Code expira em {{ Math.ceil((whatsappQrExpiresAt - Date.now()) / 1000) }} segundos.</p>
          </div>
          <BaseButton
            variant="primary"
            class="w-full"
            :loading="whatsappLoading"
            @click="connectWhatsapp"
            :disabled="whatsappLoading || whatsappIntegration.status === 'pending_qr'"
          >
            <Loader2 v-if="whatsappLoading" :size="20" class="animate-spin" />
            <Wifi v-else :size="20" />
            {{ whatsappLoading ? 'Gerando QR Code...' : 'Conectar WhatsApp' }}
          </BaseButton>
        </div>

        <div v-if="whatsappIntegration.status === 'connected'" class="text-center">
          <BaseButton variant="danger" class="w-full" :loading="whatsappLoading" @click="disconnectWhatsapp">
            <Loader2 v-if="whatsappLoading" :size="20" class="animate-spin" />
            <WifiOff v-else :size="20" />
            Desconectar WhatsApp
          </BaseButton>
        </div>
      </div>

      <!-- Card de Integração iFood -->
      <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div class="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-widest">
          <Utensils :size="16" /> Integração iFood
        </div>

        <div class="flex items-center justify-between">
          <span class="text-lg font-bold text-slate-700">Status da Conexão:</span>
          <span :class="[
            'px-3 py-1 rounded-full text-sm font-black uppercase tracking-tighter',
            ifoodIntegration.status === 'connected' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          ]">
            {{ ifoodIntegration.status === 'connected' ? 'Conectado' : 'Desconectado' }}
          </span>
        </div>

        <div v-if="ifoodIntegration.status === 'disconnected' || !ifoodIntegration.merchantId" class="space-y-4">
          <p class="text-slate-600 text-sm">Insira suas credenciais do iFood para autorizar a integração:</p>
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-700 ml-1">Client ID</label>
            <input v-model="ifoodClientId" type="text" placeholder="Client ID" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20">
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-700 ml-1">Client Secret</label>
            <input v-model="ifoodClientSecret" type="password" placeholder="Client Secret" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20">
          </div>
          <BaseButton variant="primary" class="w-full" :loading="ifoodLoading" @click="saveAndAuthorizeIfood">
            <Loader2 v-if="ifoodLoading" :size="20" class="animate-spin" />
            <CheckCircle v-else :size="20" />
            Salvar e Autorizar iFood
          </BaseButton>
        </div>

        <div v-if="ifoodIntegration.status === 'connected'" class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-slate-700">Loja no iFood:</span>
            <span :class="[
              'px-3 py-1 rounded-full text-sm font-black uppercase tracking-tighter',
              ifoodIntegration.storeStatus === 'open' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            ]">
              {{ ifoodIntegration.storeStatus === 'open' ? 'Aberta' : 'Fechada' }}
            </span>
          </div>
          <BaseButton
            :variant="ifoodIntegration.storeStatus === 'open' ? 'danger' : 'primary'"
            class="w-full"
            :loading="ifoodStoreStatusLoading"
            @click="toggleIfoodStoreStatus"
          >
            <Loader2 v-if="ifoodStoreStatusLoading" :size="20" class="animate-spin" />
            <Lock v-else-if="ifoodIntegration.storeStatus === 'open'" :size="20" />
            <Unlock v-else :size="20" />
            {{ ifoodIntegration.storeStatus === 'open' ? 'Fechar Loja no iFood' : 'Abrir Loja no iFood' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Adicione estilos específicos se necessário */
</style>