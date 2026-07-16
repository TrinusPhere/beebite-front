<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ShoppingCart, X, MapPin, Bike, Store, CreditCard, Banknote, QrCode, Clock, ChevronRight, ChevronLeft, Plus, Minus, Trash2, User, Clipboard } from 'lucide-vue-next'
import { productsDB, storeInfo, ordersKanbanDB, financialRecordsDB } from '@/utils/mockData'

// --- Dados da Loja ---
const loja = storeInfo.value
const estaAberto = computed(() => loja.isOpen)

// --- Produtos ---
const produtos = productsDB.value
const categorias = computed(() => {
  const uniqueCategories = [...new Set(produtos.map(p => p.category))]
  return ['Todos', ...uniqueCategories]
})
const categoriaSelecionada = ref('Todos')

const produtosFiltrados = computed(() => {
  if (categoriaSelecionada.value === 'Todos') {
    return produtos
  }
  return produtos.filter(p => p.category === categoriaSelecionada.value)
})

// --- Carrinho ---
const carrinho = ref([]) // { product: {}, quantity: N }
const mostrarCarrinhoDrawer = ref(false)

const totalItensCarrinho = computed(() => {
  return carrinho.value.reduce((acc, item) => acc + item.quantity, 0)
})

const subtotalCarrinho = computed(() => {
  return carrinho.value.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
})

const valorEntrega = computed(() => {
  // Lógica de frete simplificada para o mock
  return formCheckout.value.tipoEntrega === 'delivery' ? 10.00 : 0.00
})

const totalCarrinho = computed(() => {
  return subtotalCarrinho.value + valorEntrega.value
})

const adicionarAoCarrinho = (produto) => {
  const itemExistente = carrinho.value.find(item => item.product.id === produto.id)
  if (itemExistente) {
    itemExistente.quantity++
  } else {
    carrinho.value.push({ product: { ...produto }, quantity: 1 })
  }
}

const removerDoCarrinho = (productId) => {
  const itemIndex = carrinho.value.findIndex(item => item.product.id === productId)
  if (itemIndex !== -1) {
    if (carrinho.value[itemIndex].quantity > 1) {
      carrinho.value[itemIndex].quantity--
    } else {
      carrinho.value.splice(itemIndex, 1)
    }
  }
}

const removerItemCompletoDoCarrinho = (productId) => {
  carrinho.value = carrinho.value.filter(item => item.product.id !== productId)
}

// --- Checkout ---
const mostrarCheckoutDrawer = ref(false)
const loadingCheckout = ref(false)

const formCheckout = ref({
  tipoEntrega: 'delivery', // 'delivery' ou 'retirada'
  nomeCliente: '',
  telefoneCliente: '',
  enderecoCliente: '', // Apenas para delivery
  numeroCliente: '',
  complementoCliente: '',
  bairroCliente: '',
  metodoPagamento: 'pix', // 'pix', 'credito', 'debito', 'dinheiro'
  observacoes: ''
})

const abrirCheckout = () => {
  if (totalItensCarrinho.value === 0) {
    alert('Seu carrinho está vazio!')
    return
  }
  mostrarCarrinhoDrawer.value = false
  mostrarCheckoutDrawer.value = true
}

const finalizarPedido = () => {
  loadingCheckout.value = true
  // Simular processamento do pedido
  setTimeout(() => {
    // 1. Gerar ID do pedido e data/hora
    const orderId = `#${Math.floor(Math.random() * 9000) + 1000}`
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().split(' ')[0].substring(0, 5)

    // 2. Criar registro financeiro
    const newFinancialRecord = {
      id: `FIN${Math.floor(Math.random() * 900) + 100}`,
      orderId: orderId,
      date: date,
      time: time,
      totalValue: totalCarrinho.value,
      paymentMethod: formCheckout.value.metodoPagamento === 'credito' ? 'Cartão de Crédito' :
                     formCheckout.value.metodoPagamento === 'debito' ? 'Cartão de Débito' :
                     formCheckout.value.metodoPagamento === 'pix' ? 'PIX' : 'Dinheiro',
      status: 'Pendente',
      products: carrinho.value.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }))
    }
    financialRecordsDB.value.push(newFinancialRecord)

    // 3. Adicionar ao Kanban de Pedidos (coluna "Sendo Preparado")
    const preparingColumn = ordersKanbanDB.value.find(col => col.id === 'preparando')
    if (preparingColumn) {
      preparingColumn.orders.unshift({
        id: orderId,
        customer: formCheckout.value.nomeCliente,
        items: carrinho.value.map(item => `${item.quantity}x ${item.product.name}`).join(', '),
        time: 'Agora',
        total: `R$ ${totalCarrinho.value.toFixed(2)}`,
        selected: false,
        type: formCheckout.value.tipoEntrega,
        driver: null
      })
    }

    alert('Pedido finalizado com sucesso! Acompanhe no painel administrativo.')
    carrinho.value = [] // Limpa o carrinho
    mostrarCheckoutDrawer.value = false
    loadingCheckout.value = false
    // Opcional: redirecionar para uma tela de confirmação ou fechar o cardápio
  }, 1500)
}

