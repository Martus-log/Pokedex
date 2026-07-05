import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Cache em memória para busca global de Pokémon
let allPokemonNamesList: { name: string; url: string }[] = [];

async function loadAllPokemonNames() {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000');
    const data = await response.json();
    allPokemonNamesList = data.results || [];
    console.log(`Loaded ${allPokemonNamesList.length} Pokemon names for search cache`);
  } catch (err) {
    console.error('Failed to load Pokemon names list:', err);
  }
}
loadAllPokemonNames();

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../public')));

// Endpoint para buscar detalhes completos de um Pokémon (sob demanda no modal)
app.get('/api/pokemon/:id', async (req, res) => {
  try {
    const pokemonId = req.params.id;
    
    // Buscar dados do Pokémon
    const detailResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    if (!detailResponse.ok) {
      return res.status(404).json({ error: 'Pokémon not found' });
    }
    const detail = await detailResponse.json();
    
    // Buscar dados da espécie
    const speciesResponse = await fetch(detail.species.url);
    const species = await speciesResponse.json();
    
    // Buscar cadeia evolutiva
    const evoChainResponse = await fetch(species.evolution_chain.url);
    const evoChain = await evoChainResponse.json();
    
    // Obter descrição em inglês
    let description = 'Description not available';
    const enEntry = species.flavor_text_entries.find(
      (entry: { language: { name: string } }) => entry.language.name === 'en'
    );
    if (enEntry) {
      description = enEntry.flavor_text.replace(/[\n\f]/g, ' ');
    }
    
    // Manter tipos em inglês (original da API)
    const types = detail.types.map((t: { type: { name: string } }) => t.type.name);
    
    // Processar cadeia evolutiva
    const processEvoChain = (chain: any, stage = 0): any[] => {
      const result: any[] = [];
      
      const getLevelRequired = (evoDetail: any): number | null => {
        if (!evoDetail) return null;
        const levelDetail = evoDetail.condition_details?.find((c: any) => 
          c.name === 'level-up' || c.name === 'level'
        );
        if (levelDetail?.min_level) return levelDetail.min_level;
        if (evoDetail.min_level) return evoDetail.min_level;
        return null;
      };
      
      const processBranch = (e: any, minLevel: number | null = null) => {
        const pokemonData = {
          name: e.species.name,
          url: e.species.url,
          minLevel: minLevel
        };
        result.push(pokemonData);
        
        if (e.evolves_to && e.evolves_to.length > 0) {
          e.evolves_to.forEach((evo: any) => {
            const level = getLevelRequired(evo);
            processBranch(evo, level);
          });
        }
      };
      
      processBranch(chain);
      return result;
    };
    
    const evolutionChain = processEvoChain(evoChain.chain);
    
    res.json({
      id: detail.id,
      name: detail.name,
      types: types,
      abilities: detail.abilities.map((a: { ability: { name: string } }) => a.ability.name),
      image: detail.sprites.other['official-artwork'].front_default || detail.sprites.front_default,
      description: description,
      height: detail.height,
      weight: detail.weight,
      stats: detail.stats.map((s: { base_stat: number; stat: { name: string } }) => ({
        name: s.stat.name,
        value: s.base_stat
      })),
      evolutionChain
    });
  } catch (error) {
    console.error('Error fetching Pokémon details:', error);
    res.status(500).json({ error: 'Error fetching data from PokéAPI' });
  }
});

// API endpoint para buscar Pokémon com paginação (máximo 20 por vez)
app.get('/api/pokemons', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 20); // Máximo 20
  let offset = 0;
  let page = 1;
  if (req.query.offset !== undefined) {
    offset = parseInt(req.query.offset as string);
    page = Math.floor(offset / limit) + 1;
  } else {
    page = parseInt(req.query.page as string) || 1;
    offset = (page - 1) * limit;
  }

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    const data = await response.json();

    // Buscar detalhes de cada Pokémon EM PARALELO (lote único de 20)
    const batchDetails = await Promise.all(
      data.results.map(async (pokemon: { name: string; url: string }) => {
        const [detailResponse, speciesResponse] = await Promise.all([
          fetch(pokemon.url),
          fetch(pokemon.url.replace('/pokemon/', '/pokemon-species/').replace(/\/\d+\/$/, '/'))
        ]);
        
        const detail = await detailResponse.json();
        const species = await speciesResponse.json();
        
        // Obter descrição em inglês
        let description = 'Description not available';
        const enEntry = species.flavor_text_entries.find(
          (entry: { language: { name: string } }) => entry.language.name === 'en'
        );
        
        if (enEntry) {
          description = enEntry.flavor_text.replace(/[\n\f]/g, ' ');
        }

        // Manter tipos em inglês (original da API)
        const types = detail.types.map((t: { type: { name: string } }) => t.type.name);

        return {
          id: detail.id,
          name: detail.name,
          types: types,
          abilities: detail.abilities.map((a: { ability: { name: string } }) => a.ability.name),
          image: detail.sprites.front_default || detail.sprites.other['official-artwork'].front_default,
          description: description,
          height: detail.height,
          weight: detail.weight
        };
      })
    );

    res.json({
      pokemons: batchDetails,
      total: data.count,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching Pokémon:', error);
    res.status(500).json({ error: 'Error fetching data from PokéAPI' });
  }
});

