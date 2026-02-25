/**
 * @fileoverview Classe base para todos os cards SVG do GitHub README Stats.
 *
 * A classe `Card` é responsável por renderizar a estrutura SVG base de
 * qualquer card: bordas, título, gradientes, fontes, animações e acessibilidade.
 * Todos os cards específicos (stats, top-langs, repo, gist, wakatime) herdam
 * ou instanciam esta classe para gerar o SVG final.
 */

import { encodeHTML } from "./html.js";
import { flexLayout } from "./render.js";
import { BRICOLAGE_GROTESQUE_BASE64 } from "./fonts.js";

/**
 * Opções de cores para o card SVG.
 */
type CoresCard = {
  /** Cor do título. */
  titleColor?: string;
  /** Cor do texto. */
  textColor?: string;
  /** Cor dos ícones. */
  iconColor?: string;
  /** Cor de fundo (pode ser um array para gradiente). */
  bgColor?: string | string[];
  /** Cor da borda. */
  borderColor?: string;
  /** Cor do anel de rank. */
  ringColor?: string;
  /** Família de fontes personalizada. */
  font_family?: string;
};

/**
 * Parâmetros do construtor da classe `Card`.
 */
type ParamsCard = {
  /** Largura do card em pixels (padrão: 100). */
  width?: number;
  /** Altura do card em pixels (padrão: 100). */
  height?: number;
  /** Raio das bordas arredondadas do card (padrão: 4.5). */
  border_radius?: number;
  /** Título personalizado do card (sobrescreve o título padrão). */
  customTitle?: string;
  /** Título padrão do card (padrão: ""). */
  defaultTitle?: string;
  /** Ícone SVG de prefixo do título. */
  titlePrefixIcon?: string;
  /** Objeto de cores do card. */
  colors?: CoresCard;
};

/**
 * Classe base para renderização dos cards SVG do GitHub README Stats.
 *
 * Responsável por:
 * - Estrutura SVG (viewport, bordas arredondadas)
 * - Gradientes de background
 * - Título com ícone de prefixo opcional
 * - CSS de animações (fadeIn, scaleIn)
 * - Font-face para fonte Bricolage Grotesque
 * - Labels de acessibilidade (aria-labelledby, title, desc)
 *
 * @example
 * const card = new Card({
 *   width: 450,
 *   height: 200,
 *   customTitle: "Minhas Estatísticas",
 *   colors: { titleColor: "#2f80ed", bgColor: "#1a1b27" }
 * });
 * card.setCSS(cssStyles);
 * return card.render(bodyContent);
 */
class Card {
  /** Largura do card em pixels. */
  width: number;
  /** Altura do card em pixels. */
  height: number;
  /** Se `true`, a borda do card será ocultada. */
  hideBorder: boolean;
  /** Se `true`, o título do card será ocultado. */
  hideTitle: boolean;
  /** Raio das bordas arredondadas. */
  border_radius: number;
  /** Cores do card. */
  colors: CoresCard;
  /** Título renderizado (codificado para HTML). */
  title: string;
  /** CSS personalizado injetado no card. */
  css: string;
  /** Padding horizontal interno do card. */
  paddingX: number;
  /** Padding vertical interno do card. */
  paddingY: number;
  /** Ícone de prefixo do título (opcional). */
  titlePrefixIcon?: string;
  /** Se `true`, as animações CSS estão habilitadas. */
  animations: boolean;
  /** Título para acessibilidade (aria). */
  a11yTitle: string;
  /** Descrição para acessibilidade (aria). */
  a11yDesc: string;
  /** Família de fontes do card. */
  font_family: string;

  /**
   * Cria uma nova instância do card SVG.
   *
   * @param params - Parâmetros de configuração do card.
   */
  constructor({
    width = 100,
    height = 100,
    border_radius = 4.5,
    colors = {},
    customTitle,
    defaultTitle = "",
    titlePrefixIcon,
  }: ParamsCard) {
    this.width = width;
    this.height = height;

    this.hideBorder = false;
    this.hideTitle = false;

    this.border_radius = border_radius;

    // Cores do tema com os overrides e padrões corretos
    this.colors = colors;
    this.title =
      customTitle === undefined
        ? encodeHTML(defaultTitle)
        : encodeHTML(customTitle);

    this.css = "";

    this.paddingX = 25;
    this.paddingY = 35;
    this.titlePrefixIcon = titlePrefixIcon;
    this.animations = true;
    this.a11yTitle = "";
    this.a11yDesc = "";

    this.font_family = colors.font_family || "'Segoe UI', Ubuntu, Sans-Serif";
  }

  /**
   * Desativa todas as animações CSS do card.
   * Útil para capturas de tela e ambientes sem suporte a animações.
   */
  disableAnimations(): void {
    this.animations = false;
  }

  /**
   * Define os labels de acessibilidade do card SVG (title e desc do aria).
   *
   * @param props - Objeto com título e descrição de acessibilidade.
   * @param props.title - Título acessível do card (lido por leitores de tela).
   * @param props.desc - Descrição acessível do card (lida por leitores de tela).
   */
  setAccessibilityLabel({
    title,
    desc,
  }: {
    title: string;
    desc: string;
  }): void {
    this.a11yTitle = title;
    this.a11yDesc = desc;
  }

  /**
   * Define o CSS personalizado do card.
   *
   * @param value - String CSS a ser injetada no `<style>` do card.
   */
  setCSS(value: string): void {
    this.css = value;
  }

  /**
   * Define se a borda do card deve ser ocultada.
   *
   * @param value - `true` para ocultar a borda.
   */
  setHideBorder(value: boolean): void {
    this.hideBorder = value;
  }

