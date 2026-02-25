/**
 * @fileoverview Script utilizado para visualizar temas em PRs de novos temas.
 */
import * as dotenv from "dotenv";
dotenv.config();

import { debug, setFailed } from "@actions/core";
import github from "@actions/github";
// @ts-ignore
import ColorContrastChecker from "color-contrast-checker";
import { info } from "console";
// @ts-ignore
import Hjson from "hjson";
// @ts-ignore
import snakeCase from "lodash.snakecase";
// @ts-ignore
import parse from "parse-diff";
import { inspect } from "util";
import { isValidHexColor, isValidGradient } from "../src/common/color.js";
import { themes } from "../themes/index.js";
import { getGithubToken, getRepoInfo } from "./helpers.js";

const COMMENTER = "github-actions[bot]";

const COMMENT_TITLE = "Pré-visualização Automática de Tema";
const THEME_PR_FAIL_TEXT = ":x: O PR do tema não adere às nossas diretrizes.";
const THEME_PR_SUCCESS_TEXT =
  ":heavy_check_mark: O PR do tema adere às nossas diretrizes.";
const FAIL_TEXT = `
  \rInfelizmente, seu PR de tema contém um erro ou não adere às nossas [diretrizes de tema](https://github.com/ramonsantos9/github-readme-stats/blob/master/CONTRIBUTING.md#themes-contribution). Por favor, corrija os problemas abaixo e revisaremos seu\
  \r PR novamente. Este pull request será **fechado automaticamente em 20 dias** se nenhuma alteração for feita. Após este tempo, você deverá reabrir o PR para que ele seja revisado.
`;
const THEME_CONTRIB_GUIDELINES = `
  \rOlá, obrigado pela contribuição do tema. Por favor, leia nossas [diretrizes de contribuição](https://github.com/ramonsantos9/github-readme-stats/blob/master/CONTRIBUTING.md#themes-contribution).
  
  \r> [!WARNING]\
  \r> Tenha em mente que já temos uma vasta coleção de temas diferentes. Para manter o número gerenciável, começamos a adicionar apenas os temas apoiados pela comunidade. Seu pull request será mesclado assim que obtivermos feedback positivo suficiente da comunidade na forma de emojis de joinha :+1: (veja [#1935](https://github.com/ramonsantos9/github-readme-stats/issues/1935#top-themes-prs)). Esperamos ver pelo menos 10-15 joinhas antes de tomar a decisão de mesclar seu pull request. Lembre-se que você também pode apoiar temas de outros contribuidores que gostou para acelerar a mesclagem deles.

  \r> [!WARNING]\
  \r> Por favor, não envie um pull request com um lote de temas, pois será difícil julgar como a comunidade reagirá a cada um deles. Mesclaremos apenas um tema por pull request. Se você tiver vários temas, envie um pull request separado para cada um deles. Situações em que você tem várias versões do mesmo tema (ex: claro e escuro) são uma exceção a esta regra.

  \r> [!NOTE]\
  \r> Além disso, note que se este tema for exclusivamente para seu uso pessoal, em vez de adicioná-lo à nossa coleção de temas, você pode usar as [opções de personalização](https://github.com/ramonsantos9/github-readme-stats#customization) do card.
`;
const COLOR_PROPS: Record<string, number> = {
  title_color: 6,
  icon_color: 6,
  text_color: 6,
  bg_color: 23,
  border_color: 6,
};
const ACCEPTED_COLOR_PROPS = Object.keys(COLOR_PROPS);
const REQUIRED_COLOR_PROPS = ACCEPTED_COLOR_PROPS.slice(0, 4);

const INVALID_REVIEW_COMMENT = (commentUrl: string) =>
  `Alguns temas são inválidos. Veja o comentário de [Pré-visualização Automática de Tema](${commentUrl}) acima para mais informações.`;

let OCTOKIT: any;
let OWNER: string;
let REPO: string;
let PULL_REQUEST_ID: number;

