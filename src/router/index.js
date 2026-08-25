import { createRouter, createWebHistory } from "vue-router";
import { authState } from "../utils/auth";
import Login from "../views/Login.vue";
import AdminLayout from "../layouts/AdminLayout.vue";
import Dashboard from "../views/Dashboard.vue";
import ListaClientes from "../views/clientes/ListaClientes.vue";
import CadastroCliente from "../views/clientes/CadastroCliente.vue";
import AvaliacaoPedido from "../views/clientes/AvaliacaoPedido.vue";
import ListaIngredientes from "../views/ingredientes/ListaIngredientes.vue";
import CadastroIngrediente from "../views/ingredientes/CadastroIngrediente.vue";
import ControlePedidos from "../views/pedidos/ControlePedidos.vue";
import NovoPedido from "../views/pedidos/NovoPedido.vue";
import ListaProdutos from "../views/produtos/ListaProdutos.vue";
import CadastroProduto from "../views/produtos/CadastroProduto.vue";
import ListaEntregadores from "../views/entregadores/ListaEntregadores.vue";
import CadastroEntregadores from "../views/entregadores/CadastroEntregador.vue";
import AcertoEntregadores from "../views/entregadores/AcertoEntregadores.vue";
import Financeiro from "../views/financeiro/Financeiro.vue";
import UsuariosView from "../views/usuarios/Usuarios.vue";
import CadastroUsuario from "@/views/usuarios/CadastroUsuario.vue";
import CardapioDigital from "../views/cardapio/CardapioDigital.vue";
import Integracoes from "../views/integracoes/Integracoes.vue";
import CMV from "../views/financeiro/CMV.vue";
import ConfiguracaoModificadores from "../views/configuracoes/ConfiguracaoModificadores.vue";
import Checklist from "../views/operacional/Checklist.vue";
import Cotacoes from "../views/operacional/Cotacoes.vue";
import MovimentacoesEstoque from "../views/estoque/MovimentacoesEstoque.vue";
import SetoresProducao from "../views/configuracoes/SetoresProducao.vue";
import Impressoras from "../views/configuracoes/Impressoras.vue";
import InteligenciaFinanceira from "../views/financeiro/InteligenciaFinanceira.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "login",
      component: Login,
    },
    {
      path: "/avaliar/:orderId",
      name: "avaliar-pedido",
      component: AvaliacaoPedido,
      meta: { public: true },
    },
    {
      path: "/cardapio/:storeName",
      name: "cardapio-digital",
      component: CardapioDigital,
      meta: { public: true },
    },
    {
      path: "/",
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "dashboard",
          name: "dashboard",
          component: Dashboard,
          meta: { requiresPermission: "dashboard" },
        },
        {
          path: "pedidos",
          name: "pedidos",
          component: ControlePedidos,
          meta: { requiresPermission: "pedidos" },
        },
        {
          path: "pedidos/novo",
          name: "novo-pedido",
          component: NovoPedido,
          meta: { requiresPermission: "pedidos" },
        },
        {
          path: "pedidos/editar/:id",
          name: "editar-pedido",
          component: NovoPedido,
          meta: { requiresPermission: "pedidos" },
        },
        {
          path: "clientes",
          name: "clientes",
          component: ListaClientes,
          meta: { requiresPermission: "clientes" },
        },
        {
          path: "clientes/novo",
          name: "novo-cliente",
          component: CadastroCliente,
          meta: { requiresPermission: "clientes" },
        },
        {
          path: "clientes/editar/:id",
          name: "editar-cliente",
          component: CadastroCliente,
          meta: { requiresPermission: "clientes" },
        },
        {
          path: "ingredientes",
          name: "ingredientes",
          component: ListaIngredientes,
          meta: { requiresPermission: "ingredientes" },
        },
        {
          path: "estoque/movimentacoes",
          name: "movimentacoes-estoque",
          component: MovimentacoesEstoque,
          meta: { requiresPermission: "ingredientes" },
        },
        {
          path: "ingredientes/novo",
          name: "novo-ingrediente",
          component: CadastroIngrediente,
          meta: { requiresPermission: "ingredientes" },
        },
        {
          path: "ingredientes/editar/:id",
          name: "editar-ingrediente",
          component: CadastroIngrediente,
          meta: { requiresPermission: "ingredientes" },
        },
        {
          path: "produtos",
          name: "produtos",
          component: ListaProdutos,
          meta: { requiresPermission: "produtos" },
        },
        {
          path: "produtos/novo",
          name: "novo-produto",
          component: CadastroProduto,
          meta: { requiresPermission: "produtos" },
        },
        {
          path: "produtos/editar/:id",
          name: "editar-produto",
          component: CadastroProduto,
          meta: { requiresPermission: "produtos" },
        },
        {
          path: "entregadores",
          name: "entregadores",
          component: ListaEntregadores,
          meta: { requiresPermission: "entregadores" },
        },
        {
          path: "entregadores/novo",
          name: "novo-entregador",
          component: CadastroEntregadores,
          meta: { requiresPermission: "entregadores" },
        },
        {
          path: "entregadores/editar/:id",
          name: "editar-entregadores",
          component: CadastroEntregadores,
          meta: { requiresPermission: "entregadores" },
        },
        {
          path: "acerto-entregadores",
          name: "acerto-entregadores",
          component: AcertoEntregadores,
          meta: { requiresPermission: "acerto_entregadores" },
        },
        {
          path: "financeiro",
          name: "financeiro",
          component: Financeiro,
          meta: { requiresPermission: "financeiro" },
        },
        {
          path: "financeiro/cmv", // Nova rota para o CMV
          name: "cmv",
          component: CMV,
          meta: { requiresPermission: "financeiro" }, // Requer permissão de financeiro
        },
        {
          path: "usuarios",
          name: "usuarios",
          component: UsuariosView,
          meta: { requiresPermission: "usuarios" },
        },
        {
          path: "usuarios/novo",
          name: "novo-usuario",
          component: CadastroUsuario,
          meta: { requiresPermission: "usuarios" },
        },
        {
          path: "usuarios/editar/:id",
          name: "editar-usuario",
          component: CadastroUsuario,
          meta: { requiresPermission: "usuarios" },
        },
        {
          path: "integracoes",
          name: "integracoes",
          component: Integracoes,
          meta: { requiresPermission: "integracoes" },
        },
        {
          path: "configuracoes/modificadores",
          name: "configuracao-modificadores",
          component: ConfiguracaoModificadores,
          meta: { requiresPermission: "produtos" }, // Requer permissão de produtos/gestor
        },
        {
          path: "checklist",
          name: "checklist",
          component: Checklist,
          meta: { requiresPermission: "pedidos" },
        },
        {
          path: "cotacoes",
          name: "cotacoes",
          component: Cotacoes,
          meta: { requiresPermission: "financeiro" },
        },
        {
          path: "configuracoes/setores-producao",
          name: "setores-producao",
          component: SetoresProducao,
          meta: { requiresPermission: "produtos" },
        },
        {
          path: "configuracoes/impressoras",
          name: "impressoras",
          component: Impressoras,
          meta: { requiresPermission: "produtos" },
        },
        {
          path: "financeiro/inteligencia",
          name: "inteligencia-financeira",
          component: InteligenciaFinanceira,
          meta: { requiresPermission: "financeiro" },
        },
      ],
    },
  ],
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isPublic = to.matched.some((record) => record.meta.public); // Verifica se é uma rota pública
  const requiredPermission = to.meta.requiresPermission;

  console.log("--- Navigation Guard ---");
  console.log(
    "To:",
    to.path,
    "Requires Auth:",
    requiresAuth,
    "Required Permission:",
    requiredPermission,
    "Is Public:",
    isPublic,
  );
  console.log(
    "Current User:",
    authState.currentUser ? authState.currentUser.login : "None",
    "Has Permission:",
    requiredPermission ? authState.hasPermission(requiredPermission) : "N/A",
  );

  if (requiresAuth && !authState.currentUser) {
    next({ name: "login" });
  } else if (
    requiredPermission &&
    !authState.hasPermission(requiredPermission)
  ) {
    next({ name: "login" });
  } else if (isPublic) {
    // Se for rota pública, permite acesso direto
    next();
  } else {
    next();
  }
});

export default router;
