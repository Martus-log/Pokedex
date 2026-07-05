// script.js - Pokédex com carregamento paginado (máx 20 por vez)

let currentPage = 1;
const LIMIT = 20; // Máximo de Pokémon por página
let allPokemons = [];
let filteredPokemons = [];
let allPokemonsList = [];

// Estado do carregamento por geração
let generationState = {
  currentGen: '1',
  loadedCount: 0,
  totalCount: 0,
  offset: 0,
  isLoading: false
};

// Type to CSS class mapping
const typeToClass = {
  'Normal': 'type-normal',
  'Fire': 'type-fire',
  'Water': 'type-water',
  'Electric': 'type-electric',
  'Grass': 'type-grass',
  'Ice': 'type-ice',
  'Fighting': 'type-fighting',
  'Poison': 'type-poison',
  'Ground': 'type-ground',
  'Flying': 'type-flying',
  'Psychic': 'type-psychic',
  'Bug': 'type-bug',
  'Rock': 'type-rock',
  'Ghost': 'type-ghost',
  'Dragon': 'type-dragon',
  'Steel': 'type-steel',
  'Fairy': 'type-fairy'
};

// Translation: English → Portuguese (for display only)
const typeToPortuguese = {
  'normal': 'Normal',
  'fire': 'Fogo',
  'water': 'Água',
  'electric': 'Elétrico',
  'grass': 'Grama',
  'ice': 'Gelo',
  'fighting': 'Lutador',
  'poison': 'Venenoso',
  'ground': 'Terra',
  'flying': 'Voador',
  'psychic': 'Psíquico',
  'bug': 'Inseto',
  'rock': 'Pedra',
  'ghost': 'Fantasma',
  'dragon': 'Dragão',
  'steel': 'Aço',
  'fairy': 'Fada'
};

// Translation: Portuguese → English (for API calls)
const portugueseToEnglish = {
  'Normal': 'normal',
  'Fogo': 'fire',
  'Água': 'water',
  'Elétrico': 'electric',
  'Grama': 'grass',
  'Gelo': 'ice',
  'Lutador': 'fighting',
  'Venenoso': 'poison',
  'Terra': 'ground',
  'Voador': 'flying',
  'Psíquico': 'psychic',
  'Inseto': 'bug',
  'Pedra': 'rock',
  'Fantasma': 'ghost',
  'Dragão': 'dragon',
  'Aço': 'steel',
  'Fada': 'fairy',
  'Todos': 'all'
};

// Dados das gerações
const generationData = {
  '1': { offset: 0, limit: 151, name: 'Gen 1' },
  '2': { offset: 151, limit: 100, name: 'Gen 2' },
  '3': { offset: 251, limit: 135, name: 'Gen 3' },
  '4': { offset: 386, limit: 107, name: 'Gen 4' },
  '5': { offset: 493, limit: 156, name: 'Gen 5' },
  '6': { offset: 649, limit: 72, name: 'Gen 6' },
  '7': { offset: 721, limit: 88, name: 'Gen 7' },
  '8': { offset: 809, limit: 96, name: 'Gen 8' },
  '9': { offset: 905, limit: 120, name: 'Gen 9' },
  'all': { offset: 0, limit: 1025, name: 'Todas as Gerações' }
};

// DOM elements
const pokedexGrid = document.getElementById('pokedexGrid');
const loadingDiv = document.getElementById('loading');
const loadMoreButton = document.getElementById('loadMore');
const searchInput = document.getElementById('searchInput');
const searchContainer = document.getElementById('searchContainer');
const modal = document.getElementById('pokemonModal');

/**
 * Carrega um lote de 20 Pokémon da geração atual
 * Usa o backend como proxy para evitar chamadas simultâneas excessivas
 */
