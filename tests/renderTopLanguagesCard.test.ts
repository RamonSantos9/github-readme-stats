import { describe, expect, it } from "@jest/globals";
import { queryAllByTestId, queryByTestId } from "@testing-library/dom";
import "@testing-library/jest-dom";
import { cssToObject } from "@uppercod/css-to-object";
import {
  MIN_CARD_WIDTH,
  calculateCompactLayoutHeight,
  calculateDonutLayoutHeight,
  calculateDonutVerticalLayoutHeight,
  calculateNormalLayoutHeight,
  calculatePieLayoutHeight,
  cartesianToPolar,
  degreesToRadians,
  donutCenterTranslation,
  getCircleLength,
  getDefaultLanguagesCountByLayout,
  getLongestLang,
  polarToCartesian,
  radiansToDegrees,
  renderTopLanguages,
  trimTopLanguages,
} from "../src/cards/top-languages.js";

import { themes } from "../themes/index.js";

const langs = {
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
  css: {
    color: "#ff0",
    name: "css",
    size: 100,
  },
};

/**
 * Recupera array de números da string de definição de caminho SVG (d).
 */
const getNumbersFromSvgPathDefinitionAttribute = (d: string): number[] => {
  return d
    .split(" ")
    .filter((x) => !isNaN(parseFloat(x)))
    .map((x) => parseFloat(x));
};

/**
 * Recupera a porcentagem da linguagem do SVG do layout donut.
 */
const langPercentFromDonutLayoutSvg = (
  d: string,
  centerX: number,
  centerY: number,
): number => {
  const dTmp = getNumbersFromSvgPathDefinitionAttribute(d);
  const endAngle =
    cartesianToPolar(centerX, centerY, dTmp[0], dTmp[1]).angleInDegrees + 90;
  let startAngle =
    cartesianToPolar(centerX, centerY, dTmp[7], dTmp[8]).angleInDegrees + 90;
  if (startAngle > endAngle) {
    startAngle -= 360;
  }
  return (endAngle - startAngle) / 3.6;
};

/**
 * Calcula a porcentagem da linguagem para o SVG do layout donut vertical.
 */
const langPercentFromDonutVerticalLayoutSvg = (
  partLength: number,
  totalCircleLength: number,
): number => {
  return (partLength / totalCircleLength) * 100;
};

/**
 * Recupera a porcentagem da linguagem do SVG do layout pie (pizza).
 */
const langPercentFromPieLayoutSvg = (
  d: string,
  centerX: number,
  centerY: number,
): number => {
  const dTmp = getNumbersFromSvgPathDefinitionAttribute(d);
  const startAngle = cartesianToPolar(
    centerX,
    centerY,
    dTmp[2],
    dTmp[3],
  ).angleInDegrees;
  let endAngle = cartesianToPolar(
    centerX,
    centerY,
    dTmp[9],
    dTmp[10],
  ).angleInDegrees;
  if (endAngle < startAngle) {
    endAngle += 360;
  }
  return ((endAngle - startAngle) / 360) * 100;
};

