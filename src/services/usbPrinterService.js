/**
 * Serviço de comunicação direta com impressoras térmicas via USB no navegador.
 * Utiliza WebUSB API (com fallback para Web Serial API).
 * Requer navegador baseado em Chromium (Chrome, Edge, Opera) e HTTPS ou localhost.
 */

let cachedUsbDevice = null;
let cachedSerialPort = null;

export const usbPrinterService = {
  isSupported() {
    return typeof navigator !== "undefined" && (!!navigator.usb || !!navigator.serial);
  },

  async sendEscPosToUsb(escPosBase64) {
    if (!this.isSupported()) {
      throw new Error(
        "Seu navegador não suporta impressão USB direta (WebUSB/Web Serial). Use Google Chrome ou Microsoft Edge no PC do caixa."
      );
    }

    const binaryString = atob(escPosBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 1. Tentar WebUSB
    if (navigator.usb) {
      try {
        await this.printViaWebUsb(bytes);
        return { success: true, method: "WebUSB" };
      } catch (usbError) {
        console.warn("Falha no WebUSB, tentando Web Serial...", usbError);
      }
    }

    // 2. Fallback: Web Serial
    if (navigator.serial) {
      try {
        await this.printViaWebSerial(bytes);
        return { success: true, method: "WebSerial" };
      } catch (serialError) {
        throw new Error(
          "Não foi possível enviar para a impressora USB: " +
            (serialError.message || "Acesso negado ou dispositivo desconectado.")
        );
      }
    }

    throw new Error("Nenhum método USB disponível para envio.");
  },

  async printViaWebUsb(bytes) {
    let device = cachedUsbDevice;

    if (!device || !device.opened) {
      const paired = await navigator.usb.getDevices();
      device = paired[0] || (await navigator.usb.requestDevice({ filters: [] }));
      cachedUsbDevice = device;
    }

    if (!device.opened) {
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);
    }

    // Localizar endpoint de saída (direction === "out")
    const iface = device.configuration.interfaces[0];
    const alt = iface.alternates[0];
    const outEndpoint = alt.endpoints.find((ep) => ep.direction === "out");

    if (!outEndpoint) {
      throw new Error("Endpoint de saída USB não encontrado na impressora.");
    }

    await device.transferOut(outEndpoint.endpointNumber, bytes);
  },

  async printViaWebSerial(bytes) {
    let port = cachedSerialPort;

    if (!port) {
      const ports = await navigator.serial.getPorts();
      port = ports[0] || (await navigator.serial.requestPort());
      cachedSerialPort = port;
    }

    try {
      await port.open({ baudRate: 9600 });
    } catch (e) {
      // Pode já estar aberta
    }

    const writer = port.writable.getWriter();
    await writer.write(bytes);
    writer.releaseLock();
  },
};
