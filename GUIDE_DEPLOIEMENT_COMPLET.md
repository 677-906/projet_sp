# 📱 GUIDE DE DÉPLOIEMENT COMPLET - Source du Pays

Ce guide vous permettra de :
1. ✅ Générer l'APK Android
2. ✅ Installer le backend sur Windows Server
3. ✅ Configurer le réseau pour les tests réels

---

## 🎯 PARTIE 1 : GÉNÉRATION DE L'APK ANDROID

### Option A : EAS Build (Recommandé - Plus Simple)

**Prérequis :**
- Compte Expo (gratuit) : https://expo.dev/signup
- Node.js installé
- Application mobile-app configurée

**Étapes :**

#### 1. Installer EAS CLI

```bash
npm install -g eas-cli
```

#### 2. Se connecter à Expo

```bash
cd mobile-app
eas login
```

Entrez vos identifiants Expo.

#### 3. Créer le fichier de configuration EAS

Créez `mobile-app/eas.json` :

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### 4. Générer l'APK

Pour un **APK de test** :

```bash
cd mobile-app
eas build --platform android --profile preview
```

Pour un **APK de production** :

```bash
cd mobile-app
eas build --platform android --profile production
```

#### 5. Télécharger l'APK

Une fois le build terminé (5-15 minutes), vous recevrez un lien pour télécharger l'APK.

Ou accédez à : https://expo.dev/accounts/[votre-compte]/projects/mobile-app/builds

---

### Option B : Build Local avec Expo (Si vous n'avez pas de compte Expo)

**Prérequis :**
- Android Studio installé
- Java JDK 17
- Variables d'environnement configurées

**Étapes :**

#### 1. Installer expo-dev-client

```bash
cd mobile-app
npx expo install expo-dev-client
```

#### 2. Prégénérer le projet Android

```bash
npx expo prebuild --platform android
```

#### 3. Build avec Gradle

```bash
cd android
.\gradlew assembleRelease
```

L'APK sera généré dans :
```
mobile-app/android/app/build/outputs/apk/release/app-release.apk
```

---

## 🖥️ PARTIE 2 : INSTALLATION DU BACKEND SUR WINDOWS SERVER

### Prérequis Windows Server

1. **Python 3.9+** : https://www.python.org/downloads/
2. **PostgreSQL 14+** : https://www.postgresql.org/download/windows/
3. **Git** (optionnel) : https://git-scm.com/download/win

### Étape 1 : Installer PostgreSQL

1. Téléchargez et installez PostgreSQL
2. Pendant l'installation, notez le **mot de passe du superutilisateur (postgres)**
3. Le port par défaut est **5432**

### Étape 2 : Créer la base de données

Ouvrez **pgAdmin** ou **SQL Shell (psql)** :

```sql
CREATE DATABASE projet_sp;
CREATE USER projet_sp_user WITH PASSWORD 'VotreMotDePasseSecurise123!';
GRANT ALL PRIVILEGES ON DATABASE projet_sp TO projet_sp_user;
```

### Étape 3 : Copier le backend sur le serveur

Copiez le dossier `backend` vers votre Windows Server, par exemple :
```
C:\ProjetSP\backend\
```

### Étape 4 : Installer Python et dépendances

Ouvrez **PowerShell en tant qu'Administrateur** :

```powershell
# Aller dans le dossier backend
cd C:\ProjetSP\backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
.\venv\Scripts\Activate.ps1

# Installer les dépendances
pip install -r requirements.txt
```

### Étape 5 : Configurer la connexion à la base de données

Éditez `backend/app/database.py` :

```python
# Ligne 5 - Remplacez par vos credentials
SQLALCHEMY_DATABASE_URL = "postgresql://projet_sp_user:VotreMotDePasseSecurise123!@localhost:5432/projet_sp"
```

### Étape 6 : Initialiser la base de données

```powershell
# Toujours dans l'environnement virtuel
python -m backend.init_db
```

Vous devriez voir :
```
Aucun rôle trouvé, création des rôles par défaut...
Aucun admin trouvé, création de l'admin par défaut...
Admin par défaut créé avec succès.
```

