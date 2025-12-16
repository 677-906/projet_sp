# ⚡ COMMANDES RAPIDES - AIDE-MÉMOIRE

Document de référence rapide pour les opérations courantes.

---

## 📱 GÉNÉRATION APK

### Générer un APK de test

```bash
cd mobile-app
eas build --platform android --profile preview
```

### Générer un APK de production

```bash
cd mobile-app
eas build --platform android --profile production
```

### Voir l'historique des builds

```bash
eas build:list
```

---

## 🖥️ BACKEND - WINDOWS SERVER

### Démarrer le backend (Script)

Double-cliquez sur : `C:\ProjetSP\backend\demarrer_backend.bat`

### Démarrer le backend (PowerShell)

```powershell
cd C:\ProjetSP\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Arrêter le backend

`Ctrl + C` dans la fenêtre PowerShell

---

## 🔧 SERVICE WINDOWS (Démarrage automatique)

### Créer le service

```powershell
cd C:\ProjetSP
.\nssm.exe install SourceDuPaysAPI "C:\ProjetSP\backend\venv\Scripts\python.exe" "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
.\nssm.exe set SourceDuPaysAPI AppDirectory "C:\ProjetSP\backend"
.\nssm.exe set SourceDuPaysAPI Start SERVICE_AUTO_START
```

### Démarrer le service

```powershell
.\nssm.exe start SourceDuPaysAPI
```

### Arrêter le service

```powershell
.\nssm.exe stop SourceDuPaysAPI
```

### Redémarrer le service

```powershell
.\nssm.exe restart SourceDuPaysAPI
```

### Voir le statut du service

```powershell
.\nssm.exe status SourceDuPaysAPI
```

### Supprimer le service

```powershell
.\nssm.exe remove SourceDuPaysAPI confirm
```

---

## 💾 POSTGRESQL

### Se connecter à PostgreSQL

```powershell
psql -U projet_sp_user -d projet_sp -h localhost
```

### Créer une sauvegarde

```powershell
pg_dump -U projet_sp_user -h localhost projet_sp > backup.sql
```

### Restaurer une sauvegarde

```powershell
psql -U projet_sp_user -h localhost projet_sp < backup.sql
```

### Voir les tables

```sql
\dt
```

### Compter les visites

```sql
SELECT COUNT(*) FROM visites;
```

### Compter les utilisateurs

```sql
SELECT COUNT(*) FROM users;
```

### Voir les visites validées

```sql
SELECT id, date_visite, statut_validation FROM visites WHERE statut_validation = 'valide';
```

---

## 🔥 PARE-FEU WINDOWS

### Ouvrir le port 8000 (PowerShell Administrateur)

```powershell
New-NetFirewallRule -DisplayName "API Source du Pays" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

### Supprimer la règle

```powershell
Remove-NetFirewallRule -DisplayName "API Source du Pays"
```

### Désactiver temporairement le pare-feu

```powershell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
```

### Réactiver le pare-feu

```powershell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

---

## 🌐 RÉSEAU

### Trouver l'IP du serveur

```powershell
ipconfig
```

Regardez **Adresse IPv4**

### Tester la connexion au backend

Depuis un navigateur :
```
http://[IP_SERVEUR]:8000/docs
```

Exemple :
```
http://192.168.1.100:8000/docs
```

### Ping le serveur

```powershell
ping 192.168.1.100
```

---

## 🐍 PYTHON / BACKEND

### Activer l'environnement virtuel

```powershell
cd C:\ProjetSP\backend
.\venv\Scripts\Activate.ps1
```

### Désactiver l'environnement virtuel

```powershell
deactivate
```

### Réinstaller les dépendances

```powershell
pip install -r requirements.txt --force-reinstall
```

### Mettre à jour pip

```powershell
python -m pip install --upgrade pip
```

### Initialiser/Réinitialiser la base de données

```powershell
python -m backend.init_db
```

### Nettoyer les zones (espaces en trop)

```powershell
python -m backend.fix_zones
```

### Vérifier les superviseurs

```powershell
python -m backend.check_superviseurs
```

### Vérifier les clients

```powershell
python -m backend.check_clients
```

### Migrer les commerciaux (LEGACY vers ID)

```powershell
python -m backend.migrate_commerciaux
```

---

## 📦 NODE.JS / MOBILE APP

### Installer les dépendances

```bash
cd mobile-app
npm install
```

### Lancer en développement

```bash
npm start
```

### Nettoyer le cache

```bash
npm start --clear
```

---

## 📊 WEB APP

### Installer les dépendances

```bash
cd web-app
npm install
```

### Lancer en développement

```bash
npm start
```

### Build pour production

```bash
npm run build
```

---

## 🧪 TESTS

### Tester l'API

1. Ouvrir : http://localhost:8000/docs
2. Cliquer sur `/token`
3. Cliquer sur **Try it out**
4. Entrer :
   - username: `admin@gmail.com`
   - password: `admin237`
5. Cliquer sur **Execute**
6. Copier le `access_token` reçu

### Tester une endpoint protégée

1. Cliquer sur le cadenas 🔒 en haut de la page
2. Entrer : `Bearer [votre_token]`
3. Cliquer sur **Authorize**
4. Maintenant vous pouvez tester toutes les routes

---

## 🔒 SÉCURITÉ

### Changer le mot de passe d'un utilisateur (PostgreSQL)

```sql
-- Se connecter à la base
psql -U projet_sp_user -d projet_sp -h localhost