  /**
   * Define se o título do card deve ser ocultado.
   * Quando ocultado, reduz a altura do card em 30px.
   *
   * @param value - `true` para ocultar o título.
   */
  setHideTitle(value: boolean): void {
    this.hideTitle = value;
    if (value) {
      this.height -= 30;
    }
  }

  /**
   * Define o texto do título do card.
   *
   * @param text - O novo título a ser exibido.
   */
  setTitle(text: string): void {
    this.title = text;
  }

  /**
   * Renderiza o título do card como SVG.
   *
   * Se `titlePrefixIcon` estiver definido, renderiza um ícone SVG antes do texto.
   * O layout é gerenciado pelo utilitário `flexLayout`.
   *
   * @returns String SVG do título do card.
   */
  renderTitle(): string {
    const titleText = `
      <text
        x="0"
        y="0"
        class="header"
        data-testid="header"
      >${this.title}</text>
    `;

    const prefixIcon = `
      <svg
        class="icon"
        x="0"
        y="-13"
        viewBox="0 0 16 16"
        version="1.1"
        width="16"
        height="16"
      >
        ${this.titlePrefixIcon}
      </svg>
    `;
    return `
      <g
        data-testid="card-title"
        transform="translate(${this.paddingX}, ${this.paddingY})"
      >
        ${flexLayout({
          items: [this.titlePrefixIcon ? prefixIcon : "", titleText],
          gap: 25,
        }).join("")}
      </g>
    `;
  }

  /**
   * Renderiza o gradiente de fundo do card (quando `bgColor` é um array).
   *
   * @returns String SVG do gradiente linear, ou string vazia se não for gradiente.
   */
  renderGradient(): string {
    if (typeof this.colors.bgColor !== "object") {
      return "";
    }

    const gradients = this.colors.bgColor.slice(1);
    return typeof this.colors.bgColor === "object"
      ? `
        <defs>
          <linearGradient
            id="gradient"
            gradientTransform="rotate(${this.colors.bgColor[0]})"
            gradientUnits="userSpaceOnUse"
          >
            ${gradients.map((grad, index) => {
              let offset = (index * 100) / (gradients.length - 1);
              return `<stop offset="${offset}%" stop-color="#${grad}" />`;
            })}
          </linearGradient>
        </defs>
        `
      : "";
  }

  /**
   * Retorna o CSS de animações do card.
   *
   * Inclui as animações `scaleInAnimation` (para o círculo de rank)
   * e `fadeInAnimation` (para os itens de estatística).
   *
   * @returns String CSS com as keyframes de animação.
   */
  getAnimations = (): string => {
    return `
      /* Animações */
      @keyframes scaleInAnimation {
        from {
          transform: translate(-5px, 5px) scale(0);
        }
        to {
          transform: translate(-5px, 5px) scale(1);
        }
      }
      @keyframes fadeInAnimation {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `;
  };

  /**
   * Retorna o CSS `@font-face` para importar a fonte Bricolage Grotesque embutida.
   *
   * A fonte é importada como Base64 embutida diretamente no SVG para garantir
   * a renderização correta no GitHub (que bloqueia requisições externas de fontes).
   *
   * @returns String CSS com o `@font-face`, ou string vazia se a fonte não for Bricolage Grotesque.
   */
  renderFontFace(): string {
    if (this.font_family.includes("Bricolage Grotesque")) {
      return `
        @font-face {
          font-family: 'Bricolage Grotesque';
          src: url(data:font/woff2;base64,${BRICOLAGE_GROTESQUE_BASE64}) format('woff2');
          font-weight: 200 800;
          font-style: normal;
          font-display: swap;
        }
      `;
    }
    return "";
  }

  /**
   * Renderiza o card SVG completo com o corpo fornecido.
   *
   * Compila todos os elementos: viewport SVG, acessibilidade, estilos,
   * gradiente, borda retangular, título e corpo principal.
   *
   * @param body - O conteúdo SVG interno do card (gerado pelo card específico).
   * @returns String SVG completa e pronta para exibição no GitHub README.
   */
  render(body: string): string {
    return `
      <svg
        width="${this.width}"
        height="${this.height}"
        viewBox="0 0 ${this.width} ${this.height}"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby="descId"
      >
        <title id="titleId">${this.a11yTitle}</title>
        <desc id="descId">${this.a11yDesc}</desc>
        <style>
          ${this.renderFontFace()}
          .header {
            font: 600 18px "${this.font_family}";
            fill: ${this.colors.titleColor};
            animation: fadeInAnimation 0.8s ease-in-out forwards;
          }
          @supports(-moz-appearance: auto) {
            /* Seletor detecta Firefox */
            .header { font-size: 15.5px; }
          }
          ${this.css}

          ${process.env.NODE_ENV === "test" ? "" : this.getAnimations()}
          ${
            this.animations === false
              ? `* { animation-duration: 0s !important; animation-delay: 0s !important; }`
              : ""
          }
        </style>

        ${this.renderGradient()}

        <rect
          data-testid="card-bg"
          x="0.5"
          y="0.5"
          rx="${this.border_radius}"
          height="99%"
          stroke="${this.colors.borderColor}"
          width="${this.width - 1}"
          fill="${
            typeof this.colors.bgColor === "object"
              ? "url(#gradient)"
              : this.colors.bgColor
          }"
          stroke-opacity="${this.hideBorder ? 0 : 1}"
        />

        ${this.hideTitle ? "" : this.renderTitle()}

        <g
          data-testid="main-card-body"
          transform="translate(0, ${
            this.hideTitle ? this.paddingX : this.paddingY + 20
          })"
        >
          ${body}
        </g>
      </svg>
    `;
  }
}

export { Card };
export default Card;
