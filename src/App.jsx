import './App.css'

import Title from './components/title'
import Counter from './components/counter'
import PokeList from './components/pokelist'
import { useState, useEffect } from 'react';
import './App.css';

const API = 'http://localhost:5000/api/pokemon';

function App() {
  const [pokemons, setPokemons] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // charger les pokemons au chargement et changement de page
  useEffect(() => {
    fetchPokemons();
  }, [page]);

  // liste des pokemons
  const fetchPokemons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}?page=${page}`);
      const data = await res.json();
      setPokemons(data.pokemons);
      setTotalPages(data.totalPages);
    } catch (error) {
      alert('Erreur de chargement');
    }
    setLoading(false);
  };

  // récupérer un pokemon par ID
  const fetchPokemon = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/${id}`);
      const data = await res.json();
      setSelectedPokemon(data);
    } catch (error) {
      alert('Erreur');
    }
    setLoading(false);
  };

  // rechercher un pokemon par nom
  const searchPokemon = async () => {
    if (!searchTerm.trim()) {
      fetchPokemons();
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API}/search?name=${searchTerm}`);
      const data = await res.json();
      
      if (data.error) {
        alert('Pokemon non trouvé');
        setPokemons([]);
      } else {
        setPokemons([data]);
      }
    } catch (error) {
      alert('Erreur de recherche');
      setPokemons([]);
    }
    setLoading(false);
  };

  //  modifier un pokemon
  const updatePokemon = async () => {
    try {
      const res = await fetch(`${API}/${selectedPokemon._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedPokemon)
      });
      
      if (res.ok) {
        alert('Pokemon modifié !');
        setSelectedPokemon(null);
        fetchPokemons();
      }
    } catch (error) {
      alert('Erreur de modification');
    }
  };

  //  supprimer un pokemon
  const deletePokemon = async () => {
    try {
      const res = await fetch(`${API}/${selectedPokemon._id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert('Pokemon supprimé !');
        setShowDeleteModal(false);
        setSelectedPokemon(null);
        fetchPokemons();
      }
    } catch (error) {
      alert('Erreur de suppression');
    }
  };

  //  créer un nouveau pokemon
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
      image: form.get('image') || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'
    };

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPokemon)
      });
      
      if (res.ok) {
        alert('Pokemon créé !');
        setIsCreating(false);
        fetchPokemons();
      }
    } catch (error) {
      alert(' Erreur de création');
    }
  };

  //  modifier une valeur du pokemon sélectionné
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


  if (!selectedPokemon && !isCreating) {
    return (
      <div className="app">
        {/* Header */}
        <header className="header">
          <h1>🔴 Pokédex</h1>
          
          {/* Barre de recherche */}
          <div className="search-bar">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un pokemon..."
              onKeyPress={(e) => e.key === 'Enter' && searchPokemon()}
            />
            <button onClick={searchPokemon}>🔍</button>
            {searchTerm && (
              <button onClick={() => {
                setSearchTerm('');
                fetchPokemons();
              }}>✕</button>
            )}
          </div>

          <button className="btn-create" onClick={() => setIsCreating(true)}>
            + Créer
          </button>
        </header>

        {/* Loading */}
        {loading && <div className="loading">Chargement...</div>}

        {/* Grille de cartes */}
        {!loading && (
          <>
            <div className="grid">
              {pokemons.map((pokemon) => (
                <div
                  key={pokemon._id}
                  className="card"
                  onClick={() => fetchPokemon(pokemon._id)}
                >
                  <img
                    src={pokemon.image}
                    alt={pokemon.name.english}
                    onError={(e) => {
                      e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
                    }}
                  />
                  <p className="pokemon-id">#{pokemon.id}</p>
                  <h3>{pokemon.name.english}</h3>
                  <div className="types">
                    {pokemon.type.map((type, i) => (
                      <span key={i} className={`type ${type.toLowerCase()}`}>
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {!searchTerm && pokemons.length > 0 && (
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
              <div className="no-results">Aucun pokemon trouvé</div>
            )}
          </>
        )}
      </div>
    );
  }


  if (selectedPokemon) {
    return (
      <div className="app">
        <header className="header">
          <button onClick={() => setSelectedPokemon(null)}>← Retour</button>
          <h2>{selectedPokemon.name.english}</h2>
          <div className="header-actions">
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
          {/* Image */}
          <div className="detail-image">
            <img
              src={selectedPokemon.image}
              alt={selectedPokemon.name.english}
              onError={(e) => {
                e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
              }}
            />
            <p className="pokemon-id">#{selectedPokemon.id}</p>
            <div className="types">
              {selectedPokemon.type.map((type, i) => (
                <span key={i} className={`type ${type.toLowerCase()}`}>
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* modification */}
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
          </div>
        </div>

        {/* suppression */}
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
            <input name="type1" required placeholder="Electric" />
          </div>
          <div className="form-group">
            <label>Type 2</label>
            <input name="type2" placeholder="Flying" />
          </div>
        </div>

        <div className="form-group">
          <label>Image URL</label>
          <input name="image" placeholder="https://..." />
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