// --- Scroll para Categorias ---
const scrollCategorias = (direction) => {
  const container = document.querySelector('.categorias-scroll-container')
  if (container) {
    const scrollAmount = 200 // Ajuste conforme necessário
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }
}

// --- Estilos e UX ---
// Para simular o padrão das telas existentes, usaremos classes utilitárias do Tailwind CSS
// e uma estrutura similar aos componentes BaseButton, etc.

</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">

    <!-- Cabeçalho Fixo -->
    <header class="bg-white shadow-sm p-4 sticky top-0 z-20">
      <div class="max-w-md mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img :src="loja.logoUrl" alt="Logo da Loja" class="w-10 h-10 rounded-full object-cover">
          <div>
            <h1 class="text-lg font-bold">{{ loja.name }}</h1>
            <p :class="['text-xs font-medium flex items-center gap-1', estaAberto ? 'text-green-600' : 'text-red-600']">
              <span :class="['w-2 h-2 rounded-full', estaAberto ? 'bg-green-500' : 'bg-red-500']"></span>
              {{ estaAberto ? 'Aberto Agora' : 'Fechado' }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-500">Horário:</p>
          <p class="text-xs font-medium">{{ loja.openingHours }}</p>
        </div>
      </div>
    </header>

    <!-- Navegação por Categorias (Horizontal Fixo) -->
    <nav class="bg-white shadow-sm py-3 sticky top-[72px] z-10 border-b border-gray-100">
      <div class="max-w-md mx-auto relative flex items-center">
        <button @click="scrollCategorias('left')" class="absolute left-0 bg-white bg-opacity-75 p-1 rounded-full shadow-md z-10">
          <ChevronLeft :size="18" />
        </button>
        <div class="flex-1 overflow-x-auto whitespace-nowrap scroll-smooth hide-scrollbar categorias-scroll-container px-8">
          <button
            v-for="cat in categorias"
            :key="cat"
            @click="categoriaSelecionada = cat"
            :class="['inline-block px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 mx-1',
                     categoriaSelecionada === cat ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100']"
          >
            {{ cat }}
          </button>
        </div>
        <button @click="scrollCategorias('right')" class="absolute right-0 bg-white bg-opacity-75 p-1 rounded-full shadow-md z-10">
          <ChevronRight :size="18" />
        </button>
      </div>
    </nav>

    <!-- Lista de Produtos -->
    <main class="flex-1 p-4 pb-24 max-w-md mx-auto w-full">
      <h2 class="text-xl font-bold mb-4">{{ categoriaSelecionada === 'Todos' ? 'Nosso Cardápio' : categoriaSelecionada }}</h2>
      <div class="space-y-4">
        <div
          v-for="produto in produtosFiltrados"
          :key="produto.id"
          class="bg-white rounded-xl shadow-sm overflow-hidden flex items-center border border-gray-100"
        >
          <img :src="produto.imageUrl" :alt="produto.name" class="w-24 h-24 object-cover flex-shrink-0">
          <div class="p-3 flex-1 flex flex-col justify-between">
            <div>
              <h3 class="font-semibold text-gray-900">{{ produto.name }}</h3>
              <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ produto.description }}</p>
            </div>
            <div class="flex items-center justify-between mt-2">
              <span class="text-base font-bold text-orange-600">R$ {{ produto.price.toFixed(2) }}</span>
              <button
                @click="adicionarAoCarrinho(produto)"
                :disabled="!estaAberto || produto.stock <= 0"
                :class="['bg-orange-500 text-white rounded-full p-2 text-sm font-bold transition-colors duration-200',
                         !estaAberto || produto.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600']"
              >
                <Plus :size="18" />
              </button>
            </div>
            <p v-if="produto.stock <= 0" class="text-red-500 text-xs mt-1">Esgotado</p>
          </div>
        </div>
        <p v-if="produtosFiltrados.length === 0" class="text-center text-gray-500 py-8">Nenhum produto nesta categoria.</p>
      </div>
    </main>

    <!-- Carrinho Flutuante (Botão/Barra Inferior) -->
    <div
      v-if="totalItensCarrinho > 0"
      @click="mostrarCarrinhoDrawer = true"
      class="fixed bottom-0 left-0 right-0 bg-orange-600 text-white p-4 shadow-lg cursor-pointer z-30"
    >
      <div class="max-w-md mx-auto flex justify-between items-center">
        <span class="font-bold">{{ totalItensCarrinho }} item(s)</span>
        <span class="font-bold text-lg">Ver Carrinho - R$ {{ subtotalCarrinho.toFixed(2) }}</span>
      </div>
    </div>

    <!-- Drawer do Carrinho -->
    <transition
      enter-active-class="transition ease-out duration-300 transform"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition ease-in duration-200 transform"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="mostrarCarrinhoDrawer"
        class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end"
        @click.self="mostrarCarrinhoDrawer = false"
      >
        <div class="bg-white w-full max-h-[90vh] rounded-t-3xl shadow-lg p-6 flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Seu Pedido</h2>
            <button @click="mostrarCarrinhoDrawer = false" class="text-gray-500 hover:text-gray-800">
              <X :size="24" />
            </button>
          </div>

          <div v-if="carrinho.length === 0" class="flex-1 text-center text-gray-500 py-8">
            <ShoppingCart :size="48" class="mx-auto mb-4 text-gray-300" />
            <p>Seu carrinho está vazio.</p>
          </div>

          <div v-else class="flex-1 overflow-y-auto space-y-4 pr-2">
            <div v-for="item in carrinho" :key="item.product.id" class="flex items-center gap-4">
              <img :src="item.product.imageUrl" :alt="item.product.name" class="w-16 h-16 object-cover rounded-lg">
              <div class="flex-1">
                <p class="font-semibold text-gray-900">{{ item.product.name }}</p>
                <p class="text-sm text-gray-600">R$ {{ item.product.price.toFixed(2) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="removerDoCarrinho(item.product.id)" class="bg-gray-200 text-gray-700 rounded-full p-1">
                  <Minus :size="16" />
                </button>
                <span class="font-bold">{{ item.quantity }}</span>
                <button @click="adicionarAoCarrinho(item.product)" class="bg-gray-200 text-gray-700 rounded-full p-1">
                  <Plus :size="16" />
                </button>
                <button @click="removerItemCompletoDoCarrinho(item.product.id)" class="text-red-500 ml-2">
                  <Trash2 :size="18" />
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <div class="flex justify-between font-medium">
              <span>Subtotal:</span>
              <span>R$ {{ subtotalCarrinho.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between font-medium" v-if="formCheckout.tipoEntrega === 'delivery'">
              <span>Entrega:</span>
              <span>R$ {{ valorEntrega.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>R$ {{ totalCarrinho.toFixed(2) }}</span>
            </div>
            <button
              @click="abrirCheckout"
              class="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-lg mt-4 hover:bg-orange-600 transition-colors"
            >
              Continuar para o Checkout
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Drawer do Checkout -->
    <transition
      enter-active-class="transition ease-out duration-300 transform"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition ease-in duration-200 transform"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="mostrarCheckoutDrawer"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
        @click.self="mostrarCheckoutDrawer = false"
      >
        <div class="bg-white w-full max-h-[90vh] rounded-t-3xl shadow-lg p-6 flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Finalizar Pedido</h2>
            <button @click="mostrarCheckoutDrawer = false" class="text-gray-500 hover:text-gray-800">
              <X :size="24" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto space-y-6 pr-2">
            <!-- Tipo de Entrega -->
            <div>
              <h3 class="font-bold text-lg mb-3 flex items-center gap-2"><MapPin :size="20" /> Como você quer receber?</h3>
              <div class="flex gap-4">
                <label :class="['flex-1 p-3 rounded-lg border cursor-pointer flex items-center gap-2', formCheckout.tipoEntrega === 'delivery' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white']">
                  <input type="radio" value="delivery" v-model="formCheckout.tipoEntrega" class="form-radio text-orange-500">
                  <Bike :size="20" /> Delivery
                </label>
                <label :class="['flex-1 p-3 rounded-lg border cursor-pointer flex items-center gap-2', formCheckout.tipoEntrega === 'retirada' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white']">
                  <input type="radio" value="retirada" v-model="formCheckout.tipoEntrega" class="form-radio text-orange-500">
                  <Store :size="20" /> Retirada
                </label>
              </div>
            </div>

            <!-- Dados do Cliente -->
            <div>
              <h3 class="font-bold text-lg mb-3 flex items-center gap-2"><User :size="20" /> Seus Dados</h3>
              <div class="space-y-3">
                <input type="text" v-model="formCheckout.nomeCliente" placeholder="Seu Nome Completo" class="w-full p-3 border border-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500">
                <input type="tel" v-model="formCheckout.telefoneCliente" placeholder="Seu Telefone (WhatsApp)" class="w-full p-3 border border-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500">
              </div>
            </div>

            <!-- Endereço de Entrega (se delivery) -->
            <div v-if="formCheckout.tipoEntrega === 'delivery'">
              <h3 class="font-bold text-lg mb-3 flex items-center gap-2"><MapPin :size="20" /> Endereço de Entrega</h3>
              <div class="space-y-3">
                <input type="text" v-model="formCheckout.enderecoCliente" placeholder="Rua, Avenida..." class="w-full p-3 border border-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500">
                <div class="flex gap-3">
                  <input type="text" v-model="formCheckout.numeroCliente" placeholder="Número" class="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500">
                  <input type="text" v-model="formCheckout.complementoCliente" placeholder="Apto, Bloco (opcional)" class="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500">
                </div>
                <input type="text" v-model="formCheckout.bairroCliente" placeholder="Bairro" class="w-full p-3 border border-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500">
              </div>
            </div>

            <!-- Forma de Pagamento -->
            <div>
              <h3 class="font-bold text-lg mb-3 flex items-center gap-2"><CreditCard :size="20" /> Forma de Pagamento</h3>
              <div class="grid grid-cols-2 gap-3">
                <label :class="['p-3 rounded-lg border cursor-pointer flex items-center gap-2', formCheckout.metodoPagamento === 'pix' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white']">
                  <input type="radio" value="pix" v-model="formCheckout.metodoPagamento" class="form-radio text-orange-500">
                  <QrCode :size="20" /> PIX
                </label>
                <label :class="['p-3 rounded-lg border cursor-pointer flex items-center gap-2', formCheckout.metodoPagamento === 'credito' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white']">
                  <input type="radio" value="credito" v-model="formCheckout.metodoPagamento" class="form-radio text-orange-500">
                  <CreditCard :size="20" /> Cartão Crédito
                </label>
                <label :class="['p-3 rounded-lg border cursor-pointer flex items-center gap-2', formCheckout.metodoPagamento === 'debito' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white']">
                  <input type="radio" value="debito" v-model="formCheckout.metodoPagamento" class="form-radio text-orange-500">
                  <CreditCard :size="20" /> Cartão Débito
                </label>
                <label :class="['p-3 rounded-lg border cursor-pointer flex items-center gap-2', formCheckout.metodoPagamento === 'dinheiro' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white']">
                  <input type="radio" value="dinheiro" v-model="formCheckout.metodoPagamento" class="form-radio text-orange-500">
                  <Banknote :size="20" /> Dinheiro
                </label>
              </div>
            </div>

            <!-- Observações -->
            <div>
              <h3 class="font-bold text-lg mb-3 flex items-center gap-2"><Clipboard :size="20" /> Observações (opcional)</h3>
              <textarea v-model="formCheckout.observacoes" placeholder="Ex: Sem cebola, tirar maionese..." rows="3" class="w-full p-3 border border-gray-200 rounded-lg focus:ring-orange-500 focus:border-orange-500"></textarea>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-gray-100">
            <div class="flex justify-between font-bold text-xl mb-4">
              <span>Total a Pagar:</span>
              <span>R$ {{ totalCarrinho.toFixed(2) }}</span>
            </div>
            <button
              @click="finalizarPedido"
              :disabled="loadingCheckout"
              :class="['w-full bg-green-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors', loadingCheckout ? 'opacity-50 cursor-not-allowed' : '']"
            >
              {{ loadingCheckout ? 'Finalizando...' : 'Fazer Pedido' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
/* Esconder scrollbar mas permitir rolagem */
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
</style>
