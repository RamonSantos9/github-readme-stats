/**
 * @fileoverview Script para baixar as cores de linguagens do repositório Linguist do GitHub
 * e gerar o arquivo JSON local utilizado nos cards.
 */

import axios from "axios";
import fs from "fs";
import jsYaml from "js-yaml";

const LANGS_FILEPATH = "./src/common/languageColors.json";

/**
 * Recupera as linguagens do arquivo YAML do repositório Linguist do GitHub
 * e as converte para um objeto JSON contendo apenas as cores.
 */
axios
  .get(
    "https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml",
  )
  .then((response) => {
    // Converte o conteúdo YAML para um objeto JavaScript
    const languages = jsYaml.load(response.data) as Record<string, any>;

    const languageColors: Record<string, string> = {};

    // Filtra apenas as cores das linguagens
    Object.keys(languages).forEach((lang) => {
      if (languages[lang].color) {
        languageColors[lang] = languages[lang].color;
      }
    });

    // Salva o resultado no arquivo JSON
    fs.writeFileSync(
      LANGS_FILEPATH,
      JSON.stringify(languageColors, null, "    "),
    );
    console.log(
      `Cores de linguagens geradas com sucesso em: ${LANGS_FILEPATH}`,
    );
  })
  .catch((err) => {
    console.error("Erro ao gerar cores de linguagens:", err.message);
  });
