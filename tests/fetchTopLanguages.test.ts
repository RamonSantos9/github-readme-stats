import { afterEach, describe, expect, it } from "@jest/globals";
import "@testing-library/jest-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { fetchTopLanguages } from "../src/fetchers/top-languages.js";

const mock = new MockAdapter(axios);

afterEach(() => {
  mock.reset();
});

const data_langs = {
  data: {
    user: {
      repositories: {
        nodes: [
          {
            name: "test-repo-1",
            languages: {
              edges: [{ size: 100, node: { color: "#0f0", name: "HTML" } }],
            },
          },
          {
            name: "test-repo-2",
            languages: {
              edges: [{ size: 100, node: { color: "#0f0", name: "HTML" } }],
            },
          },
          {
            name: "test-repo-3",
            languages: {
              edges: [
                { size: 100, node: { color: "#0ff", name: "javascript" } },
              ],
            },
          },
          {
            name: "test-repo-4",
            languages: {
              edges: [
                { size: 100, node: { color: "#0ff", name: "javascript" } },
              ],
            },
          },
        ],
      },
    },
  },
};

const error = {
  errors: [
    {
      type: "NOT_FOUND",
      path: ["user"],
      locations: [],
      message:
        "Não foi possível resolver para um usuário com o login 'noname'.",
    },
  ],
};

describe("Testes em fetchers/top-languages.ts", () => {
  it("deve buscar os dados de linguagem corretos usando o novo cálculo", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    const repo = await fetchTopLanguages("ramonsantos9", [], 0.5, 0.5);
    expect(repo).toStrictEqual({
      HTML: {
        color: "#0f0",
        name: "HTML",
        size: 20.000000000000004,
      },
      javascript: {
        color: "#0ff",
        name: "javascript",
        size: 20.000000000000004,
      },
    });
  });

  it("deve buscar os dados de linguagem corretos excluindo o repositório 'test-repo-1'", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    const repo = await fetchTopLanguages("ramonsantos9", ["test-repo-1"]);
    expect(repo).toStrictEqual({
      HTML: {
        color: "#0f0",
        name: "HTML",
        size: 100,
      },
      javascript: {
        color: "#0ff",
        name: "javascript",
        size: 200,
      },
    });
  });

  it("deve buscar os dados de linguagem corretos usando o cálculo antigo", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    const repo = await fetchTopLanguages("ramonsantos9", [], 1, 0);
    expect(repo).toStrictEqual({
      HTML: {
        color: "#0f0",
        name: "HTML",
        size: 200,
      },
      javascript: {
        color: "#0ff",
        name: "javascript",
        size: 200,
      },
    });
  });

  it("deve classificar as linguagens pelo número de repositórios em que aparecem", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    const repo = await fetchTopLanguages("ramonsantos9", [], 0, 1);
    expect(repo).toStrictEqual({
      HTML: {
        color: "#0f0",
        name: "HTML",
        size: 2,
      },
      javascript: {
        color: "#0ff",
        name: "javascript",
        size: 2,
      },
    });
  });

  it("deve lançar erro específico quando o usuário não for encontrado", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, error);

    await expect(fetchTopLanguages("ramonsantos9")).rejects.toThrow(
      "Não foi possível resolver para um usuário com o login 'noname'.",
    );
  });

  it("deve lançar outros erros com sua mensagem", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      errors: [{ message: "Algum erro de teste do GraphQL" }],
    });

    await expect(fetchTopLanguages("ramonsantos9")).rejects.toThrow(
      "Algum erro de teste do GraphQL",
    );
  });

  it("deve lançar erro com mensagem específica quando o erro não contém a propriedade message", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      errors: [{ type: "TEST" }],
    });

    await expect(fetchTopLanguages("ramonsantos9")).rejects.toThrow(
      "Ocorreu um erro ao buscar os dados de linguagens via GraphQL.",
    );
  });
});
