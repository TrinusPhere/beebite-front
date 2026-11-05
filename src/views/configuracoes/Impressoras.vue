<script setup>
import { ref, reactive, watch, onMounted } from "vue";
import {
  Printer,
  Plus,
  TestTube2,
  Trash2,
  FileText,
  Eye,
  Save,
  Check,
  RotateCcw,
  Sliders,
  Scissors,
  Wifi,
  Usb,
  Receipt,
  Store,
  User,
  ShoppingBag,
  CreditCard,
} from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import { printingService } from "@/services/printingService";
import { productionSectorService } from "@/services/productionSectorService";
import { usbPrinterService } from "@/services/usbPrinterService";

const activeTab = ref("printers"); // "printers", "rules", "template"

// ── Impressoras e Regras ──────────────────────────────────────────────
const printers = ref([]);
const rules = ref([]);
const sectors = ref([]);
const isTesting = ref(false);

const printer = ref({
  name: "",
  connectionType: "NETWORK",
  address: "",
  port: 9100,
  paperWidthMm: 80,
  codePage: "CP860",
  cutPaper: true,
  active: true,
});

const rule = ref({
  name: "",
  operation: "DELIVERY",
  documentType: "KITCHEN",
  sectorId: "",
  printerId: "",
});

// ── Modelo de Comanda & Preview ───────────────────────────────────────
const selectedDocType = ref("KITCHEN");
const previewWidthMm = ref(80);
const previewLines = ref([]);
const previewColumns = ref(48);
const isSavingTemplate = ref(false);
const saveSuccess = ref(false);

const templateForm = reactive({
  largeTitle: true,
  headerText: "",
  footerText: "",
  sections: {
    showStoreName: false,
    showStoreAddress: false,
    showCustomerName: false,
    showCustomerPhone: false,
    showCustomerAddress: false,
    showOrderNumber: true,
    showDateTime: true,
    showChannel: true,
    showServiceType: true,
    showOrderNotes: true,
    showItemModifiers: true,
    showItemRemovals: true,
    showItemNotes: true,
    showItemPrices: false,
    showSubtotal: false,
    showDeliveryFee: false,
    showTotal: false,
    showPaymentMethod: false,
    showCashChange: false,
  },
});

// ── Carga Inicial ─────────────────────────────────────────────────────
const load = async () => {
  [printers.value, rules.value, sectors.value] = await Promise.all([
    printingService.getPrinters(),
    printingService.getRules(),
    productionSectorService.getAll(),
  ]);

  if (!rule.value.sectorId && sectors.value.length) {
    const kitchen = sectors.value.find(
      (s) => String(s.code || "").toUpperCase() === "KITCHEN"
    );
    rule.value.sectorId = (kitchen || sectors.value[0]).id;
  }
};

onMounted(async () => {
  await load();
  await loadTemplate();
});

// ── Operações de Impressora ───────────────────────────────────────────
const savePrinter = async () => {
  if (!printer.value.name) return;
  await printingService.savePrinter(printer.value);
  printer.value = {
    name: "",
    connectionType: "NETWORK",
    address: "",
    port: 9100,
    paperWidthMm: 80,
    codePage: "CP860",
    cutPaper: true,
    active: true,
  };
  await load();
};

const del = async (id) => {
  if (!confirm("Excluir esta impressora?")) return;
  await printingService.deletePrinter(id);
  await load();
};

const test = async (p) => {
  isTesting.value = true;
  try {
    const r = await printingService.testPrint(p);
    if (r.mode === "BROWSER" && r.escPosBase64) {
      // Impressora USB: enviar bytes via navegador
      await usbPrinterService.sendEscPosToUsb(r.escPosBase64);
      alert("Comanda de teste enviada para a impressora USB via navegador!");
    } else {
      alert(r.message || "Teste enviado para a impressora de rede!");
    }
  } catch (err) {
    alert("Erro no teste de impressão: " + (err.message || err));
  } finally {
    isTesting.value = false;
  }
};

const saveRule = async () => {
  if (!rule.value.name || !rule.value.printerId) return;
  await printingService.saveRule(rule.value);
  rule.value = {
    name: "",
    operation: "DELIVERY",
    documentType: "KITCHEN",
    sectorId:
      sectors.value.find(
        (s) => String(s.code || "").toUpperCase() === "KITCHEN"
      )?.id ||
      sectors.value[0]?.id ||
      "",
    printerId: "",
  };
  await load();
};

