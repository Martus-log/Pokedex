// api.ts - Funções de chamada à PokéAPI (com carregamento limitado)

export interface PokemonBasic {
  id: number;
  name: string;
  types: string[];
  abilities: string[];
  image: string;
  height: number;
  weight: number;
  description: string;
}

export interface PokemonDetail extends PokemonBasic {
  stats: { name: string; value: number }[];
  evolutionChain: { name: string; url: string; minLevel: number | null }[];
}

interface GenerationData {
  offset: number;
  limit: number;
  name: string;
}

export const generationData: Record<string, GenerationData> = {
  '1': { offset: 0, limit: 151, name: 'Gen 1' },
  '2': { offset: 151, limit: 100, name: 'Gen 2' },
  '3': { offset: 251, limit: 135, name: 'Gen 3' },
  '4': { offset: 386, limit: 107, name: 'Gen 4' },
  '5': { offset: 493, limit: 156, name: 'Gen 5' },
  '6': { offset: 649, limit: 72, name: 'Gen 6' },
  '7': { offset: 721, limit: 88, name: 'Gen 7' },
  '8': { offset: 809, limit: 96, name: 'Gen 8' },
  '9': { offset: 905, limit: 120, name: 'Gen 9' }
  // 'all' removido - usar gerações individuais para performance
};

/**
 * Busca um lote de Pokémon (máximo 20 por vez)
 * NÃO carrega todos de uma vez - usar paginação
 */
export async function fetchPokemonBatch(offset: number, limit: number = 20): Promise<PokemonBasic[]> {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
  
  if (!response.ok) throw new Error('Failed to fetch Pokémon');
  
  const data = await response.json();
  const pokemons: PokemonBasic[] = [];
  
  // Carrega detalhes em lotes de 5 para não sobrecarregar
  const batchSize = 5;
  for (let i = 0; i < data.results.length; i += batchSize) {
    const batch = data.results.slice(i, i + batchSize);
    
    const details = await Promise.all(batch.map(async (pokemon: any) => {
      try {
        const detailResponse = await fetch(pokemon.url);
        if (!detailResponse.ok) return null;
        const detail = await detailResponse.json();
        const idMatch = pokemon.url.match(/\/pokemon\/(\d+)\/$/);
        
        return {
          id: idMatch ? parseInt(idMatch[1]) : 0,
          name: detail.name,
          types: detail.types.map(t => t.type.name),
          abilities: detail.abilities.map(a => a.ability.name),
          image: detail.sprites.front_default || detail.sprites.other['official-artwork'].front_default,
          height: detail.height,
          weight: detail.weight,
          description: ''
        };
      } catch (err) {
        console.error(`Error loading ${pokemon.name}:`, err);
        return null;
      }
    }));
    
    const validDetails = details.filter(d => d !== null);
    pokemons.push(...validDetails);
    
    // Delay para não sobrecarregar API
    if (i + batchSize < data.results.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return pokemons;
}

/**
 * Busca detalhes completos de um Pokémon (sob demanda no modal)
 */
export async function fetchPokemonDetails(id: number): Promise<PokemonDetail> {
  const url = `/api/pokemon/${id}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Busca Pokémon de um tipo específico (máximo 20)
 */
export async function fetchPokemonsByType(typeName: string): Promise<PokemonBasic[]> {
  const typeResponse = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
  if (!typeResponse.ok) {
    throw new Error(`Failed to load type ${typeName}`);
  }
  
  const typeData = await typeResponse.json();
  // Limita a 20 Pokémon
  const pokemonUrls = typeData.pokemon.slice(0, 20).map(p => p.pokemon.url);
  const pokemons: PokemonBasic[] = [];
  
  // Carrega em lotes de 5
  const batchSize = 5;
  for (let i = 0; i < pokemonUrls.length; i += batchSize) {
    const batch = pokemonUrls.slice(i, i + batchSize);
    
    const details = await Promise.all(batch.map(async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        const idMatch = url.match(/\/pokemon\/(\d+)\/$/);
        
        return {
          id: idMatch ? parseInt(idMatch[1]) : 0,
          name: data.name,
          types: data.types.map(t => t.type.name),
          abilities: data.abilities.map(a => a.ability.name),
          image: data.sprites.front_default || data.sprites.other['official-artwork'].front_default,
          height: data.height,
          weight: data.weight,
          description: ''
        };
      } catch (err) {
        console.error(`Error loading ${url}:`, err);
        return null;
      }
    }));
    
    const validDetails = details.filter(d => d !== null);
    pokemons.push(...validDetails);
    
    if (i + batchSize < batch.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return pokemons;
}