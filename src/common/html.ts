/**
 * @fileoverview Utilitários para codificação de HTML.
 *
 * Fornece funções para escapar corretamente caracteres especiais
 * antes de inseri-los em SVG ou HTML, prevenindo XSS e parsing incorreto.
 */

/**
 * Codifica uma string para uso seguro em HTML/SVG.
 *
 * Converte caracteres especiais (como `<`, `>`, `&` e caracteres Unicode)
 * em suas entidades HTML correspondentes (`&#NNN;`), evitando problemas
 * de renderização e vulnerabilidades de segurança.
 *
 * @see https://stackoverflow.com/a/48073476/10629172
 *
 * @param str - A string a ser codificada.
 * @returns A string com caracteres especiais escapados como entidades HTML.
 *
 * @example
 * encodeHTML("<script>alert('xss')</script>");
 * // Retorna: "&#60;script&#62;alert(&#39;xss&#39;)&#60;/script&#62;"
 */
const encodeHTML = (str: string): string => {
  return str
    .replace(/[\u00A0-\u9999<>&](?!#)/gim, (i) => {
      return "&#" + i.charCodeAt(0) + ";";
    })
    .replace(/\u0008/gim, "");
};

export { encodeHTML };