/**
 * Erro de formato JSON incorreto.
 */
class IncorrectJsonFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncorrectJsonFormatError";
  }
}

/**
 * Recupera o número do PR do payload do evento.
 *
 * @returns Número do PR.
 */
const getPrNumber = (): number => {
  if (process.env.MOCK_PR_NUMBER) {
    return parseInt(process.env.MOCK_PR_NUMBER, 10);
  }

  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    throw new Error(
      "Não foi possível obter o número do pull request do contexto",
    );
  }
  return pullRequest.number;
};

/**
 * Recupera o usuário que comenta.
 */
const getCommenter = (): string => {
  return process.env.COMMENTER ? process.env.COMMENTER : COMMENTER;
};

/**
 * Verifica se o comentário é um comentário de pré-visualização.
 */
const isPreviewComment = (inputs: any, comment: any): boolean => {
  return (
    (inputs.commentAuthor && comment.user
      ? comment.user.login === inputs.commentAuthor
      : true) &&
    (inputs.bodyIncludes && comment.body
      ? comment.body.includes(inputs.bodyIncludes)
      : true)
  );
};

/**
 * Encontra o comentário de pré-visualização do tema.
 */
const findComment = async (
  octokit: any,
  issueNumber: number,
  owner: string,
  repo: string,
  commenter: string,
): Promise<any | undefined> => {
  const parameters = {
    owner,
    repo,
    issue_number: issueNumber,
  };
  const inputs = {
    commentAuthor: commenter,
    bodyIncludes: COMMENT_TITLE,
  };

  for await (const { data: comments } of octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    parameters,
  )) {
    const comment = comments.find((comment: any) =>
      isPreviewComment(inputs, comment),
    );
    if (comment) {
      debug(
        `Encontrado comentário de pré-visualização de tema: ${inspect(comment)}`,
      );
      return comment;
    } else {
      debug(`Nenhum comentário de pré-visualização de tema encontrado.`);
    }
  }

  return undefined;
};

/**
 * Cria ou atualiza o comentário de pré-visualização.
 */
const upsertComment = async (
  octokit: any,
  issueNumber: number,
  repo: string,
  owner: string,
  commentId: number | undefined,
  body: string,
): Promise<string> => {
  let resp;
  if (commentId === undefined) {
    resp = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });
  } else {
    resp = await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: commentId,
      body,
    });
  }
  return resp.data.html_url;
};

/**
 * Adiciona uma revisão ao pull request.
 */
const addReview = async (
  octokit: any,
  prNumber: number,
  owner: string,
  repo: string,
  reviewState: string,
  reason: string | undefined,
): Promise<void> => {
  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    event: reviewState,
    body: reason,
  });
};

/**
 * Adiciona etiqueta ao pull request.
 */
const addLabel = async (
  octokit: any,
  prNumber: number,
  owner: string,
  repo: string,
  labels: string[],
): Promise<void> => {
  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels,
  });
};

/**
 * Remove etiqueta do pull request.
 */
const removeLabel = async (
  octokit: any,
  prNumber: number,
  owner: string,
  repo: string,
  label: string,
): Promise<void> => {
  await octokit.rest.issues.removeLabel({
    owner,
    repo,
    issue_number: prNumber,
    name: label,
  });
};

/**
 * Adiciona ou remove uma etiqueta do pull request.
 */
const addRemoveLabel = async (
  octokit: any,
  prNumber: number,
  owner: string,
  repo: string,
  label: string,
  add: boolean,
): Promise<void> => {
  const res = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });
  const labels = res.data.labels as any[];
  if (add) {
    if (!labels.find((l) => l.name === label)) {
      await addLabel(octokit, prNumber, owner, repo, [label]);
    }
  } else {
    if (labels.find((l) => l.name === label)) {
      await removeLabel(octokit, prNumber, owner, repo, label);
    }
  }
};

/**
 * Recupera o link de verificação de contraste de cor WebAim.
 */
