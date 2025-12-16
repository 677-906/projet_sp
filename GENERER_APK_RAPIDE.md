# 📱 GÉNÉRATION APK - GUIDE RAPIDE

## 🚀 Méthode Rapide avec EAS Build (5 minutes)

### Étape 1 : Installer EAS CLI (une seule fois)

```bash
npm install -g eas-cli
```

### Étape 2 : Se connecter à Expo

```bash
cd mobile-app
eas login
```

Si vous n'avez pas de compte, créez-en un gratuitement sur : https://expo.dev/signup

### Étape 3 : Générer l'APK

**Pour un APK de test (RECOMMANDÉ) :**

```bash
eas build --platform android --profile preview
```

**Pour un APK de production :**

```bash
eas build --platform android --profile production
```

### Étape 4 : Télécharger l'APK

Une fois le build terminé (5-15 minutes), vous recevrez :
- Un lien direct dans le terminal
- Un email avec le lien de téléchargement
- L'APK disponible sur https://expo.dev (section "Builds")

### Étape 5 : Distribuer l'APK

1. Téléchargez l'APK sur votre ordinateur
2. Partagez-le par :
   - Email
   - WhatsApp
   - USB
   - Réseau local

### Étape 6 : Installer sur les téléphones

1. Transférez l'APK sur le téléphone
2. Ouvrez le fichier APK
3. Autorisez l'installation depuis des sources inconnues si demandé
4. Cliquez sur "Installer"

---

## ⚙️ Configuration avant le build (IMPORTANT)

### Option A : URL Configurable (Recommandé)

✅ **Déjà configuré dans votre app !**

Les utilisateurs pourront configurer l'URL du serveur depuis l'écran de connexion :
1. Cliquez sur ⚙️ Paramètres
2. Entrez l'URL : `http://[IP_SERVEUR]:8000`
3. Enregistrez

### Option B : URL Fixe dans l'APK

Si vous voulez que l'URL soit déjà configurée dans l'APK :

1. Éditez `mobile-app/api/axiosConfig.js`
2. Ligne 8, remplacez :
   ```javascript
   const DEFAULT_BASE_URL = 'http://10.105.50.117:8000';
   ```
   Par l'IP de votre serveur Windows :
   ```javascript
   const DEFAULT_BASE_URL = 'http://192.168.1.100:8000';
   ```
3. Regénérez l'APK

---

## 🔧 Dépannage

### Erreur : "eas: command not found"

**Solution :**
```bash
npm install -g eas-cli
```

### Erreur : "Project not configured"

**Solution :**
```bash
cd mobile-app
eas build:configure
```

### Erreur : "Build failed"

**Solutions :**
1. Vérifiez votre connexion internet
2. Vérifiez que `package.json` est correct
3. Vérifiez que `app.json` est correct
4. Réessayez avec :
   ```bash
   eas build --platform android --profile preview --clear-cache
   ```

### L'installation de l'APK est bloquée sur Android

**Solution :**
1. Allez dans **Paramètres → Sécurité**
2. Activez **Sources inconnues** ou **Installer des applications inconnues**
3. Autorisez l'application qui installe l'APK (Chrome, Files, etc.)

---

## 📊 Statut du Build

Suivez l'avancement de votre build :

```bash
eas build:list
```

Ou consultez : https://expo.dev/accounts/[votre-compte]/projects/mobile-app/builds

---

## 💡 Astuces

### Build plus rapide

Pour un build encore plus rapide, utilisez le profil "preview" :
- Build time : ~5-10 minutes
- Taille APK : ~50-70 MB
- Parfait pour les tests

### Version de l'application

Avant chaque nouveau build, mettez à jour la version dans `mobile-app/app.json` :

```json
{
  "expo": {
    "version": "1.0.1"
  }
}
```

### Plusieurs APK pour différents environnements

Créez plusieurs profils dans `eas.json` :

```json
{
  "build": {
    "test": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "API_URL": "http://192.168.1.100:8000"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "API_URL": "http://serveur-prod.com:8000"
      }
    }
  }
}
```

---

## ✅ Checklist avant distribution

- [ ] APK généré et téléchargé
- [ ] APK testé sur au moins un téléphone
- [ ] Backend démarré sur le serveur
- [ ] URL du serveur accessible depuis le Wi-Fi de l'entreprise
- [ ] Connexion testée avec l'app
- [ ] Comptes utilisateurs créés (admin, chef de zone, merchandisers)
- [ ] Instructions distribuées aux utilisateurs

---

## 🎯 Prochaines étapes

1. **Générez l'APK** avec la commande ci-dessus
2. **Installez le backend** sur Windows Server (voir `GUIDE_DEPLOIEMENT_COMPLET.md`)
3. **Testez sur un téléphone** avant de distribuer
4. **Distribuez l'APK** aux utilisateurs
5. **Formez les utilisateurs** à l'utilisation de l'app

Bon déploiement ! 🚀