async function loadPokemonPage() {
  if (generationState.isLoading) return;
  
  generationState.isLoading = true;
  const genData = generationData[generationState.currentGen];
  const offset = generationState.offset;
  const limit = Math.min(LIMIT, genData.limit - (generationState.loadedCount));
  
  if (limit <= 0) {
    generationState.isLoading = false;
    loadMoreButton.style.display = 'none';
    return;
  }
  
  loadingDiv.style.display = 'block';
  loadingDiv.innerHTML = `<p>Carregando ${generationState.loadedCount + 1} a ${Math.min(generationState.loadedCount + limit, genData.totalCount)}...</p>`;
  
  try {
    // Usa o backend como proxy - 1 chamada apenas
    const response = await fetch(`/api/pokemons?limit=${limit}&offset=${generationState.offset}`);
    if (!response.ok) throw new Error(`Backend error: ${response.status}`);
    
    const data = await response.json();
    if (generationState.currentGen === 'all' && data.total) {
      generationState.totalCount = data.total;
      generationData['all'].limit = data.total;
    }
    const newPokemons = data.pokemons || [];
    
    if (newPokemons.length === 0) {
      throw new Error('No Pokémon returned');
    }
    
    // Adiciona apenas se não estiver na lista para evitar duplicatas (backend já fez o batch loading)
    const newUniquePokemons = newPokemons.filter(p => !allPokemons.some(existing => existing.id === p.id));
    allPokemons.push(...newUniquePokemons);
    filteredPokemons = [...allPokemons];
    allPokemonsList = [...allPokemons];
    
    // Renderiza todos
    renderPokemons(allPokemons);
    
    // Atualiza estado
    generationState.loadedCount += newPokemons.length;
    generationState.offset += LIMIT;
    currentPage++;
    
    loadingDiv.innerHTML = `<p>Carregados ${generationState.loadedCount}/${genData.limit}</p>`;
    
    // Verifica se carregou todos
    if (generationState.loadedCount >= genData.limit) {
      loadMoreButton.style.display = 'none';
      loadingDiv.style.display = 'none';
    } else {
      loadMoreButton.style.display = 'block';
      loadingDiv.style.display = 'none';
    }
    
    // Atualiza banner
    updateGenerationBanner();
    
  } catch (error) {
    console.error('Error loading Pokémon:', error);
    loadingDiv.innerHTML = '<p style="color: #ff5252;">Erro ao carregar. Tente novamente.</p>';
  } finally {
    generationState.isLoading = false;
  }
}

/**
 * Inicializa o carregamento de uma nova geração
 * Reseta estado e carrega primeiros 20 Pokémon
 */
async function loadGeneration(gen) {
  if (generationState.isLoading) return;
  
  const genData = generationData[gen];
  if (!genData) return;
  
  // Sincroniza o select dropdown se existir
  const generationSelect = document.getElementById('generationSelect');
  if (generationSelect && generationSelect.value !== gen) {
    generationSelect.value = gen;
  }
  
  // Reseta estado
  generationState = {
    currentGen: gen,
    loadedCount: 0,
    totalCount: genData.limit,
    offset: genData.offset,
    isLoading: false
  };
  
  // Limpa UI
  pokedexGrid.innerHTML = '';
  allPokemons = [];
  filteredPokemons = [];
  allPokemonsList = [];
  currentPage = 1;
  
  loadingDiv.style.display = 'block';
  loadingDiv.innerHTML = `<p>Carregando ${genData.name}...</p>`;
  loadMoreButton.style.display = 'none';
  
  // Remove banners antigos
  removeExistingBanners();
  
  // Carrega primeira página
  await loadPokemonPage();
  
  // Show generation banner
  const bannerHTML = `
    <div class="generation-banner" style="grid-column: 1/-1; text-align: center; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; margin-bottom: 20px;">
      <p style="color: #fff; font-family: 'Press Start 2P', cursive; font-size: 10px;">
        ${genData.name}: ${generationState.loadedCount}/${genData.limit} Pokémon
      </p>
    </div>
  `;
  pokedexGrid.insertAdjacentHTML('beforebegin', bannerHTML);
}