const getWebAimLink = (color1: string, color2: string): string => {
  return `https://webaim.org/resources/contrastchecker/?fcolor=${color1}&bcolor=${color2}`;
};

/**
 * Recupera a URL do card com o tema para visualização.
 */
const getGRSLink = (colors: Record<string, string>): string => {
  const url = `https://github-readme-stats.vercel.app/api?username=ramonsantos9`;
  const colorString = Object.keys(colors)
    .map((colorKey) => `${colorKey}=${colors[colorKey] as string}`)
    .join("&");

  return `${url}&${colorString}&show_icons=true`;
};

/**
 * Converte string JSON/Hjson para objeto JavaScript.
 */
const parseJSON = (json: string): any => {
  try {
    const parsedJson = Hjson.parse(json);
    if (typeof parsedJson === "object" && parsedJson !== null) {
      return parsedJson;
    } else {
      throw new IncorrectJsonFormatError(
        "O diff do PR não é um objeto JSON de tema válido.",
      );
    }
  } catch (error) {
    void error;

    // Tenta limpar erros comuns de sintaxe JSON.
    let parsedJson = json.replace(/(,\s*})/g, "}");
    parsedJson = parsedJson.replace(/\/\/[A-z\s]*\s/g, "");

    const splitJson = parsedJson
      .split(/([\s\r\s]*}[\s\r\s]*,[\s\r\s]*)(?=[\w"-]+:)/)
      .filter((x) => typeof x !== "string" || !!x.trim());

    if (splitJson[0] && splitJson[0].replace(/\s+/g, "") === "},") {
      splitJson[0] = "},";
      if (splitJson[1] && /\s*}\s*,?\s*$/.test(splitJson[1])) {
        splitJson.shift();
      } else {
        const shifted = splitJson.shift();
        if (shifted !== undefined) {
          splitJson.push(shifted);
        }
      }
      parsedJson = splitJson.join("");
    }

    try {
      return Hjson.parse(parsedJson);
    } catch (err: any) {
      throw new IncorrectJsonFormatError(
        `O arquivo JSON do tema não pôde ser analisado: ${err.message}`,
      );
    }
  }
};

/**
 * Verifica se o nome do tema já existe.
 */
const themeNameAlreadyExists = (name: string): boolean => {
  return (themes as any)[name] !== undefined;
};

/**
 * Função principal para execução do script.
 */
