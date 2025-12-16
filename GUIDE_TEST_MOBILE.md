# Guide pour Tester l'Application Mobile

## 🎯 Situation Actuelle

Les optimisations pour résoudre le crash d'Expo Go ont été appliquées:
- ✅ ScrollView optimisés (maxHeight réduit)
- ✅ Hermes Engine activé (+40-50% performance)
- ✅ Expo mis à jour vers la version 54.0.19

Un serveur Expo est déjà en cours d'exécution sur le port 8081.

---

## 📱 Option 1: Tester avec Expo Go (RECOMMANDÉ - Rapide)

### Étape 1: Vérifier le serveur Expo

Dans PowerShell, exécutez:
```powershell
cd C:\Users\Jenny Tiemeni\Projet_SP\mobile-app
npx expo start
```

Vous verrez un **QR code** affiché dans le terminal.

### Étape 2: Scanner le QR code

1. Ouvrez **Expo Go** sur votre téléphone Android
2. Appuyez sur **"Scan QR code"**
3. Scannez le QR code affiché dans le terminal
4. L'application se chargera automatiquement

### Étape 3: Recharger après modifications

Si vous avez déjà l'application ouverte:
1. **Secouez votre téléphone**
2. Un menu apparaîtra
3. Appuyez sur **"Reload"**

Cela rechargera l'application avec les nouvelles optimisations.

---

## 🔧 Option 2: Build Natif Android (Plus Stable mais Plus Long)

### Prérequis

Pour faire un build natif, vous devez avoir:
1. **Android Studio** installé
2. Un **émulateur Android** créé OU un **téléphone physique** connecté en USB avec le **débogage USB activé**

### Étape 1: Vérifier si vous avez un appareil/émulateur

```powershell
cd C:\Users\Jenny Tiemeni\Projet_SP\mobile-app
adb devices
```

**Résultat attendu si un appareil est connecté:**
```
List of devices attached
XXXXXXXX        device
```

**Si aucun appareil n'est listé:**
- Connectez votre téléphone en USB
- Activez le débogage USB (voir ci-dessous)
- Ou démarrez un émulateur Android Studio

### Étape 2: Activer le Débogage USB (Téléphone Physique)

Sur votre téléphone Android:

1. Allez dans **Paramètres** → **À propos du téléphone**
2. Appuyez **7 fois** sur **"Numéro de build"** pour activer les Options développeur
3. Retournez aux **Paramètres** → **Options développeur**
4. Activez **"Débogage USB"**
5. Connectez le téléphone à l'ordinateur via USB
6. Acceptez l'autorisation de débogage USB qui apparaît sur le téléphone

### Étape 3: Démarrer un Émulateur (Alternative)

Si vous avez Android Studio:

1. Ouvrez **Android Studio**
2. Cliquez sur **"Device Manager"** (icône de téléphone)
3. Si aucun émulateur n'existe, cliquez sur **"Create Device"**
4. Sélectionnez un appareil (ex: Pixel 6)
5. Téléchargez une image système (ex: Android 13)
6. Créez l'émulateur
7. Cliquez sur le bouton **Play** pour le démarrer

### Étape 4: Lancer le Build

Une fois qu'un appareil/émulateur est détecté:

```powershell
cd C:\Users\Jenny Tiemeni\Projet_SP\mobile-app
npx expo run:android
```

**Durée**: 5-10 minutes pour le premier build, puis 1-2 minutes pour les builds suivants.

**Avantages du build natif:**
- ✅ Beaucoup plus stable qu'Expo Go
- ✅ Meilleures performances
- ✅ Hermes Engine activé automatiquement
- ✅ Pas de crash lié aux limitations d'Expo Go

---

## 🐛 Si le Crash Persiste avec Expo Go

### Solution Immédiate: Vider le Cache

1. **Sur votre téléphone**, allez dans:
   - **Paramètres** → **Applications** → **Expo Go**
   - Appuyez sur **"Stockage"**
   - Appuyez sur **"Vider le cache"**

2. **Sur votre PC**, dans PowerShell:
   ```powershell
   cd C:\Users\Jenny Tiemeni\Projet_SP\mobile-app
   npx expo start -c
   ```

3. **Redémarrez Expo Go** sur votre téléphone et scannez à nouveau le QR code

### Vérifier les Logs d'Erreur

Si l'application crash, secouez le téléphone et appuyez sur **"Show Dev Menu"** → **"Debug Remote JS"**.

Cela ouvrira un onglet dans votre navigateur avec les erreurs détaillées.

---

## 📊 Comparaison des Options

| Critère | Expo Go | Build Natif |
|---------|---------|-------------|
| **Vitesse setup** | ⚡ Instantané | 🐢 5-10 min premier build |
| **Stabilité** | ⚠️ Peut crasher si formulaire lourd | ✅ Très stable |
| **Performance** | 🔶 Moyenne | ✅ Excellente (Hermes) |
| **Rechargement** | ⚡ Instantané | 🔶 1-2 min par build |
| **Prérequis** | Juste Expo Go app | Android Studio + Appareil |

---

## 🎯 Recommandation

### Pour les Tests Rapides (Développement)
**Utilisez Expo Go** (Option 1) avec les optimisations appliquées.

### Pour les Tests Finaux (Avant Production)
**Utilisez Build Natif** (Option 2) pour avoir l'expérience utilisateur finale.

---

## 🆘 Besoin d'Aide?

Si vous rencontrez des problèmes:

1. **Vérifiez que le serveur Expo est en cours:**
   ```powershell
   cd C:\Users\Jenny Tiemeni\Projet_SP\mobile-app
   npx expo start
   ```

2. **Vérifiez que votre téléphone et PC sont sur le même réseau WiFi**

3. **Vérifiez les logs du serveur** dans le terminal pour voir les erreurs

4. **Si vraiment bloqué**, faites un build natif (Option 2) qui est beaucoup plus stable.

---

*Guide créé le 23 octobre 2025*