describe("Testes em funções auxiliares de cards/top-languages.ts", () => {
  it("getLongestLang", () => {
    const langArray = Object.values(langs);
    expect(getLongestLang(langArray)).toBe(langs.javascript);
  });

  it("degreesToRadians", () => {
    expect(degreesToRadians(0)).toBe(0);
    expect(degreesToRadians(90)).toBe(Math.PI / 2);
    expect(degreesToRadians(180)).toBe(Math.PI);
    expect(degreesToRadians(270)).toBe((3 * Math.PI) / 2);
    expect(degreesToRadians(360)).toBe(2 * Math.PI);
  });

  it("radiansToDegrees", () => {
    expect(radiansToDegrees(0)).toBe(0);
    expect(radiansToDegrees(Math.PI / 2)).toBe(90);
    expect(radiansToDegrees(Math.PI)).toBe(180);
    expect(radiansToDegrees((3 * Math.PI) / 2)).toBe(270);
    expect(radiansToDegrees(2 * Math.PI)).toBe(360);
  });

  it("polarToCartesian", () => {
    expect(polarToCartesian(100, 100, 60, 0)).toStrictEqual({ x: 160, y: 100 });
    expect(polarToCartesian(100, 100, 60, 90)).toStrictEqual({
      x: 100,
      y: 160,
    });
  });

  it("cartesianToPolar", () => {
    expect(cartesianToPolar(100, 100, 160, 100)).toStrictEqual({
      radius: 60,
      angleInDegrees: 0,
    });
    expect(cartesianToPolar(100, 100, 100, 160)).toStrictEqual({
      radius: 60,
      angleInDegrees: 90,
    });
  });

  it("Cálculos de altura (calculate...LayoutHeight)", () => {
    expect(calculateCompactLayoutHeight(3)).toBe(140);
    expect(calculateNormalLayoutHeight(3)).toBe(205);
    expect(calculateDonutLayoutHeight(3)).toBe(215);
    expect(calculateDonutVerticalLayoutHeight(3)).toBe(350);
    expect(calculatePieLayoutHeight(3)).toBe(350);
  });

  it("donutCenterTranslation", () => {
    expect(donutCenterTranslation(5)).toBe(-45);
    expect(donutCenterTranslation(6)).toBe(-29);
  });

  it("getCircleLength", () => {
    expect(getCircleLength(20)).toBeCloseTo(125.663);
  });

  it("trimTopLanguages", () => {
    expect(trimTopLanguages(langs as any, 2)).toStrictEqual({
      langs: [langs.HTML, langs.javascript],
      totalLanguageSize: 400,
    });
  });

  it("getDefaultLanguagesCountByLayout", () => {
    expect(
      getDefaultLanguagesCountByLayout({ layout: "normal" }),
    ).toStrictEqual(5);
    expect(
      getDefaultLanguagesCountByLayout({ layout: "compact" }),
    ).toStrictEqual(6);
  });
});

