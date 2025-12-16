# 🖥️ INSTALLATION BACKEND SUR WINDOWS SERVER

Guide pas-à-pas pour installer le backend Source du Pays sur Windows Server.

---

## 📋 PRÉREQUIS

### Logiciels à installer

1. **Python 3.9 ou supérieur**
   - Téléchargement : https://www.python.org/downloads/
   - ⚠️ IMPORTANT : Cochez "Add Python to PATH" pendant l'installation

2. **PostgreSQL 14 ou supérieur**
   - Téléchargement : https://www.postgresql.org/download/windows/
   - ⚠️ Notez le mot de passe du superutilisateur pendant l'installation

3. **Git** (optionnel mais recommandé)
   - Téléchargement : https://git-scm.com/download/win

---

## 📥 ÉTAPE 1 : INSTALLATION DE POSTGRESQL

### 1.1. Installer PostgreSQL

1. Lancez l'installateur PostgreSQL
2. Laissez le port par défaut : **5432**
3. Choisissez un mot de passe pour l'utilisateur `postgres` (notez-le !)
4. Installez tous les composants proposés

### 1.2. Créer la base de données

Ouvrez **SQL Shell (psql)** depuis le menu Démarrer :

```sql
-- Appuyez sur Entrée pour chaque question (valeurs par défaut)
-- Entrez le mot de passe postgres quand demandé

-- Créer la base de données
CREATE DATABASE projet_sp;

-- Créer un utilisateur dédié
CREATE USER projet_sp_user WITH PASSWORD 'MotDePasseSecurise123!';

-- Donner tous les droits
GRANT ALL PRIVILEGES ON DATABASE projet_sp TO projet_sp_user;

-- Dans PostgreSQL 15+, exécutez aussi :
\c projet_sp
GRANT ALL ON SCHEMA public TO projet_sp_user;

-- Quitter
\q
```

---

## 📂 ÉTAPE 2 : COPIER LE PROJET SUR LE SERVEUR

### 2.1. Créer le dossier

Créez le dossier : `C:\ProjetSP\`

### 2.2. Copier les fichiers

Copiez le dossier `backend` complet depuis votre PC de développement vers :
```
C:\ProjetSP\backend\
```

La structure doit être :
```
C:\ProjetSP\
└── backend\
    ├── app\
    │   ├── main.py
    │   ├── models.py
    │   ├── schemas.py
    │   ├── crud.py
    │   ├── security.py
    │   ├── database.py
    │   └── export_excel.py
    ├── requirements.txt
    ├── init_db.py
    └── demarrer_backend.bat
```

---

## 🐍 ÉTAPE 3 : INSTALLER PYTHON ET LES DÉPENDANCES

### 3.1. Vérifier l'installation Python

Ouvrez **PowerShell** et tapez :

```powershell
python --version
```

Vous devriez voir : `Python 3.x.x`

### 3.2. Créer l'environnement virtuel

```powershell
cd C:\ProjetSP\backend

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
.\venv\Scripts\Activate.ps1
```

Si vous avez une erreur "scripts désactivés", exécutez :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Puis réessayez.

### 3.3. Installer les dépendances

```powershell
# Toujours dans l'environnement virtuel (venv)
pip install --upgrade pip
pip install -r requirements.txt
```

Attendez que toutes les dépendances s'installent (2-5 minutes).

---

## 🔧 ÉTAPE 4 : CONFIGURER LA CONNEXION DATABASE

### 4.1. Éditer database.py

Ouvrez `C:\ProjetSP\backend\app\database.py` avec Notepad++, VS Code, ou Notepad.

**Ligne 5**, remplacez :
```python
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost:5432/projet_sp"
```

Par :
```python
SQLALCHEMY_DATABASE_URL = "postgresql://projet_sp_user:MotDePasseSecurise123!@localhost:5432/projet_sp"
```

⚠️ Remplacez `MotDePasseSecurise123!` par le mot de passe que vous avez choisi à l'étape 1.2.

Enregistrez le fichier.

---

## 🎲 ÉTAPE 5 : INITIALISER LA BASE DE DONNÉES

### 5.1. Exécuter le script d'initialisation

```powershell
# Dans PowerShell, environnement virtuel activé
cd C:\ProjetSP\backend
python -m backend.init_db
```

Vous devriez voir :
```
Aucun rôle trouvé, création des rôles par défaut...
Aucun admin trouvé, création de l'admin par défaut...
Admin par défaut créé avec succès.
```

✅ **Si vous voyez ce message, c'est parfait !**

### 5.2. Comptes créés par défaut

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@gmail.com | admin237 | Administrateur |
| responsable@sp.com | resp123 | Responsable |
| chef@sp.com | chef123 | Chef de Zone |
| merchandiser@sp.com | merc123 | Merchandiser |

⚠️ **Changez ces mots de passe après le premier démarrage !**

---

## 🚀 ÉTAPE 6 : DÉMARRER LE BACKEND

### Méthode 1 : Script Batch (Simple)

Double-cliquez sur : `C:\ProjetSP\backend\demarrer_backend.bat`

### Méthode 2 : PowerShell

```powershell
cd C:\ProjetSP\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Vous devriez voir :
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Le backend est démarré !**

