/**
 * @file Contém uma função simples que pode ser usada para verificar quais PATs não
 * estão mais funcionando. Retorna uma lista de PATs válidos, expirados e com erros.
 *
 * @description Esta função é limitada a 1 requisição a cada 5 minutos.
 */

import { request } from "../../src/common/http.js";
import { logger } from "../../src/common/log.js";
import { dateDiff } from "../../src/common/ops.js";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { AxiosResponse } from "axios";

export const RATE_LIMIT_SECONDS = 60 * 5; // 1 request per 5 minutes

/**
 * Buscador simples de status (uptime) para os PATs
 *
 * @param variables Variáveis do buscador.
 * @param token Token do GitHub.
 * @returns {Promise<AxiosResponse>} A resposta da API.
 */
const uptimeFetcher = (
  variables: Record<string, any>,
  token: string,
): Promise<AxiosResponse> => {
  return request(
    {
      query: `
        query {
          rateLimit {
            remaining
            resetAt
          },
        }`,
      variables,
    },
    {
      Authorization: `bearer ${token}`,
    },
  );
};

const getAllPATs = () => {
  return Object.keys(process.env).filter((key) => /PAT_\d*$/.exec(key));
};

type PATInfo = {
  validPATs: string[];
  expiredPATs: string[];
  exhaustedPATs: string[];
  suspendedPATs: string[];
  errorPATs: string[];
  details: Record<string, any>;
};

/**
 * Verifica se algum dos PATs expirou.
 *
 * @param fetcher A função de busca.
 * @param variables Variáveis do buscador.
 * @returns {Promise<PATInfo>} As informações dos PATs.
 */
const getPATInfo = async (
  fetcher: (variables: any, token: string) => Promise<AxiosResponse>,
  variables: any,
): Promise<PATInfo> => {
  const details: Record<string, any> = {};
  const PATs = getAllPATs();

  for (const pat of PATs) {
    try {
      const token = process.env[pat];
      if (!token) continue;
      const response = await fetcher(variables, token);
      const errors = response.data.errors;
      const hasErrors = Boolean(errors);
      const errorType = errors?.[0]?.type;
      const isRateLimited =
        (hasErrors && errorType === "RATE_LIMITED") ||
        response.data.data?.rateLimit?.remaining === 0;

      // Store PATs with errors.
      if (hasErrors && errorType !== "RATE_LIMITED") {
        details[pat] = {
          status: "error",
          error: {
            type: errors[0].type,
            message: errors[0].message,
          },
        };
        continue;
      } else if (isRateLimited) {
        const date1 = new Date();
        const date2 = new Date(response.data?.data?.rateLimit?.resetAt);
        details[pat] = {
          status: "exhausted",
          remaining: 0,
          resetIn: dateDiff(date2, date1) + " minutos",
        };
      } else {
        details[pat] = {
          status: "valid",
          remaining: response.data.data.rateLimit.remaining,
        };
      }
    } catch (err: any) {
      // Store the PAT if it is expired.
      const errorMessage = err.response?.data?.message?.toLowerCase();
      if (errorMessage === "bad credentials") {
        details[pat] = {
          status: "expired",
        };
      } else if (errorMessage === "sorry. your account was suspended.") {
        details[pat] = {
          status: "suspended",
        };
      } else {
        throw err;
      }
    }
  }

  const filterPATsByStatus = (status: string) => {
    return Object.keys(details).filter((pat) => details[pat].status === status);
  };

  const sortedDetails: Record<string, any> = Object.keys(details)
    .sort()
    .reduce((obj: Record<string, any>, key) => {
      obj[key] = details[key];
      return obj;
    }, {});

  return {
    validPATs: filterPATsByStatus("valid"),
    expiredPATs: filterPATsByStatus("expired"),
    exhaustedPATs: filterPATsByStatus("exhausted"),
    suspendedPATs: filterPATsByStatus("suspended"),
    errorPATs: filterPATsByStatus("error"),
    details: sortedDetails,
  };
};

/**
 * Função que retorna informações sobre os PATs configurados.
 *
 * @param _ A requisição.
 * @param res A resposta.
 * @returns {Promise<void>}
 */
export default async (_: VercelRequest, res: VercelResponse) => {
  res.setHeader("Content-Type", "application/json");
  try {
    // Add header to prevent abuse.
    const PATsInfo = await getPATInfo(uptimeFetcher, {});
    if (PATsInfo) {
      res.setHeader(
        "Cache-Control",
        `max-age=0, s-maxage=${RATE_LIMIT_SECONDS}`,
      );
    }
    res.send(JSON.stringify(PATsInfo, null, 2));
  } catch (err: any) {
    // Lança erro caso algo dê errado.
    logger.error(err);
    res.setHeader("Cache-Control", "no-store");
    res.send("Algo deu errado: " + err.message);
  }
};
