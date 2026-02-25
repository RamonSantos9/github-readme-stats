/**
 * @fileoverview Busca de dados do WakaTime.
 *
 * Fornece a função `fetchWakatimeStats` que busca as estatísticas
 * de tempo de codificação do usuário via API pública do WakaTime.
 */

import axios from "axios";
import { CustomError, MissingParamError } from "../common/error.js";
import type { WakaTimeData } from "./types.js";

/**
 * Parâmetros para `fetchWakatimeStats`.
 */
type ParamsFetchWakatime = {
  /** Nome de usuário no WakaTime. */
  username: string;
  /** Domínio customizado da API WakaTime (opcional). Padrão: `wakatime.com`. */
  api_domain?: string;
};

/**
 * Busca as estatísticas de codificação de um usuário do WakaTime.
 *
 * Usa a API pública do WakaTime para obter dados de tempo de codificação
 * por linguagem, editor, SO e categoria.
 *
 * @param params - Parâmetros da busca.
 * @returns Promise com os dados completos do WakaTime.
 * @throws {MissingParamError} Se `username` não for fornecido.
 * @throws {CustomError} Se o usuário não for encontrado (HTTP 4xx/5xx).
 *
 * @example
 * const dados = await fetchWakatimeStats({ username: "meu-usuario" });
 * dados.languages.forEach(lang => console.log(lang.name, lang.percent));
 */
const fetchWakatimeStats = async ({
  username,
  api_domain,
}: ParamsFetchWakatime): Promise<WakaTimeData> => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  try {
    const baseUrl = api_domain
      ? api_domain.replace(/\/$/gi, "")
      : "wakatime.com";

    const { data } = await axios.get(
      `https://${baseUrl}/api/v1/users/${username}/stats?is_including_today=true`,
    );

    return data.data;
  } catch (err: any) {
    if (err.response?.status < 200 || err.response?.status > 299) {
      throw new CustomError(
        `Não foi possível encontrar o usuário '${username}' no WakaTime.`,
        "WAKATIME_USER_NOT_FOUND",
      );
    }
    throw err;
  }
};

export { fetchWakatimeStats };
export default fetchWakatimeStats;
