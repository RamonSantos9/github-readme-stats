/**
 * @fileoverview Sistema de internacionalização (i18n) do projeto.
 *
 * Provê a classe `I18n` responsável por traduzir strings da interface
 * para o idioma selecionado pelo usuário via parâmetro de query `locale`.
 */

/** Idioma de fallback quando nenhum locale é especificado ou o locale não tem tradução. */
const LOCALE_PADRAO = "en";

/**
 * Tipo que representa o mapa de traduções.
 * Cada chave é o identificador da string, e o valor é um objeto
 * mapeando códigos de locale para a string traduzida.
 */
type MapaDeTraducoes = Record<string, Record<string, string>>;

/**
 * Classe de internacionalização (i18n) para tradução de textos do card.
 *
 * Permite que os cards sejam exibidos no idioma escolhido pelo usuário,
 * com suporte a mais de 40 idiomas via o arquivo `translations.ts`.
 *
 * @example
 * const i18n = new I18n({
 *   locale: "pt-br",
 *   translations: { "statcard.title": { "en": "Stats", "pt-br": "Estatísticas" } }
 * });
 * i18n.t("statcard.title"); // → "Estatísticas"
 */
class I18n {
  /** Código do locale ativo (ex.: "pt-br", "en", "fr"). */
  private locale: string;

  /** Mapa de todas as traduções disponíveis. */
  private translations: MapaDeTraducoes;

  /**
   * Cria uma nova instância do sistema de tradução.
   *
   * @param options - Opções de configuração.
   * @param options.locale - Código do locale desejado (ex.: "pt-br"). Padrão: "en".
   * @param options.translations - Mapa de traduções com todas as strings disponíveis.
   */
  constructor({
    locale,
    translations,
  }: {
    locale?: string;
    translations: MapaDeTraducoes;
  }) {
    this.locale = locale || LOCALE_PADRAO;
    this.translations = translations;
  }

  /**
   * Retorna a string traduzida para o locale atual.
   *
   * @param str - Identificador da string de tradução (ex.: "statcard.title").
   * @returns A string traduzida para o locale atual.
   * @throws {Error} Se a string de tradução não existir no mapa.
   * @throws {Error} Se a tradução não existir para o locale atual.
   *
   * @example
   * i18n.t("statcard.commits"); // → "Total de Commits" (em pt-br)
   */
  t(str: string): string {
    if (!this.translations[str]) {
      throw new Error(`String de tradução "${str}" não encontrada`);
    }

    if (!this.translations[str][this.locale]) {
      throw new Error(
        `Tradução para "${str}" não encontrada para o locale "${this.locale}"`,
      );
    }

    return this.translations[str][this.locale];
  }
}

export { I18n };
export default I18n;
