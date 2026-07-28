import { describe, expect, test } from "vitest";
import { RuntimeConfigRepository } from "../../../src/config/RuntimeConfigRepository";

describe("RuntimeConfigRepository", () => {
  test("lee la configuración completa de un paquete de empresa", async () => {
    const repository = new RuntimeConfigRepository(async () => ({
      apiBaseUrl: "https://guard.example.com/",
      companyId: "andes-fintech",
      companyName: "Andes Fintech",
      enrollmentCode: "ande-7f3k-2nq8",
    }));

    expect(await repository.get()).toEqual({
      apiBaseUrl: "https://guard.example.com",
      companyId: "andes-fintech",
      companyName: "Andes Fintech",
      enrollmentCode: "ANDE-7F3K-2NQ8",
    });
  });

  test("acepta un build de desarrollo con sólo la URL del API", async () => {
    const repository = new RuntimeConfigRepository(async () => ({
      apiBaseUrl: "http://localhost:8787",
    }));

    const config = await repository.get();
    expect(config?.apiBaseUrl).toBe("http://localhost:8787");
    expect(config?.enrollmentCode).toBeUndefined();
  });

  test("sin configuración queda en modo local", async () => {
    const repository = new RuntimeConfigRepository(async () => null);
    expect(await repository.get()).toBe(null);
  });

  test("una configuración corrupta queda en modo local en vez de romper", async () => {
    const repository = new RuntimeConfigRepository(async () => ({
      apiBaseUrl: "no-es-una-url",
    }));
    expect(await repository.get()).toBe(null);
  });

  test("un error al leer queda en modo local", async () => {
    const repository = new RuntimeConfigRepository(() => {
      throw new Error("sin archivo");
    });
    expect(await repository.get()).toBe(null);
  });

  test("cachea la lectura", async () => {
    let calls = 0;
    const repository = new RuntimeConfigRepository(async () => {
      calls += 1;
      return { apiBaseUrl: "http://localhost:8787" };
    });

    await repository.get();
    await repository.get();

    expect(calls).toBe(1);
  });
});
