# 🎵 INSTALLATION MUSIQUE POKÉMON

## Option 1 : Fichier local (RECOMMANDÉ)

### Étape 1 : Télécharger la musique
Téléchargez une musique Pokémon (MP3) depuis :
- YouTube (utilisez un convertisseur YouTube to MP3)
- Recherche : "Pokemon Theme Song MP3"
- Ou : "Pokemon Route 1 8bit MP3"

### Étape 2 : Placer le fichier
```bash
# Créer le dossier public s'il n'existe pas
mkdir -p frontend/public

# Copier votre fichier MP3
cp ~/Downloads/pokemon-theme.mp3 frontend/public/music.mp3
```

### Étape 3 : C'est tout !
Le code est déjà configuré pour lire `/music.mp3`

---

## Option 2 : URL externe

Si vous préférez une URL, modifiez dans `App.jsx` ligne ~155 :

```javascript
// Remplacez
audio.src = '/music.mp3';

// Par une URL qui marche (exemples)
audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

// Ou votre propre URL
audio.src = 'https://mon-serveur.com/pokemon-theme.mp3';
```

---

## 🎮 Musiques Pokémon recommandées

**Thèmes classiques :**
- Pokemon Theme Song (original)
- Route 1 (Kanto)
- Lavender Town
- Battle Theme
- Pallet Town
- Pokemon Center

**Où trouver :**
1. YouTube → Convertir en MP3
2. https://downloads.khinsider.com/game-soundtracks/album/pokemon-red-blue
3. Recherche Google : "Pokemon OST MP3"

---

## 🔧 Dépannage

### La musique ne démarre pas
- **Cause** : Les navigateurs bloquent l'autoplay
- **Solution** : Cliquez n'importe où sur la page après avoir activé 🎵

### Volume trop fort/faible
Changez dans le code (ligne ~160) :
```javascript
audio.volume = 0.15; // 0.0 à 1.0 (15% actuellement)
```

### Le fichier ne charge pas
Vérifiez :
```bash
# Le fichier existe ?
ls frontend/public/music.mp3

# Il fait moins de 5 MB ?
du -h frontend/public/music.mp3
```

---

## ✅ Test rapide

1. Placez `music.mp3` dans `frontend/public/`
2. Lancez `npm run dev`
3. Cliquez sur 🎵 dans le header
4. Cliquez sur la page si rien ne se passe
5. Profitez ! 🎶

---

## 🎨 Images des dresseurs

Les images utilisent maintenant **PokemonDB** :
- URL : `https://img.pokemondb.net/sprites/black-white/normal/[trainer-name].png`
- Exemples : brock, misty, lt-surge, sabrina, etc.
- Fallback : red (le joueur légendaire)

**Dresseurs par type :**
- Fire → Blaine
- Water → Misty
- Grass → Erika
- Electric → Lt. Surge
- Psychic → Sabrina
- Fighting → Bruno
- Rock → Brock
- etc.

Ces sprites sont **officiels** et marchent sans problème de CORS ! ✅
