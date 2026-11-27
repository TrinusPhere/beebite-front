import { test, expect } from "@playwright/test";

test.describe("Diagnóstico e Indicador de Sincronização Edge (Camada 5)", () => {
  test("Deve exibir badge de evento rejeitado no cabeçalho e permitir reenvio e reconciliação", async ({
    page,
  }) => {
    const failedEventId = "11111111-2222-3333-4444-555555555555";
    let retried = false;

    await page.addInitScript(() => {
      localStorage.setItem("beebite_token", "fake-jwt-token");
      localStorage.setItem(
        "beebite_current_user",
        JSON.stringify({
          id: "00000000-0000-0000-0000-000000000099",
          name: "Admin Balcão",
          login: "admin",
          role: "ADMIN",
          storeId: "00000000-0000-0000-0000-000000000001",
          permissions: ["integracoes", "pedidos", "dashboard"],
        }),
      );
      localStorage.setItem(
        "beebite_accessible_stores",
        JSON.stringify([
          {
            id: "00000000-0000-0000-0000-000000000001",
            storeId: "00000000-0000-0000-0000-000000000001",
            storeName: "Loja Balcão Edge",
            syncMode: "EDGE",
            activeContext: true,
          },
        ]),
      );
    });

    await page.route("**/api/v1/auth/stores", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "00000000-0000-0000-0000-000000000001",
            storeId: "00000000-0000-0000-0000-000000000001",
            storeName: "Loja Balcão Edge",
            syncMode: "EDGE",
            activeContext: true,
          },
        ]),
      });
    });

    await page.route("**/api/v1/sync/health", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          syncMode: "EDGE",
          pendingCount: retried ? 1 : 0,
          failedCount: retried ? 0 : 1,
          oldestPendingAgeSeconds: retried ? 3 : null,
          cloudAckSequence: 142,
          lastSuccessAt: "2026-11-26T23:00:00Z",
          nextAttemptAt: null,
          consecutiveFailures: 0,
          lastError: null,
          fullResyncRequested: false,
          lastReconciliation: {
            runId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            status: "CONSISTENT",
            bucketsCompared: 12,
            bucketsMismatched: 0,
            requeuedCount: 0,
            extraInCloudCount: 0,
          },
        }),
      });
    });

    await page.route("**/api/v1/sync/failed/*/retry", async (route) => {
      retried = true;
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ requeued: 1 }),
      });
    });

    await page.route("**/api/v1/sync/failed?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          retried
            ? []
            : [
                {
                  id: failedEventId,
                  sequence: 143,
                  eventType: "ORDER_UPSERT",
                  aggregateId: "99999999-8888-7777-6666-555555555555",
                  attempts: 1,
                  rejectedReason: "Payload de evento Edge inválido: orderId ausente",
                  createdAt: "2026-11-26T22:59:00Z",
                },
              ],
        ),
      });
    });

    await page.route("**/api/v1/sync/reconcile", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          runId: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
          status: "REPAIRED",
          bucketsCompared: 14,
          bucketsMismatched: 1,
          requeuedCount: 2,
          extraInCloudCount: 0,
        }),
      });
    });

    await page.goto("/integracoes/edge-sync");

    await expect(page.getByTestId("edge-sync-badge")).toContainText("1 rejeitado");
    await expect(
      page.getByRole("heading", { name: "Diagnóstico de Sincronização Edge" }),
    ).toBeVisible();
    await expect(page.getByText("Payload de evento Edge inválido")).toBeVisible();

    await page.getByRole("button", { name: "Reenviar" }).click();
    await expect(page.getByTestId("edge-sync-badge")).toContainText("1 pendente");

    await page.getByRole("button", { name: /Conferir agora/i }).click();
    await expect(page.getByText(/2 registro\(s\) reenfileirado\(s\)/i)).toBeVisible();
  });
});

