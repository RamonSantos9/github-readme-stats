<div align="center">
  <img src="./banner.png" alt="Ramon Santos - GitHub Stats Banner" width="100%" />

  <h1>GitHub Readme Estatísticas</h1>

  <p>Gere cartões de estatísticas dinâmicas e visualmente incríveis para elevar o nível do seu perfil do GitHub.</p>

  <p>
    <a href="#-sobre-o-projeto">Sobre</a> •
    <a href="#-exemplos-de-cartões">Exemplos</a> •
    <a href="#-como-usar">Como Usar</a> •
    <a href="#-executando-localmente">Localmente</a> •
    <a href="#-customização">Customização</a>
  </p>
</div>

## Sobre o Projeto

Este projeto é uma ferramenta poderosa para gerar **cards de estatísticas dinâmicos** que podem ser fixados diretamente no README do seu perfil do GitHub. Com ele, você pode exibir de forma elegante as suas principais linguagens de programação, estatísticas gerais, ofensivas de commits (streak), horas de código registradas (WakaTime) e a sua stack completa de tecnologias.

O foco desta versão customizada é fornecer um **visual altamente premium**, utilizando fontes modernas (como `Bricolage Grotesque`) e cores personalizadas (como o Laranja Vibrante) para criar uma identidade visual única e marcante.

---

## Exemplos de Cartões

Aqui estão alguns exemplos reais dos cartões que você pode gerar e adicionar ao seu perfil (dados do perfil Ramon Santos).

### 1. Estatísticas Gerais

Mostra um resumo da sua conta: total de estrelas recebidas, commits realizados neste ano, PRs, issues enviadas e contribuições em outros repositórios.

```markdown
[![Estatísticas do GitHub](https://staticas-readme.vercel.app/api?username=ramonsantos9&font_family=Bricolage+Grotesque&locale=pt-br&title_color=FB8C00&icon_color=FB8C00&show_icons=true&v=2)](https://github.com/ramonsantos9)
```

### 2. Ofensiva de Commits (Streak)

Incentiva a consistência mostrando o total de contribuições em dias consecutivos.

```markdown
[![Streak Stats](https://staticas-readme.vercel.app/api/streak?username=ramonsantos9&font_family=Bricolage+Grotesque&locale=pt-br&title_color=FB8C00&icon_color=FB8C00&hide_border=true&v=2)](https://github.com/ramonsantos9)
```

### 3. Principais Linguagens Trabalhadas

Um gráfico atualizado dinamicamente que exibe as linguagens de programação que você mais utiliza em seus repositórios.

```markdown
[![Principais Langs](https://staticas-readme.vercel.app/api/top-langs?username=ramonsantos9&font_family=Bricolage+Grotesque&locale=pt-br&layout=donut&langs_count=5&title_color=FB8C00&icon_color=FB8C00&v=2)](https://github.com/ramonsantos9)
```

### 4. Estatísticas de Código (WakaTime)

Mostra o seu tempo total ou semanal gasto codificando em cada linguagem, puxando os dados diretamente da sua integração com o WakaTime.

```markdown
[![WakaTime](https://staticas-readme.vercel.app/api/wakatime?username=ramonsantos9&font_family=Bricolage+Grotesque&locale=pt-br&title_color=FB8C00&icon_color=FB8C00&v=2)](https://github.com/ramonsantos9)
```

### 5. Cards de Stack (Tecnologias)

Exibe uma grade limpa e responsiva das tecnologias e ferramentas que você usa.

```markdown
[![Stack Card](https://staticas-readme.vercel.app/api/stack?username=ramonsantos9&title_color=FB8C00&icon_color=FB8C00&v=2)](https://github.com/ramonsantos9/github-readme-stats)
```

---

## Como Usar no seu Perfil

Para que esses cartões apareçam no seu próprio perfil do GitHub, basta copiar as URLs dos exemplos acima e **substituir `username=ramonsantos9` pelo seu nome de usuário no GitHub**.

A seguir, basta colar o código Markdown diretamente no seu `README.md` (o repositório com o mesmo nome do seu usuário).

---

## Executando Localmente e Hospedando

Se você quiser hospedar sua própria versão (por exemplo, na Vercel), ou se quiser contribuir/modificar o código localmente:

1. **Configuração do Token:**
   - Faça uma cópia do arquivo `.env.example` e renomeie-o para `.env`.
   - Crie um Personal Access Token (PAT) no GitHub e adicione-o na variável `PAT_1`. _(Nota: O token não precisa de permissões especiais se os repositórios forem públicos)._

2. **Instalação das dependências:**

   ```bash
   npm install
   ```

3. **Iniciando o servidor de desenvolvimento:**

   ```bash
   npm run dev
   ```

4. **Interface do Playground:**
   - Acesse [http://localhost:9000/playground](http://localhost:9000/playground)
   - Lá você encontrará uma interface visual e amigável para customizar as variáveis e pré-visualizar todos os cards.

---

## Customização e Parâmetros

Você pode alterar profundamente a aparência de qualquer cartão simplesmente adicionando ou modificando parâmetros de consulta (query) na URL. Os principais são:

| Parâmetro     | Descrição                                                     | Exemplo                           | Padrão        |
| ------------- | ------------------------------------------------------------- | --------------------------------- | ------------- |
| `theme`       | Aplica um dos temas oficiais do projeto                       | `theme=dark`                      | `default`     |
| `title_color` | Altera a cor dos títulos do card                              | `title_color=FB8C00`              | varia do tema |
| `icon_color`  | Altera a cor dos ícones exibidos                              | `icon_color=FB8C00`               | varia do tema |
| `text_color`  | Altera a cor principal dos textos                             | `text_color=ffffff`               | varia do tema |
| `bg_color`    | Cor de fundo do card                                          | `bg_color=000000`                 | varia do tema |
| `hide_border` | Remove as bordas do cartão                                    | `hide_border=true`                | `false`       |
| `show_icons`  | Ativa a visualização de ícones nas estatísticas               | `show_icons=true`                 | `false`       |
| `font_family` | Usa uma fonte customizada (Precisa estar instalada/suportada) | `font_family=Bricolage+Grotesque` | `Segoe UI`    |
| `locale`      | Idioma de exibição dos textos                                 | `locale=pt-br`                    | `en`          |

> **Nota:** Certifique-se de não usar o símbolo `#` nos códigos hexadecimais das cores diretamente na URL. Utilize apenas os 6 caracteres da cor (ex: `FB8C00`).

---

<div align="center">
  Feito com 🧡 para otimizar os perfis do GitHub.
</div>