/**
 * Atualiza o banner da geração com contagem atual
 */
function updateGenerationBanner() {
   const existingBanner = pokedexGrid.previousElementSibling;
   if (existingBanner && existingBanner.classList && existingBanner.classList.contains('generation-banner')) {
     const genData = generationData[generationState.currentGen];
     existingBanner.querySelector('p').textContent = 
       `${genData.name}: ${generationState.loadedCount}/${genData.limit}`;
   }
 }

/**
 * Remove banners existentes
 */
function removeExistingBanners() {
  const existingBanner = pokedexGrid.previousElementSibling;
  if (existingBanner && existingBanner.classList && 
      (existingBanner.classList.contains('generation-banner') || 
       existingBanner.classList.contains('type-banner') || 
       existingBanner.classList.contains('search-banner'))) {
    existingBanner.remove();
  }
}

// Setup generation selector
function setupGenerationSelector() {
  const generationSelect = document.getElementById('generationSelect');
  if (!generationSelect) return;
  
  generationSelect.addEventListener('change', async (e) => {
    generationState.currentGen = e.target.value;
    await loadGeneration(generationState.currentGen);
  });
}

// Load more Pokémon (botão "Carregar Mais")
async function loadMore() {
  if (generationState.isLoading) return;
  await loadPokemonPage();
}

// Expose functions globally
window.loadMore = loadMore;
window.closeModal = closeModal;

// Capitalize first letter
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Render Pokémon cards
function renderPokemons(pokemons) {
  pokedexGrid.innerHTML = '';
  
  pokemons.forEach((pokemon, index) => {
    const card = createPokemonCard(pokemon, index);
    pokedexGrid.appendChild(card);
  });
}

// Type colors for card backgrounds
const typeColors = {
  normal: '#AAA67F',
  fire: '#F57D31',
  water: '#6493EB',
  grass: '#74CB48',
  electric: '#F9CF30',
  ice: '#9AD6DF',
  fighting: '#C12239',
  poison: '#A43E9E',
  ground: '#DEC16B',
  flying: '#A891EC',
  psychic: '#FB5584',
  bug: '#A7B723',
  rock: '#B69E31',
  ghost: '#70559B',
  dragon: '#7037FF',
  steel: '#B7B9D0',
  fairy: '#E69EAC',
  dark: '#75574C',
};

// Create Pokémon card
function createPokemonCard(pokemon, index = 0) {
  const card = document.createElement('div');
  card.className = 'pokemon-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Ver detalhes de ${pokemon.name}`);
  
  // Atraso em cascata para animação fade-in
  card.style.animationDelay = `${index * 0.03}s`;
  
  const primaryType = pokemon.types[0];
  const typeColor = typeColors[primaryType] || '#AAA67F';
  
  const typesPT = pokemon.types.map(t => capitalizeFirst(typeToPortuguese[t] || t));
  card.setAttribute('data-type', typesPT.join(' '));
  
  const typesHtml = typesPT
    .map(type => {
      const enType = portugueseToEnglish[type] || type.toLowerCase();
      const cssClass = typeToClass[type] || `type-${enType}`;
      return `<span class="type-badge ${cssClass}">${type}</span>`;
    })
    .join('');
  
  card.innerHTML = `
    <div class="pokemon-image-container" style="background: ${typeColor};">
      <img src="${pokemon.image}" alt="${pokemon.name}" class="pokemon-image" loading="lazy">
    </div>
    <div class="pokemon-info" style="background: #ffffff;">
      <div class="pokemon-id">#${String(pokemon.id).padStart(3, '0')}</div>
      <h3 class="pokemon-name">${capitalizeFirst(pokemon.name)}</h3>
      <div class="pokemon-types">${typesHtml}</div>
    </div>
  `;
  
  card.addEventListener('click', () => openModal(pokemon));
  card.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') openModal(pokemon);
  });
  
  return card;
}