-- Voir les utilisateurs
SELECT id, nom, email FROM users;

-- NE PAS faire cela (mot de passe en clair) :
-- UPDATE users SET password_hash = 'nouveau' WHERE id = 1;

-- À la place, utilisez l'interface web admin pour changer les mots de passe
```

### Générer une nouvelle clé secrète JWT

En Python :

```python
import secrets
print(secrets.token_urlsafe(50))
```

Copiez le résultat dans `backend/app/security.py` (ligne `SECRET_KEY`)

---

## 📱 INSTALLATION APK

### Sur le téléphone

1. Activez **Sources inconnues** :
   - **Paramètres → Sécurité → Sources inconnues** (Android < 8)
   - **Paramètres → Applications → Accès spécial → Installer applications inconnues** (Android 8+)

2. Transférez l'APK sur le téléphone

3. Ouvrez le fichier APK

4. Cliquez sur **Installer**

---

## 🆘 DÉPANNAGE RAPIDE

### Backend ne démarre pas

```powershell
# Vérifier Python
python --version

# Vérifier PostgreSQL
psql -U projet_sp_user -d projet_sp -h localhost

# Réinstaller dépendances
pip install -r requirements.txt --force-reinstall
```

### Port 8000 occupé

```powershell
# Trouver le processus
netstat -ano | findstr :8000

# Tuer le processus (remplacer XXXX par le PID)
taskkill /PID XXXX /F
```

### APK ne s'installe pas

- Activez "Sources inconnues"
- Vérifiez que le fichier n'est pas corrompu
- Réessayez avec un autre gestionnaire de fichiers

### App ne se connecte pas au backend

1. Vérifiez que le backend est démarré
2. Vérifiez l'URL dans l'app : `http://[IP]:8000` (pas `https://`)
3. Vérifiez que le téléphone est sur le même Wi-Fi
4. Testez l'URL dans le navigateur du téléphone d'abord

---

## 📞 URLs IMPORTANTES

| Service | URL |
|---------|-----|
| API Backend (local) | http://localhost:8000 |
| API Backend (réseau) | http://192.168.1.X:8000 |
| Documentation API | http://localhost:8000/docs |
| Web App (dev) | http://localhost:3000 |
| Expo Builds | https://expo.dev |
| PostgreSQL (local) | localhost:5432 |

---

## 🎯 IDENTIFIANTS PAR DÉFAUT

⚠️ **À changer en production !**

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@gmail.com | admin237 |
| Responsable | responsable@sp.com | resp123 |
| Chef de Zone | chef@sp.com | chef123 |
| Merchandiser | merchandiser@sp.com | merc123 |

**PostgreSQL :**
- Utilisateur : `projet_sp_user`
- Mot de passe : `MotDePasseSecurise123!` (selon votre config)
- Base de données : `projet_sp`

---

## 📚 DOCUMENTS DE RÉFÉRENCE

- **Guide complet** : `GUIDE_DEPLOIEMENT_COMPLET.md`
- **Guide APK** : `GENERER_APK_RAPIDE.md`
- **Installation Server** : `INSTALLATION_WINDOWS_SERVER.md`
- **Documentation projet** : `CLAUDE.md`
- **Ce document** : `COMMANDES_RAPIDES.md`

---

Gardez ce document à portée de main pour les opérations quotidiennes ! 📌
