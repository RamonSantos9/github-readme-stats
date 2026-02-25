import { describe, expect, it } from "@jest/globals";
import "@testing-library/jest-dom";
import { calculateRank } from "../src/calculateRank.js";

describe("Testes em calculateRank.ts", () => {
  it("usuário novo ganha rank C", () => {
    expect(
      calculateRank({
        all_commits: false,
        commits: 0,
        prs: 0,
        issues: 0,
        reviews: 0,
        repos: 0,
        stars: 0,
        followers: 0,
      }),
    ).toStrictEqual({ level: "C", percentile: 100 });
  });

  it("usuário iniciante ganha rank B-", () => {
    expect(
      calculateRank({
        all_commits: false,
        commits: 125,
        prs: 25,
        issues: 10,
        reviews: 5,
        repos: 0,
        stars: 25,
        followers: 5,
      }),
    ).toStrictEqual({ level: "B-", percentile: 65.02918514848255 });
  });

  it("usuário médio ganha rank B+", () => {
    expect(
      calculateRank({
        all_commits: false,
        commits: 250,
        prs: 50,
        issues: 25,
        reviews: 10,
        repos: 0,
        stars: 50,
        followers: 10,
      }),
    ).toStrictEqual({ level: "B+", percentile: 46.09375 });
  });

  it("usuário mediano ganha rank B+ (com include_all_commits)", () => {
    expect(
      calculateRank({
        all_commits: true,
        commits: 1000,
        prs: 50,
        issues: 25,
        reviews: 10,
        repos: 0,
        stars: 50,
        followers: 10,
      }),
    ).toStrictEqual({ level: "B+", percentile: 46.09375 });
  });

  it("usuário avançado ganha rank A", () => {
    expect(
      calculateRank({
        all_commits: false,
        commits: 500,
        prs: 100,
        issues: 50,
        reviews: 20,
        repos: 0,
        stars: 200,
        followers: 40,
      }),
    ).toStrictEqual({ level: "A", percentile: 20.841471354166664 });
  });

  it("usuário especialista ganha rank A+", () => {
    expect(
      calculateRank({
        all_commits: false,
        commits: 1000,
        prs: 200,
        issues: 100,
        reviews: 40,
        repos: 0,
        stars: 800,
        followers: 160,
      }),
    ).toStrictEqual({ level: "A+", percentile: 5.575988339442828 });
  });

  it("usuário de elite (sindresorhus) ganha rank S", () => {
    expect(
      calculateRank({
        all_commits: false,
        commits: 1300,
        prs: 1500,
        issues: 4500,
        reviews: 1000,
        repos: 0,
        stars: 600000,
        followers: 50000,
      }),
    ).toStrictEqual({ level: "S", percentile: 0.4578556547153667 });
  });
});
