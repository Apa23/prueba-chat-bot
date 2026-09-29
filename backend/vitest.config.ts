import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/domain/afiliado.ts',
        'src/application/herramientas/contrato.ts',
        'src/application/llm/llm-port.ts',
        'src/infrastructure/llm/llm-mock.ts',
      ],
    },
  },
});
