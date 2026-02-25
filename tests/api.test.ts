import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import api from "../api/index.js";
import { calculateRank } from "../src/calculateRank.js";
import { renderStatsCard } from "../src/cards/stats.js";
import { renderError } from "../src/common/render.js";
import { CACHE_TTL, DURATIONS } from "../src/common/cache.js";

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
  totalDiscussionsAnswered: 40,
  contributedTo: 50,
  rank: { level: "DEV", percentile: 0 },
};

(stats as any).rank = calculateRank({
  all_commits: false,
  commits: stats.totalCommits,
  prs: stats.totalPRs,
  reviews: stats.totalReviews,
  issues: stats.totalIssues,
  repos: 1,
  stars: stats.totalStars,
  followers: 0,
});

const data_stats = {
  data: {
    user: {
      name: stats.name,
      repositoriesContributedTo: { totalCount: stats.contributedTo },
      commits: {
        totalCommitContributions: stats.totalCommits,
      },
      reviews: {
        totalPullRequestReviewContributions: stats.totalReviews,
      },
      pullRequests: { totalCount: stats.totalPRs },
      mergedPullRequests: { totalCount: stats.totalPRsMerged },
      openIssues: { totalCount: stats.totalIssues },
      closedIssues: { totalCount: 0 },
      followers: { totalCount: 0 },
      repositoryDiscussions: { totalCount: stats.totalDiscussionsStarted },
      repositoryDiscussionComments: {
        totalCount: stats.totalDiscussionsAnswered,
      },
      repositories: {
        totalCount: 1,
        nodes: [{ stargazers: { totalCount: 100 } }],
        pageInfo: {
          hasNextPage: false,
          endCursor: "cursor",
        },
      },
    },
  },
};

const error = {
  errors: [
    {
      type: "NOT_FOUND",
      path: ["user"],
      locations: [],
      message: "Could not fetch user",
    },
  ],
};

const mock = new MockAdapter(axios);

const faker = (query: any, data: any) => {
  const req = {
    query: {
      username: "ramonsantos9",
      ...query,
    },
  };
  const res = {
    setHeader: jest.fn(),
    send: jest.fn(),
  };
  mock.onPost("https://api.github.com/graphql").replyOnce(200, data);

  return { req, res };
};

beforeEach(() => {
  process.env.CACHE_SECONDS = undefined;
});

afterEach(() => {
  mock.reset();
});

describe("Testes em api/index.ts (Stats API)", () => {
  it("deve processar a requisição corretamente", async () => {
    const { req, res } = faker({}, data_stats);

    await api(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderStatsCard(stats as any, { ...req.query }),
    );
  });

  it("deve renderizar card de erro em caso de erro na API", async () => {
    const { req, res } = faker({}, error);

    await api(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: error.errors[0].message,
        secondaryMessage:
          "Certifique-se de que o nome de usuário fornecido não é uma organização",
      }),
    );
  });

  it("deve renderizar card de erro com o mesmo tema solicitado", async () => {
    const { req, res } = faker({ theme: "merko" }, error);

    await api(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: error.errors[0].message,
        secondaryMessage:
          "Certifique-se de que o nome de usuário fornecido não é uma organização",
        renderOptions: { theme: "merko" },
      }),
    );
  });

  it("deve aplicar corretamente as opções de query", async () => {
    const { req, res } = faker(
      {
        username: "ramonsantos9",
        hide: "issues,prs,contribs",
        show_icons: true,
        hide_border: true,
        line_height: 100,
        title_color: "fff",
        icon_color: "fff",
        text_color: "fff",
        bg_color: "fff",
      },
      data_stats,
    );

    await api(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderStatsCard(stats as any, {
        hide: ["issues", "prs", "contribs"],
        show_icons: true,
        hide_border: true,
        line_height: 100,
        title_color: "fff",
        icon_color: "fff",
        text_color: "fff",
        bg_color: "fff",
      }),
    );
  });

  it("deve ter headers de cache adequados", async () => {
    const { req, res } = faker({}, data_stats);

    await api(req as any, res as any);

    expect((res.setHeader as any).mock.calls).toEqual([
      ["Content-Type", "image/svg+xml"],
      [
        "Cache-Control",
        `max-age=${CACHE_TTL.STATS_CARD.DEFAULT}, ` +
          `s-maxage=${CACHE_TTL.STATS_CARD.DEFAULT}, ` +
          `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
      ],
    ]);
  });

  it("deve desativar o cache quando CACHE_SECONDS for 0", async () => {
    process.env.CACHE_SECONDS = "0";

    const { req, res } = faker({}, data_stats);
    await api(req as any, res as any);

    expect((res.setHeader as any).mock.calls).toEqual([
      ["Content-Type", "image/svg+xml"],
      [
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
      ],
      ["Pragma", "no-cache"],
      ["Expires", "0"],
    ]);
  });

  it("deve renderizar erro se o usuário estiver na lista de bloqueio (blacklist)", async () => {
    const { req, res } = faker({ username: "renovate-bot" }, data_stats);

    await api(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Este nome de usuário está na lista de bloqueio",
        secondaryMessage: "Por favor, faça o deploy da sua própria instância",
        renderOptions: { show_repo_link: false },
      }),
    );
  });

  it("deve renderizar erro quando um locale inválido é fornecido", async () => {
    const { req, res } = faker({ locale: "asdf" }, data_stats);

    await api(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Language not found",
      }),
    );
  });
});