// ── Gestão de Modelo de Comanda ───────────────────────────────────────
const loadTemplate = async () => {
  try {
    const t = await printingService.getTemplate(selectedDocType.value);
    templateForm.largeTitle = t.largeTitle;
    templateForm.headerText = t.headerText || "";
    templateForm.footerText = t.footerText || "";
    Object.assign(templateForm.sections, t.sections);
    await updatePreview();
  } catch (err) {
    console.error("Erro ao carregar modelo:", err);
  }
};

let previewDebounce = null;
const updatePreview = async () => {
  clearTimeout(previewDebounce);
  previewDebounce = setTimeout(async () => {
    try {
      const resp = await printingService.previewTemplate(
        selectedDocType.value,
        {
          paperWidthMm: previewWidthMm.value,
          template: {
            largeTitle: templateForm.largeTitle,
            headerText: templateForm.headerText || null,
            footerText: templateForm.footerText || null,
            sections: templateForm.sections,
          },
        }
      );
      previewLines.value = resp.lines;
      previewColumns.value = resp.columns;
    } catch (err) {
      console.error("Erro no preview:", err);
    }
  }, 150);
};

// Atualiza preview em tempo real quando formulário muda
watch(
  () => [templateForm, previewWidthMm.value],
  () => updatePreview(),
  { deep: true }
);

watch(selectedDocType, async () => {
  await loadTemplate();
});