### Étape 7 : Tester le backend localement

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Ouvrez un navigateur sur le serveur : http://localhost:8000/docs

Si vous voyez l'interface Swagger, **c'est bon !** ✅

---

## 🌐 PARTIE 3 : CONFIGURATION RÉSEAU

### A. Trouver l'adresse IP du serveur

Sur Windows Server, ouvrez **PowerShell** :

```powershell
ipconfig
```

Notez l'adresse **IPv4** de votre carte réseau local, par exemple : `192.168.1.100`

### B. Configurer le pare-feu Windows

1. Ouvrez **Panneau de configuration → Système et sécurité → Pare-feu Windows Defender**
2. Cliquez sur **Paramètres avancés**
3. Cliquez sur **Règles de trafic entrant** → **Nouvelle règle**
4. Type : **Port**
5. Protocole : **TCP**
6. Port : **8000**
7. Action : **Autoriser la connexion**
8. Profil : Cochez **Domaine**, **Privé**, **Public**
9. Nom : **API Source du Pays**
10. Cliquez sur **Terminer**

### C. Tester l'accès depuis un autre PC

Sur un autre ordinateur du réseau local :

```
http://192.168.1.100:8000/docs
```

Remplacez `192.168.1.100` par l'IP de votre serveur.

---

## 📲 PARTIE 4 : CONFIGURER L'APPLICATION MOBILE

### Option 1 : Configuration via l'interface (Recommandé pour les tests)

1. Installez l'APK sur le téléphone
2. Lancez l'application
3. Sur l'écran de connexion, cliquez sur **⚙️ Paramètres**
4. Entrez l'URL du serveur : `http://192.168.1.100:8000`
5. Cliquez sur **Enregistrer**
6. Revenez à l'écran de connexion

### Option 2 : Configurer l'URL par défaut avant de build l'APK

Éditez `mobile-app/api/axiosConfig.js` :

Remplacez :
```javascript
const DEFAULT_BASE_URL = 'http://10.105.50.117:8000';
```

Par l'IP de votre serveur :
```javascript
const DEFAULT_BASE_URL = 'http://192.168.1.100:8000';
```

Puis regénérez l'APK.

---

## 🚀 PARTIE 5 : DÉMARRAGE AUTOMATIQUE DU BACKEND (Production)

### Option A : Service Windows avec NSSM (Recommandé)

#### 1. Télécharger NSSM

https://nssm.cc/download

Extrayez `nssm.exe` dans `C:\ProjetSP\`

#### 2. Créer le service

Ouvrez **PowerShell en tant qu'Administrateur** :

```powershell
cd C:\ProjetSP

.\nssm.exe install SourceDuPaysAPI "C:\ProjetSP\backend\venv\Scripts\python.exe" "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"

.\nssm.exe set SourceDuPaysAPI AppDirectory "C:\ProjetSP\backend"
.\nssm.exe set SourceDuPaysAPI Description "API Backend Source du Pays"
.\nssm.exe set SourceDuPaysAPI Start SERVICE_AUTO_START
```

#### 3. Démarrer le service

```powershell
.\nssm.exe start SourceDuPaysAPI
```

Le backend démarrera automatiquement au démarrage du serveur.

### Option B : Script de démarrage simple

Créez `C:\ProjetSP\demarrer_backend.bat` :

```batch
@echo off
cd C:\ProjetSP\backend
call venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
```

Double-cliquez sur ce fichier pour démarrer le backend.

---

## 🧪 PARTIE 6 : TESTS COMPLETS

### Test 1 : Connexion Backend

Sur le serveur, ouvrez :
```
http://localhost:8000/docs
```

### Test 2 : Connexion depuis un PC du réseau

Sur un autre PC :
```
http://[IP_DU_SERVEUR]:8000/docs
```

### Test 3 : Connexion depuis le téléphone

1. **Assurez-vous que le téléphone est sur le même réseau Wi-Fi** que le serveur
2. Installez l'APK
3. Lancez l'application
4. Configurez l'URL : `http://[IP_DU_SERVEUR]:8000`
5. Testez la connexion avec les identifiants par défaut :
   - Email : `admin@gmail.com`
   - Mot de passe : `admin237`

