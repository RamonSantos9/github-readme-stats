import { afterEach, describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import gist from "../api/gist.js";
import { renderGistCard } from "../src/cards/gist.js";
import { renderError } from "../src/common/render.js";
import { CACHE_TTL, DURATIONS } from "../src/common/cache.js";

const gist_data = {
  data: {
    viewer: {
      gist: {
        description:
          "List of countries and territories in English and Spanish: name, continent, capital, dial code, country codes, TLD, and area in sq km. Updated 2023",
        owner: {
          login: "Yizack",
        },
        stargazerCount: 33,
        forks: {
          totalCount: 11,
        },
        files: [
          {
            name: "countries.json",
            language: {
              name: "JSON",
            },
            size: 85858,
          },
        ],
      },
    },
  },
};

const gist_not_found_data = {
  data: {
    viewer: {
      gist: null,
    },
  },
};

const mock = new MockAdapter(axios);

afterEach(() => {
  mock.reset();
});

describe("Testes em api/gist.ts (Gist API)", () => {
  it("deve processar a requisição de Gist corretamente", async () => {
    const req = {
      query: {
        id: "bbfce31e0217a3689c8d961a356cb10d",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, gist_data);

    await gist(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderGistCard({
        name: gist_data.data.viewer.gist.files[0].name,
        nameWithOwner: `${gist_data.data.viewer.gist.owner.login}/${gist_data.data.viewer.gist.files[0].name}`,
        description: gist_data.data.viewer.gist.description,
        language: gist_data.data.viewer.gist.files[0].language.name,
        starsCount: gist_data.data.viewer.gist.stargazerCount,
        forksCount: gist_data.data.viewer.gist.forks.totalCount,
      }),
    );
  });

  it("deve aplicar as opções de query no card de Gist", async () => {
    const req = {
      query: {
        id: "bbfce31e0217a3689c8d961a356cb10d",
        title_color: "fff",
        icon_color: "fff",
        text_color: "fff",
        bg_color: "fff",
        show_owner: "true",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, gist_data);

    await gist(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderGistCard(
        {
          name: gist_data.data.viewer.gist.files[0].name,
          nameWithOwner: `${gist_data.data.viewer.gist.owner.login}/${gist_data.data.viewer.gist.files[0].name}`,
          description: gist_data.data.viewer.gist.description,
          language: gist_data.data.viewer.gist.files[0].language.name,
          starsCount: gist_data.data.viewer.gist.stargazerCount,
          forksCount: gist_data.data.viewer.gist.forks.totalCount,
        },
        {
          title_color: "fff",
          icon_color: "fff",
          text_color: "fff",
          bg_color: "fff",
          show_owner: true,
        } as any,
      ),
    );
  });

  it("deve renderizar erro se o ID não for fornecido", async () => {
    const req = {
      query: {},
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await gist(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message:
          'Estão faltando parâmetros "id" certifique-se de passar os parâmetros na URL',
        secondaryMessage: "/api/gist?id=GIST_ID",
        renderOptions: { show_repo_link: false },
      }),
    );
  });

  it("deve renderizar erro se o Gist não for encontrado", async () => {
    const req = {
      query: {
        id: "bbfce31e0217a3689c8d961a356cb10d",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock
      .onPost("https://api.github.com/graphql")
      .reply(200, gist_not_found_data);

    await gist(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({ message: "Gist não encontrado" }),
    );
  });

  it("deve ter headers de cache adequados", async () => {
    const req = {
      query: {
        id: "bbfce31e0217a3689c8d961a356cb10d",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mock.onPost("https://api.github.com/graphql").reply(200, gist_data);

    await gist(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      `max-age=${CACHE_TTL.GIST_CARD.DEFAULT}, ` +
        `s-maxage=${CACHE_TTL.GIST_CARD.DEFAULT}, ` +
        `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
    );
  });
});
