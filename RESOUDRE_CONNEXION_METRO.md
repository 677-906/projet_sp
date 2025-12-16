# Résoudre "Cannot connect to Metro"

## 🔍 Diagnostic du Problème

L'erreur indique que votre téléphone ne peut pas se connecter au serveur Metro (Expo) sur l'adresse **192.168.43.117:8081**.

Cela peut avoir plusieurs causes:
- Le PC et le téléphone ne sont pas sur le même réseau WiFi
- Le pare-feu Windows bloque la connexion
- Le serveur Metro n'est pas démarré
- L'adresse IP a changé

---

## ✅ Solution 1: Vérifier que PC et Téléphone sont sur le Même WiFi

### Sur votre PC:

1. Ouvrez **Paramètres** → **Réseau et Internet** → **WiFi**
2. Notez le nom du réseau WiFi auquel vous êtes connecté

### Sur votre Téléphone:

1. Ouvrez **Paramètres** → **WiFi**
2. Vérifiez que vous êtes connecté au **même réseau WiFi** que le PC

⚠️ **IMPORTANT**: Si votre téléphone est connecté aux **données mobiles** ou à un **autre WiFi**, l'application ne fonctionnera pas!

---

## ✅ Solution 2: Redémarrer le Serveur Expo

### Dans PowerShell:

```powershell
# Tuez tous les processus Node
taskkill /F /IM node.exe

# Allez dans le dossier mobile-app
cd C:\Users\Jenny Tiemeni\Projet_SP\mobile-app

# Redémarrez Expo avec le cache nettoyé
npx expo start -c
```

### Un QR code devrait apparaître:

```
Metro waiting on exp://192.168.x.x:8081
› Press s │ switch to Expo Go
› Press a │ open Android
› Press i │ open iOS simulator

[QR CODE ICI]
```

### Scannez le QR code avec Expo Go

---

## ✅ Solution 3: Configurer l'Adresse IP Manuellement dans Expo Go

Si le QR code ne fonctionne pas:

### Étape 1: Trouver l'adresse IP de votre PC

Dans PowerShell:
```powershell
ipconfig
```

Cherchez la ligne **"Adresse IPv4"** sous votre adaptateur WiFi:
```
Carte réseau sans fil Wi-Fi:
   Adresse IPv4. . . . . . . . . . . . . . : 192.168.1.100
```

Notez cette adresse (ex: **192.168.1.100**)

### Étape 2: Configurer Expo Go

1. Ouvrez **Expo Go** sur votre téléphone
2. Allez dans **Projects** → ⚙️ (Settings)
3. Appuyez sur **"Enter URL manually"**
4. Entrez: `exp://[VOTRE_IP]:8081`
   - Exemple: `exp://192.168.1.100:8081`
5. Appuyez sur **Connect**

---

## ✅ Solution 4: Désactiver Temporairement le Pare-feu Windows

Le pare-feu Windows peut bloquer la connexion.

### Méthode 1: Créer une Exception

1. Ouvrez **Pare-feu Windows Defender**
2. Cliquez sur **"Autoriser une application via le pare-feu"**
3. Cliquez sur **"Modifier les paramètres"**
4. Cliquez sur **"Autoriser une autre application"**
5. Cherchez **"node.exe"** dans:
   ```
   C:\Program Files\nodejs\node.exe
   ```
6. Cochez **Privé** et **Public**
7. Cliquez sur **OK**

### Méthode 2: Désactiver Temporairement (pour tester)

⚠️ **Seulement pour tester**, puis réactivez-le!

1. Ouvrez **Pare-feu Windows Defender**
2. Cliquez sur **"Activer ou désactiver le Pare-feu Windows Defender"**
3. Désactivez pour **"Réseau privé"**
4. Testez l'application
5. **Réactivez le pare-feu** après le test!

---

## ✅ Solution 5: Utiliser le Mode Tunnel (Sans WiFi)

Si rien ne fonctionne, utilisez le **mode tunnel** d'Expo qui fonctionne même sans être sur le même réseau:

```powershell
cd C:\Users\Jenny Tiemeni\Projet_SP\mobile-app
npx expo start --tunnel
```

⚠️ **Note**: Le mode tunnel est plus lent mais fonctionne toujours.

Scannez le nouveau QR code qui apparaît.

---

## ✅ Solution 6: Vérifier les Ports

Assurez-vous que le port 8081 n'est pas bloqué:

```powershell
# Vérifier si le port 8081 est utilisé
netstat -ano | findstr :8081
```

Si le port est utilisé par un autre processus:
```powershell
# Tuer le processus (remplacez PID par le numéro affiché)
taskkill /F /PID [PID]
```

---

## 🎯 Solution Recommandée (Ordre de Priorité)

1. ✅ **Vérifier le même WiFi** (Solution 1) - 30 secondes
2. ✅ **Redémarrer Expo** (Solution 2) - 1 minute
3. ✅ **Configurer IP manuellement** (Solution 3) - 2 minutes
4. ✅ **Autoriser dans Pare-feu** (Solution 4) - 3 minutes
5. ✅ **Mode Tunnel** (Solution 5) - 5 minutes

---

## 📱 Vérification que Ça Fonctionne

Quand la connexion réussit, vous verrez dans le terminal:

```
› Opening exp://192.168.x.x:8081 on DEVICE_NAME
Metro waiting on exp://192.168.x.x:8081
```

Et sur votre téléphone, l'application se chargera avec un écran de chargement Expo.

---

## 🆘 Si Rien ne Fonctionne

**Dernière solution**: Utilisez un câble USB pour le débogage:

1. Connectez votre téléphone en USB
2. Activez le débogage USB
3. Lancez:
   ```powershell
   npx expo run:android
   ```

Cela fera un build natif qui ne nécessite pas de connexion Metro.

---

## 📊 Tableau de Diagnostic

| Symptôme | Cause Probable | Solution |
|----------|----------------|----------|
| "Cannot connect to Metro" | Pas sur le même WiFi | Vérifier WiFi |
| QR code ne fonctionne pas | Mauvaise IP | Config manuelle IP |
| Connexion lente puis timeout | Pare-feu bloque | Autoriser node.exe |
| Fonctionne puis se déconnecte | IP change (DHCP) | IP statique OU tunnel |
| Rien ne fonctionne | Réseau complexe | Mode tunnel |

---

*Document créé le 23 octobre 2025*
