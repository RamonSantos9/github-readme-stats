/**
 * @fileoverview Funções de renderização SVG dos cards.
 *
 * Fornece utilitários para criar elementos SVG usados nos cards:
 * layouts flex, barras de progresso, nós de ícones e mensagens de erro.
 */

import { SECONDARY_ERROR_MESSAGES, TRY_AGAIN_LATER } from "./error.js";
import { getCardColors } from "./color.js";
import { encodeHTML } from "./html.js";
import { clampValue } from "./ops.js";
import { BRICOLAGE_GROTESQUE_BASE64 } from "./fonts.js";

/**
 * Parâmetros para a função `flexLayout`.
 */
type ParamsFlexLayout = {
  /** Array de strings SVG para posicionar. */
  items: string[];
  /** Espaçamento entre os itens em pixels. */
  gap: number;
  /** Direção do layout: "column" (vertical) ou "row" (horizontal). Padrão: "row". */
  direction?: "column" | "row";
  /** Tamanhos individuais de cada item em pixels. */
  sizes?: number[];
};

/**
 * Utilitário de layout automático que posiciona elementos SVG em linha ou coluna.
 *
 * Semelhante ao `flexbox` do CSS, mas para SVG. Calcula a posição de cada item
 * com base no tamanho dos anteriores mais o espaçamento (gap).
 *
 * @param props - Parâmetros de layout.
 * @returns Array de elementos SVG `<g>` posicionados corretamente.
 *
 * @example
 * // Layout horizontal de ícones
 * flexLayout({ items: [iconSvg, textSvg], gap: 20 }).join("");
 *
 * // Layout vertical de estatísticas
 * flexLayout({ items: statItems, gap: 25, direction: "column" }).join("");
 */
const flexLayout = ({
  items,
  gap,
  direction,
  sizes = [],
}: ParamsFlexLayout): string[] => {
  let lastSize = 0;
  return items.filter(Boolean).map((item, i) => {
    const size = sizes[i] || 0;
    let transform = `translate(${lastSize}, 0)`;
    if (direction === "column") {
      transform = `translate(0, ${lastSize})`;
    }
    lastSize += size + gap;
    return `<g transform="${transform}">${item}</g>`;
  });
};

/**
 * Cria um nó SVG para exibir a linguagem de programação principal de um repositório/gist.
 *
 * @param nomeLinguagem - Nome da linguagem de programação.
 * @param corLinguagem - Cor hexadecimal da linguagem.
 * @returns String SVG com círculo colorido e nome da linguagem.
 *
 * @example
 * createLanguageNode("TypeScript", "#3178c6");
 */
const createLanguageNode = (
  nomeLinguagem: string,
  corLinguagem: string,
): string => {
  return `
    <g data-testid="primary-lang">
      <circle data-testid="lang-color" cx="0" cy="-5" r="6" fill="${corLinguagem}" />
      <text data-testid="lang-name" class="gray" x="15">${nomeLinguagem}</text>
    </g>
    `;
};

/**
 * Parâmetros para a função `createProgressNode`.
 */
type ParamsCreateProgressNode = {
  /** Posição X da barra de progresso. */
  x: number;
  /** Posição Y da barra de progresso. */
  y: number;
  /** Largura total da barra de progresso em pixels. */
  width: number;
  /** Cor da barra de progresso preenchida. */
  color: string;
  /** Valor de progresso em percentual (0-100). */
  progress: number;
  /** Cor de fundo da barra de progresso. */
  progressBarBackgroundColor: string;
  /** Atraso em ms antes da animação iniciar. */
  delay: number;
};

/**
 * Cria um nó SVG de barra de progresso animada.
 *
 * A barra representa visualmente o percentual de uso de uma linguagem.
 * O progresso é limitado ao intervalo [2, 100] para garantir visibilidade mínima.
 *
 * @param params - Parâmetros da barra de progresso.
 * @returns String SVG da barra de progresso.
 *
 * @example
 * createProgressNode({ x: 0, y: 0, width: 220, color: "#3178c6", progress: 45.5, progressBarBackgroundColor: "#e1e4e8", delay: 300 });
 */
