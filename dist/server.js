"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Servir arquivos estáticos da pasta public
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
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
        const enEntry = species.flavor_text_entries.find((entry) => entry.language.name === 'en');
        if (enEntry) {
            description = enEntry.flavor_text.replace(/[\n\f]/g, ' ');
        }
        // Manter tipos em inglês (original da API)
        const types = detail.types.map((t) => t.type.name);
        // Processar cadeia evolutiva
        const processEvoChain = (chain, stage = 0) => {
            const result = [];
            const getLevelRequired = (evoDetail) => {
                if (!evoDetail)
                    return null;
                const levelDetail = evoDetail.condition_details?.find((c) => c.name === 'level-up' || c.name === 'level');
                if (levelDetail?.min_level)
                    return levelDetail.min_level;
                if (evoDetail.min_level)
                    return evoDetail.min_level;
                return null;
            };
            const processBranch = (e, minLevel = null) => {
                const pokemonData = {
                    name: e.species.name,
                    url: e.species.url,
                    minLevel: minLevel
                };
                result.push(pokemonData);
                if (e.evolves_to && e.evolves_to.length > 0) {
                    e.evolves_to.forEach((evo) => {
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
            abilities: detail.abilities.map((a) => a.ability.name),
            image: detail.sprites.other['official-artwork'].front_default || detail.sprites.front_default,
            description: description,
            height: detail.height,
            weight: detail.weight,
            stats: detail.stats.map((s) => ({
                name: s.stat.name,
                value: s.base_stat
            })),
            evolutionChain
        });
    }
    catch (error) {
        console.error('Error fetching Pokémon details:', error);
        res.status(500).json({ error: 'Error fetching data from PokéAPI' });
    }
});
// API endpoint para buscar Pokémon com paginação (máximo 20 por vez)
app.get('/api/pokemons', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 20); // Máximo 20
    let offset = 0;
    let page = 1;
    if (req.query.offset !== undefined) {
        offset = parseInt(req.query.offset);
        page = Math.floor(offset / limit) + 1;
    }
    else {
        page = parseInt(req.query.page) || 1;
        offset = (page - 1) * limit;
    }
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
        const data = await response.json();
        // Buscar detalhes de cada Pokémon EM LOTES DE 5
        const pokemons = [];
        const batchSize = 5;
        for (let i = 0; i < data.results.length; i += batchSize) {
            const batch = data.results.slice(i, i + batchSize);
            const batchDetails = await Promise.all(batch.map(async (pokemon) => {
                const detailResponse = await fetch(pokemon.url);
                const detail = await detailResponse.json();
                // Buscar dados da espécie para descrição
                const speciesResponse = await fetch(detail.species.url);
                const species = await speciesResponse.json();
                // Obter descrição em inglês
                let description = 'Description not available';
                const enEntry = species.flavor_text_entries.find((entry) => entry.language.name === 'en');
                if (enEntry) {
                    description = enEntry.flavor_text.replace(/[\n\f]/g, ' ');
                }
                // Manter tipos em inglês (original da API)
                const types = detail.types.map((t) => t.type.name);
                return {
                    id: detail.id,
                    name: detail.name,
                    types: types,
                    abilities: detail.abilities.map((a) => a.ability.name),
                    image: detail.sprites.front_default || detail.sprites.other['official-artwork'].front_default,
                    description: description,
                    height: detail.height,
                    weight: detail.weight
                };
            }));
            pokemons.push(...batchDetails);
            // Delay para não sobrecarregar API
            if (i + batchSize < data.results.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        res.json({
            pokemons,
            total: data.count,
            page,
            limit
        });
    }
    catch (error) {
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
        const pokemonList = typeData.pokemon.slice(0, 20).map((entry) => ({
            id: parseInt(entry.pokemon.url.replace(/.*\/(\d+)\/$/, '$1')),
            name: entry.pokemon.name,
            url: entry.pokemon.url
        }));
        console.log(`Type '${typeName}' has ${pokemonList.length} Pokémon (showing ${pokemonList.length})`);
        // Buscar detalhes EM LOTES DE 5
        const pokemons = [];
        const batchSize = 5;
        for (let i = 0; i < pokemonList.length; i += batchSize) {
            const batch = pokemonList.slice(i, i + batchSize);
            const batchDetails = await Promise.all(batch.map(async (pokemon) => {
                const detailResponse = await fetch(pokemon.url);
                const detail = await detailResponse.json();
                // Buscar dados da espécie para descrição
                const speciesResponse = await fetch(detail.species.url);
                const species = await speciesResponse.json();
                // Obter descrição em inglês
                let description = 'Description not available';
                const enEntry = species.flavor_text_entries.find((entry) => entry.language.name === 'en');
                if (enEntry) {
                    description = enEntry.flavor_text.replace(/[\n\f]/g, ' ');
                }
                // Manter tipos em inglês (original da API)
                const types = detail.types.map((t) => t.type.name);
                return {
                    id: detail.id,
                    name: detail.name,
                    types: types,
                    abilities: detail.abilities.map((a) => a.ability.name),
                    image: detail.sprites.front_default || detail.sprites.other['official-artwork'].front_default,
                    description: description,
                    height: detail.height,
                    weight: detail.weight
                };
            }));
            pokemons.push(...batchDetails);
            // Delay para não sobrecarregar API
            if (i + batchSize < pokemonList.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        res.json({
            pokemons: pokemons,
            total: pokemons.length,
            type: typeName,
            isTypeFilter: true
        });
    }
    catch (error) {
        console.error(`Error fetching type ${typeName}:`, error);
        res.status(500).json({ error: `Error fetching type data from PokéAPI: ${error}` });
    }
});
// Servir index.html para todas as rotas
app.get(/.*/, (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📚 Pokédex ready! (carregamento limitado a 20 Pokémon por vez)`);
});
//# sourceMappingURL=server.js.map