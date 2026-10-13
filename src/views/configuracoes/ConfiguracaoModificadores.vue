<template>
  <div class="max-w-6xl mx-auto space-y-6 pb-20">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-slate-100 pb-4"
    >
      <div>
        <h1
          class="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3"
        >
          <div
            class="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20"
          >
            <SlidersHorizontal :size="18" class="text-white" />
          </div>
          Configuração de Modificadores
        </h1>
        <p class="text-slate-500 text-sm font-medium mt-1">
          Configure grupos, adicionais e itens removíveis que aparecem no modal
          de pedidos
        </p>
      </div>
    </div>

    <!-- Abas de navegação -->
    <div class="flex gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
          activeTab === tab.id
            ? 'bg-white text-orange-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700',
        ]"
      >
        <component :is="tab.icon" :size="16" />
        {{ tab.label }}
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- ABA 1: Grupos de Modificadores                  -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="activeTab === 'grupos'" class="space-y-4">
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <p class="text-slate-500 text-sm flex-1">
          Grupos definem conjuntos de opções que aparecem no modal de
          customização. Um grupo pode ser de seleção única (radio) ou múltipla
          (checkbox).
        </p>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <input
            v-model="searchGroupQuery"
            @input="currentGroupPage = 1"
            type="text"
            placeholder="Buscar grupo..."
            class="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-orange-400 outline-none w-full sm:w-56"
          />
          <button
            @click="openGroupModal(null)"
            class="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-sm shadow-orange-500/20 shrink-0"
          >
            <Plus :size="16" /> Novo Grupo
          </button>
        </div>
      </div>

      <!-- Cards de grupos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="group in filteredAndPaginatedGroups.items"
          :key="group.id"
          class="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all space-y-4"
        >
          <!-- Cabeçalho do grupo -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl leading-none">{{ group.icon }}</span>
              <div>
                <h3 class="font-black text-slate-800">{{ group.name }}</h3>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    :class="
                      group.type === 'RADIO'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    "
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  >
                    {{
                      group.type === "RADIO"
                        ? "Seleção Única"
                        : "Múltipla Seleção"
                    }}
                  </span>
                  <span
                    :class="
                      group.required
                        ? 'bg-red-100 text-red-600'
                        : 'bg-slate-100 text-slate-500'
                    "
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  >
                    {{ group.required ? "Obrigatório" : "Opcional" }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-medium"
                    >Min: {{ group.minSelections }} / Max:
                    {{ group.maxSelections }}</span
                  >
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="openGroupModal(group)"
                class="p-2 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
              >
                <Pencil :size="15" />
              </button>
              <button
                @click="deleteGroup(group.id)"
                class="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 :size="15" />
              </button>
            </div>
          </div>

          <!-- Opções do grupo -->
          <div class="space-y-1.5">
            <p
              class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2"
            >
              Opções
            </p>
            <div
              v-for="opt in group.options"
              :key="opt.id"
              class="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2"
            >
              <div class="flex items-center gap-2">
                <div
                  :class="
                    group.type === 'RADIO' ? 'rounded-full' : 'rounded-md'
                  "
                  class="w-3.5 h-3.5 border-2 border-slate-300"
                />
                <span class="text-sm text-slate-700 font-medium">{{
                  opt.name
                }}</span>
              </div>
              <span
                v-if="opt.price > 0"
                class="text-xs font-bold text-emerald-600"
                >+R$ {{ opt.price.toFixed(2) }}</span
              >
              <span v-else class="text-xs text-slate-400">Incluso</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="filteredAndPaginatedGroups.items.length === 0"
        class="text-center py-16 text-slate-400"
      >
        <Layers :size="40" class="mx-auto mb-3 opacity-30" />
        <p class="font-medium">Nenhum grupo encontrado.</p>
        <p v-if="modifierGroupsDB.length === 0" class="text-sm mt-1">
          Clique em "Novo Grupo" para começar.
        </p>
      </div>

      <!-- Pagination -->
      <div
        v-if="filteredAndPaginatedGroups.totalPages > 1"
        class="flex items-center justify-center gap-2 mt-6"
      >
        <button
          @click="currentGroupPage--"
          :disabled="currentGroupPage === 1"
          class="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 disabled:opacity-50 hover:bg-slate-50 transition-colors"
        >
          Anterior
        </button>
        <span class="text-sm font-medium text-slate-600 px-2">
          Página {{ currentGroupPage }} de
          {{ filteredAndPaginatedGroups.totalPages }}
        </span>
        <button
          @click="currentGroupPage++"
          :disabled="currentGroupPage === filteredAndPaginatedGroups.totalPages"
          class="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 disabled:opacity-50 hover:bg-slate-50 transition-colors"
        >
          Próxima
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- ABA 2: Adicionais Globais                       -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="activeTab === 'adicionais'" class="space-y-5">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p class="text-slate-600 text-sm font-medium">
          Cadastre os adicionais que podem ser oferecidos nos pedidos e defina seus preços de venda.
        </p>
        <button
          @click="openAdditionalModal(null)"
          class="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-sm shadow-orange-500/20 shrink-0"
        >
          <Plus :size="16" /> Novo Adicional
        </button>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div class="relative flex-1">
          <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchAdditionalQuery"
            type="text"
            placeholder="Buscar por nome ou categoria..."
            class="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:border-orange-400 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
          <button
            v-for="f in [
              { id: 'all', label: 'Todos' },
              { id: 'active', label: 'Ativos' },
              { id: 'inactive', label: 'Pausados' }
            ]"
            :key="f.id"
            @click="additionalFilterTab = f.id"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
              additionalFilterTab === f.id
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            ]"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/80">
                <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Adicional</th>
                <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Categoria</th>
                <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Preço</th>
                <th class="text-center px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th class="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in filteredAdditionals"
                :key="item.id"
                class="hover:bg-slate-50/70 transition-colors"
              >
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-orange-100 text-orange-600">
                      <Sparkles :size="16" />
                    </div>
                    <p class="font-bold text-slate-800 leading-snug">{{ item.name }}</p>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-semibold inline-block">
                    {{ item.category || 'Adicionais' }}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="text-sm font-black text-emerald-600">
                    +R$ {{ Number(item.price || 0).toFixed(2) }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="toggleAdditionalStatus(item)"
                      :class="[
                        'relative w-11 h-6 rounded-full transition-all duration-300 shrink-0',
                        item.active ? 'bg-orange-500' : 'bg-slate-200'
                      ]"
                      :title="item.active ? 'Pausar adicional' : 'Ativar adicional'"
                    >
                      <span
                        :class="[
                          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300',
                          item.active ? 'translate-x-5' : 'translate-x-0'
                        ]"
                      />
                    </button>
                    <span
                      class="text-xs font-bold hidden sm:inline-block w-14 text-left"
                      :class="item.active ? 'text-emerald-600' : 'text-slate-400'"
                    >
                      {{ item.active ? 'Ativo' : 'Pausado' }}
                    </span>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      @click="openAdditionalModal(item)"
                      class="p-2 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                      title="Editar adicional"
                    >
                      <Pencil :size="15" />
                    </button>
                    <button
                      @click="deleteAdditional(item.id)"
                      class="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Excluir adicional"
                    >
                      <Trash2 :size="15" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="filteredAdditionals.length === 0"
          class="text-center py-16 text-slate-400 space-y-2"
        >
          <Boxes :size="40" class="mx-auto mb-2 opacity-30" />
          <p class="font-medium text-slate-500">Nenhum adicional encontrado.</p>
          <p class="text-xs text-slate-400">Use o botão Novo Adicional para cadastrar.</p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- ABA 3: Remoções por Produto                     -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="activeTab === 'remocoes'" class="space-y-5">
      <p class="text-slate-500 text-sm">
        Selecione um produto e configure quais ingredientes da ficha técnica o
        cliente pode solicitar para remover. Itens como "pão" e "carne" podem
        ser desativados para evitar remoções indevidas.
      </p>

      <!-- Selector de produto -->
      <div
        class="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4"
      >
        <label class="block text-sm font-bold text-slate-700"
          >Selecione o Produto</label
        >
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <button
            v-for="product in productsWithSheet"
            :key="product.id"
            @click="selectedProductForRemoval = product"
            :class="[
              'p-3 rounded-2xl border-2 text-left transition-all',
              selectedProductForRemoval?.id === product.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-slate-100 bg-slate-50 hover:border-orange-200',
            ]"
          >
            <p class="font-bold text-xs text-slate-700 leading-tight">
              {{ product.name }}
            </p>
            <p class="text-[10px] text-slate-400 mt-0.5">
              {{ product.technicalSheet.length }} ingredientes
            </p>
          </button>
        </div>
        <p v-if="!productsWithSheet.length" class="text-slate-400 text-sm">
          Nenhum produto com ficha técnica cadastrada.
        </p>
      </div>

      <!-- Configuração de removíveis do produto selecionado -->
      <Transition name="section-fade">
        <div
          v-if="selectedProductForRemoval"
          class="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-black text-slate-800">
                {{ selectedProductForRemoval.name }}
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Ative o toggle para permitir que o cliente remova o ingrediente
              </p>
            </div>
            <span
              class="text-xs bg-orange-100 text-orange-600 font-bold px-3 py-1 rounded-xl"
            >
              {{ countRemovable(selectedProductForRemoval) }} removíveis
            </span>
          </div>

          <div class="space-y-2">
            <div
              v-for="ingredient in selectedProductForRemoval.technicalSheet"
              :key="ingredient.ingredientId"
              class="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/60 transition-all"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-sm"
                >
                  🥬
                </div>
                <div>
                  <p class="font-semibold text-sm text-slate-800">
                    {{ ingredient.name }}
                  </p>
                  <p class="text-xs text-slate-400">
                    {{ ingredient.quantity }} {{ ingredient.unit }}
                  </p>
                </div>
              </div>

              <!-- Toggle switch -->
              <button
                @click="
                  toggleRemovable(
                    selectedProductForRemoval,
                    ingredient.ingredientId,
                  )
                "
                :class="[
                  'relative w-11 h-6 rounded-full transition-all duration-300 shrink-0',
                  isRemovable(
                    selectedProductForRemoval,
                    ingredient.ingredientId,
                  )
                    ? 'bg-orange-500'
                    : 'bg-slate-200',
                ]"
                :aria-label="
                  isRemovable(
                    selectedProductForRemoval,
                    ingredient.ingredientId,
                  )
                    ? 'Desativar'
                    : 'Ativar'
                "
              >
                <span
                  :class="[
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300',
                    isRemovable(
                      selectedProductForRemoval,
                      ingredient.ingredientId,
                    )
                      ? 'translate-x-5'
                      : 'translate-x-0',
                  ]"
                />
              </button>
            </div>
          </div>

          <!-- Aviso de ingredientes sem ficha técnica -->
          <div
            class="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100"
          >
            <Info :size="14" class="text-amber-500 shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700 font-medium">
              Ingredientes sem ficha técnica (como bebidas ou acompanhamentos)
              não aparecem aqui. Para exibir remoções, o produto precisa ter a
              ficha técnica cadastrada.
            </p>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ══════════════════════════════════════════════════ -->
    <!-- MODAL: Grupo de Modificadores (criar/editar)       -->
    <!-- ══════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showGroupModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-x-hidden"
        >
          <div
            class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            @click="closeGroupModal"
          />
          <Transition name="modal-slide">
            <div
              v-if="showGroupModal"
              class="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[96vh] sm:max-h-[90vh] flex flex-col overflow-hidden min-w-0"
            >
              <div
                class="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0"
              >
                <h3 class="font-black text-slate-800 text-lg">
                  {{ editingGroup?.id ? "Editar Grupo" : "Novo Grupo" }}
                </h3>
                <button
                  @click="closeGroupModal"
                  class="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
                >
                  <X :size="18" />
                </button>
              </div>
              <div class="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5">
                <!-- Nome e ícone -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="sm:col-span-2 min-w-0">
                    <label
                      class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider"
                      >Nome do Grupo *</label
                    >
                    <input
                      v-model="groupForm.name"
                      type="text"
                      placeholder="Ex: Ponto da Carne"
                      class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label
                      class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider"
                      >Ícone</label
                    >
                    <input
                      v-model="groupForm.icon"
                      type="text"
                      placeholder="🥩"
                      maxlength="2"
                      class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center text-2xl focus:border-orange-400 outline-none"
                    />
                  </div>
                </div>

                <!-- Tipo de seleção -->
                <div>
                  <label
                    class="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider"
                    >Tipo de Seleção *</label
                  >
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      v-for="t in [
                        { v: 'RADIO', l: 'Única (Radio)' },
                        { v: 'CHECKBOX', l: 'Múltipla (Checkbox)' },
                      ]"
                      :key="t.v"
                      :class="[
                        'min-w-0 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all',
                        groupForm.type === t.v
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-slate-100 hover:border-orange-200',
                      ]"
                    >
                      <input
                        type="radio"
                        :value="t.v"
                        v-model="groupForm.type"
                        class="hidden"
                      />
                      <div
                        :class="[
                          'w-4 h-4 border-2 flex items-center justify-center shrink-0 transition-all',
                          groupForm.type === t.v
                            ? 'border-orange-500 bg-orange-500 rounded-full'
                            : 'border-slate-300 rounded-full',
                        ]"
                      >
                        <div
                          v-if="groupForm.type === t.v"
                          class="w-1.5 h-1.5 rounded-full bg-white"
                        />
                      </div>
                      <span class="text-sm font-semibold text-slate-700">{{
                        t.l
                      }}</span>
                    </label>
                  </div>
                </div>

                <!-- Obrigatório + limites -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="flex flex-col gap-1.5">
                    <label
                      class="text-xs font-bold text-slate-600 uppercase tracking-wider"
                      >Obrigatório</label
                    >
                    <button
                      @click="groupForm.required = !groupForm.required"
                      :class="[
                        'relative w-11 h-6 rounded-full transition-all',
                        groupForm.required ? 'bg-orange-500' : 'bg-slate-200',
                      ]"
                    >
                      <span
                        :class="[
                          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
                          groupForm.required
                            ? 'translate-x-5'
                            : 'translate-x-0',
                        ]"
                      />
                    </button>
                  </div>
                  <div>
                    <label
                      class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider"
                      >Mín.</label
                    >
                    <input
                      v-model.number="groupForm.minSelections"
                      type="number"
                      min="0"
                      class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-orange-400 outline-none"
                    />
                  </div>
                  <div>
                    <label
                      class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider"
                      >Máx.</label
                    >
                    <input
                      v-model.number="groupForm.maxSelections"
                      type="number"
                      min="1"
                      class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-orange-400 outline-none"
                    />
                  </div>
                </div>

                <!-- Opções do grupo -->
                <div>
                  <div
                    class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3"
                  >
                    <label
                      class="text-xs font-bold text-slate-600 uppercase tracking-wider"
                      >Opções do Grupo</label
                    >
                    <div class="w-full sm:w-auto min-w-0 flex flex-col lg:flex-row lg:items-center gap-2 sm:gap-3">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0 flex-1">
                        <!-- Importar Tipo Inteiro -->
                        <select
                          class="w-full min-w-0 text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-2 py-1.5 outline-none hover:border-slate-300 cursor-pointer"
                          @change="(e) => importCategory(e.target.value, e)"
                        >
                          <option value="">📥 Importar por Tipo...</option>
                          <option
                            v-for="(adds, category) in additionalsByCategory"
                            :key="category"
                            :value="category"
                          >
                            Todos do tipo: {{ category }} ({{
                              adds.length
                            }}
                            itens)
                          </option>
                        </select>

                        <!-- Importar Item Único -->
                        <select
                          class="w-full min-w-0 text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-2 py-1.5 outline-none hover:border-slate-300 cursor-pointer"
                          @change="(e) => importFromCatalog(e.target.value, e)"
                        >
                          <option value="">📥 Importar 1 Adicional...</option>
                          <optgroup
                            v-for="(adds, category) in additionalsByCategory"
                            :key="category"
                            :label="category"
                          >
                            <option
                              v-for="add in adds"
                              :key="add.id"
                              :value="add.id"
                            >
                              {{ add.name }} (+R$ {{ add.price.toFixed(2) }})
                            </option>
                          </optgroup>
                        </select>
                      </div>
                      <button
                        @click="addOption"
                        class="shrink-0 text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                      >
                        <Plus :size="12" /> Opção Manual
                      </button>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <div
                      v-for="(opt, i) in groupForm.options"
                      :key="i"
                      class="grid grid-cols-[minmax(0,1fr)_7rem_auto] items-center gap-2 min-w-0"
                    >
                      <input
                        v-model="opt.name"
                        type="text"
                        placeholder="Nome da opção"
                        class="w-full min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-orange-400 outline-none"
                      />
                      <div
                        class="min-w-0 flex items-center gap-1 border border-slate-200 rounded-xl px-2 sm:px-3 py-2 text-sm w-full"
                      >
                        <span class="text-slate-400 text-xs">R$</span>
                        <input
                          :value="formatCurrencyInput(opt.price)"
                          @input="handleOptionPriceInput($event, opt)"
                          type="text"
                          inputmode="numeric"
                          min="0"
                          placeholder="R$ 0,00"
                          class="w-full text-sm outline-none"
                        />
                      </div>
                      <button
                        @click="removeOption(i)"
                        class="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X :size="14" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="p-4 sm:p-6 border-t border-slate-100 flex gap-3 shrink-0">
                <button
                  @click="closeGroupModal"
                  class="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  @click="saveGroup"
                  class="flex-[2] py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all"
                >
                  Salvar Grupo
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════ -->
    <!-- MODAL: Adicional (criar/editar)                    -->
    <!-- ══════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showAdditionalModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            @click="closeAdditionalModal"
          />
          <Transition name="modal-slide">
            <div
              v-if="showAdditionalModal"
              class="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div
                class="p-6 border-b border-slate-100 flex items-center justify-between"
              >
                <div>
                  <h3 class="font-black text-slate-800 text-lg">
                    {{
                      editingAdditional?.id
                        ? "Editar Adicional"
                        : "Novo Adicional"
                    }}
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Configure os dados do adicional e a saída de estoque por venda
                  </p>
                </div>
                <button
                  @click="closeAdditionalModal"
                  class="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
                >
                  <X :size="18" />
                </button>
              </div>

              <div class="p-6 space-y-4">
                <div>
                  <label
                    class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider"
                    >Nome do Adicional *</label
                  >
                  <input
                    v-model="additionalForm.name"
                    type="text"
                    placeholder="Ex: Blend de 160g, Bacon Crocante"
                    class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:border-orange-400 outline-none transition-all placeholder:font-normal"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider"
                      >Tipo / Categoria</label
                    >
                    <input
                      v-model="additionalForm.category"
                      type="text"
                      placeholder="Ex: Queijos, Carnes, Molhos..."
                      class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-orange-400 outline-none"
                    />
                  </div>

                  <div>
                    <label
                      class="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider"
                      >Preço de Venda (R$) *</label
                    >
                    <input
                      :value="formatCurrencyInput(additionalForm.price)"
                      @input="handleAdditionalPriceInput"
                      type="text"
                      inputmode="numeric"
                      min="0"
                      placeholder="R$ 0,00"
                      class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-emerald-700 focus:border-orange-400 outline-none"
                    />
                  </div>
                </div>

                <!-- 2 Novos Campos: Ingrediente Cadastrado e Quantidade a Debitar do Estoque -->
                <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div class="flex items-center gap-2">
                    <Boxes :size="15" class="text-orange-500" />
                    <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Baixa de Estoque por Venda
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <!-- 1 - Escolho o ingrediente cadastrado -->
                    <div class="sm:col-span-8">
                      <label class="block text-xs font-semibold text-slate-600 mb-1">
                        Ingrediente Cadastrado
                      </label>
                      <select
                        v-model="additionalForm.ingredientId"
                        class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-orange-400 outline-none cursor-pointer"
                      >
                        <option value="">Nenhum (Sem baixa de estoque)</option>
                        <option
                          v-for="ing in ingredientsDB"
                          :key="ing.id"
                          :value="ing.id"
                        >
                          {{ ing.name }} (Estoque: {{ ing.stock }} {{ ing.unit }})
                        </option>
                      </select>
                    </div>

                    <!-- 2 - Informo a quantidade que deve ser debitada -->
                    <div class="sm:col-span-4">
                      <label class="block text-xs font-semibold text-slate-600 mb-1">
                        Qtd a Debitar
                      </label>
                      <div class="flex items-center gap-1.5">
                        <input
                          v-model.number="additionalForm.ingredientQuantity"
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0.00"
                          :disabled="!additionalForm.ingredientId"
                          class="w-full p-2.5 text-center text-sm font-bold bg-white border border-slate-200 rounded-xl focus:border-orange-400 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        <span class="text-xs font-black text-slate-500 uppercase shrink-0 min-w-[28px]">
                          {{ selectedModalIngredient?.unit || 'UN' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p v-if="selectedModalIngredient && additionalForm.ingredientQuantity > 0" class="text-[11px] text-slate-500 mt-1">
                    Ao vender 1 adicional, será debitado <strong>{{ additionalForm.ingredientQuantity }} {{ selectedModalIngredient.unit }}</strong> do estoque de <strong>{{ selectedModalIngredient.name }}</strong>.
                  </p>
                </div>
              </div>

              <div class="px-6 pb-6 flex gap-3">
                <button
                  @click="closeAdditionalModal"
                  class="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  @click="saveAdditional"
                  class="flex-[2] py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20"
                >
                  Salvar Adicional
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  Layers,
  X,
  Info,
  Boxes,
  ListChecks,
  MinusCircle,
  Search,
  Package,
  Check,
  Sparkles,
} from "lucide-vue-next";
import { modifierGroupService } from "@/services/modifierGroupService";
import { additionalService } from "@/services/additionalService";
import { ingredientService } from "@/services/ingredientService";
import { productService } from "@/services/productService";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/money";

const modifierGroupsDB = ref([]);
const additionalsDB = ref([]);
const ingredientsDB = ref([]);
const productsDB = ref([]);

// Pesquisa e Filtros da Aba de Adicionais
const searchAdditionalQuery = ref("");
const additionalFilterTab = ref("all"); // 'all' | 'active' | 'not_configured'
const selectedIngredientForModal = ref(null);

// Pesquisa e Paginação de Grupos
const searchGroupQuery = ref("");
const currentGroupPage = ref(1);
const groupsPerPage = 8;

const filteredAndPaginatedGroups = computed(() => {
  let filtered = modifierGroupsDB.value;

  if (searchGroupQuery.value.trim()) {
    const q = searchGroupQuery.value.toLowerCase();
    filtered = filtered.filter((g) => g.name.toLowerCase().includes(q));
  }

  const start = (currentGroupPage.value - 1) * groupsPerPage;
  const end = start + groupsPerPage;

  return {
    items: filtered.slice(start, end),
    totalItems: filtered.length,
    totalPages: Math.ceil(filtered.length / groupsPerPage) || 1,
  };
});

const additionalsByCategory = computed(() => {
  const groups = {};
  for (const add of additionalsDB.value) {
    if (!add.active) continue;
    const cat = add.category || "Outros";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(add);
  }
  return groups;
});

const filteredAdditionals = computed(() => {
  let list = additionalsDB.value;

  if (searchAdditionalQuery.value.trim()) {
    const q = searchAdditionalQuery.value.toLowerCase().trim();
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }

  if (additionalFilterTab.value === "active") {
    list = list.filter((item) => item.active);
  } else if (additionalFilterTab.value === "inactive") {
    list = list.filter((item) => !item.active);
  }

  return list;
});

onMounted(async () => {
  try {
    const [modGroups, adds, ings, pResponse] = await Promise.all([
      modifierGroupService.getAll(),
      additionalService.getAll(),
      ingredientService.getAll(),
      productService.getAll(null, 0, 1000),
    ]);
    modifierGroupsDB.value = modGroups || [];
    additionalsDB.value = adds || [];
    ingredientsDB.value = ings || [];
    productsDB.value = (pResponse.content || []).map((p) => ({
      ...p,
      removableItemIds: (p.removableItems || []).map((r) => r.ingredientId),
    }));
  } catch (err) {
    console.error("Erro ao carregar configurações:", err);
  }
});

// ── Abas ──
const tabs = [
  { id: "grupos", label: "Grupos de Modificadores", icon: Layers },
  { id: "adicionais", label: "Adicionais Globais", icon: Boxes },
  { id: "remocoes", label: "Remoções por Produto", icon: MinusCircle },
];
const activeTab = ref("grupos");

// ─────────────────────────────────────────
// ABA 1: Grupos de Modificadores
// ─────────────────────────────────────────
const showGroupModal = ref(false);
const editingGroup = ref(null);

const groupForm = ref({
  name: "",
  icon: "🔧",
  type: "RADIO",
  required: false,
  minSelections: 0,
  maxSelections: 1,
  options: [{ name: "", price: 0 }],
});

const openGroupModal = (group) => {
  editingGroup.value = group;
  if (group) {
    groupForm.value = {
      name: group.name,
      icon: group.icon,
      type: group.type,
      required: group.required,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      options: group.options.map((o) => ({ ...o })),
    };
  } else {
    groupForm.value = {
      name: "",
      icon: "🔧",
      type: "RADIO",
      required: false,
      minSelections: 0,
      maxSelections: 1,
      options: [{ name: "", price: 0 }],
    };
  }
  showGroupModal.value = true;
};

const closeGroupModal = () => {
  showGroupModal.value = false;
};

const addOption = () => {
  groupForm.value.options.push({ name: "", price: 0 });
};
const removeOption = (i) => {
  groupForm.value.options.splice(i, 1);
};

const handleOptionPriceInput = (event, option) => {
  const hasDigits = /\d/.test(event.target.value);
  option.price = parseCurrencyInput(event.target.value);
  event.target.value = hasDigits ? formatCurrencyInput(option.price) : "";
};

const handleAdditionalPriceInput = (event) => {
  const hasDigits = /\d/.test(event.target.value);
  additionalForm.value.price = parseCurrencyInput(event.target.value);
  event.target.value = hasDigits ? formatCurrencyInput(additionalForm.value.price) : "";
};

const importFromCatalog = (addId, event) => {
  if (!addId) return;
  const add = additionalsDB.value.find((a) => a.id === addId);
  if (add) {
    // Adiciona o adicional como uma nova opção no grupo
    groupForm.value.options.push({ name: add.name, price: add.price });
  }
  // Reseta o select
  if (event?.target) event.target.value = "";
};

const importCategory = (categoryName, event) => {
  if (!categoryName) return;
  const adds = additionalsByCategory.value[categoryName];
  if (adds) {
    adds.forEach((add) => {
      // Evita duplicidade exata de nome
      const exists = groupForm.value.options.some((o) => o.name === add.name);
      if (!exists) {
        groupForm.value.options.push({ name: add.name, price: add.price });
      }
    });
  }
  if (event?.target) event.target.value = "";
};

const saveGroup = async () => {
  if (!groupForm.value.name.trim()) {
    alert("Nome do grupo é obrigatório.");
    return;
  }
  if (!groupForm.value.options.some((o) => o.name.trim())) {
    alert("Adicione ao menos uma opção.");
    return;
  }

  const validOptions = groupForm.value.options.filter((o) => o.name.trim());
  // Backend creates IDs for options if they are null

  try {
    const payload = {
      ...groupForm.value,
      options: validOptions,
    };

    if (editingGroup.value) {
      await modifierGroupService.update(editingGroup.value.id, payload);
    } else {
      await modifierGroupService.create(payload);
    }
    modifierGroupsDB.value = await modifierGroupService.getAll();
    closeGroupModal();
  } catch (err) {
    console.error("Erro ao salvar grupo:", err);
    alert("Erro ao salvar grupo");
  }
};

const deleteGroup = async (groupId) => {
  if (
    !confirm(
      "Deseja excluir este grupo? Ele será removido de todos os produtos vinculados.",
    )
  )
    return;
  try {
    await modifierGroupService.delete(groupId);
    modifierGroupsDB.value = await modifierGroupService.getAll();
  } catch (err) {
    console.error("Erro ao excluir grupo:", err);
    alert("Erro ao excluir grupo");
  }
};

// ─────────────────────────────────────────
// ABA 2: Adicionais Globais
// ─────────────────────────────────────────
const showAdditionalModal = ref(false);
const editingAdditional = ref(null);

const additionalForm = ref({
  name: "",
  category: "",
  price: 0,
  ingredientId: "",
  ingredientQuantity: null,
});

const selectedModalIngredient = computed(() => {
  if (!additionalForm.value.ingredientId) return null;
  return ingredientsDB.value.find((i) => i.id === additionalForm.value.ingredientId) || null;
});

const openAdditionalModal = (add) => {
  editingAdditional.value = add;
  additionalForm.value = add
    ? {
        name: add.name || "",
        category: add.category || "",
        price: add.price || 0,
        ingredientId: add.ingredientId || "",
        ingredientQuantity: add.ingredientQuantity != null ? add.ingredientQuantity : null,
      }
    : {
        name: "",
        category: "",
        price: 0,
        ingredientId: "",
        ingredientQuantity: null,
      };
  showAdditionalModal.value = true;
};

const closeAdditionalModal = () => {
  showAdditionalModal.value = false;
  editingAdditional.value = null;
  additionalForm.value = {
    name: "",
    category: "",
    price: 0,
    ingredientId: "",
    ingredientQuantity: null,
  };
};

const saveAdditional = async () => {
  if (!additionalForm.value.name.trim()) {
    alert("Nome é obrigatório.");
    return;
  }
  if (additionalForm.value.price <= 0) {
    alert("Preço deve ser maior que zero.");
    return;
  }

  const payload = {
    name: additionalForm.value.name.trim(),
    category: additionalForm.value.category ? additionalForm.value.category.trim() : "Adicionais",
    price: Number(additionalForm.value.price) || 0,
  };

  if (additionalForm.value.ingredientId) {
    payload.ingredientId = additionalForm.value.ingredientId;
    payload.ingredientQuantity = Number(additionalForm.value.ingredientQuantity) || 0;
  }

  try {
    if (editingAdditional.value) {
      await additionalService.update(
        editingAdditional.value.id,
        payload,
      );
    } else {
      await additionalService.create(payload);
    }
    additionalsDB.value = await additionalService.getAll();
    closeAdditionalModal();
  } catch (err) {
    console.error("Erro ao salvar adicional:", err);
    alert("Erro ao salvar adicional");
  }
};

const deleteAdditional = async (addId) => {
  if (!confirm("Excluir este adicional?")) return;
  try {
    await additionalService.delete(addId);
    additionalsDB.value = await additionalService.getAll();
  } catch (err) {
    console.error("Erro ao excluir adicional:", err);
    alert("Erro ao excluir adicional");
  }
};

const toggleAdditionalStatus = async (add) => {
  try {
    await additionalService.toggleStatus(add.id);
    additionalsDB.value = await additionalService.getAll();
  } catch (err) {
    console.error("Erro ao alternar status do adicional:", err);
    alert("Erro ao alterar status");
  }
};

// ─────────────────────────────────────────
// ABA 3: Remoções por Produto
// ─────────────────────────────────────────
const selectedProductForRemoval = ref(null);

const productsWithSheet = computed(() =>
  productsDB.value.filter((p) => p.technicalSheet?.length > 0),
);

const isRemovable = (product, ingredientId) =>
  (product.removableItemIds || []).includes(ingredientId);

const toggleRemovable = async (product, ingredientId) => {
  if (!product.removableItemIds) product.removableItemIds = [];

  // Create a copy of current removables
  const currentRemovables = [...product.removableItemIds];
  const idx = currentRemovables.indexOf(ingredientId);

  if (idx === -1) {
    currentRemovables.push(ingredientId);
  } else {
    currentRemovables.splice(idx, 1);
  }

  try {
    await productService.updateRemovableItems(product.id, currentRemovables);
    // Update local state after success
    product.removableItemIds = currentRemovables;
  } catch (err) {
    console.error("Erro ao atualizar item removível:", err);
    alert("Erro ao atualizar permissão de remoção");
  }
};

const countRemovable = (product) => (product.removableItemIds || []).length;
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.25s ease;
}
.modal-slide-enter-from,
.modal-slide-leave-to {
  transform: scale(0.93) translateY(20px);
  opacity: 0;
}

.section-fade-enter-active,
.section-fade-leave-active {
  transition: all 0.3s ease;
}
.section-fade-enter-from,
.section-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
