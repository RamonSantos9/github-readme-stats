import { describe, expect, it } from "@jest/globals";
import {
  getByTestId,
  queryAllByTestId,
  queryByTestId,
} from "@testing-library/dom";
import "@testing-library/jest-dom";
import { cssToObject } from "@uppercod/css-to-object";
import { renderStatsCard } from "../src/cards/stats.js";
import { CustomError } from "../src/common/error.js";
import { themes } from "../themes/index.js";

const stats = {
  name: "Anurag Hazra",
  totalStars: 100,
  totalCommits: 200,
  totalIssues: 300,
  totalPRs: 400,
  totalPRsMerged: 320,
  mergedPRsPercentage: 80,
  totalReviews: 50,
  totalDiscussionsStarted: 10,
  totalDiscussionsAnswered: 50,
  contributedTo: 500,
  rank: { level: "A+", percentile: 40 },
};

describe("Testes em cards/stats.ts", () => {
  it("deve renderizar corretamente", () => {
    document.body.innerHTML = renderStatsCard(stats as any);

    expect(document.getElementsByClassName("header")[0].textContent).toBe(
      "Estatísticas do GitHub de Anurag Hazra",
    );

    expect(
      document.body.getElementsByTagName("svg")[0].getAttribute("height"),
    ).toBe("195");
    expect(getByTestId(document.body, "stars").textContent).toBe("100");
    expect(getByTestId(document.body, "commits").textContent).toBe("200");
    expect(getByTestId(document.body, "issues").textContent).toBe("300");
    expect(getByTestId(document.body, "prs").textContent).toBe("400");
    expect(getByTestId(document.body, "contribs").textContent).toBe("500");
    expect(queryByTestId(document.body, "card-bg")).toBeInTheDocument();
    expect(queryByTestId(document.body, "rank-circle")).toBeInTheDocument();

    // Stats ocultos por padrão
    expect(queryByTestId(document.body, "reviews")).not.toBeInTheDocument();
    expect(
      queryByTestId(document.body, "discussions_started"),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId(document.body, "discussions_answered"),
    ).not.toBeInTheDocument();
    expect(queryByTestId(document.body, "prs_merged")).not.toBeInTheDocument();
    expect(
      queryByTestId(document.body, "prs_merged_percentage"),
    ).not.toBeInTheDocument();
  });

  it("deve ocultar estatísticas individuais", () => {
    document.body.innerHTML = renderStatsCard(stats as any, {
      hide: ["issues", "prs", "contribs"],
    });

    expect(
      document.body.getElementsByTagName("svg")[0].getAttribute("height"),
    ).toBe("150");

    expect(queryByTestId(document.body, "stars")).toBeDefined();
    expect(queryByTestId(document.body, "commits")).toBeDefined();
    expect(queryByTestId(document.body, "issues")).toBeNull();
    expect(queryByTestId(document.body, "prs")).toBeNull();
    expect(queryByTestId(document.body, "contribs")).toBeNull();
  });

  it("deve mostrar estatísticas adicionais", () => {
    document.body.innerHTML = renderStatsCard(stats as any, {
      show: [
        "reviews",
        "discussions_started",
        "discussions_answered",
        "prs_merged",
        "prs_merged_percentage",
      ],
    });

    expect(
      document.body.getElementsByTagName("svg")[0].getAttribute("height"),
    ).toBe("320");

    expect(queryByTestId(document.body, "stars")).toBeDefined();
    expect(queryByTestId(document.body, "commits")).toBeDefined();
    expect(queryByTestId(document.body, "reviews")).toBeDefined();
    expect(queryByTestId(document.body, "discussions_started")).toBeDefined();
    expect(queryByTestId(document.body, "discussions_answered")).toBeDefined();
    expect(queryByTestId(document.body, "prs_merged")).toBeDefined();
    expect(queryByTestId(document.body, "prs_merged_percentage")).toBeDefined();
  });

  it("deve ocultar o rank (hide_rank)", () => {
    document.body.innerHTML = renderStatsCard(stats as any, {
      hide_rank: true,
    });
    expect(queryByTestId(document.body, "rank-circle")).not.toBeInTheDocument();
  });

  it("deve renderizar com largura personalizada limitada ao mínimo", () => {
    document.body.innerHTML = renderStatsCard(stats as any, { card_width: 1 });
    expect(document.querySelector("svg")).toHaveAttribute("width", "420");
  });

  it("deve renderizar as cores padrão corretamente", () => {
    document.body.innerHTML = renderStatsCard(stats as any);

    const styleTag = document.querySelector("style");
    const stylesObject = cssToObject(styleTag!.textContent!);

    const headerClassStyles = stylesObject[":host"][".header "];
    const statClassStyles = stylesObject[":host"][".stat "];
    const iconClassStyles = stylesObject[":host"][".icon "];

    expect(headerClassStyles.fill.trim()).toBe("#2f80ed");
    expect(statClassStyles.fill.trim()).toBe("#434d58");
    expect(iconClassStyles.fill.trim()).toBe("#4c71f2");
  });

  it("deve renderizar com todos os temas", () => {
    Object.keys(themes).forEach((name) => {
      document.body.innerHTML = renderStatsCard(stats as any, {
        theme: name as any,
      });

      const styleTag = document.querySelector("style");
      const stylesObject = cssToObject(styleTag!.innerHTML);

      const headerClassStyles = stylesObject[":host"][".header "];
      const statClassStyles = stylesObject[":host"][".stat "];
      const iconClassStyles = stylesObject[":host"][".icon "];

      expect(headerClassStyles.fill.trim()).toBe(
        `#${themes[name].title_color}`,
      );
      expect(statClassStyles.fill.trim()).toBe(`#${themes[name].text_color}`);
      expect(iconClassStyles.fill.trim()).toBe(`#${themes[name].icon_color}`);
    });
  });

  it("deve renderizar a cor do anel (ring_color) personalizada", () => {
    const customColors = {
      ring_color: "0000ff",
    };

    document.body.innerHTML = renderStatsCard(stats as any, {
      ...customColors,
    });

    const styleTag = document.querySelector("style");
    const stylesObject = cssToObject(styleTag!.innerHTML);

    const rankCircleStyles = stylesObject[":host"][".rank-circle "];
    const rankCircleRimStyles = stylesObject[":host"][".rank-circle-rim "];

    expect(rankCircleStyles.stroke.trim()).toBe(`#${customColors.ring_color}`);
    expect(rankCircleRimStyles.stroke.trim()).toBe(
      `#${customColors.ring_color}`,
    );
  });

  it("deve renderizar ícones corretamente", () => {
    document.body.innerHTML = renderStatsCard(stats as any, {
      show_icons: true,
    });

    expect(queryAllByTestId(document.body, "icon")[0]).toBeDefined();
    expect(queryByTestId(document.body, "stars")).toBeDefined();
    expect(
      queryByTestId(document.body, "stars")?.previousElementSibling,
    ).toHaveAttribute("x", "25");
  });

  it("deve redimensionar automaticamente se hide_rank for true", () => {
    document.body.innerHTML = renderStatsCard(stats as any, {
      hide_rank: true,
    });

    expect(
      document.body.getElementsByTagName("svg")[0].getAttribute("width"),
    ).toBe("305.81250000000006");
  });

  it("deve renderizar traduções para chinês (cn)", () => {
    document.body.innerHTML = renderStatsCard(stats as any, { locale: "cn" });
    expect(document.getElementsByClassName("header")[0].textContent).toBe(
      "Anurag Hazra 的 GitHub 统计数据",
    );
    expect(
      document.querySelector(
        'g[transform="translate(0, 0)"]>.stagger>.stat.bold',
      )?.textContent,
    ).toBe("获标星数:");
  });

  it("deve encurtar os valores (kFormatter)", () => {
    const bigStats = { ...stats, totalCommits: 1999 };

    document.body.innerHTML = renderStatsCard(bigStats as any);
    expect(getByTestId(document.body, "commits").textContent).toBe("2k");
    document.body.innerHTML = renderStatsCard(bigStats as any, {
      number_format: "long",
    });
    expect(getByTestId(document.body, "commits").textContent).toBe("1999");
  });

  it("deve renderizar o ícone de rank padrão com nível A+", () => {
    document.body.innerHTML = renderStatsCard(stats as any, {
      rank_icon: "default",
    });
    expect(queryByTestId(document.body, "level-rank-icon")).toBeDefined();
    expect(
      queryByTestId(document.body, "level-rank-icon")?.textContent?.trim(),
    ).toBe("A+");
  });

  it("deve mostrar o percentil do rank", () => {
    document.body.innerHTML = renderStatsCard(stats as any, {
      rank_icon: "percentile",
    });
    expect(queryByTestId(document.body, "percentile-top-header")).toBeDefined();
    expect(
      queryByTestId(
        document.body,
        "percentile-top-header",
      )?.textContent?.trim(),
    ).toBe("Top");
    expect(queryByTestId(document.body, "rank-percentile-text")).toBeDefined();
    expect(
      queryByTestId(
        document.body,
        "percentile-rank-value",
      )?.textContent?.trim(),
    ).toBe(stats.rank.percentile.toFixed(1) + "%");
  });

  it("deve lançar erro se todas as estatísticas e o ícone de rank estiverem ocultos", () => {
    expect(() =>
      renderStatsCard(stats as any, {
        hide: ["stars", "commits", "prs", "issues", "contribs"],
        hide_rank: true,
      }),
    ).toThrow(
      new CustomError(
        "Não foi possível renderizar o card de estatísticas.",
        "Pelo menos as estatísticas ou o rank são obrigatórios.",
      ),
    );
  });
});
