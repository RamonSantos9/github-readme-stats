import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import "@testing-library/jest-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { calculateRank } from "../src/calculateRank.js";
import { fetchStats } from "../src/fetchers/stats.js";

// Parâmetros de teste.
const data_stats = {
  data: {
    user: {
      name: "Anurag Hazra",
      repositoriesContributedTo: { totalCount: 61 },
      commits: {
        totalCommitContributions: 100,
      },
      reviews: {
        totalPullRequestReviewContributions: 50,
      },
      pullRequests: { totalCount: 300 },
      mergedPullRequests: { totalCount: 240 },
      openIssues: { totalCount: 100 },
      closedIssues: { totalCount: 100 },
      followers: { totalCount: 100 },
      repositoryDiscussions: { totalCount: 10 },
      repositoryDiscussionComments: { totalCount: 40 },
      repositories: {
        totalCount: 5,
        nodes: [
          { name: "test-repo-1", stargazers: { totalCount: 100 } },
          { name: "test-repo-2", stargazers: { totalCount: 100 } },
          { name: "test-repo-3", stargazers: { totalCount: 100 } },
        ],
        pageInfo: {
          hasNextPage: true,
          endCursor: "cursor",
        },
      },
    },
  },
};

const data_year2003 = JSON.parse(JSON.stringify(data_stats));
data_year2003.data.user.commits.totalCommitContributions = 428;

const data_without_pull_requests = {
  data: {
    user: {
      ...data_stats.data.user,
      pullRequests: { totalCount: 0 },
      mergedPullRequests: { totalCount: 0 },
    },
  },
};

const data_repo = {
  data: {
    user: {
      repositories: {
        nodes: [
          { name: "test-repo-4", stargazers: { totalCount: 50 } },
          { name: "test-repo-5", stargazers: { totalCount: 50 } },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: "cursor",
        },
      },
    },
  },
};

const data_repo_zero_stars = {
  data: {
    user: {
      repositories: {
        nodes: [
          { name: "test-repo-1", stargazers: { totalCount: 100 } },
          { name: "test-repo-2", stargazers: { totalCount: 100 } },
          { name: "test-repo-3", stargazers: { totalCount: 100 } },
          { name: "test-repo-4", stargazers: { totalCount: 0 } },
          { name: "test-repo-5", stargazers: { totalCount: 0 } },
        ],
        pageInfo: {
          hasNextPage: true,
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
      message:
        "Não foi possível resolver para um usuário com o login 'noname'.",
    },
  ],
};

const mock = new MockAdapter(axios);

beforeEach(() => {
  process.env.FETCH_MULTI_PAGE_STARS = "false"; // Define como `false` para buscar apenas uma página de estrelas.
  mock.onPost("https://api.github.com/graphql").reply((cfg) => {
    const req = JSON.parse(cfg.data);

    if (
      req.variables &&
      req.variables.startTime &&
      req.variables.startTime.startsWith("2003")
    ) {
      return [200, data_year2003];
    }
    return [
      200,
      req.query.includes("totalCommitContributions") ? data_stats : data_repo,
    ];
  });
});

afterEach(() => {
  mock.reset();
});

describe("Testes em fetchers/stats.ts", () => {
  it("deve buscar as estatísticas corretamente", async () => {
    const stats = await fetchStats("ramonsantos9");
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Anurag Hazra",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("deve parar de buscar quando houver repositórios com zero estrelas", async () => {
    mock.reset();
    mock
      .onPost("https://api.github.com/graphql")
      .replyOnce(200, data_stats)
      .onPost("https://api.github.com/graphql")
      .replyOnce(200, data_repo_zero_stars);

    const stats = await fetchStats("ramonsantos9");
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Anurag Hazra",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("deve lançar erro se o usuário não for encontrado", async () => {
    mock.reset();
    mock.onPost("https://api.github.com/graphql").reply(200, error);

    await expect(fetchStats("ramonsantos9")).rejects.toThrow(
      "Não foi possível resolver para um usuário com o login 'noname'.",
    );
  });

  it("deve buscar o total de commits via REST", async () => {
    mock
      .onGet("https://api.github.com/search/commits?q=author:ramonsantos9")
      .reply(200, { total_count: 1000 });

    const stats = await fetchStats("ramonsantos9", true);
    const rank = calculateRank({
      all_commits: true,
      commits: 1000,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Anurag Hazra",
      totalCommits: 1000,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("deve lançar erro específico quando include_all_commits é true e o nome de usuário é inválido", async () => {
    await expect(fetchStats("asdf///---", true)).rejects.toThrow(
      "Nome de usuário inválido.",
    );
  });

  it("deve lançar erro específico quando include_all_commits é true e a API REST retorna erro", async () => {
    mock
      .onGet("https://api.github.com/search/commits?q=author:ramonsantos9")
      .reply(200, { error: "Algum erro de teste" });

    await expect(fetchStats("ramonsantos9", true)).rejects.toThrow(
      "Não foi possível buscar o total de commits.",
    );
  });

  it("deve excluir estrelas do repositório 'test-repo-1'", async () => {
    mock
      .onGet("https://api.github.com/search/commits?q=author:ramonsantos9")
      .reply(200, { total_count: 1000 });

    const stats = await fetchStats("ramonsantos9", true, ["test-repo-1"]);
    const rank = calculateRank({
      all_commits: true,
      commits: 1000,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 200,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Anurag Hazra",
      totalCommits: 1000,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 200,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("deve buscar duas páginas de estrelas se 'FETCH_MULTI_PAGE_STARS' for true", async () => {
    process.env.FETCH_MULTI_PAGE_STARS = "true";

    const stats = await fetchStats("ramonsantos9");
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 400,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Anurag Hazra",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 400,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("deve buscar apenas uma página de estrelas se 'FETCH_MULTI_PAGE_STARS' for false", async () => {
    process.env.FETCH_MULTI_PAGE_STARS = "false";

    const stats = await fetchStats("ramonsantos9");
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Anurag Hazra",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("deve buscar estatísticas adicionais quando solicitado", async () => {
    const stats = await fetchStats("ramonsantos9", false, [], true, true, true);
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Anurag Hazra",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 240,
      mergedPRsPercentage: 80,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 10,
      totalDiscussionsAnswered: 40,
      rank,
    });
  });

  it("deve obter commits do ano fornecido", async () => {
    const stats = await fetchStats(
      "ramonsantos9",
      false,
      [],
      false,
      false,
      false,
      2003,
    );

    const rank = calculateRank({
      all_commits: false,
      commits: 428,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Anurag Hazra",
      totalCommits: 428,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("deve retornar dados corretos quando o usuário não tem pull requests", async () => {
    mock.reset();
    mock
      .onPost("https://api.github.com/graphql")
      .reply(200, data_without_pull_requests);
    const stats = await fetchStats("ramonsantos9", false, [], true);
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 0,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Anurag Hazra",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 0,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });
});
