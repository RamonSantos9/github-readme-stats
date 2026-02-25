import dotenv from "dotenv";
dotenv.config();

import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import patInfo, { RATE_LIMIT_SECONDS } from "../api/status/pat-info.js";

const mock = new MockAdapter(axios);

const successData = {
  data: {
    rateLimit: {
      remaining: 4986,
    },
  },
};

const faker = (query: any) => {
  const req = {
    query: { ...query },
  };
  const res = {
    setHeader: jest.fn(),
    send: jest.fn(),
  };

  return { req, res };
};

const rate_limit_error = {
  errors: [
    {
      type: "RATE_LIMITED",
      message: "API rate limit exceeded for user ID.",
    },
  ],
  data: {
    rateLimit: {
      resetAt: Date.now(),
    },
  },
};

const other_error = {
  errors: [
    {
      type: "SOME_ERROR",
      message: "This is a error",
    },
  ],
};

const bad_credentials_error = {
  message: "Bad credentials",
};

afterEach(() => {
  mock.reset();
});

describe("Testes em api/status/pat-info.ts (PAT Monitor)", () => {
  beforeAll(() => {
    // reseta patenv primeiro para que o dotenv não os popule com envs locais
    process.env = {};
    process.env.PAT_1 = "testPAT1";
    process.env.PAT_2 = "testPAT2";
    process.env.PAT_3 = "testPAT3";
    process.env.PAT_4 = "testPAT4";
  });

  it("deve retornar apenas 'validPATs' se todos os PATs forem válidos", async () => {
    mock
      .onPost("https://api.github.com/graphql")
      .replyOnce(200, rate_limit_error)
      .onPost("https://api.github.com/graphql")
      .reply(200, successData);

    const { req, res } = faker({});
    await patInfo(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
    const responseData = JSON.parse((res.send as any).mock.calls[0][0]);
    expect(responseData.validPATs).toEqual(["PAT_2", "PAT_3", "PAT_4"]);
    expect(responseData.exhaustedPATs).toEqual(["PAT_1"]);
  });

  it("deve retornar `errorPATs` se um PAT causar o lançamento de um erro", async () => {
    mock
      .onPost("https://api.github.com/graphql")
      .replyOnce(200, other_error)
      .onPost("https://api.github.com/graphql")
      .reply(200, successData);

    const { req, res } = faker({});
    await patInfo(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
    const responseData = JSON.parse((res.send as any).mock.calls[0][0]);
    expect(responseData.errorPATs).toEqual(["PAT_1"]);
  });

  it("deve retornar `expiredPATs` se um PAT retornar erro de 'Bad credentials'", async () => {
    mock
      .onPost("https://api.github.com/graphql")
      .replyOnce(404, bad_credentials_error)
      .onPost("https://api.github.com/graphql")
      .reply(200, successData);

    const { req, res } = faker({});
    await patInfo(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
    const responseData = JSON.parse((res.send as any).mock.calls[0][0]);
    expect(responseData.expiredPATs).toEqual(["PAT_1"]);
  });

  it("deve lançar um erro se algo der errado na rede", async () => {
    mock.onPost("https://api.github.com/graphql").networkError();

    const { req, res } = faker({});
    await patInfo(req as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
    expect(res.send).toHaveBeenCalledWith(
      "Something went wrong: Network Error",
    );
  });

  it("deve ter headers de cache adequados quando nenhum erro é lançado", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, successData);

    const { req, res } = faker({});
    await patInfo(req as any, res as any);

    expect((res.setHeader as any).mock.calls).toContainEqual([
      "Cache-Control",
      `max-age=0, s-maxage=${RATE_LIMIT_SECONDS}`,
    ]);
  });
});
