/**
 * @fileoverview Script para gerar automaticamente a documentação de temas em themes/README.md.
 */

import fs from "fs";
import { themes } from "../themes/index.js";

const TARGET_FILE = "./themes/README.md";
const REPO_CARD_LINKS_FLAG = "<!-- REPO_CARD_LINKS -->";
const STAT_CARD_LINKS_FLAG = "<!-- STATS_CARD_LINKS -->";

const STAT_CARD_TABLE_FLAG = "<!-- STATS_CARD_TABLE -->";
const REPO_CARD_TABLE_FLAG = "<!-- REPO_CARD_TABLE -->";

const THEME_TEMPLATE = `## Temas Disponíveis

<!-- NÃO EDITE ESTE ARQUIVO DIRETAMENTE -->

Com temas integrados, você pode personalizar a aparência do card sem precisar fazer personalizações manuais.

Use o parâmetro \`?theme=NOME_DO_TEMA\` como no exemplo:

\`\`\`md
![GitHub Stats do Anurag](https://github-readme-stats.vercel.app/api?username=ramonsantos9&theme=dark&show_icons=true)
\`\`\`

## Estatísticas (Stats)

> Estes temas funcionam com todos os nossos cinco cards: Stats Card, Repo Card, Gist Card, Top Languages Card e WakaTime Card.

| | | |
| :--: | :--: | :--: |
${STAT_CARD_TABLE_FLAG}

## Card de Repositório (Repo Card)

> Estes temas funcionam com todos os nossos cinco cards: Stats Card, Repo Card, Gist Card, Top Languages Card e WakaTime Card.

| | | |
| :--: | :--: | :--: |
${REPO_CARD_TABLE_FLAG}

${STAT_CARD_LINKS_FLAG}

${REPO_CARD_LINKS_FLAG}
`;

/**
 * Cria um link markdown para o card de repositório de um tema específico.
 * @param theme - Nome do tema.
 */
const createRepoMdLink = (theme: string): string => {
  return `\n[${theme}_repo]: https://github-readme-stats.vercel.app/api/pin/?username=ramonsantos9&repo=github-readme-stats&cache_seconds=86400&theme=${theme}`;
};

/**
 * Cria um link markdown para o card de estatísticas de um tema específico.
 * @param theme - Nome do tema.
 */
const createStatMdLink = (theme: string): string => {
  return `\n[${theme}]: https://github-readme-stats.vercel.app/api?username=ramonsantos9&show_icons=true&hide=contribs,prs&cache_seconds=86400&theme=${theme}`;
};

/**
 * Gera os links markdown para todos os temas.
 * @param fn - Função geradora de links.
 */
const generateLinks = (fn: (theme: string) => string): string => {
  return Object.keys(themes)
    .map((name) => fn(name))
    .join("");
};

/**
 * Cria um item de tabela markdown para um tema.
 */
const createTableItem = ({
  link,
  label,
  isRepoCard,
}: {
  link: string;
  label: string;
  isRepoCard: boolean;
}): string => {
  if (!link || !label) {
    return "";
  }
  return `\`${label}\` ![${link}][${link}${isRepoCard ? "_repo" : ""}]`;
};

/**
 * Gera a tabela markdown de demonstração dos temas.
 */
const generateTable = ({ isRepoCard }: { isRepoCard: boolean }): string => {
  const rows: string[] = [];
  const themesFiltered = Object.keys(themes).filter(
    (name) => name !== (isRepoCard ? "default" : "default_repocard"),
  );

  for (let i = 0; i < themesFiltered.length; i += 3) {
    const one = themesFiltered[i];
    const two = themesFiltered[i + 1];
    const three = themesFiltered[i + 2];

    const tableItem1 = createTableItem({ link: one, label: one, isRepoCard });
    const tableItem2 = createTableItem({ link: two, label: two, isRepoCard });
    const tableItem3 = createTableItem({
      link: three,
      label: three,
      isRepoCard,
    });

    rows.push(`| ${tableItem1} | ${tableItem2} | ${tableItem3} |`);
  }

  return rows.join("\n");
};

/**
 * Monta o conteúdo final do README de temas.
 */
const buildReadme = (): string => {
  return THEME_TEMPLATE.split("\n")
    .map((line) => {
      if (line.includes(REPO_CARD_LINKS_FLAG)) {
        return generateLinks(createRepoMdLink);
      }
      if (line.includes(STAT_CARD_LINKS_FLAG)) {
        return generateLinks(createStatMdLink);
      }
      if (line.includes(REPO_CARD_TABLE_FLAG)) {
        return generateTable({ isRepoCard: true });
      }
      if (line.includes(STAT_CARD_TABLE_FLAG)) {
        return generateTable({ isRepoCard: false });
      }
      return line;
    })
    .join("\n");
};

// Escreve o arquivo final
fs.writeFileSync(TARGET_FILE, buildReadme());
console.log(`Documentação de temas gerada em: ${TARGET_FILE}`);
