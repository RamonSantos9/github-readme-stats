import { describe, expect, it } from "@jest/globals";
import { queryByTestId } from "@testing-library/dom";
import "@testing-library/jest-dom";
import { cssToObject } from "@uppercod/css-to-object";
import { Card } from "../src/common/Card.js";
import { icons } from "../src/common/icons.js";
import { getCardColors } from "../src/common/color.js";

describe("Testes em common/Card.ts", () => {
  it("deve ocultar a borda", () => {
    const card = new Card({});
    card.setHideBorder(true);

    document.body.innerHTML = card.render(``);
    expect(queryByTestId(document.body, "card-bg")).toHaveAttribute(
      "stroke-opacity",
      "0",
    );
  });

  it("não deve ocultar a borda", () => {
    const card = new Card({});
    card.setHideBorder(false);

    document.body.innerHTML = card.render(``);
    expect(queryByTestId(document.body, "card-bg")).toHaveAttribute(
      "stroke-opacity",
      "1",
    );
  });

  it("deve ter um título personalizado", () => {
    const card = new Card({
      customTitle: "título personalizado",
      defaultTitle: "título padrão",
    });

    document.body.innerHTML = card.render(``);
    expect(queryByTestId(document.body, "card-title")).toHaveTextContent(
      "título personalizado",
    );
  });

  it("deve definir título personalizado via setTitle", () => {
    const card = new Card({});
    card.setTitle("título personalizado");

    document.body.innerHTML = card.render(``);
    expect(queryByTestId(document.body, "card-title")).toHaveTextContent(
      "título personalizado",
    );
  });

  it("deve ocultar o título", () => {
    const card = new Card({});
    card.setHideTitle(true);

    document.body.innerHTML = card.render(``);
    expect(queryByTestId(document.body, "card-title")).toBeNull();
  });

  it("não deve ocultar o título", () => {
    const card = new Card({});
    card.setHideTitle(false);

    document.body.innerHTML = card.render(``);
    expect(queryByTestId(document.body, "card-title")).toBeInTheDocument();
  });

  it("título deve ter ícone de prefixo", () => {
    const card = new Card({
      defaultTitle: "ok",
      titlePrefixIcon: icons.contribs,
    });

    document.body.innerHTML = card.render(``);
    expect(document.getElementsByClassName("icon")[0]).toBeInTheDocument();
  });

  it("título não deve ter ícone de prefixo", () => {
    const card = new Card({ defaultTitle: "ok" });

    document.body.innerHTML = card.render(``);
    expect(document.getElementsByClassName("icon")[0]).toBeUndefined();
  });

  it("deve ter altura e largura adequadas", () => {
    const card = new Card({ height: 200, width: 200, defaultTitle: "ok" });
    document.body.innerHTML = card.render(``);
    expect(document.getElementsByTagName("svg")[0]).toHaveAttribute(
      "height",
      "200",
    );
    expect(document.getElementsByTagName("svg")[0]).toHaveAttribute(
      "width",
      "200",
    );
  });

  it("deve diminuir a altura após o título ser ocultado", () => {
    const card = new Card({ height: 200, defaultTitle: "ok" });
    card.setHideTitle(true);

    document.body.innerHTML = card.render(``);
    expect(document.getElementsByTagName("svg")[0]).toHaveAttribute(
      "height",
      "170",
    );
  });

  it("main-card-body deve estar na posição correta quando o título é visível", () => {
    const card = new Card({ height: 200 });
    document.body.innerHTML = card.render(``);
    expect(queryByTestId(document.body, "main-card-body")).toHaveAttribute(
      "transform",
      "translate(0, 55)",
    );
  });

  it("main-card-body deve estar na posição correta após o título ser ocultado", () => {
    const card = new Card({ height: 200 });
    card.setHideTitle(true);

    document.body.innerHTML = card.render(``);
    expect(queryByTestId(document.body, "main-card-body")).toHaveAttribute(
      "transform",
      "translate(0, 25)",
    );
  });

  it("deve renderizar com as cores corretas", () => {
    const { titleColor, textColor, iconColor, bgColor } = getCardColors({
      title_color: "f00",
      icon_color: "0f0",
      text_color: "00f",
      bg_color: "fff",
      theme: "default",
    });

    const card = new Card({
      height: 200,
      colors: {
        titleColor,
        textColor,
        iconColor,
        bgColor,
      },
    });
    document.body.innerHTML = card.render(``);

    const styleTag = document.querySelector("style");
    const stylesObject = cssToObject(styleTag!.innerHTML);
    const headerClassStyles = stylesObject[":host"][".header "] as any;

    expect(headerClassStyles["fill"].trim()).toBe("#f00");
    expect(queryByTestId(document.body, "card-bg")).toHaveAttribute(
      "fill",
      "#fff",
    );
  });

  it("deve renderizar fundos em gradiente", () => {
    const { titleColor, textColor, iconColor, bgColor } = getCardColors({
      title_color: "f00",
      icon_color: "0f0",
      text_color: "00f",
      bg_color: "90,fff,000,f00",
      theme: "default",
    });

    const card = new Card({
      height: 200,
      colors: {
        titleColor,
        textColor,
        iconColor,
        bgColor,
      },
    });
    document.body.innerHTML = card.render(``);
    expect(queryByTestId(document.body, "card-bg")).toHaveAttribute(
      "fill",
      "url(#gradient)",
    );
    expect(document.querySelector("defs #gradient")).toHaveAttribute(
      "gradientTransform",
      "rotate(90)",
    );
    expect(
      document.querySelector("defs #gradient stop:nth-child(1)"),
    ).toHaveAttribute("stop-color", "#fff");
    expect(
      document.querySelector("defs #gradient stop:nth-child(2)"),
    ).toHaveAttribute("stop-color", "#000");
    expect(
      document.querySelector("defs #gradient stop:nth-child(3)"),
    ).toHaveAttribute("stop-color", "#f00");
  });
});
