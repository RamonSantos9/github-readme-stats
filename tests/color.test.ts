import { getCardColors } from "../src/common/color.js";
import { describe, expect, it } from "@jest/globals";

describe("Testes em common/color.ts", () => {
  it("getCardColors: deve retornar os valores esperados", () => {
    const colors = getCardColors({
      title_color: "f00",
      text_color: "0f0",
      ring_color: "0000ff",
      icon_color: "00f",
      bg_color: "fff",
      border_color: "fff",
      theme: "dark",
    });
    expect(colors).toStrictEqual({
      titleColor: "#f00",
      textColor: "#0f0",
      iconColor: "#00f",
      ringColor: "#0000ff",
      bgColor: "#fff",
      borderColor: "#fff",
    });
  });

  it("getCardColors: deve retornar cores padrão se a cor for inválida", () => {
    const colors = getCardColors({
      title_color: "invalidcolor",
      text_color: "0f0",
      icon_color: "00f",
      bg_color: "fff",
      border_color: "invalidColor",
      theme: "dark",
    });
    expect(colors).toStrictEqual({
      titleColor: "#2f80ed",
      textColor: "#0f0",
      iconColor: "#00f",
      ringColor: "#2f80ed",
      bgColor: "#fff",
      borderColor: "#e4e2e2",
    });
  });

  it("getCardColors: deve retornar as cores do tema especificado se não houver definição de cor personalizada", () => {
    const colors = getCardColors({
      theme: "dark",
    });
    expect(colors).toStrictEqual({
      titleColor: "#fff",
      textColor: "#9f9f9f",
      ringColor: "#fff",
      iconColor: "#79ff97",
      bgColor: "#151515",
      borderColor: "#e4e2e2",
    });
  });

  it("getCardColors: deve retornar ringColor igual ao titleColor se o ringColor não for definido", () => {
    const colors = getCardColors({
      title_color: "f00",
      text_color: "0f0",
      icon_color: "00f",
      bg_color: "fff",
      border_color: "fff",
      theme: "dark",
    });
    expect(colors).toStrictEqual({
      titleColor: "#f00",
      textColor: "#0f0",
      iconColor: "#00f",
      ringColor: "#f00",
      bgColor: "#fff",
      borderColor: "#fff",
    });
  });
});
