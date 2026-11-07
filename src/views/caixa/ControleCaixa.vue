<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6 font-sans">
    <!-- Topbar: Título & Status -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          💰 Controle de Caixa & PDV
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Abertura, sangrias, suprimentos, conferência de entregadores e fechamento de turno.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Badge de Sessão -->
        <div
          v-if="currentSession"
          class="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Caixa Aberto ({{ summary?.registerName || 'Terminal' }})</span>
        </div>
        <div
          v-else-if="!loading"
          class="flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-bold"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Caixa Fechado</span>
        </div>

        <button
          @click="loadData"
          class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Atualizar dados"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-3"></div>
      <p class="text-sm">Carregando informações do caixa...</p>
    </div>

    <!-- ESTADO 1: NENHUM CAIXA ABERTO PARA O USUÁRIO -->
    <div
      v-else-if="!currentSession"
      class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm max-w-xl mx-auto my-12"
    >
      <div class="text-center space-y-3 mb-6">
        <div class="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-3xl border border-amber-500/20">
          🔓
        </div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Abertura de Sessão de Caixa</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Você não possui uma sessão aberta. Selecione o terminal físico e informe o valor de fundo de troco para iniciar o turno.
        </p>
      </div>

      <form @submit.prevent="openSession" class="space-y-4">
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
              Terminal de Caixa (PDV)
            </label>
            <button
              type="button"
              @click="quickCreateRegister"
              class="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              + Novo Terminal
            </button>
          </div>
          <select
            v-model="openForm.cashRegisterId"
            required
            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="" disabled>Selecione um terminal...</option>
            <option v-for="reg in registers" :key="reg.id" :value="reg.id">
              {{ reg.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
            Fundo de Troco Inicial (R$)
          </label>
          <input
            v-model.number="openForm.initialAmount"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="Ex: 100,00"
            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
          />
        </div>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-lg shadow-emerald-950/20 active:scale-95 disabled:opacity-50"
        >
          {{ submitting ? 'Abrindo caixa...' : '✓ Abrir Caixa Agora' }}
        </button>
      </form>
    </div>

    <!-- ESTADO 2: CAIXA ABERTO - DASHBOARD OPERACIONAL -->
    <div v-else class="space-y-6">
      <!-- Cards de Métricas Financeiras em Tempo Real -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Saldo Físico Esperado em Gaveta -->
        <div class="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span class="text-xs font-semibold uppercase tracking-wider opacity-80">Saldo Esperado em Gaveta</span>
            <div class="text-2xl font-black mt-1 font-mono">
              R$ {{ formatMoney(summary?.calculatedCashBalance) }}
            </div>
          </div>
          <p class="text-[11px] opacity-80 mt-2">
            Fundo ({{ formatMoney(summary?.initialAmount) }}) + Dinheiro vendas + Entradas - Sangrias
          </p>
        </div>

        <!-- Total Geral de Vendas no Turno -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Vendas (Geral)</span>
            <div class="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              R$ {{ formatMoney(summary?.totalSalesAmount) }}
            </div>
          </div>
          <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
            <span>Dinheiro: R$ {{ formatMoney(summary?.cashSalesAmount) }}</span>
            <span>•</span>
            <span>Cartão: R$ {{ formatMoney(summary?.cardSalesAmount) }}</span>
            <span>•</span>
            <span>PIX: R$ {{ formatMoney(summary?.pixSalesAmount) }}</span>
          </div>
        </div>

        <!-- Suprimentos x Sangrias -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Movimentações Manuais</span>
            <div class="flex items-baseline gap-3 mt-1 font-mono">
              <span class="text-emerald-500 font-bold text-lg">+R$ {{ formatMoney(summary?.totalSuprimento) }}</span>
              <span class="text-rose-500 font-bold text-lg">-R$ {{ formatMoney(summary?.totalSangria) }}</span>
            </div>
          </div>
          <div class="text-[11px] text-slate-400 mt-2">
            Ajustes compensatórios: R$ {{ formatMoney(summary?.totalAjustes) }}
          </div>
        </div>

        <!-- Informações do Operador -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Operador & Turno</span>
            <div class="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
              👤 {{ summary?.userName || 'Operador' }}
            </div>
          </div>
          <p class="text-[11px] text-slate-400 mt-2">
            Aberto às: {{ formatDateTime(currentSession.openedAt) }}
          </p>
        </div>
      </div>

      <!-- Barra de Ações Rápidas -->
      <div class="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          @click="openMovementModal('SUPRIMENTO')"
          class="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow active:scale-95"
        >
          <span>📥 + Suprimento (Entrada)</span>
        </button>

        <button
          @click="openMovementModal('SANGRIA')"
          class="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow active:scale-95"
        >
          <span>📤 - Sangria (Retirada)</span>
        </button>

        <button
          @click="openMovementModal('AJUSTE_COMPENSATORIO')"
          class="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow active:scale-95"
        >
          <span>⚖️ Ajuste Compensatório</span>
        </button>

        <div class="flex-1"></div>

        <button
          @click="openCloseModal"
          class="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold px-5 py-2.5 rounded-xl text-xs transition shadow active:scale-95"
        >
          <span>🔒 Fechar Caixa do Turno</span>
        </button>
      </div>

      <!-- Seção: Conferência de Entregadores (Exigência Explícita do Usuário) -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              🛵 Conferência de Recebimentos por Entregador
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              Valores recebidos pelos entregadores nos pedidos delivery durante este turno.
            </p>
          </div>
          <span class="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-bold">
            {{ summary?.driverCollections?.length || 0 }} entregadores com entregas
          </span>
        </div>

        <div v-if="!summary?.driverCollections || summary.driverCollections.length === 0" class="py-8 text-center text-slate-400 text-sm">
          Nenhum pagamento registrado por entregador nesta sessão até o momento.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead class="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th class="px-4 py-3 rounded-l-lg">Entregador</th>
                <th class="px-4 py-3 text-center">Entregas</th>
                <th class="px-4 py-3 text-right">Dinheiro (Acerto)</th>
                <th class="px-4 py-3 text-right">PIX</th>
                <th class="px-4 py-3 text-right">Cartão (Maquininha)</th>
                <th class="px-4 py-3 rounded-r-lg text-right font-bold">Total Recebido</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="d in summary.driverCollections" :key="d.driverId" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td class="px-4 py-3 font-bold text-slate-900 dark:text-white">
                  {{ d.driverName }}
                </td>
                <td class="px-4 py-3 text-center font-mono">
                  {{ d.deliveryCount }}
                </td>
                <td class="px-4 py-3 text-right font-mono font-bold text-emerald-500">
                  R$ {{ formatMoney(d.cashAmount) }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-teal-400">
                  R$ {{ formatMoney(d.pixAmount) }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-blue-400">
                  R$ {{ formatMoney(d.cardAmount) }}
                </td>
                <td class="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                  R$ {{ formatMoney(d.totalCollected) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Seção: Pagamentos e Vendas Recebidas na Sessão -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              💳 Vendas e Pagamentos Recebidos no Turno
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              Recebimentos de pedidos finalizados integrados diretamente com este caixa.
            </p>
          </div>
          <span class="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-bold">
            {{ summary?.payments?.length || 0 }} pagamentos
          </span>
        </div>

        <div v-if="!summary?.payments || summary.payments.length === 0" class="py-8 text-center text-slate-400 text-sm">
          Nenhum pagamento registrado nesta sessão até o momento.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead class="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th class="px-4 py-3 rounded-l-lg">Referência / Pedido</th>
                <th class="px-4 py-3 text-center">Horário</th>
                <th class="px-4 py-3 text-center">Forma</th>
                <th class="px-4 py-3 text-center">Recebido Por</th>
                <th class="px-4 py-3 text-center">Status</th>
                <th class="px-4 py-3 rounded-r-lg text-right font-bold">Valor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="p in summary.payments" :key="p.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td class="px-4 py-3 font-bold text-slate-900 dark:text-white">
                  {{ p.notes || ('Pedido #' + (p.orderId ? p.orderId.substring(0, 8) : '')) }}
                </td>
                <td class="px-4 py-3 text-center text-xs text-slate-400">
                  {{ formatTime(p.paidAt || p.createdAt) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                      p.method === 'DINHEIRO' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      p.method === 'PIX' ? 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                    ]"
                  >
                    {{ p.method }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center text-xs">
                  <span class="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                    {{ p.collectedBy === 'ENTREGADOR' ? '🛵 Entregador' : '🏪 Caixa' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                      p.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                    ]"
                  >
                    {{ p.status === 'CONFIRMED' ? '✓ Confirmado' : '✕ Cancelado' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                  R$ {{ formatMoney(p.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Seção: Histórico de Movimentações da Sessão -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 class="text-base font-bold text-slate-900 dark:text-white">
            📋 Movimentações de Caixa Registradas
          </h2>
          <span class="text-xs text-slate-400">
            {{ movements.length }} registros
          </span>
        </div>

        <div v-if="movements.length === 0" class="py-8 text-center text-slate-400 text-sm">
          Nenhuma sangria, suprimento ou ajuste registrado nesta sessão.
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="m in movements"
            :key="m.id"
            class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
          >
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'px-2 py-1 rounded font-bold uppercase text-[10px]',
                  m.type === 'SUPRIMENTO' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' :
                  m.type === 'SANGRIA' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' :
                  'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                ]"
              >
                {{ m.type }}
              </span>
              <span class="text-slate-800 dark:text-slate-200 font-medium">{{ m.reason }}</span>
            </div>

            <div class="flex items-center gap-4">
              <span class="font-mono font-bold text-sm" :class="m.type === 'SANGRIA' ? 'text-rose-500' : 'text-emerald-500'">
                {{ m.type === 'SANGRIA' ? '-' : '+' }} R$ {{ formatMoney(m.amount) }}
              </span>
              <span class="text-slate-400">{{ formatTime(m.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE MOVIMENTAÇÃO (SANGRIA / SUPRIMENTO / AJUSTE) -->
    <div
      v-if="showMovementModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">
          {{ movementForm.type === 'SUPRIMENTO' ? '📥 Registrar Suprimento' :
             movementForm.type === 'SANGRIA' ? '📤 Registrar Sangria' : '⚖️ Registrar Ajuste Compensatório' }}
        </h3>

        <form @submit.prevent="submitMovement" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Valor (R$)
            </label>
            <input
              v-model.number="movementForm.amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Justificativa Obrigatória
            </label>
            <textarea
              v-model="movementForm.reason"
              required
              rows="3"
              placeholder="Descreva o motivo desta movimentação..."
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              @click="showMovementModal = false"
              class="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-sm transition disabled:opacity-50"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL DE FECHAMENTO DE CAIXA COM CONFERÊNCIA -->
    <div
      v-if="showCloseModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-lg shadow-2xl">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">
          🔒 Fechamento de Caixa do Turno
        </h3>
        <p class="text-xs text-slate-400 mb-4">
          Conte as notas e moedas físicas presentes na gaveta e informe o valor real apurado.
        </p>

        <!-- Comparativo de Saldos -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 mb-4 text-xs font-mono">
          <div class="flex justify-between">
            <span class="text-slate-500">Saldo Esperado em Gaveta:</span>
            <span class="font-bold text-slate-900 dark:text-white">R$ {{ formatMoney(summary?.calculatedCashBalance) }}</span>
          </div>
          <div class="flex justify-between" v-if="closeForm.countedAmount !== null && closeForm.countedAmount !== ''">
            <span class="text-slate-500">Saldo Contado:</span>
            <span class="font-bold text-emerald-500">R$ {{ formatMoney(closeForm.countedAmount) }}</span>
          </div>
          <div
            v-if="closeForm.countedAmount !== null && closeForm.countedAmount !== ''"
            class="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold"
          >
            <span>Divergência / Diferença:</span>
            <span :class="difference >= 0 ? 'text-emerald-500' : 'text-rose-500'">
              {{ difference >= 0 ? '+' : '' }} R$ {{ formatMoney(difference) }}
            </span>
          </div>
        </div>

        <form @submit.prevent="submitCloseSession" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Valor Contado Fisicamente (R$)
            </label>
            <input
              v-model.number="closeForm.countedAmount"
              type="number"
              step="0.01"
              min="0"
              required
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Observações / Justificativa de Divergência (opcional)
            </label>
            <textarea
              v-model="closeForm.closingNotes"
              rows="2"
              placeholder="Ex: Faltou troco de moedas, diferença em centavos..."
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              @click="showCloseModal = false"
              class="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2 rounded-xl text-sm transition disabled:opacity-50"
            >
              Confirmar Fechamento
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import cashService from "@/services/cashService";

const loading = ref(false);
const submitting = ref(false);
const registers = ref([]);
const currentSession = ref(null);
const summary = ref(null);
const movements = ref([]);

const showMovementModal = ref(false);
const showCloseModal = ref(false);

const openForm = ref({
  cashRegisterId: "",
  initialAmount: 0.0,
});

const movementForm = ref({
  type: "SANGRIA",
  amount: 0.0,
  reason: "",
});

const closeForm = ref({
  countedAmount: 0.0,
  closingNotes: "",
});

const difference = computed(() => {
  if (closeForm.value.countedAmount === null || closeForm.value.countedAmount === "") return 0;
  const expected = summary.value?.calculatedCashBalance || 0;
  return Number(closeForm.value.countedAmount) - Number(expected);
});

async function loadData() {
  loading.value = true;
  try {
    registers.value = await cashService.listRegisters().catch(() => []);
    if (registers.value.length > 0 && !openForm.value.cashRegisterId) {
      openForm.value.cashRegisterId = registers.value[0].id;
    }

    try {
      currentSession.value = await cashService.getCurrentSession();
    } catch {
      currentSession.value = null;
    }

    if (currentSession.value) {
      const [sumData, movData] = await Promise.all([
        cashService.getSessionSummary(currentSession.value.id),
        cashService.listMovements(currentSession.value.id),
      ]);
      summary.value = sumData;
      movements.value = movData || [];
    } else {
      summary.value = null;
      movements.value = [];
    }
  } catch (err) {
    console.error("Erro ao carregar dados do caixa:", err);
  } finally {
    loading.value = false;
  }
}

async function quickCreateRegister() {
  const defaultName = `Caixa 0${registers.value.length + 1}`;
  const name = prompt(
    "Informe o nome do terminal de caixa (ex: Caixa 02 - Balcão):",
    defaultName
  );
  if (!name || !name.trim()) return;
  try {
    const created = await cashService.createRegister({ name: name.trim() });
    registers.value = await cashService.listRegisters().catch(() => []);
    openForm.value.cashRegisterId = created.id || registers.value[registers.value.length - 1]?.id;
  } catch (err) {
    alert("Erro ao cadastrar terminal: " + (err.response?.data?.message || err.message));
  }
}

async function openSession() {
  if (!openForm.value.cashRegisterId) {
    alert("Selecione um terminal de caixa.");
    return;
  }

  submitting.value = true;
  try {
    await cashService.openSession({
      cashRegisterId: openForm.value.cashRegisterId,
      initialAmount: openForm.value.initialAmount || 0,
    });
    await loadData();
  } catch (err) {
    alert(err.response?.data?.message || "Erro ao abrir sessão de caixa.");
  } finally {
    submitting.value = false;
  }
}

function openMovementModal(type) {
  movementForm.value = {
    type,
    amount: null,
    reason: "",
  };
  showMovementModal.value = true;
}

async function submitMovement() {
  if (!movementForm.value.amount || movementForm.value.amount <= 0) {
    alert("Informe um valor válido.");
    return;
  }
  if (!movementForm.value.reason.trim()) {
    alert("A justificativa é obrigatória.");
    return;
  }

  submitting.value = true;
  try {
    await cashService.addMovement(currentSession.value.id, movementForm.value);
    showMovementModal.value = false;
    await loadData();
  } catch (err) {
    alert(err.response?.data?.message || "Erro ao registrar movimentação.");
  } finally {
    submitting.value = false;
  }
}

function openCloseModal() {
  closeForm.value = {
    countedAmount: summary.value?.calculatedCashBalance || 0,
    closingNotes: "",
  };
  showCloseModal.value = true;
}

async function submitCloseSession() {
  submitting.value = true;
  try {
    await cashService.closeSession(currentSession.value.id, closeForm.value);
    showCloseModal.value = false;
    alert("Sessão de caixa fechada com sucesso!");
    await loadData();
  } catch (err) {
    alert(err.response?.data?.message || "Erro ao fechar caixa.");
  } finally {
    submitting.value = false;
  }
}

function formatMoney(val) {
  if (val === undefined || val === null) return "0,00";
  return Number(val).toFixed(2).replace(".", ",");
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

onMounted(() => {
  loadData();
});
</script>