---

## 🧪 ÉTAPE 7 : TESTER LE BACKEND

### 7.1. Test local (sur le serveur)

Ouvrez un navigateur **sur le serveur** et allez sur :
```
http://localhost:8000/docs
```

Vous devriez voir l'interface **Swagger UI** de l'API.

### 7.2. Trouver l'IP du serveur

Dans PowerShell :
```powershell
ipconfig
```

Notez l'adresse **IPv4** de votre carte réseau (exemple : `192.168.1.100`)

### 7.3. Configurer le pare-feu

#### Option A : Interface graphique

1. Ouvrez **Panneau de configuration**
2. **Système et sécurité** → **Pare-feu Windows Defender**
3. **Paramètres avancés**
4. **Règles de trafic entrant** → **Nouvelle règle**
5. **Port** → **TCP** → Port **8000**
6. **Autoriser la connexion**
7. Cochez **Domaine**, **Privé**, **Public**
8. Nom : **API Source du Pays**
9. **Terminer**

#### Option B : PowerShell (en tant qu'Administrateur)

```powershell
New-NetFirewallRule -DisplayName "API Source du Pays" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

### 7.4. Test depuis un autre PC

Sur un autre ordinateur du réseau :
```
http://192.168.1.100:8000/docs
```

Remplacez `192.168.1.100` par l'IP de votre serveur.

✅ **Si vous voyez l'interface Swagger, le réseau est bon !**

---

## ♾️ ÉTAPE 8 : DÉMARRAGE AUTOMATIQUE (PRODUCTION)

Pour que le backend démarre automatiquement au démarrage du serveur.

### 8.1. Télécharger NSSM

1. Allez sur : https://nssm.cc/download
2. Téléchargez la version 64-bit
3. Extrayez `nssm.exe` dans `C:\ProjetSP\`

### 8.2. Créer le service Windows

Ouvrez **PowerShell en tant qu'Administrateur** :

```powershell
cd C:\ProjetSP

# Créer le service
.\nssm.exe install SourceDuPaysAPI "C:\ProjetSP\backend\venv\Scripts\python.exe" "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"

# Configurer le répertoire de travail
.\nssm.exe set SourceDuPaysAPI AppDirectory "C:\ProjetSP\backend"

# Description
.\nssm.exe set SourceDuPaysAPI Description "API Backend Source du Pays - Gestion Merchandising"

# Démarrage automatique
.\nssm.exe set SourceDuPaysAPI Start SERVICE_AUTO_START

# Démarrer le service
.\nssm.exe start SourceDuPaysAPI
```

### 8.3. Vérifier le service

```powershell
# Voir le statut
.\nssm.exe status SourceDuPaysAPI

# Arrêter le service
.\nssm.exe stop SourceDuPaysAPI

# Redémarrer le service
.\nssm.exe restart SourceDuPaysAPI