// Open modal with Pokémon details
async function openModal(pokemon) {
  try {
    // Carrega detalhes completos sob demanda
    const response = await fetch(`/api/pokemon/${pokemon.id}`);
    if (!response.ok) throw new Error('Failed to load details');
    
    const details = await response.json();
    
    // Atualiza header colorido com base no tipo principal
    const primaryType = details.types[0];
    const typeColor = typeColors[primaryType] || '#AAA67F';
    const modalHeader = document.getElementById('modalHeaderColored');
    modalHeader.style.background = `linear-gradient(135deg, ${typeColor} 0%, ${adjustColor(typeColor, -20)} 100%)`;
    
    // Atualiza botão de fechar para ser visível no fundo colorido
    const closeBtn = document.querySelector('.modal-close');
    closeBtn.style.color = 'white';
    
    // Preenche header do modal
    document.getElementById('modalImage').src = details.image;
    document.getElementById('modalImage').alt = details.name;
    document.getElementById('modalTitle').textContent = capitalizeFirst(details.name);
    document.getElementById('modalId').textContent = `#${String(details.id).padStart(3, '0')}`;
    
    // Types badges no header
    const typesPT = details.types.map(t => capitalizeFirst(typeToPortuguese[t] || t));
    document.getElementById('modalTypes').innerHTML = typesPT
      .map(type => {
        const enType = portugueseToEnglish[type] || type.toLowerCase();
        const cssClass = typeToClass[type] || `type-${enType}`;
        return `<span class="type-badge ${cssClass}">${type}</span>`;
      })
      .join('');
    
    // Stats com cores dinâmicas
    const statsContainer = document.getElementById('statsBars');
    statsContainer.innerHTML = '';
    let totalStats = 0;
    
    const statLabels = {
      'hp': 'PS',
      'attack': 'Ataque',
      'defense': 'Defesa',
      'special-attack': 'Atq. Esp.',
      'special-defense': 'Def. Esp.',
      'speed': 'Velocidade'
    };
    
    details.stats.forEach(stat => {
      const label = statLabels[stat.name] || stat.name;
      const percentage = Math.min(100, (stat.value / 255) * 100);
      totalStats += stat.value;
      
      // Determina cor baseada no valor do stat
      let statColorClass = 'low';
      if (stat.value >= 100) statColorClass = 'high';
      else if (stat.value >= 60) statColorClass = 'medium';
      
      statsContainer.innerHTML += `
        <div class="stat-bar-container">
          <span class="stat-label">${label}</span>
          <div class="stat-bar-wrapper">
            <div class="stat-bar ${statColorClass}" style="width: ${percentage}%"></div>
          </div>
          <span class="stat-value">${stat.value}</span>
        </div>
      `;
    });
    
    document.getElementById('statsTotal').textContent = totalStats;
    
    // Habilidades
    const abilitiesPT = details.abilities.map(a => 
      capitalizeFirst(a.replace(/-/g, ' '))
    );
    document.getElementById('modalAbilities').innerHTML = abilitiesPT
      .map(a => `<span class="ability-badge">${a}</span>`)
      .join('');
    
    // Descrição
    document.getElementById('modalDescription').textContent = details.description;
    
    // Altura e Peso
    document.getElementById('modalHeight').textContent = `${(details.height / 10).toFixed(1)} m`;
    document.getElementById('modalWeight').textContent = `${(details.weight / 10).toFixed(1)} kg`;
    
    // Cadeia evolutiva
    renderEvolutionChain(details.evolutionChain, details.id);
    
    // Show modal
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
  } catch (error) {
    console.error('Error loading Pokémon details:', error);
    alert('Erro ao carregar detalhes. Tente novamente.');
  }
}

