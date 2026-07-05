# 🎮 Pokédex - Aplicação Web Completa

Uma Pokédex moderna e responsiva construída com **TypeScript**, **Node.js**, **Express** e **Vanilla JavaScript**, consumindo a [PokéAPI](https://pokeapi.co/) para exibir informações detalhadas de todos os Pokémon.

![Status](https://img.shields.io/badge/status-completo-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Node](https://img.shields.io/badge/Node.js-22.x-green)
![Express](https://img.shields.io/badge/Express-5.1.0-red)

---

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Endpoints](#-api-endpoints)
- [Design System](#-design-system)
- [Melhorias Visuais](#-melhorias-visuais)
- [Performance](#-performance)
- [Responsividade](#-responsividade)
- [Créditos](#-créditos)

---

## ✨ Funcionalidades

### 🏠 Página Principal
- **Grid de Pokémon** com cards interativos
- **Paginação** de 20 em 20 Pokémon para performance
- **Seletor de Gerações** (Gen 1-9 + Todas)
- **Busca global** por nome com debounce
- **Filtro por tipo** em drawer animado
- **Ordenação** por nome (A-Z) ou número (#001-#1025)
- **Animação fade-in** escalonado nos cards
- **Barra de status** discreta mostrando progresso

### 🃏 Cards de Pokémon
- **Design duas seções**: topo colorido (tipo) + base branca
- **Hover effect**: zoom 1.05x + sombra suave
- **Sprite oficial** da PokéAPI com drop-shadow
- **Número** em cinza (#666) fonte 12px bold
- **Nome** em Roboto 17px bold
- **Badges de tipo** coloridas e traduzidas (PT-BR)
- **Bordas arredondadas** 16px
- **Shine animation** ao passar o mouse

### 📱 Modal de Detalhes
- **Header colorido** dinâmico (cor do tipo principal)
- **Sprite grande** (160px) com animação de flutuar
- **Nome, número e tipos** no header
- **Botão fechar** (X) branco visível
- **Scroll interno** com scrollbar customizada vermelha
- **Fechar ao clicar fora** ou pressionar Escape

#### Seções do Modal:
1. **Estatísticas Base**
   - 6 barras de progresso (PS, Ataque, Defesa, Atq. Esp., Def. Esp., Velocidade)
   - **Cores dinâmicas**: vermelho (<60), amarelo (60-99), verde (≥100)
   - Valores numéricos ao lado
   - **Total de stats** no final
   - Animação shimmer nas barras

2. **Cadeia Evolutiva**
   - Sprites em linha horizontal com scroll
   - Setas → entre evoluções
   - **Nível de evolução** (ex: "Lv. 16")
   - Nome e número abaixo de cada sprite
   - **Clicável**: abre modal da evolução
   - Highlight no Pokémon atual

3. **Habilidades**
   - Badges com hover effect
   - Nomes em português capitalizado
   - Tooltip ao passar o mouse

4. **Descrição**
   - Texto em inglês da PokéAPI
   - Background sutil com borda lateral azul
   - Justificado para leitura

5. **Altura e Peso**
   - Ícones (📏 ⚖️)
   - Formatados (ex: "0.7 m", "6.9 kg")

### 🎨 Elementos Visuais
- **Seletor de geração** vermelho escuro com borda dourada
- **Pokébola decorativa** semi-transparente no header
- **Scrollbar customizada** vermelha (gradiente)
- **Tooltips** nos botões flutuantes
- **Background estrelado** com animação twinkle
- **Header gradiente** vermelho com pokébolas de fundo

---

## 🛠 Tecnologias

### Backend
| Tecnologia | Versão | Função |
|------------|--------|--------|
| **Node.js** | 22.x | Runtime |
| **TypeScript** | 5.8.3 | Tipagem estática |
| **Express** | 5.1.0 | Servidor web |
| **nodemon** | 3.1.10 | Hot reload |

### Frontend
| Tecnologia | Uso |
|------------|-----|
| **Vanilla JavaScript** | Lógica da UI |
| **CSS3** | Estilização com variáveis |
| **Google Fonts** | Press Start 2P (retro), Roboto (texto) |
| **PokéAPI** | Dados dos Pokémon |

### APIs Externas
- **PokéAPI v2**: https://pokeapi.co/
  - `/pokemon` - Lista básica
  - `/pokemon/{id}` - Detalhes completos
  - `/pokemon-species/{id}` - Descrição e evolução
  - `/type/{type}` - Pokémon por tipo

---

## 📦 Instalação

### Pré-requisitos
- Node.js 22.x ou superior
- npm ou yarn

### Passos

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd Pokedex

# Instale as dependências
npm install

# Build TypeScript
npm run build

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em **http://localhost:3000**

---

## 🚀 Uso

### Scripts Disponíveis

```json
{
  "dev": "nodemon src/server.ts --exec ts-node",
  "build": "tsc",
  "start": "node dist/server.js"
}
```

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor com hot reload |
| `npm run build` | Compila TypeScript para JavaScript |
| `npm start` | Inicia servidor em produção |

### Navegação

1. **Explorar**: Role a página para carregar mais Pokémon (20 por vez)
2. **Filtrar por tipo**: Clique no botão de filtro e selecione um tipo
3. **Buscar**: Clique na lupa e digite o nome do Pokémon
4. **Ordenar**: Alterne entre ordem alfabética e numérica
5. **Ver detalhes**: Clique em qualquer card para abrir o modal
6. **Evolução**: Clique nos Pokémon na cadeia evolutiva para navegar

---

## 📁 Estrutura do Projeto

```
Pokedex/
├── src/
│   └── server.ts              # Servidor Express + API proxy
├── public/
│   ├── index.html             # Estrutura HTML + Modal
│   ├── script.js              # Lógica frontend (700+ linhas)
│   ├── style.css              # Estilos gerais (1800+ linhas)
│   └── stats-evolution.css    # Stats e evolução (400+ linhas)
├── dist/                       # Build compilado
│   └── server.js
├── node_modules/
├── package.json
└── README.md
```

### Detalhes dos Arquivos

#### `src/server.ts` (353 linhas)
- Servidor Express estático
- **Proxy API** para evitar rate limiting:
  - `GET /api/pokemons` - Lista paginada (batch de 5)
  - `GET /api/pokemon/:id` - Detalhes completos + espécie + evolução
  - `GET /api/type/:type` - Pokémon por tipo (máx 20)
  - `GET /api/search` - Busca global com cache
- **Cache em memória** para nomes de Pokémon (1351 entries)
- **Batch loading** de 5 em 5 requisições com delay 200ms

#### `public/script.js` (835 linhas)
- **Gerenciamento de estado**: paginação, geração, filtros
- **Renderização de cards**: createPokemonCard, renderPokemons
- **Modal**: openModal, openModalHelper, openModalFromChain
- **Cadeia evolutiva**: renderEvolutionChain com níveis
- **Filtros**: loadPokemonsByType, setupFloatingActions
- **Busca**: Debounce 300ms + API search
- **Utilitários**: capitalizeFirst, adjustColor (cores dinâmicas)

#### `public/style.css` (1877 linhas)
- **Variáveis CSS**: cores temáticas (pokedex-red, pokemon-yellow)
- **Cards**: hover effects, badges de tipo, animações
- **Header**: seletor, pokébolas decorativas, logo
- **Modal**: header colorido, scroll customizado, seções
- **Responsive**: media queries para mobile/tablet
- **Scrollbar**: vermelha com gradiente
- **Tooltips**: appearing on hover

#### `public/stats-evolution.css` (400+ linhas)
- **Stats bars**: cores dinâmicas, animação shimmer
- **Cadeia evolutiva**: layout horizontal, setas pulsantes
- **Habilidades**: badges com hover
- **Responsivo**: grid adaptativo para mobile

---

## 🔌 API Endpoints

### Backend (Proxy)

| Endpoint | Método | Descrição | Exemplo |
|----------|--------|-----------|---------|
| `/api/pokemons` | GET | Lista paginada | `?limit=20&offset=0` |
| `/api/pokemon/:id` | GET | Detalhes completos | `/api/pokemon/25` |
| `/api/type/:type` | GET | Pokémon por tipo | `/api/type/fire` |
| `/api/search` | GET | Busca global | `?q=pikachu` |

### Fluxo de Dados

1. **Carregamento inicial**: 
   - Frontend → `/api/pokemons?limit=20&offset=0`
   - Backend → PokéAPI (batch de 5)
   - Cache → 1351 nomes para busca

2. **Modal**:
   - Clique no card → `/api/pokemon/:id`
   - Backend busca: dados + espécie + evolução
   - Retorna JSON completo

3. **Filtro por tipo**:
   - Seleciona tipo → `/api/type/fire`
   - PokéAPI retorna todos do tipo
   - Frontend exibe máx 20

4. **Busca**:
   - Digita nome → debounce 300ms
   - `/api/search?q=char`
   - Cache filtra → busca detalhes

---

## 🎨 Design System

### Cores

```css
:root {
  --pokedex-red: #dc0a2d;
  --pokedex-dark-red: #8b0000;
  --pokedex-blue: #2158ff;
  --pokemon-yellow: #ffcb05;
  --pokemon-blue: #3b4cca;
}
```

### Tipos (Cores Oficiais)

| Tipo | Cor Hex | Classe CSS |
|------|---------|------------|
| Fogo | #F08030 | type-fire |
| Água | #6890F0 | type-water |
| Grama | #78C850 | type-grass |
| Elétrico | #F8D030 | type-electric |
| Gelo | #98D8D8 | type-ice |
| Lutador | #C03028 | type-fighting |
| Venenoso | #A040A0 | type-poison |
| Terra | #E0C068 | type-ground |
| Voador | #A890F0 | type-flying |
| Psíquico | #F85888 | type-psychic |
| Inseto | #A8B820 | type-bug |
| Pedra | #B8A038 | type-rock |
| Fantasma | #705890 | type-ghost |
| Dragão | #7038F8 | type-dragon |
| Aço | #B8B8D0 | type-steel |
| Fada | #EE99AC | type-fairy |

### Tipografia

| Elemento | Fonte | Tamanho | Peso |
|----------|-------|---------|------|
| Títulos retro | Press Start 2P | 10-22px | 400 |
| Nomes | Roboto | 17px | 700 |
| Números | Press Start 2P | 12px | 700 |
| Texto | Roboto | 13-14px | 400-600 |

---

## 🖼 Melhorias Visuais

### Cards
- ✅ **Hover**: `scale(1.05)` + `translateY(-6px)` + sombra suave
- ✅ **Transição**: `cubic-bezier(0.4, 0, 0.2, 1)`
- ✅ **Número**: `#666666` (cinza, alto contraste)
- ✅ **Nome**: Roboto 17px bold (legibilidade)
- ✅ **Border radius**: 16px (moderno)
- ✅ **Fade-in**: animação escalonale (0.03s delay por card)

### Header
- ✅ **Seletor**: fundo vermelho escuro, borda dourada
- ✅ **Pokébola**: 120px, opacity 0.08, canto direito
- ✅ **Glow**: animação de brilho passando

### Grid
- ✅ **Barra status**: discreta (`rgba(0,0,0,0.2)`), 12px
- ✅ **Animação**: cards surgem de baixo para cima

### Geral
- ✅ **Scrollbar**: vermelha com gradiente
- ✅ **Tooltips**: aparecem no hover (preto 90%)
- ✅ **Background**: estrelas com twinkle (5s loop)

---

## ⚡ Performance

### Otimizações Implementadas

1. **Paginação**: 20 Pokémon por vez (evita renderizar 1000+ cards)
2. **Batch loading**: 5 requisições simultâneas + delay 200ms
3. **Cache em memória**: 1351 nomes para busca instantânea
4. **Debounce**: 300ms na barra de busca (evita spam de API)
5. **Lazy loading**: `loading="lazy"` nas imagens
6. **CSS otimizado**: variáveis, animações hardware-accelerated

### Métricas

| Métrica | Valor |
|---------|-------|
| Primeiros 20 Pokémon | ~1-2s |
| Busca (debounce) | ~300-500ms |
| Modal (detalhes) | ~500-800ms |
| Filtro por tipo | ~1-1.5s |

---

## 📱 Responsividade

### Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  - Modal: 95% width
  - Sprite: 140px
  - Stats: grid 3 colunas
  - Cadeia evolutiva: scroll horizontal
}

/* Mobile pequeno */
@media (max-width: 480px) {
  - Sprite: 120px
  - Fonte títulos: 10px
  - Cards: 1 coluna
}
```

### Ajustes Mobile

- **Header**: layout vertical centralizado
- **Modal**: scroll máximo 95vh
- **Stats**: labels menores (11px)
- **Evolução**: sprites 55px
- **Filtro**: drawer 70vh max
- **Tooltips**: ajustados para não vazar

---

## 🧪 Testes Manuais

### Checklist de Funcionalidades

- [ ] Carregar Gen 1 (151 Pokémon)
- [ ] Carregar todas as gerações (1351+)
- [ ] Paginação (botão "Carregar Mais")
- [ ] Filtro por tipo (18 tipos)
- [ ] Busca por nome (debounce)
- [ ] Ordenar por nome/ID
- [ ] Abrir modal
- [ ] Fechar modal (X, fora, Escape)
- [ ] Navegar cadeia evolutiva
- [ ] Scroll no modal
- [ ] Responsividade mobile

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

---

## 🙏 Créditos

- **PokéAPI**: https://pokeapi.co/ - Dados de Pokémon
- **Sprites**: PokéAPI GitHub repository
- **Fontes**: Google Fonts (Press Start 2P, Roboto)
- **Cores**: Pokémon Database - tipos oficiais

---

## 📞 Contato

Projeto desenvolvido por **oMart**

Repositório: https://github.com/oMart/Pokedex

---

<div align="center">

**Feito com ❤️ e TypeScript**

🎮 "Gotta Catch 'Em All!" 🎮

</div>