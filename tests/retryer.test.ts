import { describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom";
import { RETRIES, retryer } from "../src/common/retryer.js";
import { logger } from "../src/common/log.js";

const fetcher = jest.fn((variables: any, token: string) => {
  logger.log(variables, token);
  return new Promise((res) => res({ data: "ok" }));
});

const fetcherFail = jest.fn(() => {
  return new Promise((res) =>
    res({ data: { errors: [{ type: "RATE_LIMITED" }] } }),
  );
});

const fetcherFailOnSecondTry = jest.fn(
  (_vars: any, _token: string, retries: number) => {
    return new Promise((res) => {
      // simulando limite de taxa
      if (retries < 1) {
        return res({ data: { errors: [{ type: "RATE_LIMITED" }] } });
      }
      return res({ data: "ok" });
    });
  },
);

const fetcherFailWithMessageBasedRateLimitErr = jest.fn(
  (_vars: any, _token: string, retries: number) => {
    return new Promise((res) => {
      // simulando limite de taxa baseado em mensagem
      if (retries < 1) {
        return res({
          data: {
            errors: [
              {
                type: "ASDF",
                message: "API rate limit already exceeded for user ID 11111111",
              },
            ],
          },
        });
      }
      return res({ data: "ok" });
    });
  },
);

describe("Testes em common/retryer.ts", () => {
  it("retryer deve retornar o valor e ter zero tentativas na primeira vez", async () => {
    const res = await retryer(fetcher as any, {});

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(res).toStrictEqual({ data: "ok" });
  });

  it("retryer deve retornar o valor e ter 2 tentativas", async () => {
    const res = await retryer(fetcherFailOnSecondTry as any, {});

    expect(fetcherFailOnSecondTry).toHaveBeenCalledTimes(2);
    expect(res).toStrictEqual({ data: "ok" });
  });

  it("retryer deve retornar o valor e ter 2 tentativas com erro de limite de taxa baseado em mensagem", async () => {
    const res = await retryer(
      fetcherFailWithMessageBasedRateLimitErr as any,
      {},
    );

    expect(fetcherFailWithMessageBasedRateLimitErr).toHaveBeenCalledTimes(2);
    expect(res).toStrictEqual({ data: "ok" });
  });

  it("retryer deve lançar erro específico se o máximo de tentativas for atingido", async () => {
    try {
      await retryer(fetcherFail as any, {});
    } catch (err: any) {
      expect(fetcherFail).toHaveBeenCalledTimes(RETRIES + 1);
      expect(err.message).toBe(
        "Downtime devido ao limite de taxa da API do GitHub",
      );
    }
  });
});
