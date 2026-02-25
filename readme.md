# Estatísticas do GitHub para Readme

Este projeto permite gerar cartões de estatísticas dinâmicas para o seu perfil do GitHub.

## 🚀 Como usar localmente

1. **Configuração do Token:**
   - Crie um arquivo `.env` baseado no `.env.example`.
   - Adicione seu personal access token (PAT) do GitHub na variável `PAT_1`.

2. **Instalação:**

   ```bash
   npm install
   ```

3. **Execução:**

   ```bash
   npm run dev
   ```

4. **Playground:**
   - Acesse [http://localhost:9000/playground](http://localhost:9000/playground) para visualizar todos os cards em desenvolvimento em uma única interface amigável.

## 🎨 Customização das Cores

Para usar a cor personalizada (ex: laranja vibrante `#FB8C00`), adicione os parâmetros à URL:

```md
![Estatísticas do GitHub](http://localhost:9000/api?username=SEU_USUARIO&locale=pt-br&show_icons=true&title_color=FB8C00&icon_color=FB8C00&ring_color=FB8C00)
```

## Exemplo de Uso (Perfil do Ramon)

Copie e cole este padrão no seu README para obter o mesmo visual premium:

```markdown
| ![Estatísticas do GitHub de Ramon Santos](https://staticas-readme.vercel.app/api?username=ramonsantos9&font_family=Bricolage+Grotesque&locale=pt-br&title_color=FB8C00&icon_color=FB8C00&show_icons=true&v=2)                                                       | [![RamonSantos9](https://streak-stats.demolab.com?user=ramonsantos9&theme=default&hide_border=true&border_radius=0&locale=pt_BR&date_format=n%2Fj%5B%2FY%5D)](https://git.io/streak-stats)                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![Principais Langs](https://staticas-readme.vercel.app/api/top-langs?username=ramonsantos9&font_family=Bricolage+Grotesque&locale=pt-br&layout=donut&langs_count=5&title_color=FB8C00&icon_color=FB8C00&v=2)](https://github.com/ramonsantos9/github-readme-stats) | [![WakaTime](https://staticas-readme.vercel.app/api/wakatime?username=ramonsantos9&font_family=Bricolage+Grotesque&locale=pt-br&title_color=FB8C00&icon_color=FB8C00&v=2)](https://github.com/ramonsantos9/github-readme-stats) |
```

### ✨ Destaques deste padrão:

- **Fonte Premium:** `font_family=Bricolage+Grotesque`
- **Cores Customizadas:** `title_color=FB8C00` (Laranja Vibrante)
- **Internacionalização:** `locale=pt-br`