const saveCurrentTemplate = async () => {
  isSavingTemplate.value = true;
  saveSuccess.value = false;
  try {
    await printingService.saveTemplate(selectedDocType.value, {
      largeTitle: templateForm.largeTitle,
      headerText: templateForm.headerText || null,
      footerText: templateForm.footerText || null,
      sections: templateForm.sections,
    });
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
  } catch (err) {
    alert("Erro ao salvar modelo: " + (err.message || err));
  } finally {
    isSavingTemplate.value = false;
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-20">
    <!-- Cabeçalho -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Printer class="text-orange-500" :size="28" />
          Impressoras & Comandas Térmicas
        </h1>
        <p class="text-sm text-slate-500">
          Conexão ESC/POS (Epson / Térmica), bobinas 58mm/80mm e modelos de comanda customizáveis.
        </p>
      </div>

      <!-- Abas de Navegação -->
      <div class="flex bg-slate-100 p-1 rounded-2xl border">
        <button
          @click="activeTab = 'printers'"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5',
            activeTab === 'printers'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900',
          ]"
        >
          <Printer :size="15" /> Impressoras & Regras
        </button>
        <button
          @click="activeTab = 'template'"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5',
            activeTab === 'template'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900',
          ]"
        >
          <Receipt :size="15" /> Modelo de Comanda (Preview)
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- ABA 1: IMPRESSORAS E REGRAS DE ROTEAMENTO                          -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'printers'" class="grid lg:grid-cols-2 gap-6">
      <!-- Seção: Impressoras -->
      <section class="bg-white border rounded-3xl p-6 space-y-4">
        <h2 class="font-black flex items-center gap-2 text-slate-800">
          <Printer :size="18" class="text-orange-500" /> Cadastrar Impressora
        </h2>

        <div class="space-y-3">
          <input
            v-model="printer.name"
            class="w-full border bg-slate-50 p-3 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            placeholder="Nome da impressora (ex: Epson Caixa, Cozinha 1)"
          />

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-500 block mb-1">Tipo de Conexão</label>
              <select
                v-model="printer.connectionType"
                class="w-full border bg-slate-50 p-3 rounded-xl text-sm"
              >
                <option value="NETWORK">Rede (TCP/IP 9100)</option>
                <option value="USB_BROWSER">USB no Caixa (Navegador)</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-500 block mb-1">Largura da Bobina</label>
              <select
                v-model.number="printer.paperWidthMm"
                class="w-full border bg-slate-50 p-3 rounded-xl text-sm"
              >
                <option :value="80">80mm (48 colunas - Padrão)</option>
                <option :value="58">58mm (32 colunas - Compacta)</option>
              </select>
            </div>
          </div>

          <div v-if="printer.connectionType === 'NETWORK'" class="grid grid-cols-3 gap-3">
            <div class="col-span-2">
              <label class="text-xs font-semibold text-slate-500 block mb-1">Endereço IP da Impressora</label>
              <input
                v-model="printer.address"
                class="w-full border bg-slate-50 p-3 rounded-xl text-sm"
                placeholder="Ex: 192.168.1.200"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-500 block mb-1">Porta RAW</label>
              <input
                v-model.number="printer.port"
                type="number"
                class="w-full border bg-slate-50 p-3 rounded-xl text-sm"
                placeholder="9100"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-500 block mb-1">Tabela de Caracteres (Code Page)</label>
              <select
                v-model="printer.codePage"
                class="w-full border bg-slate-50 p-3 rounded-xl text-sm"
              >
                <option value="CP860">CP860 (Português / Epson)</option>
                <option value="CP850">CP850 (Multilíngue)</option>
                <option value="CP858">CP858 (Euro / Português)</option>
                <option value="CP1252">CP1252 (Windows Latin 1)</option>
                <option value="CP437">CP437 (USA / Padrão)</option>
              </select>
            </div>
            <div class="flex items-center pt-6">
              <label class="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  v-model="printer.cutPaper"
                  class="rounded text-orange-500 focus:ring-orange-400 h-4 w-4"
                />
                <Scissors :size="16" class="text-slate-500" />
                Corte automático (Guilhotina)
              </label>
            </div>
          </div>
        </div>

        <BaseButton class="w-full" @click="savePrinter">
          <Plus :size="18" /> Adicionar Impressora
        </BaseButton>

        <!-- Lista de Impressoras Cadastradas -->
        <div class="pt-2 space-y-2">
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-400">
            Impressoras Cadastradas ({{ printers.length }})
          </h3>
          <div
            v-for="p in printers"
            :key="p.id"
            class="p-4 border rounded-2xl flex items-center justify-between gap-3 hover:border-slate-300 transition"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <b class="text-slate-800">{{ p.name }}</b>
                <span
                  :class="[
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                    p.connectionType === 'NETWORK'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700',
                  ]"
                >
                  {{ p.connectionType === 'NETWORK' ? 'Rede TCP' : 'USB Caixa' }}
                </span>
                <span class="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {{ p.paperWidthMm }}mm ({{ p.columns }} col)
                </span>
              </div>
              <p class="text-xs text-slate-500">
                <span v-if="p.connectionType === 'NETWORK'">IP: {{ p.address || 'não informado' }}:{{ p.port }} • </span>
                Code Page: {{ p.codePage }} • {{ p.cutPaper ? 'Com corte' : 'Sem corte' }}
              </p>
            </div>
            <div class="flex items-center gap-1">
              <button
                @click="test(p)"
                :disabled="isTesting"
                title="Imprimir comanda de teste"
                class="p-2 text-orange-600 hover:bg-orange-50 rounded-xl transition"
              >
                <TestTube2 :size="18" />
              </button>
              <button
                @click="del(p.id)"
                title="Excluir impressora"
                class="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Seção: Regras de Roteamento -->
      <section class="bg-white border rounded-3xl p-6 space-y-4">
        <h2 class="font-black text-slate-800 flex items-center gap-2">
          <Sliders :size="18" class="text-orange-500" /> Regras de Impressão
        </h2>
        <input
          v-model="rule.name"
          class="w-full border bg-slate-50 p-3 rounded-xl text-sm"
          placeholder="Ex.: Cozinha Delivery, Bar Salão"
        />
        <div class="grid grid-cols-2 gap-3">
          <select v-model="rule.operation" class="border bg-slate-50 p-3 rounded-xl text-sm">
            <option value="DELIVERY">Delivery</option>
            <option value="SALAO">Salão</option>
          </select>
          <select v-model="rule.documentType" class="border bg-slate-50 p-3 rounded-xl text-sm">
            <option value="KITCHEN">Via Cozinha</option>
            <option value="EXPEDITION">Via Expedição</option>
            <option value="SECTOR">Por Setor de Produção</option>
          </select>
          <select v-model="rule.sectorId" class="border bg-slate-50 p-3 rounded-xl text-sm">
            <option v-for="s in sectors" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
          <select v-model="rule.printerId" class="border bg-slate-50 p-3 rounded-xl text-sm">
            <option value="">Selecione a impressora</option>
            <option v-for="p in printers" :key="p.id" :value="p.id">
              {{ p.name }} ({{ p.paperWidthMm }}mm)
            </option>
          </select>
        </div>
        <BaseButton class="w-full" @click="saveRule">Salvar Regra</BaseButton>
        <div class="space-y-2 pt-2">
          <div v-for="r in rules" :key="r.id" class="p-4 border rounded-2xl">
            <b>{{ r.name }}</b>
            <p class="text-xs text-slate-500">
              {{ r.operation }} • {{ r.documentType }} •
              {{ sectors.find((s) => s.id === r.sectorId)?.name || r.sectorId }}
            </p>
          </div>
        </div>
      </section>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- ABA 2: MODELO DE COMANDA (CONFIGURAÇÃO & LIVE PREVIEW)             -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'template'" class="grid lg:grid-cols-12 gap-6">
      <!-- Painel Esquerdo: Configurações do Modelo (7 colunas) -->
      <section class="lg:col-span-7 bg-white border rounded-3xl p-6 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
          <div>
            <h2 class="font-black text-slate-800 flex items-center gap-2">
              <Receipt :size="20" class="text-orange-500" />
              Modelo de Comanda
            </h2>
            <p class="text-xs text-slate-500">
              Escolha quais seções e detalhes serão impressos neste tipo de comanda.
            </p>
          </div>

          <!-- Seletor de Tipo de Documento -->
          <select
            v-model="selectedDocType"
            class="border bg-slate-50 font-bold text-sm text-slate-800 p-2.5 rounded-xl border-orange-200"
          >
            <option value="KITCHEN">🍳 Via Cozinha (Produção)</option>
            <option value="EXPEDITION">📦 Via Expedição / Entrega</option>
            <option value="CUSTOMER_RECEIPT">🧾 Cupom do Cliente</option>
          </select>
        </div>

        <!-- Cabeçalho e Rodapé Personalizados -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase text-slate-400 tracking-wider">
              Textos Adicionais
            </span>
            <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                v-model="templateForm.largeTitle"
                class="rounded text-orange-500 focus:ring-orange-400 h-4 w-4"
              />
              Título em Destaque (Tamanho Duplo)
            </label>
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">
                Texto do Cabeçalho (Topo)
              </label>
              <input
                v-model="templateForm.headerText"
                maxlength="255"
                placeholder="Ex: *** MESA 05 / DELIVERY ***"
                class="w-full border bg-slate-50 p-2.5 rounded-xl text-xs"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">
                Texto do Rodapé (Fim)
              </label>
              <input
                v-model="templateForm.footerText"
                maxlength="255"
                placeholder="Ex: Obrigado pela preferência! Volte sempre!"
                class="w-full border bg-slate-50 p-2.5 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        <!-- Seções em Grid -->
        <div class="space-y-4 pt-2">
          <!-- Grupo: Dados da Loja -->
          <div class="p-4 bg-slate-50 border rounded-2xl space-y-2">
            <h3 class="text-xs font-black uppercase text-slate-600 flex items-center gap-1.5">
              <Store :size="15" class="text-slate-400" /> Dados do Estabelecimento
            </h3>
            <div class="grid sm:grid-cols-2 gap-2">
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showStoreName"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Nome do Estabelecimento
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showStoreAddress"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Endereço do Estabelecimento
              </label>
            </div>
          </div>

          <!-- Grupo: Dados do Cliente -->
          <div class="p-4 bg-slate-50 border rounded-2xl space-y-2">
            <h3 class="text-xs font-black uppercase text-slate-600 flex items-center gap-1.5">
              <User :size="15" class="text-slate-400" /> Dados do Cliente & Entrega
            </h3>
            <div class="grid sm:grid-cols-3 gap-2">
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showCustomerName"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Nome do Cliente
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showCustomerPhone"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Telefone de Contato
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showCustomerAddress"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Endereço & Referência
              </label>
            </div>
          </div>

          <!-- Grupo: Informações do Pedido -->
          <div class="p-4 bg-slate-50 border rounded-2xl space-y-2">
            <h3 class="text-xs font-black uppercase text-slate-600 flex items-center gap-1.5">
              <Receipt :size="15" class="text-slate-400" /> Informações do Pedido
            </h3>
            <div class="grid sm:grid-cols-3 gap-2">
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showOrderNumber"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Número do Pedido (#)
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showDateTime"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Data e Horário
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showChannel"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Canal (iFood, Balcão, Web)
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showServiceType"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Tipo de Serviço (Entrega/Balcão)
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showOrderNotes"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Observações Gerais do Pedido
              </label>
            </div>
          </div>

          <!-- Grupo: Itens do Pedido -->
          <div class="p-4 bg-slate-50 border rounded-2xl space-y-2">
            <h3 class="text-xs font-black uppercase text-slate-600 flex items-center gap-1.5">
              <ShoppingBag :size="15" class="text-slate-400" /> Detalhes dos Itens
            </h3>
            <div class="grid sm:grid-cols-2 gap-2">
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showItemModifiers"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Adicionais & Modificadores
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showItemRemovals"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Remoções de Insumos ("SEM Cebola")
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showItemNotes"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Observação do Item
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showItemPrices"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Preço Unitário / Subtotal do Item
              </label>
            </div>
          </div>

          <!-- Grupo: Valores e Forma de Pagamento -->
          <div class="p-4 bg-slate-50 border rounded-2xl space-y-2">
            <h3 class="text-xs font-black uppercase text-slate-600 flex items-center gap-1.5">
              <CreditCard :size="15" class="text-slate-400" /> Totais & Forma de Pagamento
            </h3>
            <div class="grid sm:grid-cols-3 gap-2">
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showSubtotal"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Subtotal
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showDeliveryFee"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Taxa de Entrega
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showTotal"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Valor TOTAL
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showPaymentMethod"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Forma de Pagamento
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  v-model="templateForm.sections.showCashChange"
                  class="rounded text-orange-500 h-4 w-4"
                />
                Troco Informado (Dinheiro)
              </label>
            </div>
          </div>
        </div>

        <!-- Botão Salvar Modelo -->
        <div class="flex items-center justify-between pt-4 border-t">
          <span v-if="saveSuccess" class="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <Check :size="16" /> Modelo salvo com sucesso!
          </span>
          <span v-else class="text-xs text-slate-400">
            As alterações são visualizadas no simulador ao lado em tempo real.
          </span>

          <BaseButton :disabled="isSavingTemplate" @click="saveCurrentTemplate">
            <Save :size="16" /> Salvar Modelo
          </BaseButton>
        </div>
      </section>

      <!-- Painel Direito: Simulador de Papel Térmico (5 colunas) -->
      <section class="lg:col-span-5 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-black text-slate-800 flex items-center gap-2 text-sm">
            <Eye :size="18" class="text-orange-500" />
            Pré-Visualização em Bobina Térmica
          </h2>

          <!-- Seletor de Largura para Teste Visual -->
          <div class="flex items-center gap-1 bg-white border rounded-xl p-1 text-xs">
            <button
              @click="previewWidthMm = 80"
              :class="[
                'px-2.5 py-1 rounded-lg font-bold transition',
                previewWidthMm === 80
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900',
              ]"
            >
              80mm (48 col)
            </button>
            <button
              @click="previewWidthMm = 58"
              :class="[
                'px-2.5 py-1 rounded-lg font-bold transition',
                previewWidthMm === 58
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900',
              ]"
            >
              58mm (32 col)
            </button>
          </div>
        </div>

        <!-- O Cupom Térmico (Renderização Fiel) -->
        <div class="bg-slate-200 p-4 rounded-3xl flex justify-center items-start overflow-x-auto min-h-[500px]">
          <div
            :style="{
              width: previewWidthMm === 80 ? '380px' : '280px',
            }"
            class="bg-amber-50/70 border-t-8 border-b-8 border-dashed border-slate-300 shadow-xl rounded-md p-4 text-slate-900 font-mono text-[11px] leading-tight select-none transition-all duration-300"
          >
            <div class="text-[9px] text-slate-400 text-center pb-2 border-b border-dashed border-slate-300 mb-2">
              ═══ BOBINA {{ previewWidthMm }}mm • {{ previewColumns }} COLUNAS ═══
            </div>

            <!-- Linhas Renderizadas -->
            <div
              v-for="(line, idx) in previewLines"
              :key="idx"
              :class="[
                'whitespace-pre',
                line.bold ? 'font-bold' : 'font-normal',
                line.large ? 'text-base font-black tracking-wider py-1' : '',
              ]"
            >
              {{ line.text || ' ' }}
            </div>

            <div class="text-[9px] text-slate-400 text-center pt-2 border-t border-dashed border-slate-300 mt-2">
              ✂ ── CORTE DO PAPEL ── ✂
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