### Test 4 : Créer une visite complète

1. Connectez-vous en tant que **Merchandiser** :
   - Email : `merchandiser@sp.com`
   - Mot de passe : `merc123`

2. Créez une visite :
   - Sélectionnez une zone
   - Sélectionnez un commercial
   - Sélectionnez un client
   - Remplissez le formulaire
   - Soumettez

3. Connectez-vous sur le **web** en tant que **Chef de Zone** :
   - Email : `chef@sp.com`
   - Mot de passe : `chef123`

4. Validez la visite

5. Exportez en Excel

---

## 🔒 PARTIE 7 : SÉCURITÉ (IMPORTANT!)

### Avant la mise en production :

1. **Changez TOUS les mots de passe par défaut** :
   ```sql
   -- Dans PostgreSQL
   ALTER USER projet_sp_user WITH PASSWORD 'NouveauMotDePasseTresSecurise!';
   ```

2. **Changez la clé secrète JWT** dans `backend/app/security.py` :
   ```python
   SECRET_KEY = "CHANGEZ_CETTE_CLE_PAR_UNE_VALEUR_ALEATOIRE_TRES_LONGUE"
   ```

3. **Mettez à jour les mots de passe des utilisateurs** via l'interface admin

4. **Configurez HTTPS** pour la production (avec Let's Encrypt ou certificat SSL)

---

## 📞 DÉPANNAGE

### Problème : "Connection refused" depuis le téléphone

**Solutions :**
1. Vérifiez que le backend est bien démarré sur le serveur
2. Vérifiez que le pare-feu autorise le port 8000
3. Vérifiez que le téléphone est sur le même réseau Wi-Fi
4. Testez avec `http://` et NON `https://`
5. Utilisez l'IP du serveur, PAS `localhost` ou `127.0.0.1`

### Problème : "Network Error" dans l'application

**Solutions :**
1. Dans l'app, allez dans Paramètres
2. Vérifiez l'URL : `http://192.168.1.X:8000` (remplacez X)
3. Assurez-vous qu'il n'y a PAS de `/` à la fin
4. Testez l'URL dans un navigateur du téléphone d'abord

### Problème : PostgreSQL n'accepte pas les connexions

**Solution :**
Éditez `C:\Program Files\PostgreSQL\14\data\postgresql.conf` :
```
listen_addresses = '*'
```

Éditez `C:\Program Files\PostgreSQL\14\data\pg_hba.conf`, ajoutez :
```
host    all    all    0.0.0.0/0    md5
```

Redémarrez PostgreSQL.

---

## 📋 CHECKLIST FINALE

Avant de distribuer l'APK aux utilisateurs :

- [ ] Backend installé et démarré sur Windows Server
- [ ] Base de données créée et initialisée
- [ ] Pare-feu configuré (port 8000 ouvert)
- [ ] URL du serveur testée depuis un navigateur
- [ ] APK généré avec la bonne URL (ou configuration dynamique)
- [ ] APK installé et testé sur au moins un téléphone
- [ ] Connexion testée depuis l'app mobile
- [ ] Création de visite testée
- [ ] Validation testée depuis le web
- [ ] Export Excel testé
- [ ] Mots de passe par défaut changés
- [ ] Service Windows configuré (optionnel mais recommandé)

---

## 🎉 FÉLICITATIONS !

Votre système est prêt pour les tests réels !

**Support :**
- Documentation complète : Voir fichier `CLAUDE.md`
- En cas de problème, vérifiez les logs du backend
- Testez toujours d'abord sur un seul téléphone avant de distribuer

**Prochaines étapes :**
1. Former les utilisateurs
2. Créer les comptes utilisateurs via l'interface admin
3. Importer les clients et commerciaux
4. Commencer les tests terrain

Bon déploiement ! 🚀