const createProgressNode = ({
  x,
  y,
  width,
  color,
  progress,
  progressBarBackgroundColor,
  delay,
}: ParamsCreateProgressNode): string => {
  const progressPercentage = clampValue(progress, 2, 100);

  return `
    <svg width="${width}" x="${x}" y="${y}">
      <rect rx="5" ry="5" x="0" y="0" width="${width}" height="8" fill="${progressBarBackgroundColor}"></rect>
      <svg data-testid="lang-progress" width="${progressPercentage}%">
        <rect
            height="8"
            fill="${color}"
            rx="5" ry="5" x="0" y="0"
            class="lang-progress"
            style="animation-delay: ${delay}ms;"
        />
      </svg>
    </svg>
  `;
};

/**
 * Cria um ícone com label para exibir estatísticas como forks, estrelas, etc.
 *
 * Retorna string vazia se o label for um número menor ou igual a zero.
 *
 * @param icon - O SVG do ícone.
 * @param label - O texto ou número a ser exibido ao lado do ícone.
 * @param testid - Atributo data-testid para os testes automatizados.
 * @param iconSize - Tamanho do ícone em pixels.
 * @returns String SVG do ícone com label, ou string vazia.
 */
const iconWithLabel = (
  icon: string,
  label: number | string,
  testid: string,
  iconSize: number,
): string => {
  if (typeof label === "number" && label <= 0) {
    return "";
  }
  const iconSvg = `
      <svg
        class="icon"
        y="-12"
        viewBox="0 0 16 16"
        version="1.1"
        width="${iconSize}"
        height="${iconSize}"
      >
        ${icon}
      </svg>
    `;
  const text = `<text data-testid="${testid}" class="gray">${label}</text>`;
  return flexLayout({ items: [iconSvg, text], gap: 20 }).join("");
};

/** Largura fixa do card de erro em pixels. */
const ERROR_CARD_LENGTH = 576.5;

/**
 * Mensagens de erro de upstream que não devem incluir o link do repositório.
 */
const UPSTREAM_API_ERRORS = [
  TRY_AGAIN_LATER,
  SECONDARY_ERROR_MESSAGES.MAX_RETRY,
];

/**
 * Parâmetros para `renderError`.
 */
type ParamsRenderError = {
  /** Mensagem principal de erro. */
  message: string;
  /** Mensagem secundária de orientação (opcional). */
  secondaryMessage?: string;
  /** Opções de renderização do card de erro. */
  renderOptions?: {
    title_color?: string;
    text_color?: string;
    bg_color?: string;
    border_color?: string;
    theme?: Parameters<typeof getCardColors>[0]["theme"];
    show_repo_link?: boolean;
    font_family?: string;
  };
};

/**
 * Renderiza um card SVG de erro para exibição no GitHub README.
 *
 * Exibe uma mensagem de erro principal e uma mensagem secundária de orientação.
 * Inclui um link para o repositório do projeto quando apropriado.
 *
 * @param args - Parâmetros do card de erro.
 * @returns String SVG do card de erro pronto para exibição.
 *
 * @example
 * renderError({ message: "Usuário não encontrado", secondaryMessage: "Verifique o nome de usuário" });
 */