describe("Testes em cards/top-languages.ts (renderTopLanguages)", () => {
  it("deve renderizar corretamente", () => {
    document.body.innerHTML = renderTopLanguages(langs as any);

    expect(queryByTestId(document.body, "header")).toHaveTextContent(
      "Linguagens mais usadas",
    );

    expect(queryAllByTestId(document.body, "lang-name")[0]).toHaveTextContent(
      "HTML",
    );
    expect(queryAllByTestId(document.body, "lang-progress")[0]).toHaveAttribute(
      "width",
      "40%",
    );
  });

  it("deve ocultar linguagens quando hide é passado", () => {
    document.body.innerHTML = renderTopLanguages(langs as any, {
      hide: ["HTML"],
    });
    expect(queryAllByTestId(document.body, "lang-name")[0]).toHaveTextContent(
      "javascript",
    );
  });

  it("deve redimensionar a altura corretamente dependendo das linguagens", () => {
    document.body.innerHTML = renderTopLanguages(langs as any, {});
    expect(document.querySelector("svg")).toHaveAttribute("height", "205");
  });

  it("deve renderizar com largura personalizada", () => {
    document.body.innerHTML = renderTopLanguages(langs as any, {
      card_width: 400,
    });
    expect(document.querySelector("svg")).toHaveAttribute("width", "400");
  });

  it("deve renderizar com largura mínima", () => {
    document.body.innerHTML = renderTopLanguages(langs as any, {
      card_width: 100,
    });
    expect(document.querySelector("svg")).toHaveAttribute("width", "280");
  });

  it("deve renderizar as cores padrão corretamente", () => {
    document.body.innerHTML = renderTopLanguages(langs as any);

    const styleTag = document.querySelector("style");
    const stylesObject = cssToObject(styleTag!.textContent!);

    const headerStyles = stylesObject[":host"][".header "];
    const langNameStyles = stylesObject[":host"][".lang-name "];

    expect(headerStyles.fill.trim()).toBe("#2f80ed");
    expect(langNameStyles.fill.trim()).toBe("#434d58");
  });

  it("deve renderizar com layout compact", () => {
    document.body.innerHTML = renderTopLanguages(langs as any, {
      layout: "compact",
    });

    expect(queryByTestId(document.body, "header")).toHaveTextContent(
      "Linguagens mais usadas",
    );

    expect(queryAllByTestId(document.body, "lang-name")[0]).toHaveTextContent(
      "HTML 40.00%",
    );
  });

  it("deve renderizar com layout donut", () => {
    document.body.innerHTML = renderTopLanguages(langs as any, {
      layout: "donut",
    });

    expect(queryByTestId(document.body, "header")).toHaveTextContent(
      "Linguagens mais usadas",
    );

    expect(queryAllByTestId(document.body, "lang-name")[0]).toHaveTextContent(
      "HTML 40.00%",
    );

    const donutPaths = queryAllByTestId(document.body, "lang-donut");
    const d = getNumbersFromSvgPathDefinitionAttribute(
      donutPaths[0].getAttribute("d")!,
    );
    const center = { x: d[7], y: d[7] };
    const HTMLLangPercent = langPercentFromDonutLayoutSvg(
      donutPaths[0].getAttribute("d")!,
      center.x,
      center.y,
    );
    expect(HTMLLangPercent).toBeCloseTo(40);
  });

  it("deve renderizar com layout donut vertical", () => {
    document.body.innerHTML = renderTopLanguages(langs as any, {
      layout: "donut-vertical",
    });

    expect(queryByTestId(document.body, "header")).toHaveTextContent(
      "Linguagens mais usadas",
    );

    const donutPaths = queryAllByTestId(document.body, "lang-donut");
    const totalCircleLength = parseFloat(
      donutPaths[0].getAttribute("stroke-dasharray")!,
    );

    const HTMLLangPercent = langPercentFromDonutVerticalLayoutSvg(
      parseFloat(donutPaths[1].getAttribute("stroke-dashoffset")!) -
        parseFloat(donutPaths[0].getAttribute("stroke-dashoffset")!),
      totalCircleLength,
    );
    expect(HTMLLangPercent).toBeCloseTo(40);
  });

  it("deve renderizar com layout pie (pizza)", () => {
    document.body.innerHTML = renderTopLanguages(langs as any, {
      layout: "pie",
    });

    expect(queryByTestId(document.body, "header")).toHaveTextContent(
      "Linguagens mais usadas",
    );

    const piePaths = queryAllByTestId(document.body, "lang-pie");
    const d = getNumbersFromSvgPathDefinitionAttribute(
      piePaths[0].getAttribute("d")!,
    );
    const center = { x: d[0], y: d[1] };
    const HTMLLangPercent = langPercentFromPieLayoutSvg(
      piePaths[0].getAttribute("d")!,
      center.x,
      center.y,
    );
    expect(HTMLLangPercent).toBeCloseTo(40);
  });

  it("deve renderizar título traduzido para chinês (cn)", () => {
    document.body.innerHTML = renderTopLanguages(langs as any, {
      locale: "cn",
    });
    expect(document.getElementsByClassName("header")[0].textContent).toBe(
      "最常用的语言",
    );
  });

  it('deve mostrar a mensagem "Sem dados de linguagens." em vez de um card vazio', () => {
    document.body.innerHTML = renderTopLanguages({});
    expect(document.querySelector(".stat")?.textContent).toBe(
      "Sem dados de linguagens.",
    );
  });

  it("deve mostrar formato de estatísticas bytes quando solicitado", () => {
    document.body.innerHTML = renderTopLanguages(langs as any, {
      layout: "compact",
      stats_format: "bytes",
    });

    expect(queryAllByTestId(document.body, "lang-name")[0]).toHaveTextContent(
      "HTML 200.0 B",
    );
  });
});
