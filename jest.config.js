/** @type {import('jest').Config} */

/**
 * Configuração do Jest para o projeto GitHub README Stats.
 *
 * Suporta TypeScript via @swc/jest para compilação rápida.
 * Os testes de ponta a ponta (e2e) são excluídos da execução padrão.
 */
export default {
  clearMocks: true,
  testEnvironment: "jsdom",
  coverageProvider: "v8",
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
  modulePathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
  coveragePathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/tests/E2E/",
  ],
  // Suporte a TypeScript via @swc/jest (rápido, sem necessidade de tsc)
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: false,
            decorators: false,
          },
          target: "es2022",
        },
        module: {
          type: "es6",
        },
      },
    ],
  },
  // Mapeia importações .ts para encontrar os módulos corretamente
  moduleNameMapper: {
    "^(\\.{1,2}/.+)\\.js$": "$1",
    "^(\\.{1,2}/.+)\\.ts$": "$1",
  },
};
