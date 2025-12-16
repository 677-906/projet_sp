# Solutions pour le Crash d'Expo Go

## Diagnostic du Problème

Le crash d'Expo Go est causé par la **surcharge mémoire** due à:

1. **Formulaire très complexe** avec:
   - 22 produits pour le relevé de stock
   - 22 marques pour la veille concurrentielle
   - Tableaux dynamiques pour ruptures/incidents
   - Nombreux pickers imbriqués (zones, commerciaux, clients)

2. **Too many re-renders**:
   - Chaque modification déclenche des re-renders multiples
   - Les ScrollView imbriqués créent des problèmes de performance
   - Les calculs de totaux se refont à chaque modification

## Solutions Recommandées

### Solution 1: Fragmenter le Formulaire (RECOMMANDÉ)

Diviser le formulaire en plusieurs écrans/étapes:

**Étape 1**: Informations Client
- Zone, Commercial, Client
- Lieu-dit
- Horaires (heure début/fin)
- Base

**Étape 2**: Équipements & Conformité
- Type outil, marque, état
- FIFO, Planogramme

**Étape 3**: Relevé de Stock
- Seulement les 22 produits (pas de tableau dynamique)

**Étape 4**: Ruptures & Incidents
- Tableau dynamique simplifié

**Étape 5**: Veille Concurrentielle
- Tableau simplifié avec lazy loading

**Étape 6**: Informations Commerciales
- Réseau distribution, type client
- Observations générales

### Solution 2: Optimisations Techniques (URGENT)

#### A. Limiter les ScrollView Imbriqués

```javascript
// AVANT (PROBLÈME)
<ScrollView>
  <ScrollView horizontal>
    <ScrollView nestedScrollEnabled>
      ...
    </ScrollView>
  </ScrollView>
</ScrollView>

// APRÈS (SOLUTION)
<ScrollView>
  <View style={{ maxHeight: 400 }}>
    <FlatList
      horizontal
      data={items}
      renderItem={renderItem}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
    />
  </View>
</ScrollView>
```

#### B. Utiliser FlatList au lieu de map()

Pour la veille concurrentielle, remplacer:

```javascript
// AVANT
{marques.map((marque) => <VeilleRow marque={marque} />)}

// APRÈS
<FlatList
  data={marques}
  renderItem={({item}) => <VeilleRow marque={item} />}
  keyExtractor={(item) => item}
  windowSize={5}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  initialNumToRender={10}
/>
```

#### C. Debounce les inputs

```javascript
import { debounce } from 'lodash';

const handleUpdateVeille = useCallback(
  debounce((marque, field, value) => {
    setVeillesData(prev => ({
      ...prev,
      [marque]: { ...prev[marque], [field]: value }
    }));
  }, 300),
  []
);
```

### Solution 3: Réduire le State Initial

Au lieu d'initialiser 22 marques au chargement:

```javascript
// AVANT
const [veillesData, setVeillesData] = useState({
  'SP': { packs: '', concurrent: null, activite: '', mecanisme: '' },
  'OP': { packs: '', concurrent: null, activite: '', mecanisme: '' },
  // ... 20 autres
});

// APRÈS (Lazy initialization)
const [veillesData, setVeillesData] = useState({});

// Créer les entrées seulement quand l'utilisateur modifie
const handleUpdateVeille = (marque, field, value) => {
  setVeillesData(prev => ({
    ...prev,
    [marque]: { ...(prev[marque] || {}), [field]: value }
  }));
};
```

### Solution 4: Utiliser React Native Performance

```bash
# Installer les outils de performance
npm install react-native-performance @react-native-community/netinfo

# Dans VisitFormScreen.js
import { InteractionManager } from 'react-native';

useEffect(() => {
  const task = InteractionManager.runAfterInteractions(() => {
    // Charger les données lourdes APRÈS le rendu initial
    loadProductsAndConcurrents();
  });

  return () => task.cancel();
}, []);
```

### Solution 5: Activer Hermes

Dans `app.json`:

```json
{
  "expo": {
    "android": {
      "jsEngine": "hermes"
    },
    "ios": {
      "jsEngine": "hermes"
    }
  }
}
```

Hermes améliore les performances de 50% sur Android.

## Actions Immédiates

### 1. Réduire maxHeight dans RupturesIncidentsTable

Dans `VisitFormScreen.js` ligne 130:

```javascript
// AVANT
<View style={{ maxHeight: 500 }}>

// APRÈS
<View style={{ maxHeight: 300 }}>
```

### 2. Supprimer les ScrollView imbriqués

Supprimer le `maxHeight` wrapper qui crée des problèmes:

```javascript
// AVANT (ligne 130-135)
<View style={{ maxHeight: 500 }}>
  <ScrollView
    horizontal
    nestedScrollEnabled={true}
    ...
  >

// APRÈS
<ScrollView
  horizontal
  keyboardShouldPersistTaps="handled"
  showsHorizontalScrollIndicator={true}
>
```

### 3. Lazy Load la Veille Concurrentielle

Charger la table de veille seulement quand l'utilisateur scrolle jusqu'à cette section:

```javascript
const [showVeille, setShowVeille] = useState(false);

// Dans le render
<View onLayout={() => setShowVeille(true)}>
  {showVeille && <VeilleConcurrentielleTable ... />}
</View>
```

## Test des Solutions

1. Appliquer les solutions 1-3 pour réduction immédiate
2. Tester sur un appareil physique (pas seulement Expo Go)
3. Utiliser React DevTools pour identifier les re-renders
4. Monitorer la mémoire avec Android Studio / Xcode

## Commandes de Debug

```bash
# Vider le cache Expo
cd mobile-app
npx expo start -c

# Tester en mode production
npx expo start --no-dev --minify

# Build natif pour meilleures performances
npx expo run:android
npx expo run:ios
```

---

**PRIORITÉ**: Implémenter la Solution 1 (fragmenter le formulaire) pour une expérience utilisateur optimale et éviter les crashs.
