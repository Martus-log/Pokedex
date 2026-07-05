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
};

/**
 * Busca um lote de Pokémon (máximo 20 por vez)
 */
export async function fetchPokemonBatch(offset: number, limit: number = 20): Promise<PokemonBasic[]> {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
  
  if (!response.ok) throw new Error('Failed to fetch Pokémon');
  
  const data = await response.json();
  const pokemons: PokemonBasic[] = [];
  
  const batchSize = 5;
  for (let i = 0; i < data.results.length; i += batchSize) {
    const batch = data.results.slice(i, i + batchSize);
    
    const details = await Promise.all(batch.map(async (pokemon: { name: string; url: string }) => {
      try {
        const detailResponse = await fetch(pokemon.url);
        if (!detailResponse.ok) return null;
        const detail = await detailResponse.json();
        const idMatch = pokemon.url.match(/\/pokemon\/(\d+)\/$/);
        
        return {
          id: idMatch ? parseInt(idMatch[1]) : 0,
          name: detail.name,
          types: detail.types.map((t: { type: { name: string } }) => t.type.name),
          abilities: detail.abilities.map((a: { ability: { name: string } }) => a.ability.name),
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
    
    const validDetails = details.filter((d): d is PokemonBasic => d !== null);
    pokemons.push(...validDetails);
    
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
  const pokemonUrls = typeData.pokemon.slice(0, 20).map((p: { pokemon: { url: string } }) => p.pokemon.url);
  const pokemons: PokemonBasic[] = [];
  
  const batchSize = 5;
  for (let i = 0; i < pokemonUrls.length; i += batchSize) {
    const batch = pokemonUrls.slice(i, i + batchSize);
    
    const details = await Promise.all(batch.map(async (url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        const idMatch = url.match(/\/pokemon\/(\d+)\/$/);
        
        return {
          id: idMatch ? parseInt(idMatch[1]) : 0,
          name: data.name,
          types: data.types.map((t: { type: { name: string } }) => t.type.name),
          abilities: data.abilities.map((a: { ability: { name: string } }) => a.ability.name),
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
    
    const validDetails = details.filter((d): d is PokemonBasic => d !== null);
    pokemons.push(...validDetails);
    
    if (i + batchSize < batch.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return pokemons;
}