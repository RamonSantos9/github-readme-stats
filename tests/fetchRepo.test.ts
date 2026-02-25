import { afterEach, describe, expect, it } from "@jest/globals";
import "@testing-library/jest-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { fetchRepo } from "../src/fetchers/repo.js";

const mock = new MockAdapter(axios);

afterEach(() => {
  mock.reset();
});

const data = {
  data: {
    user: {
      repository: {
        name: "test-repo",
        nameWithOwner: "ramonsantos9/test-repo",
        isPrivate: false,
        isArchived: false,
        isTemplate: false,
        stargazers: { totalCount: 120 },
        description: "description",
        primaryLanguage: { color: "#f00", id: "1", name: "html" },
        forkCount: 20,
      },
    },
    organization: null,
  },
};

describe("Testes em fetchers/repo.ts", () => {
  it("deve buscar o repositório corretamente", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data);

    const repo = await fetchRepo("ramonsantos9", "test-repo");

    expect(repo).toStrictEqual({
      name: "test-repo",
      nameWithOwner: "ramonsantos9/test-repo",
      isPrivate: false,
      isArchived: false,
      isTemplate: false,
      starCount: 120,
      description: "description",
      primaryLanguage: { color: "#f00", id: "1", name: "html" },
      forkCount: 20,
    });
  });

  it("deve lançar erro se o usuário for encontrado mas o repositório for nulo", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      data: { user: { repository: null }, organization: null },
    });

    await expect(fetchRepo("ramonsantos9", "test-repo")).rejects.toThrow(
      "Repositório do usuário não encontrado",
    );
  });

  it("deve lançar erro se a organização for encontrada mas o repositório for nulo", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      data: { user: null, organization: { repository: null } },
    });

    await expect(fetchRepo("ramonsantos9", "test-repo")).rejects.toThrow(
      "Repositório da organização não encontrado",
    );
  });

  it("deve lançar erro se nem usuário nem organização forem encontrados", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      data: { user: null, organization: null },
    });

    await expect(fetchRepo("ramonsantos9", "test-repo")).rejects.toThrow(
      "Não encontrado",
    );
  });

  it("deve lançar erro se o repositório for privado", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      data: {
        user: { repository: { isPrivate: true } },
        organization: null,
      },
    });

    await expect(fetchRepo("ramonsantos9", "test-repo")).rejects.toThrow(
      "Repositório do usuário não encontrado",
    );
  });
});
