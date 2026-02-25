import { describe, expect, it } from "@jest/globals";
import { queryByTestId } from "@testing-library/dom";
import "@testing-library/jest-dom";
import { cssToObject } from "@uppercod/css-to-object";
import { renderGistCard } from "../src/cards/gist.js";
import { themes } from "../themes/index.js";

const data = {
  name: "test",
  nameWithOwner: "ramonsantos9/test",
  description: "Small test repository with different Python programs.",
  language: "Python",
  starsCount: 163,
  forksCount: 19,
};

describe("Testes em cards/gist.ts", () => {
  it("deve renderizar corretamente", () => {
    document.body.innerHTML = renderGistCard(data as any);

    const header = document.getElementsByClassName("header")[0];

    expect(header).toHaveTextContent("test");
    expect(header).not.toHaveTextContent("ramonsantos9");
    expect(document.getElementsByClassName("description")[0]).toHaveTextContent(
      "Small test repository with different Python programs.",
    );
    expect(queryByTestId(document.body, "starsCount")).toHaveTextContent("163");
    expect(queryByTestId(document.body, "forksCount")).toHaveTextContent("19");
    expect(queryByTestId(document.body, "lang-name")).toHaveTextContent(
      "Python",
    );
    expect(queryByTestId(document.body, "lang-color")).toHaveAttribute(
      "fill",
      "#3572A5",
    );
  });

  it("deve exibir o nome do usuário no título se show_owner for true", () => {
    document.body.innerHTML = renderGistCard(data as any, { show_owner: true });
    const header = document.getElementsByClassName("header")[0];
    expect(header).toHaveTextContent("ramonsantos9/test");
  });

  it("deve encurtar o cabeçalho se o nome for muito longo", () => {
    document.body.innerHTML = renderGistCard({
      ...data,
      name: "some-really-long-repo-name-for-test-purposes",
    } as any);
    const header = document.getElementsByClassName("header")[0];
    expect(header).toHaveTextContent("some-really-long-repo-name-for-test...");
  });

  it("deve encurtar a descrição se ela for muito longa", () => {
    document.body.innerHTML = renderGistCard({
      ...data,
      description:
        "The quick brown fox jumps over the lazy dog is an English-language pangram—a sentence that contains all of the letters of the English alphabet",
    } as any);
    expect(
      document.getElementsByClassName("description")[0].children[0].textContent,
    ).toBe("The quick brown fox jumps over the lazy dog is an");

    expect(
      document.getElementsByClassName("description")[0].children[1].textContent,
    ).toBe("English-language pangram—a sentence that contains all");
  });

  it("não deve encurtar a descrição se ela for curta", () => {
    document.body.innerHTML = renderGistCard({
      ...data,
      description: "Texto pequeno não deve encurtar",
    } as any);
    expect(document.getElementsByClassName("description")[0]).toHaveTextContent(
      "Texto pequeno não deve encurtar",
    );
  });

  it("deve renderizar emojis na descrição", () => {
    document.body.innerHTML = renderGistCard({
      ...data,
      description: "Este é um teste de descrição de gist com o emoji :heart:.",
    } as any);
    expect(document.getElementsByClassName("description")[0]).toHaveTextContent(
      "Este é um teste de descrição de gist com o emoji ❤️.",
    );
  });

  it("deve renderizar as cores personalizadas corretamente", () => {
    const customColors = {
      title_color: "5a0",
      icon_color: "1b998b",
      text_color: "9991",
      bg_color: "252525",
    };

    document.body.innerHTML = renderGistCard(data as any, {
      ...customColors,
    });

    const styleTag = document.querySelector("style");
    const stylesObject = cssToObject(styleTag!.innerHTML);

    const headerClassStyles = stylesObject[":host"][".header "];
    const descClassStyles = stylesObject[":host"][".description "];
    const iconClassStyles = stylesObject[":host"][".icon "];

    expect(headerClassStyles.fill.trim()).toBe(`#${customColors.title_color}`);
    expect(descClassStyles.fill.trim()).toBe(`#${customColors.text_color}`);
    expect(iconClassStyles.fill.trim()).toBe(`#${customColors.icon_color}`);
    expect(queryByTestId(document.body, "card-bg")).toHaveAttribute(
      "fill",
      "#252525",
    );
  });

  it("deve renderizar com todos os temas", () => {
    Object.keys(themes).forEach((name) => {
      document.body.innerHTML = renderGistCard(data as any, {
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
    document.body.innerHTML = renderGistCard({
      ...data,
      starsCount: 0,
    } as any);

    expect(queryByTestId(document.body, "starsCount")).toBeNull();
    expect(queryByTestId(document.body, "forksCount")).toBeInTheDocument();

    document.body.innerHTML = renderGistCard({
      ...data,
      starsCount: 1,
      forksCount: 0,
    } as any);

    expect(queryByTestId(document.body, "starsCount")).toBeInTheDocument();
    expect(queryByTestId(document.body, "forksCount")).toBeNull();
  });

  it("deve renderizar sem arredondamento", () => {
    document.body.innerHTML = renderGistCard(data as any, {
      border_radius: "0",
    });
    expect(document.querySelector("rect")).toHaveAttribute("rx", "0");
    document.body.innerHTML = renderGistCard(data as any, {});
    expect(document.querySelector("rect")).toHaveAttribute("rx", "4.5");
  });

  it("deve cair para a descrição padrão", () => {
    document.body.innerHTML = renderGistCard({
      ...data,
      description: undefined,
    } as any);
    expect(document.getElementsByClassName("description")[0]).toHaveTextContent(
      "Sem descri&#231;&#227;o",
    );
  });

  it("deve mostrar 'Não especificado' se a linguagem for nula", () => {
    document.body.innerHTML = renderGistCard({
      ...data,
      language: null,
    } as any);
    expect(queryByTestId(document.body, "lang-name")).toHaveTextContent(
      "N&#227;o especificado",
    );
  });
});