export const run = async (): Promise<void> => {
  try {
    debug("Recuperando informações da ação do contexto...");
    let commentBody = `
      \r# ${COMMENT_TITLE}
      \r${THEME_CONTRIB_GUIDELINES}
    `;
    const ccc = new ColorContrastChecker();
    OCTOKIT = github.getOctokit(getGithubToken());
    PULL_REQUEST_ID = getPrNumber();
    const { owner, repo } = getRepoInfo(github.context);
    OWNER = owner;
    REPO = repo;
    const commenter = getCommenter();

    debug(`Proprietário: ${OWNER}`);
    debug(`Repositório: ${REPO}`);
    debug(`Comentador: ${commenter}`);

    debug("Recuperando diff do PR...");
    const res = await OCTOKIT.rest.pulls.get({
      owner: OWNER,
      repo: REPO,
      pull_number: PULL_REQUEST_ID,
      mediaType: {
        format: "diff",
      },
    });

    debug("Recuperando comentário de pré-visualização...");
    const comment = await findComment(
      OCTOKIT,
      PULL_REQUEST_ID,
      OWNER,
      REPO,
      commenter,
    );

    debug("Extraindo temas...");
    const diff = parse(res.data as unknown as string);

    debug("Extraindo alterações de temas...");
    const themesFile =
      diff.find((file: any) => file.to === "themes/index.js") ||
      diff.find((file: any) => file.to === "themes/index.ts");

    if (!themesFile) {
      throw new Error(
        "Não foi possível encontrar alterações em themes/index.js ou themes/index.ts",
      );
    }

    const content = themesFile.chunks
      .map((chunk: any) =>
        chunk.changes
          .filter((c: any) => c.type === "add")
          .map((c: any) => c.content.replace("+", ""))
          .join(""),
      )
      .join("");

    const themeObject = parseJSON(content);
    if (
      Object.keys(themeObject).every(
        (key) => typeof themeObject[key] !== "object",
      )
    ) {
      throw new Error("O diff do PR não contém um objeto de tema válido.");
    }

    debug("Gerando corpo da pré-visualização de temas...");
    const themeValid: Record<string, boolean> = Object.fromEntries(
      Object.keys(themeObject).map((name) => [name, true]),
    );
    let previewBody = "";

    for (const theme in themeObject) {
      debug(`Gerando pré-visualização para ${theme}...`);
      const themeName = theme;
      const colors = themeObject[theme];
      const warnings: string[] = [];
      const errors: string[] = [];

      if (themeNameAlreadyExists(themeName)) {
        warnings.push("Nome do tema já está em uso");
        themeValid[theme] = false;
      }
      if (themeName !== snakeCase(themeName)) {
        warnings.push("O nome do tema não está em snake_case");
        themeValid[theme] = false;
      }

      let invalidColors = false;
      if (colors) {
        const missingKeys = REQUIRED_COLOR_PROPS.filter(
          (x) => !Object.keys(colors).includes(x),
        );
        const extraKeys = Object.keys(colors).filter(
          (x) => !ACCEPTED_COLOR_PROPS.includes(x),
        );
        if (missingKeys.length > 0 || extraKeys.length > 0) {
          for (const missingKey of missingKeys) {
            errors.push(`Propriedade de cor \`${missingKey}\` está faltando`);
          }

          for (const extraKey of extraKeys) {
            warnings.push(`Propriedade de cor \`${extraKey}\` não é suportada`);
          }
          invalidColors = true;
        } else {
          for (const [colorKey, colorValue] of Object.entries(colors) as [
            string,
            string,
          ][]) {
            if (colorValue[0] === "#") {
              errors.push(
                `A propriedade de cor \`${colorKey}\` não deve começar com '#'`,
              );
              invalidColors = true;
            } else if (colorValue.length > (COLOR_PROPS[colorKey] || 6)) {
              errors.push(
                `A propriedade de cor \`${colorKey}\` não pode ser maior que \`${COLOR_PROPS[colorKey]}\` caracteres`,
              );
              invalidColors = true;
            } else if (
              !(colorKey === "bg_color" && colorValue.split(",").length > 1
                ? isValidGradient(colorValue.split(","))
                : isValidHexColor(colorValue))
            ) {
              errors.push(
                `A propriedade de cor \`${colorKey}\` não é uma cor hex válida: <code>${colorValue}</code>`,
              );
              invalidColors = true;
            }
          }
        }
      } else {
        warnings.push("As cores do tema estão faltando");
        invalidColors = true;
      }

      if (invalidColors) {
        themeValid[theme] = false;
        previewBody += `
          \r### Pré-visualização do tema ${
            themeName.charAt(0).toUpperCase() + themeName.slice(1)
          }
          
          \r${warnings.map((warning) => `- :warning: ${warning}.\n`).join("")}
          \r${errors.map((error) => `- :x: ${error}.\n`).join("")}

          \r>:x: Não foi possível criar a pré-visualização do tema.
        `;
        continue;
      }

      const titleColor = colors.title_color;
      const iconColor = colors.icon_color;
      const textColor = colors.text_color;
      const bgColor = colors.bg_color;
      const borderColor = colors.border_color;
      const url = getGRSLink(colors);
      const colorPairs: Record<string, [string, string]> = {
        title_color: [titleColor, bgColor],
        icon_color: [iconColor, bgColor],
        text_color: [textColor, bgColor],
      };

      (Object.keys(colorPairs) as (keyof typeof colorPairs)[]).forEach(
        (item) => {
          const [c1, c2] = colorPairs[item];
          let color1 = c1;
          let color2 = c2;
          const isGradientColor = color2.split(",").length > 1;
          if (isGradientColor) {
            return;
          }
          color1 = color1.length === 3 ? color1 : color1.slice(0, 6);
          color2 = color2.length === 3 ? color2 : color2.slice(0, 6);
          if (!ccc.isLevelAA(`#${color1}`, `#${color2}`)) {
            const permalink = getWebAimLink(color1, color2);
            warnings.push(
              `\`${item}\` não passa na [taxa de contraste AA](${permalink})`,
            );
            themeValid[theme] = false;
          }
        },
      );

      previewBody += `
        \r### Pré-visualização do tema ${
          themeName.charAt(0).toUpperCase() + themeName.slice(1)
        }
        
        \r${warnings.map((warning) => `- :warning: ${warning}.\n`).join("")}

        \ntitle_color: <code>#${titleColor}</code> | icon_color: <code>#${iconColor}</code> | text_color: <code>#${textColor}</code> | bg_color: <code>#${bgColor}</code>${
          borderColor ? ` | border_color: <code>#${borderColor}</code>` : ""
        }

        \r[Link de Pré-visualização](${url})

        \r[![](${url})](${url})
      `;
    }

    commentBody += `
      \r${
        Object.values(themeValid).every((value) => value)
          ? THEME_PR_SUCCESS_TEXT
          : THEME_PR_FAIL_TEXT
      }
      \r## Resultados dos testes
      \r${Object.entries(themeValid)
        .map(
          ([key, value]) => `- ${value ? ":heavy_check_mark:" : ":x:"} ${key}`,
        )
        .join("\r")}

      \r${
        Object.values(themeValid).every((value) => value)
          ? "**Resultado:** :heavy_check_mark: Todos os temas são válidos."
          : "**Resultado:** :x: Alguns temas são inválidos.\n\n" + FAIL_TEXT
      }
      
      \r## Detalhes
      \r${previewBody}
    `;

    const dryRun = process.env.DRY_RUN === "true";
    let comment_url = "";
    if (dryRun) {
      info(`DRY_RUN: Corpo do comentário: ${commentBody}`);
    } else {
      comment_url = await upsertComment(
        OCTOKIT,
        PULL_REQUEST_ID,
        REPO,
        OWNER,
        comment?.id,
        commentBody,
      );
    }

    const themesValid = Object.values(themeValid).every((value) => value);
    const reviewEvent = themesValid ? "APPROVE" : "REQUEST_CHANGES";
    const reviewReason = themesValid
      ? undefined
      : INVALID_REVIEW_COMMENT(comment_url);

    if (dryRun) {
      info(`DRY_RUN: Estado da revisão: ${reviewEvent}`);
      info(`DRY_RUN: Motivo da revisão: ${reviewReason}`);
    } else {
      await addReview(
        OCTOKIT,
        PULL_REQUEST_ID,
        OWNER,
        REPO,
        reviewEvent,
        reviewReason,
      );
      await addRemoveLabel(
        OCTOKIT,
        PULL_REQUEST_ID,
        OWNER,
        REPO,
        "invalid",
        !themesValid,
      );
    }
  } catch (error: any) {
    if (process.env.DRY_RUN === "true") {
      info(`DRY_RUN: Estado da revisão: REQUEST_CHANGES`);
      info(`DRY_RUN: Motivo da revisão: ${error.message}`);
    } else {
      try {
        await addReview(
          OCTOKIT,
          PULL_REQUEST_ID,
          OWNER,
          REPO,
          "REQUEST_CHANGES",
          "**Algo deu errado na ação de pré-visualização de tema:** `" +
            error.message +
            "`",
        );
        await addRemoveLabel(
          OCTOKIT,
          PULL_REQUEST_ID,
          OWNER,
          REPO,
          "invalid",
          true,
        );
      } catch (e) {
        void e;
      }
    }
    setFailed(error.message);
  }
};

run();