// Render evolution chain with level info and click to open
function renderEvolutionChain(chain, currentPokemonId) {
  const container = document.getElementById('evolutionChain');
  container.innerHTML = '';
  
  if (!Array.isArray(chain) || chain.length === 0) {
    container.innerHTML = '<p class="no-evo" style="text-align:center;color:#888;">Sem evoluções disponíveis</p>';
    return;
  }
  
  const chainContainer = document.createElement('div');
  chainContainer.className = 'evo-chain-container';
  
  chain.forEach((evo, index) => {
    const name = capitalizeFirst(evo.name);
    const url = evo.url;
    const id = url.match(/\/pokemon-species\/(\d+)\/$/)?.[1] || url.match(/\/pokemon\/(\d+)\/$/)?.[1] || '0';
    const minLevel = evo.minLevel;
    
    const stageDiv = document.createElement('div');
    stageDiv.className = `evo-stage${id == currentPokemonId ? ' current' : ''}`;
    stageDiv.setAttribute('data-pokemon-id', id);
    stageDiv.innerHTML = `
      <div class="evo-image-container">
        <img class="evo-image" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt="${name}">
      </div>
      <p class="evo-name">${name}</p>
      <p class="evo-number">#${String(id).padStart(3, '0')}</p>
    `;
    
    // Clique para abrir modal do Pokémon
    stageDiv.addEventListener('click', () => {
      openModalFromChain(id);
    });
    
    chainContainer.appendChild(stageDiv);
    
    // Seta e nível de evolução
    if (index < chain.length - 1 && minLevel) {
      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'evo-arrow';
      arrowSpan.textContent = '→';
      chainContainer.appendChild(arrowSpan);
      
      const levelDiv = document.createElement('div');
      levelDiv.className = 'evo-level';
      levelDiv.textContent = `Lv. ${minLevel}`;
      chainContainer.appendChild(levelDiv);
    } else if (index < chain.length - 1) {
      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'evo-arrow';
      arrowSpan.textContent = '→';
      chainContainer.appendChild(arrowSpan);
    }
  });
  
  container.appendChild(chainContainer);
}

// Open modal from evolution chain click
async function openModalFromChain(pokemonId) {
  try {
    const response = await fetch(`/api/pokemon/${pokemonId}`);
    if (!response.ok) throw new Error('Failed to load details');
    const details = await response.json();
    openModalHelper(details);
  } catch (error) {
    console.error('Error loading evolution details:', error);
  }
}

