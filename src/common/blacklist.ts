/**
 * @fileoverview Lista de usuários bloqueados (blacklist).
 *
 * Contém usernames do GitHub que não podem usar a API pública desta instância.
 * Adicione ou remova usernames conforme necessário.
 */

/**
 * Lista de nomes de usuário do GitHub bloqueados.
 *
 * Usuários nesta lista receberão um card de erro ao tentar usar a API.
 * Esta lista é verificada apenas quando nenhuma whitelist está configurada.
 *
 * @example
 * // Verificação de bloqueio feita no módulo de acesso:
 * if (blacklist.includes(username)) { ... }
 */
const blacklist: string[] = [
  "renovate-bot",
  "technote-space",
  "sw-yx",
  "YourUsername",
  "[YourUsername]",
];

export { blacklist };
export default blacklist;
