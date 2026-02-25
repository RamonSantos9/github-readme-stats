/**
 * @fileoverview Variáveis de ambiente do sistema.
 *
 * Centraliza a leitura e o parsing das variáveis de ambiente utilizadas
 * pelo projeto. Cada variável é lida uma única vez na inicialização.
 */

/**
 * Lista de nomes de usuário do GitHub permitidos (whitelist).
 *
 * Lida da variável de ambiente `WHITELIST` como uma string separada por vírgulas.
 * Se não definida, `undefined` indica que qualquer usuário é permitido.
 *
 * @example
 * WHITELIST=ramonsantos9,Yizack,rickstaa
 */
const whitelist: string[] | undefined = process.env.WHITELIST
  ? process.env.WHITELIST.split(",")
  : undefined;

/**
 * Lista de IDs de Gist do GitHub permitidos (whitelist de gists).
 *
 * Lida da variável de ambiente `GIST_WHITELIST` como uma string separada por vírgulas.
 * Se não definida, `undefined` indica que qualquer gist é permitido.
 *
 * @example
 * GIST_WHITELIST=abc123,def456
 */
const gistWhitelist: string[] | undefined = process.env.GIST_WHITELIST
  ? process.env.GIST_WHITELIST.split(",")
  : undefined;

/**
 * Lista de repositórios a serem excluídos da contagem de estrelas.
 *
 * Lida da variável de ambiente `EXCLUDE_REPO` como uma string separada por vírgulas.
 * Se não definida, retorna um array vazio (nenhum repositório excluído).
 *
 * @example
 * EXCLUDE_REPO=meu-repo-privado,outro-repo
 */
const excludeRepositories: string[] = process.env.EXCLUDE_REPO
  ? process.env.EXCLUDE_REPO.split(",")
  : [];

export { whitelist, gistWhitelist, excludeRepositories };