// Helper para abrir modal com dados já carregados
function openModalHelper(details) {
  // Atualiza header colorido com base no tipo principal
  const primaryType = details.types[0];
  const typeColor = typeColors[primaryType] || '#AAA67F';
  const modalHeader = document.getElementById('modalHeaderColored');
  modalHeader.style.background = `linear-gradient(135deg, ${typeColor} 0%, ${adjustColor(typeColor, -20)} 100%)`;
  
  // Atualiza botão de fechar
  const closeBtn = document.querySelector('.modal-close');
  closeBtn.style.color = 'white';
  
  // Preenche header do modal
  document.getElementById('modalImage').src = details.image;
  document.getElementById('modalImage').alt = details.name;
  document.getElementById('modalTitle').textContent = capitalizeFirst(details.name);
  document.getElementById('modalId').textContent = `#${String(details.id).padStart(3, '0')}`;
  
  // Types badges no header
  const typesPT = details.types.map(t => capitalizeFirst(typeToPortuguese[t] || t));
  document.getElementById('modalTypes').innerHTML = typesPT
    .map(type => {
      const enType = portugueseToEnglish[type] || type.toLowerCase();
      const cssClass = typeToClass[type] || `type-${enType}`;
      return `<span class="type-badge ${cssClass}">${type}</span>`;
    })
    .join('');
  
  // Stats com cores dinâmicas
  const statsContainer = document.getElementById('statsBars');
  statsContainer.innerHTML = '';
  let totalStats = 0;
  
  const statLabels = {
    'hp': 'PS',
    'attack': 'Ataque',
    'defense': 'Defesa',
    'special-attack': 'Atq. Esp.',
    'special-defense': 'Def. Esp.',
    'speed': 'Velocidade'
  };
  
  details.stats.forEach(stat => {
    const label = statLabels[stat.name] || stat.name;
    const percentage = Math.min(100, (stat.value / 255) * 100);
    totalStats += stat.value;
    
    let statColorClass = 'low';
    if (stat.value >= 100) statColorClass = 'high';
    else if (stat.value >= 60) statColorClass = 'medium';
    
    statsContainer.innerHTML += `
      <div class="stat-bar-container">
        <span class="stat-label">${label}</span>
        <div class="stat-bar-wrapper">
          <div class="stat-bar ${statColorClass}" style="width: ${percentage}%"></div>
        </div>
        <span class="stat-value">${stat.value}</span>
      </div>
    `;
  });
  
  document.getElementById('statsTotal').textContent = totalStats;
  
  // Habilidades
  const abilitiesPT = details.abilities.map(a => capitalizeFirst(a.replace(/-/g, ' ')));
  document.getElementById('modalAbilities').innerHTML = abilitiesPT
    .map(a => `<span class="ability-badge">${a}</span>`)
    .join('');
  
  // Descrição
  document.getElementById('modalDescription').textContent = details.description;
  
  // Altura e Peso
  document.getElementById('modalHeight').textContent = `${(details.height / 10).toFixed(1)} m`;
  document.getElementById('modalWeight').textContent = `${(details.weight / 10).toFixed(1)} kg`;
  
  // Cadeia evolutiva
  renderEvolutionChain(details.evolutionChain, details.id);
  
  // Show modal
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

// Close modal
function closeModal() {
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = 'auto';
}

// Helper function to adjust color brightness
function adjustColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

// Setup modal close listener
function setupModalCloseListener() {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });
}

// Setup search
function setupSearchListener() {
  const searchCloseBtn = document.getElementById('searchCloseBtn');
  const filterNameBtn = document.getElementById('filterNameBtn');
  let searchTimeout = null;
  
  if (filterNameBtn) {
    filterNameBtn.addEventListener('click', () => {
      if (searchContainer.style.display === 'none') {
        searchContainer.style.display = 'flex';
        searchInput.focus();
      } else {
        searchContainer.style.display = 'none';
        searchInput.value = '';
        filteredPokemons = [...allPokemons];
        renderPokemons(filteredPokemons);
        removeExistingBanners();
      }
    });
  }
  
  if (searchCloseBtn) {
    searchCloseBtn.addEventListener('click', () => {
      searchContainer.style.display = 'none';
      searchInput.value = '';
      filteredPokemons = [...allPokemons];
      renderPokemons(filteredPokemons);
      removeExistingBanners();
    });
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      if (query.length === 0) {
        filteredPokemons = [...allPokemons];
        renderPokemons(filteredPokemons);
        removeExistingBanners();
        return;
      }
      
      searchTimeout = setTimeout(async () => {
        try {
          loadingDiv.style.display = 'block';
          loadingDiv.innerHTML = '<p>Buscando Pokémon...</p>';
          
          const response = await fetch(`/api/search?q=${query}`);
          if (!response.ok) throw new Error('Search failed');
          
          const data = await response.json();
          filteredPokemons = data.pokemons || [];
          
          renderSearchResults(filteredPokemons, query);
        } catch (err) {
          console.error('Error fetching search results:', err);
          filteredPokemons = [];
          renderSearchResults(filteredPokemons, query);
        } finally {
          loadingDiv.style.display = 'none';
        }
      }, 300);
    });
  }
}