# Supprimer le service (si besoin)
.\nssm.exe remove SourceDuPaysAPI confirm
```

Ou utilisez **Services** dans Windows :
1. Tapez `services.msc` dans Rechercher
2. Trouvez **SourceDuPaysAPI**
3. Clic droit → **Démarrer** / **Arrêter** / **Redémarrer**

---

## 🔒 ÉTAPE 9 : SÉCURITÉ

### 9.1. Changer la clé secrète JWT

Éditez `C:\ProjetSP\backend\app\security.py` :

**Ligne 7**, remplacez :
```python
SECRET_KEY = "votre_cle_secrete_tres_longue_et_aleatoire"
```

Par une clé aléatoire très longue (50+ caractères).

Redémarrez le backend.

### 9.2. Changer les mots de passe par défaut

1. Connectez-vous sur http://localhost:3000 (web-app)
2. Email : `admin@gmail.com`
3. Mot de passe : `admin237`
4. Allez dans **Gestion Utilisateurs**
5. Changez tous les mots de passe

### 9.3. Sauvegardes PostgreSQL

Créez un script de sauvegarde `C:\ProjetSP\backup_db.bat` :

```batch
@echo off
set PGPASSWORD=MotDePasseSecurise123!
set DATE=%date:~6,4%%date:~3,2%%date:~0,2%
"C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" -U projet_sp_user -h localhost projet_sp > "C:\ProjetSP\backups\backup_%DATE%.sql"
echo Sauvegarde creee: backup_%DATE%.sql
```

Créez le dossier `C:\ProjetSP\backups\`

Programmez ce script dans le **Planificateur de tâches** Windows (quotidien).

---

## 📊 ÉTAPE 10 : MONITORING ET LOGS

### 10.1. Voir les logs en temps réel

Si vous avez démarré avec le script batch, les logs s'affichent dans la fenêtre.

Si vous utilisez le service Windows :

```powershell
# Voir les logs du service
Get-EventLog -LogName Application -Source SourceDuPaysAPI -Newest 50
```

### 10.2. Créer un fichier de logs

Éditez le service NSSM :

```powershell
cd C:\ProjetSP

# Configurer les logs
.\nssm.exe set SourceDuPaysAPI AppStdout "C:\ProjetSP\logs\backend.log"
.\nssm.exe set SourceDuPaysAPI AppStderr "C:\ProjetSP\logs\backend_error.log"

# Rotation des logs (taille max 10 MB)
.\nssm.exe set SourceDuPaysAPI AppRotateFiles 1
.\nssm.exe set SourceDuPaysAPI AppRotateBytes 10485760

# Redémarrer le service
.\nssm.exe restart SourceDuPaysAPI
```

Créez le dossier `C:\ProjetSP\logs\`

---

## 🆘 DÉPANNAGE

### Erreur : "psycopg2 not found"

**Solution :**
```powershell
pip install psycopg2-binary
```

### Erreur : "Could not connect to database"

**Solutions :**
1. Vérifiez que PostgreSQL est démarré (Services → postgresql-x64-14)
2. Vérifiez le mot de passe dans `database.py`
3. Vérifiez que la base `projet_sp` existe
4. Testez la connexion :
   ```powershell
   psql -U projet_sp_user -d projet_sp -h localhost
   ```

### Erreur : "Port 8000 already in use"

**Solution :**
Un autre processus utilise le port 8000. Trouvez-le :
```powershell
netstat -ano | findstr :8000
```

Tuez le processus :
```powershell
taskkill /PID [numéro_du_processus] /F
```

### Le pare-feu bloque toujours l'accès

**Solution :**
Désactivez temporairement le pare-feu Windows pour tester :
```powershell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
```

Si ça fonctionne, le problème vient du pare-feu. Reconfigurez la règle.

Pour réactiver :
```powershell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

---

## ✅ CHECKLIST FINALE

- [ ] PostgreSQL installé et base de données créée
- [ ] Python installé et environnement virtuel créé
- [ ] Dépendances installées avec pip
- [ ] Fichier `database.py` configuré avec les bons identifiants
- [ ] Base de données initialisée (`init_db.py` exécuté)
- [ ] Backend démarré et accessible sur http://localhost:8000/docs
- [ ] Pare-feu configuré (port 8000 ouvert)
- [ ] Backend accessible depuis un autre PC du réseau
- [ ] Service Windows créé pour démarrage automatique (optionnel)
- [ ] Mots de passe par défaut changés
- [ ] Sauvegardes PostgreSQL configurées

---

## 🎉 INSTALLATION TERMINÉE !

Votre backend est maintenant prêt pour la production !

**Prochaines étapes :**
1. Installez l'app mobile sur les téléphones (voir `GENERER_APK_RAPIDE.md`)
2. Créez les comptes utilisateurs via l'interface web
3. Importez les clients et commerciaux
4. Commencez les tests terrain

**Support :**
- Documentation complète : `GUIDE_DEPLOIEMENT_COMPLET.md`
- Guide APK : `GENERER_APK_RAPIDE.md`

Bon déploiement ! 🚀
