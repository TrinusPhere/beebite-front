import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import MainLayout from '../components/MainLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import ListaClientes from '../views/clientes/ListaClientes.vue'
import CadastroCliente from '../views/clientes/CadastroCliente.vue'
import ListaIngredientes from '../views/ingredientes/ListaIngredientes.vue'
import CadastroIngrediente from '../views/ingredientes/CadastroIngrediente.vue'
import ControlePedidos from '../views/pedidos/ControlePedidos.vue'
import NovoPedido from '../views/pedidos/NovoPedido.vue' // Importar NovoPedido
import ListaProdutos from '../views/produtos/ListaProdutos.vue'
import CadastroProduto from '../views/produtos/CadastroProduto.vue'
import ListaEntregadores from '../views/entregadores/ListaEntregadores.vue'
import CadastroEntregadores from '../views/entregadores/CadastroEntregador.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: 'pedidos',
          name: 'pedidos',
          component: ControlePedidos
        },
        {
          path: 'pedidos/novo', // Nova rota para Novo Pedido
          name: 'novo-pedido',
          component: NovoPedido
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: Dashboard
        },
        {
          path: 'clientes',
          name: 'clientes',
          component: ListaClientes
        },
        {
          path: 'clientes/novo',
          name: 'novo-cliente',
          component: CadastroCliente
        },
        {
          path: 'clientes/editar/:id',
          name: 'editar-cliente',
          component: CadastroCliente
        },
        {
          path: 'ingredientes',
          name: 'ingredientes',
          component: ListaIngredientes
        },
        {
          path: 'ingredientes/novo',
          name: 'novo-ingrediente',
          component: CadastroIngrediente
        },
        {
          path: 'ingredientes/editar/:id',
          name: 'editar-ingrediente',
          component: CadastroIngrediente
        },
        {
          path: 'produtos',
          name: 'produtos',
          component: ListaProdutos
        },
        {
          path: 'produtos/novo',
          name: 'novo-produto',
          component: CadastroProduto
        },
        {
          path: 'produtos/editar/:id',
          name: 'editar-produto',
          component: CadastroProduto
        },
        {
          path: 'entregadores',
          name: 'entregadores',
          component: ListaEntregadores
        },
        {
          path: 'entregadores/novo',
          name: 'novo-entregador',
          component: CadastroEntregadores
        },
        {
          path: 'entregadores/editar/:id',
          name: 'editar-entregadores',
          component: CadastroEntregadores
        }
      ]
    }
  ]
})

export default router