import { useState, useEffect } from 'react';
import './App.css';

const API = 'http://localhost:5000/api/pokemon';

// Liste de tous les types Pokemon
const POKEMON_TYPES = [
  'Tous',
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic',
  'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

// Génération selon l'ID
const getGeneration = (id) => {
  if (id <= 151) return 'Gen 1';
  if (id <= 251) return 'Gen 2';
  if (id <= 386) return 'Gen 3';
  if (id <= 493) return 'Gen 4';
  if (id <= 649) return 'Gen 5';
  if (id <= 721) return 'Gen 6';
  if (id <= 809) return 'Gen 7';
  return 'Gen 8+';
};

// Pokémon rares
const isRare = (pokemon) => {
  const totalStats = Object.values(pokemon.base).reduce((a, b) => a + b, 0);
  return totalStats > 550;
};

// Table des faiblesses par type
const TYPE_EFFECTIVENESS = {
  Normal: { weakTo: ['Fighting'], resistantTo: [], immuneTo: ['Ghost'] },
  Fire: { weakTo: ['Water', 'Ground', 'Rock'], resistantTo: ['Fire', 'Grass', 'Ice', 'Bug', 'Steel', 'Fairy'], immuneTo: [] },
  Water: { weakTo: ['Electric', 'Grass'], resistantTo: ['Fire', 'Water', 'Ice', 'Steel'], immuneTo: [] },
  Electric: { weakTo: ['Ground'], resistantTo: ['Electric', 'Flying', 'Steel'], immuneTo: [] },
  Grass: { weakTo: ['Fire', 'Ice', 'Poison', 'Flying', 'Bug'], resistantTo: ['Water', 'Electric', 'Grass', 'Ground'], immuneTo: [] },
  Ice: { weakTo: ['Fire', 'Fighting', 'Rock', 'Steel'], resistantTo: ['Ice'], immuneTo: [] },
  Fighting: { weakTo: ['Flying', 'Psychic', 'Fairy'], resistantTo: ['Bug', 'Rock', 'Dark'], immuneTo: [] },
  Poison: { weakTo: ['Ground', 'Psychic'], resistantTo: ['Grass', 'Fighting', 'Poison', 'Bug', 'Fairy'], immuneTo: [] },
  Ground: { weakTo: ['Water', 'Grass', 'Ice'], resistantTo: ['Poison', 'Rock'], immuneTo: ['Electric'] },
  Flying: { weakTo: ['Electric', 'Ice', 'Rock'], resistantTo: ['Grass', 'Fighting', 'Bug'], immuneTo: ['Ground'] },
  Psychic: { weakTo: ['Bug', 'Ghost', 'Dark'], resistantTo: ['Fighting', 'Psychic'], immuneTo: [] },
  Bug: { weakTo: ['Fire', 'Flying', 'Rock'], resistantTo: ['Grass', 'Fighting', 'Ground'], immuneTo: [] },
  Rock: { weakTo: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'], resistantTo: ['Normal', 'Fire', 'Poison', 'Flying'], immuneTo: [] },
  Ghost: { weakTo: ['Ghost', 'Dark'], resistantTo: ['Poison', 'Bug'], immuneTo: ['Normal', 'Fighting'] },
  Dragon: { weakTo: ['Ice', 'Dragon', 'Fairy'], resistantTo: ['Fire', 'Water', 'Electric', 'Grass'], immuneTo: [] },
  Dark: { weakTo: ['Fighting', 'Bug', 'Fairy'], resistantTo: ['Ghost', 'Dark'], immuneTo: ['Psychic'] },
  Steel: { weakTo: ['Fire', 'Fighting', 'Ground'], resistantTo: ['Normal', 'Grass', 'Ice', 'Flying', 'Psychic', 'Bug', 'Rock', 'Dragon', 'Steel', 'Fairy'], immuneTo: ['Poison'] },
  Fairy: { weakTo: ['Poison', 'Steel'], resistantTo: ['Fighting', 'Bug', 'Dark'], immuneTo: ['Dragon'] }
};

// Fonction pour obtenir tous les counters d'un pokémon
const getCounters = (pokemon, allPokemons) => {
  const weaknesses = [];
  
  pokemon.type.forEach(type => {
    const typeData = TYPE_EFFECTIVENESS[type];
    if (typeData) {
      weaknesses.push(...typeData.weakTo);
    }
  });
  
  const uniqueWeaknesses = [...new Set(weaknesses)];
  
  const counters = allPokemons.filter(p => 
    p._id !== pokemon._id && 
    p.type.some(t => uniqueWeaknesses.includes(t))
  ).slice(0, 6);
  
  return { weaknesses: uniqueWeaknesses, counters };
};

// Fonction pour obtenir le dresseur selon le type principal
const getTrainer = (pokemon) => {
  const type = pokemon.type[0].toLowerCase();
  
  // IDs des dresseurs dans PokeAPI
  const trainerIds = {
    fire: 'blaine',
    water: 'misty',
    grass: 'erika',
    electric: 'lt-surge',
    psychic: 'sabrina',
    fighting: 'bruno',
    rock: 'brock',
    ground: 'giovanni',
    poison: 'koga',
    ghost: 'morty',
    ice: 'pryce',
    dragon: 'lance',
    bug: 'bugsy',
    steel: 'jasmine',
    flying: 'falkner',
    normal: 'whitney',
    dark: 'karen',
    fairy: 'valerie'
  };
  
  const trainerId = trainerIds[type] || 'red';
  
  // Utiliser l'API officielle Pokémon pour les sprites
  return `https://img.pokemondb.net/sprites/black-white/normal/${trainerId}.png`;
};

// Sons
const playSound = (type) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  if (type === 'click') {
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.1;
  } else if (type === 'hover') {
    oscillator.frequency.value = 400;
    gainNode.gain.value = 0.05;
  }
  
  oscillator.start();
  setTimeout(() => oscillator.stop(), 100);
};

function App() {
  // États
  const [pokemons, setPokemons] = useState([]);
  const [allPokemons, setAllPokemons] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('Tous');
  const [loading, setLoading] = useState(false);
  
  // Nouveaux états
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('pokemonFavorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showWeaknesses, setShowWeaknesses] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'list';
  });
  const [showCircleTransition, setShowCircleTransition] = useState(false);
  const [filteredPokemons, setFilteredPokemons] = useState([]); // Pokémons filtrés
  const [musicEnabled, setMusicEnabled] = useState(() => {
    const saved = localStorage.getItem('musicEnabled');
    return saved === 'true';
  });
  const [audioPlayer, setAudioPlayer] = useState(null);

  // Sauvegarder les favoris
  useEffect(() => {
    localStorage.setItem('pokemonFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // Sauvegarder le mode sombre
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Sauvegarder le mode d'affichage
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  // Gérer la musique
  useEffect(() => {
    localStorage.setItem('musicEnabled', musicEnabled);
    
    if (musicEnabled) {
      if (!audioPlayer) {
        const audio = new Audio();
        
        // Musique Pokémon - Thème principal (fichier qui fonctionne)
        // Alternative : mettez votre propre fichier MP3 dans public/music.mp3
        audio.src = '/music.mp3'; // Vous devrez ajouter ce fichier
        audio.loop = true;
        audio.volume = 0.15;
        
        // Tenter de jouer
        audio.play()
          .then(() => {
            console.log('🎵 Musique lancée !');
            setAudioPlayer(audio);
          })
          .catch(() => {
            console.log('⚠️ Cliquez n\'importe où pour activer la musique');
            // Attendre interaction utilisateur
            const startAudio = () => {
              audio.play().then(() => setAudioPlayer(audio));
              document.removeEventListener('click', startAudio);
            };
            document.addEventListener('click', startAudio, { once: true });
          });
      }
    } else if (!musicEnabled && audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      setAudioPlayer(null);
    }
    
    return () => {
      if (audioPlayer && !musicEnabled) {
        audioPlayer.pause();
      }
    };
  }, [musicEnabled]);

  // Charger les pokemons
  useEffect(() => {
    if (selectedType === 'Favoris') {
      filterFavorites();
    } else if (selectedType === 'Tous') {
      fetchPokemons();
    } else {
      filterByType(selectedType);
    }
  }, [page, selectedType]);

  const fetchPokemons = async () => {
    setLoading(true);
    try {
      // Charger TOUS les pokémons pour le filtre "Tous"
      const res = await fetch(`${API}?page=1&limit=10000`);
      const data = await res.json();
      
      // Stocker TOUS les pokémons
      setAllPokemons(data.pokemons);
      
      // Afficher seulement les 20 premiers
      const limit = 20;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = data.pokemons.slice(start, end);
      
      setPokemons(paginated);
      setTotalPages(Math.ceil(data.pokemons.length / limit));
    } catch (error) {
      alert('❌ Erreur de chargement');
    }
    setLoading(false);
  };

  // MODIFIÉ: Filtre sur TOUS les pokémons (déjà chargés)
  const filterByType = (type) => {
    setLoading(true);
    
    // Filtrer depuis allPokemons (tous les pokémons chargés)
    const filtered = allPokemons.filter(pokemon => 
      pokemon.type.includes(type)
    );
    
    // Sauvegarder les filtrés
    setFilteredPokemons(filtered);
    
    // Afficher TOUS les résultats filtrés (pas de pagination)
    setPokemons(filtered);
    setTotalPages(1); // Une seule page avec tout
    setPage(1);
    setLoading(false);
  };

  // NOUVEAU: Filtre favoris (depuis allPokemons déjà chargés)
  const filterFavorites = () => {
    setLoading(true);
    
    // Filtrer TOUS les favoris
    const favPokemons = allPokemons.filter(p => favorites.includes(p._id));
    
    // Sauvegarder les filtrés
    setFilteredPokemons(favPokemons);
    
    // Afficher TOUS les favoris (pas de pagination)
    setPokemons(favPokemons);
    setTotalPages(1); // Une seule page avec tout
    setPage(1);
    setLoading(false);
  };

  const fetchPokemon = async (id) => {
    if (compareMode) {
      handleCompareSelect(id);
      return;
    }
    
    if (soundEnabled) playSound('click');
    setLoading(true);
    try {
      const res = await fetch(`${API}/${id}`);
      const data = await res.json();
      setSelectedPokemon(data);
    } catch (error) {
      alert('❌ Erreur');
    }
    setLoading(false);
  };

  const searchPokemon = async () => {
    if (!searchTerm.trim()) {
      setSelectedType('Tous');
      setPage(1);
      fetchPokemons();
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API}/search?name=${searchTerm}`);
      const data = await res.json();
      
      if (data.error) {
        alert('❌ Pokemon non trouvé');
        setPokemons([]);
      } else {
        setPokemons([data]);
        setSelectedType('Tous');
      }
    } catch (error) {
      alert('❌ Erreur de recherche');
      setPokemons([]);
    }
    setLoading(false);
  };

  const updatePokemon = async () => {
    try {
      const res = await fetch(`${API}/${selectedPokemon._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedPokemon)
      });
      
      if (res.ok) {
        alert('✅ Pokemon modifié !');
        setSelectedPokemon(null);
        if (selectedType === 'Tous') {
          fetchPokemons();
        } else if (selectedType === 'Favoris') {
          filterFavorites();
        } else {
          filterByType(selectedType);
        }
      }
    } catch (error) {
      alert('❌ Erreur de modification');
    }
  };

  const deletePokemon = async () => {
    try {
      const res = await fetch(`${API}/${selectedPokemon._id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert('✅ Pokemon supprimé !');
        setShowDeleteModal(false);
        setSelectedPokemon(null);
        if (selectedType === 'Tous') {
          fetchPokemons();
        } else if (selectedType === 'Favoris') {
          filterFavorites();
        } else {
          filterByType(selectedType);
        }
      }
    } catch (error) {
      alert('❌ Erreur de suppression');
    }
  };

  const createPokemon = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    
    const newPokemon = {
      name: {
        english: form.get('name'),
        japanese: form.get('name'),
        chinese: form.get('name'),
        french: form.get('name')
      },
      type: [form.get('type1'), form.get('type2')].filter(Boolean),
      base: {
        HP: parseInt(form.get('hp')),
        Attack: parseInt(form.get('attack')),
        Defense: parseInt(form.get('defense')),
        SpecialAttack: parseInt(form.get('spattack')),
        SpecialDefense: parseInt(form.get('spdefense')),
        Speed: parseInt(form.get('speed'))
      },
      image: uploadedImage || form.get('image') || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'
    };

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPokemon)
      });
      
      if (res.ok) {
        alert('✅ Pokemon créé !');
        setIsCreating(false);
        setUploadedImage(null);
        setSelectedType('Tous');
        setPage(1);
        fetchPokemons();
      }
    } catch (error) {
      alert('❌ Erreur de création');
    }
  };

  const updateField = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSelectedPokemon({
        ...selectedPokemon,
        [parent]: { ...selectedPokemon[parent], [child]: value }
      });
    } else {
      setSelectedPokemon({ ...selectedPokemon, [field]: value });
    }
  };

  const handleTypeChange = (type) => {
    if (soundEnabled) playSound('click');
    setSelectedType(type);
    setPage(1);
    setSearchTerm('');
  };

  const toggleFavorite = (pokemonId) => {
    if (soundEnabled) playSound('click');
    setFavorites(prev => 
      prev.includes(pokemonId) 
        ? prev.filter(id => id !== pokemonId)
        : [...prev, pokemonId]
    );
  };

  const isFavorite = (pokemonId) => favorites.includes(pokemonId);

  const handleCompareSelect = (pokemonId) => {
    if (compareList.length >= 2) {
      alert('Vous pouvez comparer seulement 2 pokémons à la fois');
      return;
    }
    
    const pokemon = pokemons.find(p => p._id === pokemonId);
    if (pokemon && !compareList.find(p => p._id === pokemonId)) {
      const newList = [...compareList, pokemon];
      setCompareList(newList);
      
      // Transition cercle quand 2 pokémons sélectionnés
      if (newList.length === 2) {
        setShowCircleTransition(true);
        setTimeout(() => {
          setShowCircleTransition(false);
        }, 1500); // 1.5s pour animation plus lente
      }
    }
  };

  const clearComparison = () => {
    setCompareList([]);
    setCompareMode(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Composant Radar Chart
  const RadarChart = ({ pokemon }) => {
    const stats = pokemon.base;
    const statNames = ['HP', 'Attack', 'Defense', 'Sp.Atk', 'Sp.Def', 'Speed'];
    const statValues = [
      stats.HP, stats.Attack, stats.Defense,
      stats.SpecialAttack, stats.SpecialDefense, stats.Speed
    ];
    
    const maxStat = 255;
    const centerX = 100;
    const centerY = 100;
    const radius = 80;
    const angles = statNames.map((_, i) => (i * 2 * Math.PI) / 6 - Math.PI / 2);
    
    const points = statValues.map((value, i) => {
      const r = (value / maxStat) * radius;
      const x = centerX + r * Math.cos(angles[i]);
      const y = centerY + r * Math.sin(angles[i]);
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg viewBox="0 0 200 200" className="radar-chart">
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <polygon
            key={i}
            points={angles.map(angle => {
              const r = radius * scale;
              const x = centerX + r * Math.cos(angle);
              const y = centerY + r * Math.sin(angle);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        
        {angles.map((angle, i) => (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={centerX + radius * Math.cos(angle)}
            y2={centerY + radius * Math.sin(angle)}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        
        <polygon
          points={points}
          fill="#667eea"
          fillOpacity="0.3"
          stroke="#667eea"
          strokeWidth="2"
        />
        
        {statNames.map((name, i) => {
          const labelRadius = radius + 20;
          const x = centerX + labelRadius * Math.cos(angles[i]);
          const y = centerY + labelRadius * Math.sin(angles[i]);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              fontWeight="600"
            >
              {name}
            </text>
          );
        })}
      </svg>
    );
  };

  // ========================================
  // RENDU: Vue Comparaison
  // ========================================
  if (compareList.length === 2) {
    const [poke1, poke2] = compareList;
    
    return (
      <div className="app">
        {/* Transition cercle */}
        {showCircleTransition && <div className="circle-transition" />}
        
        <header className="header">
          <button onClick={clearComparison}>← Retour</button>
          <h2>⚔️ Comparaison</h2>
          <button onClick={clearComparison}>✕ Fermer</button>
        </header>

        <div className="comparison-container">
          {[poke1, poke2].map((pokemon, idx) => (
            <div key={pokemon._id} className="comparison-card">
              <div className="comparison-header">
                <img src={pokemon.image} alt={pokemon.name.english} />
                <h2>{pokemon.name.english}</h2>
                <p className="pokemon-id">#{pokemon.id}</p>
                
                {/* Dresseur */}
                <div className="trainer-badge">
                  <img src={getTrainer(pokemon)} alt="Dresseur" className="trainer-image" />
                  <p className="trainer-label">Dresseur {pokemon.type[0]}</p>
                </div>
                
                <div className="types">
                  {pokemon.type.map((type, i) => (
                    <span key={i} className={`type ${type.toLowerCase()}`}>
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="radar-container">
                <RadarChart pokemon={pokemon} />
              </div>

              <div className="stats-comparison">
                {Object.entries(pokemon.base).map(([stat, value]) => (
                  <div key={stat} className="stat-compare-row">
                    <span className="stat-name">{stat}</span>
                    <div className="stat-bar-container">
                      <div
                        className="stat-bar-fill"
                        style={{ width: `${(value / 255) * 100}%` }}
                      />
                      <span className="stat-value">{value}</span>
                    </div>
                  </div>
                ))}
                <div className="total-stats">
                  <strong>Total:</strong>{' '}
                  {Object.values(pokemon.base).reduce((a, b) => a + b, 0)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="comparison-winner">
          {Object.values(poke1.base).reduce((a, b) => a + b, 0) >
           Object.values(poke2.base).reduce((a, b) => a + b, 0) ? (
            <h3>🏆 {poke1.name.english} a de meilleures stats totales !</h3>
          ) : Object.values(poke1.base).reduce((a, b) => a + b, 0) <
               Object.values(poke2.base).reduce((a, b) => a + b, 0) ? (
            <h3>🏆 {poke2.name.english} a de meilleures stats totales !</h3>
          ) : (
            <h3>🤝 Égalité parfaite !</h3>
          )}
        </div>
      </div>
    );
  }

  // ========================================
  // RENDU: Vue Liste
  // ========================================
  if (!selectedPokemon && !isCreating) {
    return (
      <div className="app">
        <header className="header">
          <h1>🔴 Pokédex</h1>
          
          <div className="header-controls">
            <button
              className={`icon-btn ${darkMode ? 'active' : ''}`}
              onClick={() => setDarkMode(!darkMode)}
              title="Mode sombre"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              className={`icon-btn ${soundEnabled ? 'active' : ''}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title="Sons"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <button
              className={`icon-btn ${musicEnabled ? 'active' : ''}`}
              onClick={() => setMusicEnabled(!musicEnabled)}
              title="Musique"
            >
              {musicEnabled ? '🎵' : '🎶'}
            </button>
            <button
              className={`icon-btn ${compareMode ? 'active' : ''}`}
              onClick={() => {
                setCompareMode(!compareMode);
                if (!compareMode) setCompareList([]);
              }}
              title="Mode comparaison"
            >
              ⚔️
            </button>
            
            {/* MODES D'AFFICHAGE */}
            <div className="view-mode-controls">
              <button
                className={`icon-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Mode Liste"
              >
                📋
              </button>
              <button
                className={`icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Mode Grille"
              >
                ⊞
              </button>
            </div>
          </div>

          <div className="search-bar">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              onKeyPress={(e) => e.key === 'Enter' && searchPokemon()}
            />
            <button onClick={searchPokemon}>🔍</button>
            {searchTerm && (
              <button onClick={() => {
                setSearchTerm('');
                setSelectedType('Tous');
                setPage(1);
                fetchPokemons();
              }}>✕</button>
            )}
          </div>

          <button className="btn-create" onClick={() => setIsCreating(true)}>
            + Créer
          </button>
        </header>

        {compareMode && compareList.length > 0 && (
          <div className="compare-banner">
            <span>{compareList.length}/2 pokémons sélectionnés</span>
            {compareList.length === 2 && (
              <button className="btn-primary">✓ Comparer</button>
            )}
            <button className="btn-secondary" onClick={clearComparison}>✕ Annuler</button>
          </div>
        )}

        <div className="type-filters">
          {/* NOUVEAU: Bouton Favoris */}
          <button
            className={`type-filter-btn ${selectedType === 'Favoris' ? 'active' : ''}`}
            style={{ background: '#ef4444' }}
            onClick={() => handleTypeChange('Favoris')}
          >
            ❤️ Favoris
          </button>
          
          {POKEMON_TYPES.map((type) => (
            <button
              key={type}
              className={`type-filter-btn ${selectedType === type ? 'active' : ''} ${
                type !== 'Tous' ? `type-${type.toLowerCase()}` : ''
              }`}
              onClick={() => handleTypeChange(type)}
              onMouseEnter={() => soundEnabled && playSound('hover')}
            >
              {type}
            </button>
          ))}
        </div>

        {selectedType !== 'Tous' && !loading && (
          <div className="filter-info">
            🔍 Filtré par {selectedType === 'Favoris' ? 'Favoris' : `type: ${selectedType}`} ({filteredPokemons.length} pokémons au total)
          </div>
        )}

        {loading && <div className="loading">Chargement...</div>}

        {!loading && (
          <>
            <div className={`grid ${viewMode === 'grid' ? 'grid-mode' : ''}`}>
              {pokemons.map((pokemon) => (
                <div
                  key={pokemon._id}
                  className={`card ${isRare(pokemon) ? 'rare-card' : ''} ${
                    compareMode && compareList.find(p => p._id === pokemon._id) ? 'selected-compare' : ''
                  }`}
                  data-type={pokemon.type[0]?.toLowerCase()}
                  onClick={() => fetchPokemon(pokemon._id)}
                  onMouseEnter={() => soundEnabled && playSound('hover')}
                >
                  {isRare(pokemon) && (
                    <div className="rare-badge">
                      <span className="sparkle">✨</span>
                      RARE
                      <span className="sparkle">✨</span>
                    </div>
                  )}
                  
                  <button
                    className={`favorite-btn ${isFavorite(pokemon._id) ? 'favorited' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(pokemon._id);
                    }}
                  >
                    {isFavorite(pokemon._id) ? '❤️' : '🤍'}
                  </button>

                  <div className="card-image">
                    <img
                      src={pokemon.image}
                      alt={pokemon.name.english}
                      onError={(e) => {
                        e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
                      }}
                    />
                  </div>
                  
                  <div className="card-content">
                    <div className="card-header">
                      <h3>{pokemon.name.english}</h3>
                      <span className="generation-badge">{getGeneration(pokemon.id)}</span>
                    </div>
                    <p className="pokemon-id">#{pokemon.id}</p>
                    <div className="types">
                      {pokemon.type.map((type, i) => (
                        <span key={i} className={`type ${type.toLowerCase()}`}>
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!searchTerm && pokemons.length > 0 && totalPages > 1 && selectedType === 'Tous' && (
              <div className="pagination">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  ← Précédent
                </button>
                <span>Page {page} / {totalPages}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Suivant →
                </button>
              </div>
            )}

            {pokemons.length === 0 && !loading && (
              <div className="no-results">
                {selectedType === 'Favoris' ? 'Aucun favori. Ajoutez des pokémons en cliquant sur ❤️' : 'Aucun pokemon trouvé'}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ========================================
  // RENDU: Vue Détails
  // ========================================
  if (selectedPokemon) {
    return (
      <div className="app">
        <header className="header">
          <button onClick={() => setSelectedPokemon(null)}>← Retour</button>
          <h2>{selectedPokemon.name.english}</h2>
          <div className="header-actions">
            <button
              className={`favorite-btn-large ${isFavorite(selectedPokemon._id) ? 'favorited' : ''}`}
              onClick={() => toggleFavorite(selectedPokemon._id)}
            >
              {isFavorite(selectedPokemon._id) ? '❤️ Favori' : '🤍 Ajouter aux favoris'}
            </button>
            <button className="btn-save" onClick={updatePokemon}>
              💾 Sauvegarder
            </button>
            <button
              className="btn-delete"
              onClick={() => setShowDeleteModal(true)}
            >
              🗑️ Supprimer
            </button>
          </div>
        </header>

        <div className="detail">
          <div className="detail-image">
            <div className="pokemon-display">
              <img
                src={selectedPokemon.image}
                alt={selectedPokemon.name.english}
                onError={(e) => {
                  e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
                }}
              />
            </div>
            <p className="pokemon-id">#{selectedPokemon.id}</p>
            <span className="generation-badge-large">{getGeneration(selectedPokemon.id)}</span>
            
            {/* Dresseur */}
            <div className="trainer-badge">
              <img src={getTrainer(selectedPokemon)} alt="Dresseur" className="trainer-image" />
              <p className="trainer-label">Dresseur {selectedPokemon.type[0]}</p>
            </div>
            
            <div className="types">
              {selectedPokemon.type.map((type, i) => (
                <span key={i} className={`type ${type.toLowerCase()}`}>
                  {type}
                </span>
              ))}
            </div>
            
            <div className="radar-container">
              <h4>Graphique des Stats</h4>
              <RadarChart pokemon={selectedPokemon} />
            </div>

            {/* Section Faiblesses et Counters */}
            <div className="weaknesses-section">
              <button 
                className="btn-weaknesses"
                onClick={() => setShowWeaknesses(!showWeaknesses)}
              >
                {showWeaknesses ? '▼' : '▶'} Faiblesses & Counters
              </button>
              
              {showWeaknesses && (
                <div className="weaknesses-content">
                  {selectedPokemon.type.map(type => {
                    const typeData = TYPE_EFFECTIVENESS[type];
                    if (!typeData) return null;
                    
                    return (
                      <div key={type} className="type-weaknesses">
                        <h5>Type {type}</h5>
                        
                        {typeData.weakTo.length > 0 && (
                          <div className="weakness-row">
                            <strong>⚠️ Faible contre :</strong>
                            <div className="types">
                              {typeData.weakTo.map(t => (
                                <span key={t} className={`type ${t.toLowerCase()}`}>{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {typeData.resistantTo.length > 0 && (
                          <div className="weakness-row">
                            <strong>🛡️ Résistant à :</strong>
                            <div className="types">
                              {typeData.resistantTo.map(t => (
                                <span key={t} className={`type ${t.toLowerCase()}`}>{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {typeData.immuneTo.length > 0 && (
                          <div className="weakness-row">
                            <strong>❌ Immunisé contre :</strong>
                            <div className="types">
                              {typeData.immuneTo.map(t => (
                                <span key={t} className={`type ${t.toLowerCase()}`}>{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  <div className="counters-section">
                    <h5>🎯 Meilleurs Counters</h5>
                    <p className="counters-hint">Ces pokémons sont efficaces contre {selectedPokemon.name.english}</p>
                    <div className="counters-grid">
                      {getCounters(selectedPokemon, allPokemons).counters.map(counter => (
                        <div 
                          key={counter._id} 
                          className="counter-card"
                          onClick={() => fetchPokemon(counter._id)}
                        >
                          <img src={counter.image} alt={counter.name.english} />
                          <div className="counter-info">
                            <p className="counter-name">{counter.name.english}</p>
                            <div className="types">
                              {counter.type.map((type, i) => (
                                <span key={i} className={`type ${type.toLowerCase()}`}>
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="detail-form">
            <div className="form-group">
              <label>Nom (English)</label>
              <input
                type="text"
                value={selectedPokemon.name.english}
                onChange={(e) => updateField('name.english', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Image URL</label>
              <input
                type="text"
                value={selectedPokemon.image}
                onChange={(e) => updateField('image', e.target.value)}
              />
            </div>

            <h3>Stats de Base</h3>
            
            {Object.entries(selectedPokemon.base).map(([stat, value]) => (
              <div key={stat} className="form-group">
                <label>{stat}: {value}</label>
                <input
                  type="range"
                  min="1"
                  max="255"
                  value={value}
                  onChange={(e) => updateField(`base.${stat}`, parseInt(e.target.value))}
                />
              </div>
            ))}
            
            <div className="total-stats-display">
              <strong>Stats Totales:</strong>{' '}
              {Object.values(selectedPokemon.base).reduce((a, b) => a + b, 0)} / 1530
            </div>
          </div>
        </div>

        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>⚠️ Confirmer la suppression</h3>
              <p>Voulez-vous vraiment supprimer <strong>{selectedPokemon.name.english}</strong> ?</p>
              <p>Cette action est irréversible.</p>
              <div className="modal-actions">
                <button onClick={() => setShowDeleteModal(false)}>Annuler</button>
                <button className="btn-delete" onClick={deletePokemon}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // RENDU: Vue Création
  // ========================================
  return (
    <div className="app">
      <header className="header">
        <button onClick={() => setIsCreating(false)}>← Retour</button>
        <h2>Créer un Pokemon</h2>
      </header>

      <form onSubmit={createPokemon} className="create-form">
        <div className="form-group">
          <label>Nom *</label>
          <input name="name" required placeholder="Pikachu" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Type 1 *</label>
            <select name="type1" required>
              <option value="">Sélectionner</option>
              {POKEMON_TYPES.slice(1).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Type 2</label>
            <select name="type2">
              <option value="">Aucun</option>
              {POKEMON_TYPES.slice(1).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Image URL</label>
          <input name="image" placeholder="https://..." />
        </div>

        <div className="form-group">
          <label>OU Upload une image depuis votre PC 📸</label>
          <div className="image-upload-container">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              id="image-upload"
              className="image-upload-input"
            />
            <label htmlFor="image-upload" className="image-upload-label">
              {uploadedImage ? '✓ Image chargée' : '📁 Choisir une image'}
            </label>
            {uploadedImage && (
              <div className="image-preview">
                <img src={uploadedImage} alt="Preview" />
                <button 
                  type="button"
                  onClick={() => setUploadedImage(null)}
                  className="remove-image-btn"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <p className="upload-hint">L'image uploadée remplacera l'URL ci-dessus</p>
        </div>

        <h3>Stats de Base</h3>

        <div className="stats-grid">
          <div className="form-group">
            <label>HP</label>
            <input name="hp" type="number" defaultValue="50" min="1" max="255" />
          </div>
          <div className="form-group">
            <label>Attack</label>
            <input name="attack" type="number" defaultValue="50" min="1" max="255" />
          </div>
          <div className="form-group">
            <label>Defense</label>
            <input name="defense" type="number" defaultValue="50" min="1" max="255" />
          </div>
          <div className="form-group">
            <label>Sp. Attack</label>
            <input name="spattack" type="number" defaultValue="50" min="1" max="255" />
          </div>
          <div className="form-group">
            <label>Sp. Defense</label>
            <input name="spdefense" type="number" defaultValue="50" min="1" max="255" />
          </div>
          <div className="form-group">
            <label>Speed</label>
            <input name="speed" type="number" defaultValue="50" min="1" max="255" />
          </div>
        </div>

        <button type="submit" className="btn-create">Créer le Pokemon</button>
      </form>
    </div>
  );
}

export default App;
