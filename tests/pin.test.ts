import { afterEach, describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import pin from "../api/pin.js";
import { renderRepoCard } from "../src/cards/repo.js";
import { renderError } from "../src/common/render.js";
import { CACHE_TTL, DURATIONS } from "../src/common/cache.js";

const data_repo = {
  repository: {
    username: "ramonsantos9",
    name: "convoychat",
    stargazers: {
      totalCount: 38000,
    },
    description: "Help us take over the world! React + TS + GraphQL Chat App",
    primaryLanguage: {
      color: "#2b7489",
      id: "MDg6TGFuZ3VhZ2UyODc=",
      name: "TypeScript",
    },
    forkCount: 100,
    isTemplate: false,
  },
};

const data_user = {
  data: {
    user: { repository: data_repo.repository },
    organization: null,
  },
};

const mock = new MockAdapter(axios);

afterEach(() => {
  mock.reset();
});

describe("Testes em api/pin.ts (Repository Pin API)", () => {
  it("deve processar a requisição de pin de repositório corretamente", async () => {
    const req = {
      query: {
        username: "ramonsantos9",
        repo: "convoychat",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, data_user);

    await pin(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderRepoCard({
        ...data_repo.repository,
        starCount: data_repo.repository.stargazers.totalCount,
      } as any),
    );
  });

  it("deve aplicar as opções de query no card de repositório", async () => {
    const req = {
      query: {
        username: "ramonsantos9",
        repo: "convoychat",
        title_color: "fff",
        icon_color: "fff",
        text_color: "fff",
        bg_color: "fff",
        full_name: "1",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, data_user);

    await pin(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderRepoCard(
        {
          ...data_repo.repository,
          starCount: data_repo.repository.stargazers.totalCount,
        } as any,
        { ...req.query } as any,
      ),
    );
  });

  it("deve renderizar erro se o repositório do usuário não for encontrado", async () => {
    const req = {
      query: {
        username: "ramonsantos9",
        repo: "convoychat",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock
      .onPost("https://api.github.com/graphql")
      .reply(200, { data: { user: { repository: null }, organization: null } });

    await pin(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({ message: "Repositório do usuário não encontrado" }),
    );
  });

  it("deve renderizar erro se o repositório da organização não for encontrado", async () => {
    const req = {
      query: {
        username: "ramonsantos9",
        repo: "convoychat",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock
      .onPost("https://api.github.com/graphql")
      .reply(200, { data: { user: null, organization: { repository: null } } });

    await pin(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({ message: "Repositório da organização não encontrado" }),
    );
  });

  it("deve renderizar erro se o nome de usuário estiver na lista de bloqueio", async () => {
    const req = {
      query: {
        username: "renovate-bot",
        repo: "convoychat",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, data_user);

    await pin(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Este nome de usuário está na lista de bloqueio",
        secondaryMessage: "Por favor, faça o deploy da sua própria instância",
        renderOptions: { show_repo_link: false },
      }),
    );
  });

  it("deve renderizar erro se os parâmetros obrigatórios estiverem ausentes", async () => {
    const req = {
      query: {},
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await pin(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message:
          'Estão faltando parâmetros "username", "repo" certifique-se de passar os parâmetros na URL',
        secondaryMessage: "/api/pin?username=USERNAME&amp;repo=REPO_NAME",
        renderOptions: { show_repo_link: false },
      }),
    );
  });

  it("deve ter headers de cache adequados", async () => {
    const req = {
      query: {
        username: "ramonsantos9",
        repo: "convoychat",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, data_user);

    await pin(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      `max-age=${CACHE_TTL.PIN_CARD.DEFAULT}, ` +
        `s-maxage=${CACHE_TTL.PIN_CARD.DEFAULT}, ` +
        `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
    );
  });
});