const renderError = ({
  message,
  secondaryMessage = "",
  renderOptions = {},
}: ParamsRenderError): string => {
  const {
    title_color,
    text_color,
    bg_color,
    border_color,
    theme = "default",
    show_repo_link = true,
    font_family = "'Segoe UI', Ubuntu, Sans-Serif",
  } = renderOptions;

  const { titleColor, textColor, bgColor, borderColor } = getCardColors({
    title_color,
    text_color,
    icon_color: "",
    bg_color,
    border_color,
    ring_color: "",
    theme,
  });

  const isBricolage = font_family.includes("Bricolage Grotesque");
  const fontFace = isBricolage
    ? `
        @font-face {
          font-family: 'Bricolage Grotesque';
          src: url(data:font/woff2;base64,${BRICOLAGE_GROTESQUE_BASE64}) format('woff2');
          font-weight: 200 800;
          font-style: normal;
          font-display: swap;
        }
      `
    : "";

  const titleText = "Algo deu errado!";
  const repoLinkText =
    UPSTREAM_API_ERRORS.includes(secondaryMessage) || !show_repo_link
      ? ""
      : "Registre um problema em:";
  const repoUrlText =
    UPSTREAM_API_ERRORS.includes(secondaryMessage) || !show_repo_link
      ? ""
      : "github.com/ramonsantos9/github-readme-stats/issues";

  return `
    <svg width="${ERROR_CARD_LENGTH}" height="180" viewBox="0 0 ${ERROR_CARD_LENGTH} 180" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="descId">
    <title id="titleId">Erro</title>
    <desc id="descId">${encodeHTML(message)}</desc>
    <style>
      ${fontFace}
      .text { font: 600 16px "${font_family}"; fill: ${titleColor} }
      .small { font: 600 12px "${font_family}"; fill: ${textColor} }
      .gray { fill: #858585 }
    </style>
    <rect x="0.5" y="0.5" width="${
      ERROR_CARD_LENGTH - 1
    }" height="99%" rx="4.5" fill="${bgColor}" stroke="${borderColor}"/>
    <text x="25" y="40" class="text">
      <tspan x="25" dy="0">${titleText}</tspan>
      ${
        repoLinkText
          ? `<tspan x="25" dy="30" class="small">${repoLinkText}</tspan>
             <tspan x="25" dy="22" class="small" fill="${titleColor}">${repoUrlText}</tspan>`
          : ""
      }
    </text>
    <text data-testid="message" x="25" y="125" class="text small">
      <tspan x="25" dy="0">${encodeHTML(message)}</tspan>
      <tspan x="25" dy="25" class="gray">${secondaryMessage}</tspan>
    </text>
    </svg>
  `;
};

/**
 * Calcula a largura de texto em pixels usando métricas de fonte.
 *
 * Usa uma tabela pré-calculada de larguras de caracteres para a fonte
 * 'Segoe UI' em tamanho 10px, evitando a necessidade de renderização.
 *
 * @see https://stackoverflow.com/a/48172630/10629172
 * @param str - String a ser medida.
 * @param fontSize - Tamanho da fonte em pixels (padrão: 10).
 * @returns Largura estimada da string em pixels.
 *
 * @example
 * measureText("GitHub Stats");  // → ~68.5
 */
const measureText = (str: string, fontSize: number = 10): number => {
  // prettier-ignore
  const widths = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0.2796875, 0.2765625,
    0.3546875, 0.5546875, 0.5546875, 0.8890625, 0.665625, 0.190625,
    0.3328125, 0.3328125, 0.3890625, 0.5828125, 0.2765625, 0.3328125,
    0.2765625, 0.3015625, 0.5546875, 0.5546875, 0.5546875, 0.5546875,
    0.5546875, 0.5546875, 0.5546875, 0.5546875, 0.5546875, 0.5546875,
    0.2765625, 0.2765625, 0.584375, 0.5828125, 0.584375, 0.5546875,
    1.0140625, 0.665625, 0.665625, 0.721875, 0.721875, 0.665625,
    0.609375, 0.7765625, 0.721875, 0.2765625, 0.5, 0.665625,
    0.5546875, 0.8328125, 0.721875, 0.7765625, 0.665625, 0.7765625,
    0.721875, 0.665625, 0.609375, 0.721875, 0.665625, 0.94375,
    0.665625, 0.665625, 0.609375, 0.2765625, 0.3546875, 0.2765625,
    0.4765625, 0.5546875, 0.3328125, 0.5546875, 0.5546875, 0.5,
    0.5546875, 0.5546875, 0.2765625, 0.5546875, 0.5546875, 0.221875,
    0.240625, 0.5, 0.221875, 0.8328125, 0.5546875, 0.5546875,
    0.5546875, 0.5546875, 0.3328125, 0.5, 0.2765625, 0.5546875,
    0.5, 0.721875, 0.5, 0.5, 0.5, 0.3546875, 0.259375, 0.353125, 0.5890625,
  ];

  const avg = 0.5279276315789471;
  return (
    str
      .split("")
      .map((c) =>
        c.charCodeAt(0) < widths.length ? widths[c.charCodeAt(0)] : avg,
      )
      .reduce((cur, acc) => acc + cur) * fontSize
  );
};

export {
  ERROR_CARD_LENGTH,
  renderError,
  createLanguageNode,
  createProgressNode,
  iconWithLabel,
  flexLayout,
  measureText,
};
