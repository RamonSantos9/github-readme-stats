/**
 * @fileoverview Controle de acesso baseado em whitelist e blacklist.
 *
 * Verifica se um usuário, gist ou conta WakaTime está autorizado
 * a usar esta instância da API. Usa whitelist para instâncias privadas
 * e blacklist para bloquear usuários específicos em instâncias públicas.
 */

import { renderError } from "./render.js";
import { blacklist } from "./blacklist.js";
import { whitelist, gistWhitelist } from "./envs.js";

/** Mensagem de erro para usuários não incluídos na whitelist. */
const MENSAGEM_NAO_WHITELISTED_USERNAME =
  "Este nome de usuário não está na lista de permissões";
/** Mensagem de erro para gists não incluídos na whitelist. */
const MENSAGEM_NAO_WHITELISTED_GIST =
  "Este ID de Gist não está na lista de permissões";
/** Mensagem de erro para usuários na blacklist. */
const MENSAGEM_BLACKLISTED = "Este nome de usuário está na lista de bloqueio";

/**
 * Tipo dos identificadores de recurso suportados.
 */
type TipoRecurso = "username" | "gist" | "wakatime";

/**
 * Parâmetros para a função `guardAccess`.
 */
type ParamsGuardAccess = {
  /** Objeto de resposta HTTP para enviar mensagens de erro. */
  res: any;
  /** Identificador do recurso (username ou ID do gist). */
  id: string;
  /** Tipo do identificador. */
  type: TipoRecurso;
  /** Opções de cor para o card de erro. */
  colors: {
    title_color?: string;
    text_color?: string;
    bg_color?: string;
    border_color?: string;
    theme?: string;
  };
};

/**
 * Tipo do resultado da verificação de acesso.
 */
type ResultadoAcesso = {
  /** `true` se o acesso foi permitido, `false` se bloqueado. */
  isPassed: boolean;
  /** Resultado da resposta HTTP (preenchido apenas quando `isPassed` é `false`). */
  result?: any;
};

/**
 * Verifica e controla o acesso usando whitelist e blacklist.
 *
 * Lógica de acesso:
 * 1. Se whitelist estiver configurada: apenas IDs na lista são permitidos.
 * 2. Se whitelist não estiver configurada: verifica a blacklist para usernames.
 * 3. WakaTime usa apenas a whitelist de username.
 *
 * @param args - Parâmetros de controle de acesso.
 * @returns Objeto com `isPassed` indicando se o acesso foi permitido.
 * @throws {Error} Se o tipo de recurso for inválido.
 *
 * @example
 * const acesso = guardAccess({ res, id: "meu-usuario", type: "username", colors: {} });
 * if (!acesso.isPassed) return acesso.result;
 */
const guardAccess = ({
  res,
  id,
  type,
  colors,
}: ParamsGuardAccess): ResultadoAcesso => {
  if (!["username", "gist", "wakatime"].includes(type)) {
    throw new Error(
      'Tipo inválido. Esperado "username", "gist" ou "wakatime".',
    );
  }

  const currentWhitelist = type === "gist" ? gistWhitelist : whitelist;
  const notWhitelistedMsg =
    type === "gist"
      ? MENSAGEM_NAO_WHITELISTED_GIST
      : MENSAGEM_NAO_WHITELISTED_USERNAME;

  if (Array.isArray(currentWhitelist) && !currentWhitelist.includes(id)) {
    const result = res.send(
      renderError({
        message: notWhitelistedMsg,
        secondaryMessage: "Por favor, faça o deploy da sua própria instância",
        renderOptions: {
          ...colors,
          show_repo_link: false,
        },
      }),
    );
    return { isPassed: false, result };
  }

  if (
    type === "username" &&
    currentWhitelist === undefined &&
    blacklist.includes(id)
  ) {
    const result = res.send(
      renderError({
        message: MENSAGEM_BLACKLISTED,
        secondaryMessage: "Por favor, faça o deploy da sua própria instância",
        renderOptions: {
          ...colors,
          show_repo_link: false,
        },
      }),
    );
    return { isPassed: false, result };
  }

  return { isPassed: true };
};

export { guardAccess };
