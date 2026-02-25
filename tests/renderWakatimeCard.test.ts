import { describe, expect, it } from "@jest/globals";
import { queryByTestId } from "@testing-library/dom";
import "@testing-library/jest-dom";
import { renderWakatimeCard } from "../src/cards/wakatime.js";
import { wakaTimeData } from "./fetchWakatime.test.js";

describe("Testes em cards/wakatime.ts", () => {
  it("deve renderizar corretamente", () => {
    const card = renderWakatimeCard(wakaTimeData.data as any);
    expect(card).toMatchSnapshot();
  });

  it("deve renderizar corretamente com layout compacto", () => {
    const card = renderWakatimeCard(wakaTimeData.data as any, {
      layout: "compact",
    });
    expect(card).toMatchSnapshot();
  });

  it("deve renderizar corretamente com layout compacto quando langs_count é definido", () => {
    const card = renderWakatimeCard(wakaTimeData.data as any, {
      layout: "compact",
      langs_count: 2,
    });

    expect(card).toMatchSnapshot();
  });

  it("deve ocultar linguagens quando hide é passado", () => {
    document.body.innerHTML = renderWakatimeCard(wakaTimeData.data as any, {
      hide: ["YAML", "Other"],
    });

    expect(queryByTestId(document.body, /YAML/i)).toBeNull();
    expect(queryByTestId(document.body, /Other/i)).toBeNull();
    expect(queryByTestId(document.body, /TypeScript/i)).not.toBeNull();
  });

  it("deve renderizar traduções", () => {
    document.body.innerHTML = renderWakatimeCard({} as any, { locale: "cn" });
    expect(document.getElementsByClassName("header")[0].textContent).toBe(
      "WakaTime 周统计",
    );
    expect(
      document.querySelector('g[transform="translate(0, 0)"]>text.stat.bold')
        ?.textContent,
    ).toBe("WakaTime 用户个人资料未公开");
  });

  it("deve renderizar sem arredondamento", () => {
    document.body.innerHTML = renderWakatimeCard(wakaTimeData.data as any, {
      border_radius: "0",
    });
    expect(document.querySelector("rect")).toHaveAttribute("rx", "0");
    document.body.innerHTML = renderWakatimeCard(wakaTimeData.data as any, {});
    expect(document.querySelector("rect")).toHaveAttribute("rx", "4.5");
  });

  it('deve exibir a mensagem "Nenhuma atividade de codificação esta semana" quando não houver atividade', () => {
    document.body.innerHTML = renderWakatimeCard(
      {
        ...wakaTimeData.data,
        languages: undefined,
      } as any,
      {},
    );
    expect(document.querySelector(".stat")?.textContent).toBe(
      "Nenhuma atividade de codificação esta semana",
    );
  });

  it('deve exibir a mensagem "Nenhuma atividade de codificação esta semana" ao usar o layout compacto e não houver atividade', () => {
    document.body.innerHTML = renderWakatimeCard(
      {
        ...wakaTimeData.data,
        languages: undefined,
      } as any,
      {
        layout: "compact",
      },
    );
    expect(document.querySelector(".stat")?.textContent).toBe(
      "Nenhuma atividade de codificação esta semana",
    );
  });

  it("deve renderizar corretamente com formato de exibição percentual", () => {
    const card = renderWakatimeCard(wakaTimeData.data as any, {
      display_format: "percent",
    });
    expect(card).toMatchSnapshot();
  });
});
