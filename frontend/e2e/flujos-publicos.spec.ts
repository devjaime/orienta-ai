import { expect, test } from "@playwright/test";

test("la exploración vocacional inicia y muestra su avance", async ({ page }) => {
  await page.goto("/test-gratis");
  await expect(page.getByRole("heading", { name: /Test vocacional gratis/i })).toBeVisible();

  await page.getByPlaceholder("Tu nombre").fill("Persona de prueba");
  await page.getByPlaceholder("tu@email.com").fill("prueba@vocari.cl");
  await page.getByRole("button", { name: /Comenzar test gratis/i }).click();

  await expect(page.getByText(/Pregunta 1 de 36/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Muy de acuerdo/i })).toBeVisible();
});

test("la reconversión solicita contexto antes de avanzar", async ({ page }) => {
  await page.goto("/reconversion-gratis");
  await expect(page.getByRole("heading", { name: /Explora un futuro laboral/i })).toBeVisible();
  await expect(page.getByText(/Fase 0 · Tu punto de partida/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Comenzar fase 1/i })).toBeDisabled();
});

test("el acceso de usuarios ofrece autenticación con Google", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: "Vocari" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Iniciar sesion con Google/i })).toBeVisible();
});
