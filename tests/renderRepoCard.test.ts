import { describe, expect, it } from "@jest/globals";
import { queryByTestId } from "@testing-library/dom";
import "@testing-library/jest-dom";
import { cssToObject } from "@uppercod/css-to-object";
import { renderRepoCard } from "../src/cards/repo.js";
import { themes } from "../themes/index.js";

const data_repo = {
  repository: {
    nameWithOwner: "ramonsantos9/convoychat",
    name: "convoychat",
    description: "Help us take over the world! React + TS + GraphQL Chat App",
    primaryLanguage: {
      color: "#2b7489",
      id: "MDg6TGFuZ3VhZ2UyODc=",
      name: "TypeScript",
    },
    starCount: 38000,
    forkCount: 100,
  },
};

describe("Testes em cards/repo.ts", () => {
  it("deve renderizar corretamente", () => {
    document.body.innerHTML = renderRepoCard(data_repo.repository as any);

    const header = document.getElementsByClassName("header")[0];

    expect(header).toHaveTextContent("convoychat");
    expect(header).not.toHaveTextContent("ramonsantos9");
    expect(document.getElementsByClassName("description")[0]).toHaveTextContent(
      "Help us take over the world! React + TS + GraphQL Chat App",
    );
    expect(queryByTestId(document.body, "stargazers")).toHaveTextContent("38k");
    expect(queryByTestId(document.body, "forkcount")).toHaveTextContent("100");
    expect(queryByTestId(document.body, "lang-name")).toHaveTextContent(
      "TypeScript",
    );
    expect(queryByTestId(document.body, "lang-color")).toHaveAttribute(
      "fill",
      "#2b7489",
    );
  });

  it("deve exibir o nome do usuário no título (nome completo do repo)", () => {
    document.body.innerHTML = renderRepoCard(data_repo.repository as any, {
      show_owner: true,
    });
    expect(document.getElementsByClassName("header")[0]).toHaveTextContent(
      "ramonsantos9/convoychat",
    );
  });

  it("deve encurtar o cabeçalho", () => {
    document.body.innerHTML = renderRepoCard({
      ...data_repo.repository,
      name: "some-really-long-repo-name-for-test-purposes",
    } as any);

    expect(
      document.getElementsByClassName("header")[0].textContent?.trim(),
    ).toBe("some-really-long-repo-name-for-test...");
  });

  it("deve encurtar a descrição", () => {
    document.body.innerHTML = renderRepoCard({
      ...data_repo.repository,
      description:
        "The quick brown fox jumps over the lazy dog is an English-language pangram—a sentence that contains all of the letters of the English alphabet",
    } as any);

    expect(
      document.getElementsByClassName("description")[0].children[0].textContent,
    ).toBe("The quick brown fox jumps over the lazy dog is an");

    expect(
      document.getElementsByClassName("description")[0].children[1].textContent,
    ).toBe("English-language pangram—a sentence that contains all");

    // Não deve encurtar
    document.body.innerHTML = renderRepoCard({
      ...data_repo.repository,
      description: "Texto pequeno não deve encurtar",
    } as any);

    expect(document.getElementsByClassName("description")[0]).toHaveTextContent(
      "Texto pequeno não deve encurtar",
    );
  });

  it("deve renderizar emojis", () => {
    document.body.innerHTML = renderRepoCard({
      ...data_repo.repository,
      description: "Isto é um texto com um emoji de :poop: cocô",
    } as any);

    expect(document.getElementsByClassName("description")[0]).toHaveTextContent(
      "Isto é um texto com um emoji de 💩 cocô",
    );
  });

  it("deve ocultar a linguagem se primaryLanguage for null e usar valores padrão", () => {
    document.body.innerHTML = renderRepoCard({
      ...data_repo.repository,
      primaryLanguage: null,
    } as any);

    expect(queryByTestId(document.body, "primary-lang")).toBeNull();

    document.body.innerHTML = renderRepoCard({
      ...data_repo.repository,
      primaryLanguage: { color: null, name: null },
    } as any);

    expect(queryByTestId(document.body, "primary-lang")).toBeInTheDocument();
    expect(queryByTestId(document.body, "lang-color")).toHaveAttribute(
      "fill",
      "#333",
    );

    expect(queryByTestId(document.body, "lang-name")).toHaveTextContent(
      "N&#227;o especificado",
    );
  });

  it("deve renderizar as cores padrão corretamente", () => {
    document.body.innerHTML = renderRepoCard(data_repo.repository as any);

    const styleTag = document.querySelector("style");
    const stylesObject = cssToObject(styleTag!.innerHTML);

    const headerClassStyles = stylesObject[":host"][".header "];
    const descClassStyles = stylesObject[":host"][".description "];
    const iconClassStyles = stylesObject[":host"][".icon "];

    expect(headerClassStyles.fill.trim()).toBe("#2f80ed");
    expect(descClassStyles.fill.trim()).toBe("#434d58");
    expect(iconClassStyles.fill.trim()).toBe("#586069");
    expect(queryByTestId(document.body, "card-bg")).toHaveAttribute(
      "fill",
      "#fffefe",
    );
  });

  it("deve renderizar com todos os temas", () => {
    Object.keys(themes).forEach((name) => {
      document.body.innerHTML = renderRepoCard(data_repo.repository as any, {
        theme: name as any,
      });

      const styleTag = document.querySelector("style");
      const stylesObject = cssToObject(styleTag!.innerHTML);

      const headerClassStyles = stylesObject[":host"][".header "];
      const descClassStyles = stylesObject[":host"][".description "];
      const iconClassStyles = stylesObject[":host"][".icon "];

      expect(headerClassStyles.fill.trim()).toBe(
        `#${themes[name].title_color}`,
      );
      expect(descClassStyles.fill.trim()).toBe(`#${themes[name].text_color}`);
      expect(iconClassStyles.fill.trim()).toBe(`#${themes[name].icon_color}`);
      const backgroundElement = queryByTestId(document.body, "card-bg");
      const backgroundElementFill = backgroundElement?.getAttribute("fill");
      expect([`#${themes[name].bg_color}`, "url(#gradient)"]).toContain(
        backgroundElementFill,
      );
    });
  });

  it("não deve renderizar a contagem de estrelas ou forks se forem zero", () => {
    document.body.innerHTML = renderRepoCard({
      ...data_repo.repository,
      starCount: 0,
    } as any);

    expect(queryByTestId(document.body, "stargazers")).toBeNull();
    expect(queryByTestId(document.body, "forkcount")).toBeInTheDocument();

    document.body.innerHTML = renderRepoCard({
      ...data_repo.repository,
      starCount: 1,
      forkCount: 0,
    } as any);

    expect(queryByTestId(document.body, "stargazers")).toBeInTheDocument();
    expect(queryByTestId(document.body, "forkcount")).toBeNull();
  });

  it("deve renderizar emblemas (badges)", () => {
    document.body.innerHTML = renderRepoCard({
      ...data_repo.repository,
      isArchived: true,
    } as any);

    expect(queryByTestId(document.body, "badge")).toHaveTextContent(
      "Arquivados",
    );

    document.body.innerHTML = renderRepoCard({
      ...data_repo.repository,
      isTemplate: true,
    } as any);
    expect(queryByTestId(document.body, "badge")).toHaveTextContent("Modelo");
  });

  it("deve cair para a descrição padrão", () => {
    document.body.innerHTML = renderRepoCard({
      ...data_repo.repository,
      description: undefined,
      isArchived: true,
    } as any);
    expect(document.getElementsByClassName("description")[0]).toHaveTextContent(
      "Sem descri&#231;&#227;o",
    );
  });
});
