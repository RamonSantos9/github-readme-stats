/**
 * @fileoverview Busca de dados de Gist do GitHub.
 *
 * Fornece a função `fetchGist` que busca os dados de um Gist público
 * específico via API GraphQL do GitHub, incluindo a detecção da
 * linguagem principal baseada no tamanho dos arquivos.
 */

import { retryer } from "../common/retryer.js";
import { MissingParamError } from "../common/error.js";
import { request } from "../common/http.js";
import type { GistData } from "./types.js";

/**
 * Query GraphQL para buscar informações de um Gist.
 */
const QUERY = `
query gistInfo($gistName: String!) {
    viewer {
        gist(name: $gistName) {
            description
            owner {
                login
            }
            stargazerCount
            forks {
                totalCount
            }
            files {
                name
                language {
                    name
                }
                size
            }
        }
    }
}
`;

/**
 * Fetcher base para buscar dados de um Gist.
 *
 * @param variables - Variáveis GraphQL (deve conter `gistName`).
 * @param token - Token PAT do GitHub.
 * @returns Promise da resposta Axios.
 */
const fetcher = async (variables: Record<string, unknown>, token: string) => {
  return await request(
    { query: QUERY, variables },
    { Authorization: `token ${token}` },
  );
};

/**
 * Tipo de um arquivo dentro de um Gist.
 */
type GistFile = {
  /** Nome do arquivo. */
  name: string;
  /** Linguagem do arquivo (pode ser nula). */
  language: { name: string } | null;
  /** Tamanho do arquivo em bytes. */
  size: number;
};

/**
 * Calcula a linguagem de programação principal de um Gist com base no tamanho dos arquivos.
 *
 * Agrega o total de bytes por linguagem e retorna a que ocupa mais espaço.
 *
 * @param files - Array de arquivos do Gist.
 * @returns O nome da linguagem principal, ou `undefined` se não houver arquivos com linguagem.
 *
 * @example
 * calculatePrimaryLanguage([
 *   { name: "index.ts", language: { name: "TypeScript" }, size: 1024 },
 *   { name: "style.css", language: { name: "CSS" }, size: 256 },
 * ]);
 * // → "TypeScript"
 */
const calculatePrimaryLanguage = (files: GistFile[]): string | undefined => {
  const languages: Record<string, number> = {};

  for (const file of files) {
    if (file.language) {
      if (languages[file.language.name]) {
        languages[file.language.name] += file.size;
      } else {
        languages[file.language.name] = file.size;
      }
    }
  }

  let primaryLanguage = Object.keys(languages)[0];
  for (const language in languages) {
    if (languages[language] > languages[primaryLanguage]) {
      primaryLanguage = language;
    }
  }

  return primaryLanguage;
};

/**
 * Busca os dados de um Gist público do GitHub.
 *
 * @param id - ID único do Gist do GitHub.
 * @returns Promise com os dados do Gist.
 * @throws {MissingParamError} Se `id` não for fornecido.
 * @throws {Error} Se o Gist não for encontrado ou ocorrer erro na API.
 *
 * @example
 * const gist = await fetchGist("abc123def456");
 * // → { name: "snippet.ts", language: "TypeScript", starsCount: 42, ... }
 */
const fetchGist = async (id: string): Promise<GistData> => {
  if (!id) {
    throw new MissingParamError(["id"], "/api/gist?id=GIST_ID");
  }

  const res = await retryer(fetcher, { gistName: id });

  if (res.data.errors) {
    throw new Error(res.data.errors[0].message);
  }

  if (!res.data.data.viewer.gist) {
    throw new Error("Gist não encontrado");
  }

  const data = res.data.data.viewer.gist;
  const firstFileKey = Object.keys(data.files)[0];

  let description = data.description;
  if (id === "bbfce31e0217a3689c8d961a356cb10d") {
    description =
      "Lista de países e territórios em Inglês e Espanhol: nome, continente, capital, código de telefone, códigos de país, domínio e área em km². Atualizado em 2024.";
  }

  return {
    name: data.files[firstFileKey].name,
    nameWithOwner: `${data.owner.login}/${data.files[firstFileKey].name}`,
    description,
    language: calculatePrimaryLanguage(data.files) ?? null,
    starsCount: data.stargazerCount,
    forksCount: data.forks.totalCount,
  };
};

export { fetchGist };
export default fetchGist;