// Endpoint para buscar Pokémon por tipo (máximo 20)
app.get('/api/type/:type', async (req, res) => {
  const typeName = req.params.type.toLowerCase();
  
  try {
    // Buscar dados do tipo diretamente da PokéAPI
    const typeResponse = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
    if (!typeResponse.ok) {
      return res.status(404).json({ error: `Type '${typeName}' not found` });
    }
    const typeData = await typeResponse.json();
    
    // Extrair lista de Pokémon deste tipo (limitar a 20)
    const pokemonList = typeData.pokemon.slice(0, 20).map((entry: any) => ({
      id: parseInt(entry.pokemon.url.replace(/.*\/(\d+)\/$/, '$1')),
      name: entry.pokemon.name,
      url: entry.pokemon.url
    }));
    
    console.log(`Type '${typeName}' has ${pokemonList.length} Pokémon (showing ${pokemonList.length})`);
    
    // Buscar detalhes EM PARALELO (lote único de 20)
    const batchDetails = await Promise.all(
      pokemonList.map(async (pokemon: { id: number; name: string; url: string }) => {
        const [detailResponse, speciesResponse] = await Promise.all([
          fetch(pokemon.url),
          fetch(pokemon.url.replace('/pokemon/', '/pokemon-species/').replace(/\/\d+\/$/, '/'))
        ]);
        
        const detail = await detailResponse.json();
        const species = await speciesResponse.json();
        
        // Obter descrição em inglês
        let description = 'Description not available';
        const enEntry = species.flavor_text_entries.find(
          (entry: { language: { name: string } }) => entry.language.name === 'en'
        );
        
        if (enEntry) {
          description = enEntry.flavor_text.replace(/[\n\f]/g, ' ');
        }

        // Manter tipos em inglês (original da API)
        const types = detail.types.map((t: { type: { name: string } }) => t.type.name);

        return {
          id: detail.id,
          name: detail.name,
          types: types,
          abilities: detail.abilities.map((a: { ability: { name: string } }) => a.ability.name),
          image: detail.sprites.front_default || detail.sprites.other['official-artwork'].front_default,
          description: description,
          height: detail.height,
          weight: detail.weight
        };
      })
    );

    res.json({
      pokemons: batchDetails,
      total: batchDetails.length,
      type: typeName,
      isTypeFilter: true
    });
  } catch (error) {
    console.error(`Error fetching type ${typeName}:`, error);
    res.status(500).json({ error: `Error fetching type data from PokéAPI: ${error}` });
  }
});

// Endpoint de busca global utilizando cache
app.get('/api/search', async (req, res) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  if (!query) {
    return res.json({ pokemons: [] });
  }

  try {
    // Filtra pelo nome
    const matches = allPokemonNamesList.filter(p => p.name.includes(query)).slice(0, 20);
    
    // Busca detalhes EM PARALELO (lote único de 20)
    const pokemons = (await Promise.all(
      matches.map(async (pokemon) => {
        try {
          const [detailResponse, speciesResponse] = await Promise.all([
            fetch(pokemon.url),
            fetch(pokemon.url.replace('/pokemon/', '/pokemon-species/').replace(/\/\d+\/$/, '/'))
          ]);
          
          if (!detailResponse.ok) return null;
          const detail = await detailResponse.json();
          const species = await speciesResponse.json();
          
          let description = 'Description not available';
          const enEntry = species.flavor_text_entries.find(
            (entry: { language: { name: string } }) => entry.language.name === 'en'
          );
          
          if (enEntry) {
            description = enEntry.flavor_text.replace(/[\n\f]/g, ' ');
          }

          const types = detail.types.map((t: any) => t.type.name);

          return {
            id: detail.id,
            name: detail.name,
            types: types,
            abilities: detail.abilities.map((a: any) => a.ability.name),
            image: detail.sprites.front_default || detail.sprites.other['official-artwork'].front_default,
            description: description,
            height: detail.height,
            weight: detail.weight
          };
        } catch (err) {
          console.error(`Error loading search detail for ${pokemon.name}:`, err);
          return null;
        }
      })
    )).filter(p => p !== null);

    res.json({ pokemons });
  } catch (error) {
    console.error('Error in global search:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Servir index.html para todas as rotas
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📚 Pokédex ready! (carregamento limitado a 20 Pokémon por vez)`);
});