// Render search results with banner
function renderSearchResults(pokemons, query) {
  pokedexGrid.innerHTML = '';
  removeExistingBanners();
  
  if (pokemons.length > 0) {
    const bannerHTML = `
      <div class="search-banner" style="grid-column: 1/-1; text-align: center; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; margin-bottom: 20px;">
        <p style="color: #fff; font-family: 'Press Start 2P', cursive; font-size: 10px;">
          ${pokemons.length} resultado(s) para "${query}"
        </p>
      </div>
    `;
    pokedexGrid.insertAdjacentHTML('beforebegin', bannerHTML);
    
    pokemons.forEach((pokemon, index) => {
      const card = createPokemonCard(pokemon, index);
      pokedexGrid.appendChild(card);
    });
  } else {
    pokedexGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #fff; font-family: \'Press Start 2P\', cursive; font-size: 12px;">Nenhum Pokémon encontrado.</p>';
  }
}

// Setup floating actions
function setupFloatingActions() {
  const filterTypeBtn = document.getElementById('filterTypeBtn');
  const typeFilterDrawer = document.getElementById('typeFilterDrawer');
  const drawerClose = document.getElementById('drawerClose');
  
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  
  // Type filter drawer
  if (filterTypeBtn && typeFilterDrawer) {
    filterTypeBtn.addEventListener('click', () => {
      typeFilterDrawer.classList.add('active');
    });
  }
  
  if (drawerClose) {
    drawerClose.addEventListener('click', () => {
      typeFilterDrawer.classList.remove('active');
    });
  }
  
  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', () => {
      typeFilterDrawer.classList.remove('active');
    });
  }
  
  // Type filter buttons
  document.querySelectorAll('.type-filter-option').forEach(button => {
    button.addEventListener('click', async (e) => {
      const typeEnglish = e.target.getAttribute('data-type');
      typeFilterDrawer.classList.remove('active');
      
      if (typeEnglish === 'all') {
        await loadGeneration(generationState.currentGen);
        return;
      }
      
      const generationSelect = document.getElementById('generationSelect');
      if (generationSelect) {
        generationSelect.value = 'all';
      }
      generationState.currentGen = 'all';
      
      await loadPokemonsByType(typeEnglish);
    });
  });
}



// Load Pokémon by type (máximo 20 de uma vez)
async function loadPokemonsByType(typeNameEnglish) {
  try {
    pokedexGrid.innerHTML = '';
    allPokemons = [];
    filteredPokemons = [];
    allPokemonsList = [];
    removeExistingBanners();
    
    loadingDiv.style.display = 'block';
    loadingDiv.innerHTML = '<p>Carregando Pokémon do tipo...</p>';
    
    // Busca os dados já prontos do backend
    const response = await fetch(`/api/type/${typeNameEnglish}`);
    if (!response.ok) throw new Error('Failed to load type');
    
    const data = await response.json();
    const typePokemons = data.pokemons || [];
    
    allPokemons.push(...typePokemons);
    filteredPokemons = [...allPokemons];
    allPokemonsList = [...allPokemons];
    
    renderPokemons(allPokemons);
    
    loadingDiv.style.display = 'none';
    loadMoreButton.style.display = 'none';
    
    const typeNamePT = typeToPortuguese[typeNameEnglish] || typeNameEnglish;
    
    const bannerHTML = `
      <div class="type-banner" style="grid-column: 1/-1; text-align: center; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; margin-bottom: 20px;">
        <p style="color: #fff; font-family: 'Press Start 2P', cursive; font-size: 10px;">
          Exibindo ${allPokemons.length} Pokémon do tipo ${typeNamePT}
        </p>
      </div>
    `;
    pokedexGrid.insertAdjacentHTML('beforebegin', bannerHTML);
    
  } catch (error) {
    console.error('Error loading type Pokémon:', error);
    loadingDiv.innerHTML = '<p style="color: #ff5252;">Erro ao carregar. Tente novamente.</p>';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready - initializing Pokédex');
  setupGenerationSelector();
  loadGeneration('all'); // Carrega todas as gerações por padrão
  setupSearchListener();
  setupModalCloseListener();
  setupFloatingActions();
});