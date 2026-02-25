import { afterEach, describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import topLangs from "../api/top-langs.js";
import { renderTopLanguages } from "../src/cards/top-languages.js";
import { renderError } from "../src/common/render.js";
import { CACHE_TTL, DURATIONS } from "../src/common/cache.js";

const data_langs = {
  data: {
    user: {
      repositories: {
        nodes: [
          {
            languages: {
              edges: [{ size: 150, node: { color: "#0f0", name: "HTML" } }],
            },
          },
          {
            languages: {
              edges: [{ size: 100, node: { color: "#0f0", name: "HTML" } }],
            },
          },
          {
            languages: {
              edges: [
                { size: 100, node: { color: "#0ff", name: "javascript" } },
              ],
            },
          },
          {
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
      message: "Could not fetch user",
    },
  ],
};

const langs = {
  HTML: {
    color: "#0f0",
    name: "HTML",
    size: 250,
  },
  javascript: {
    color: "#0ff",
    name: "javascript",
    size: 200,
  },
};

const mock = new MockAdapter(axios);

afterEach(() => {
  mock.reset();
});

describe("Testes em api/top-langs.ts (Top Languages API)", () => {
  it("deve processar a requisição de linguagens corretamente", async () => {
    const req = {
      query: {
        username: "ramonsantos9",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    await topLangs(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(renderTopLanguages(langs as any));
  });

  it("deve aplicar as opções de query no card de linguagens", async () => {
    const req = {
      query: {
        username: "ramonsantos9",
        hide_title: "true",
        card_width: "100",
        title_color: "fff",
        icon_color: "fff",
        text_color: "fff",
        bg_color: "fff",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    await topLangs(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderTopLanguages(langs as any, {
        hide_title: true,
        card_width: 100,
        title_color: "fff",
        icon_color: "fff",
        text_color: "fff",
        bg_color: "fff",
      }),
    );
  });

  it("deve renderizar card de erro quando falha a busca de dados do usuário", async () => {
    const req = {
      query: {
        username: "ramonsantos9",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, error);

    await topLangs(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Could not fetch user",
        secondaryMessage:
          "Certifique-se de que o nome de usuário fornecido não é uma organização",
      }),
    );
  });

  it("deve renderizar card de erro em caso de layout incorreto", async () => {
    const req = {
      query: {
        username: "ramonsantos9",
        layout: ["pie"],
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    await topLangs(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Incorrect layout input",
      }),
    );
  });

  it("deve renderizar erro se o usuário estiver na lista de bloqueio", async () => {
    const req = {
      query: {
        username: "renovate-bot",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    await topLangs(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Este nome de usuário está na lista de bloqueio",
        secondaryMessage: "Por favor, faça o deploy da sua própria instância",
        renderOptions: { show_repo_link: false },
      }),
    );
  });

  it("deve ter headers de cache adequados", async () => {
    const req = {
      query: {
        username: "ramonsantos9",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    await topLangs(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      `max-age=${CACHE_TTL.TOP_LANGS_CARD.DEFAULT}, ` +
        `s-maxage=${CACHE_TTL.TOP_LANGS_CARD.DEFAULT}, ` +
        `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
    );
  });
});
