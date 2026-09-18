import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Testes vivem ao lado do arquivo que exercitam (src/lib/domain.ts -> src/lib/domain.test.ts).
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/modules/**/*.schema.ts"],
    },
  },
});
