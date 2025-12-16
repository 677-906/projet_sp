# Guide Administrateur - Gestion de la Hiérarchie

## Vue d'ensemble de la hiérarchie

Le système Projet_SP utilise une structure hiérarchique à 5 niveaux :

```
Administrateur
    |
    +-- Responsable (ex: el charif)
        |
        +-- Chef de Zone (ex: Ruth)
            |
            +-- Commercial (ex: Chantal, Evans, Valerie...)
            |   |
            |   +-- Clients
            |
            +-- Merchandiser (ex: AYANGMA François)
                |
                +-- Visites clients
```

## 1. Création d'un Responsable

**Interface Web** : `/admin/users`

### Étapes :
1. Remplir le formulaire de création d'utilisateur
2. Sélectionner le rôle **"Responsable"**
3. Champs supplémentaires qui apparaissent :
   - **Base** : Ville/région (ex: DOUALA, YAOUNDE) - **OBLIGATOIRE**

### Exemple :
- Nom : `el charif`
- Email : `elcharif@sp.com`
- Mot de passe : `elcharif123`
- Rôle : `Responsable`
- Base : `DOUALA`

✅ **Résultat** : Un compte utilisateur + profil Responsable sont créés automatiquement

---

## 2. Création d'un Chef de Zone

**Interface Web** : `/admin/users`

### Étapes :
1. Remplir le formulaire de création d'utilisateur
2. Sélectionner le rôle **"Chef de Zone"**
3. Champs supplémentaires qui apparaissent :
   - **Responsable** : Sélectionner dans la liste déroulante - **OBLIGATOIRE**
   - **Zone** : Nom de la zone (ex: DOUALA 4, YAOUNDE 2) - **OBLIGATOIRE**

### Exemple :
- Nom : `Ruth`
- Email : `ruth@sp.com`
- Mot de passe : `ruth123`
- Rôle : `Chef de Zone`
- Responsable : `el charif - Base: DOUALA`
- Zone : `DOUALA 4`

✅ **Résultat** : Le chef de zone Ruth est automatiquement rattaché au responsable el charif

---

## 3. Création d'un Commercial

**Interface Web** : `/admin/commerciaux`

### Étapes :
1. Aller sur la page "Gestion des Commerciaux"
2. Remplir le formulaire :
   - **Nom** : Nom du commercial - **OBLIGATOIRE**
   - **Contact** : Numéro de téléphone (optionnel)
   - **Chef de Zone** : Sélectionner dans la liste - **OBLIGATOIRE**

### Exemple :
- Nom : `Chantal`
- Contact : `698123456`
- Chef de Zone : `Ruth - Zone: DOUALA 4`

✅ **Résultat** : Le commercial Chantal est rattaché au chef de zone Ruth (DOUALA 4)

### Important :
- Un commercial ne peut être rattaché qu'à **un seul** chef de zone
- Tous les clients du commercial doivent être dans la même zone

---

## 4. Création d'un Merchandiser

**Interface Web** : `/admin/users`

### Étapes :
1. Remplir le formulaire de création d'utilisateur
2. Sélectionner le rôle **"Merchandiser"**
3. Champs supplémentaires qui apparaissent :
   - **Chef de Zone** : Sélectionner dans la liste - **OBLIGATOIRE**

### Exemple :
- Nom : `AYANGMA François`
- Email : `ayangma.francois@sp.com`
- Mot de passe : `ayangma123`
- Rôle : `Merchandiser`
- Chef de Zone : `Ruth - Zone: DOUALA 4`

✅ **Résultat** : Le merchandiser AYANGMA François est rattaché au chef de zone Ruth

### Important :
- Le merchandiser verra dans l'app mobile **tous les clients** des commerciaux de sa zone
- Dans notre exemple : AYANGMA voit les clients de Chantal, Evans, Valerie, Josepha, Dief et Nelly

---

## 5. Création d'un Client

**Interface Web** : `/admin/clients`

### Étapes :
1. Aller sur la page "Gestion des Clients"
2. Remplir le formulaire :
   - **Nom du client** : **OBLIGATOIRE**
   - **Contact** : Numéro de téléphone
   - **Typologie** : Type de client (GROSSISTE, SUPERETTES, etc.)
   - **Localisation** : Quartier
   - **Zone** : Sélectionner dans la liste - **OBLIGATOIRE**
   - **Commercial** : Apparaît après sélection de la zone - **OBLIGATOIRE**
   - **Lieu-dit** : Indication précise

### Exemple :
- Nom du client : `KABILA NDOBO`
- Contact : `698539444`
- Typologie : `GROSSISTE`
- Localisation : `BONABERI`
- Zone : `DOUALA 4`
- Commercial : `Chantal` (liste des commerciaux de DOUALA 4)
- Lieu-dit : `NDOBO MINISTERE SOYA`

✅ **Résultat** : Le client est créé et assigné au commercial Chantal

### Sélection en cascade Zone → Commercial :

Le système charge automatiquement les commerciaux selon la zone sélectionnée :

1. **Sélection de "DOUALA 4"** → Trouve le chef de zone Ruth
2. **Chargement automatique** → Affiche les 6 commerciaux de Ruth : Chantal, Evans, Josepha, Dief, Valerie, Nelly
3. **Sélection du commercial** → Le client est assigné

---

## 6. Vérifications importantes

### Dans l'interface administrateur :

**Page Clients** (`/admin/clients`) :
- La colonne "Commercial" doit afficher le **nom** du commercial (ex: "Chantal")
- Et non pas "Commercial #40"

**Page Commerciaux** (`/admin/commerciaux`) :
- Colonne "Zone" : Affiche la zone du chef de zone
- Colonne "Chef de Zone" : Affiche le nom et la zone
- Bouton "Voir Clients" : Liste tous les clients du commercial

**Page Utilisateurs** (`/admin/users`) :
- Les rôles "Responsable", "Chef de Zone" et "Merchandiser" affichent des champs conditionnels
- Les rattachements hiérarchiques sont obligatoires

---

## 7. Application Mobile - Merchandiser

### Connexion :
- Email : `ayangma.francois@sp.com`
- Mot de passe : `ayangma123`

### Écran Clients :
- **Affiche uniquement** les clients de sa zone (DOUALA 4)
- Soit : les 45 clients des 6 commerciaux (Chantal, Evans, Valerie, Josepha, Dief, Nelly)

### Formulaire de Visite :
- Sélection d'un client
- **Le champ "Commercial"** s'auto-remplit avec le bon commercial du client
- Exemples :
  - Client "KABILA NDOBO" → Commercial : **Chantal**
  - Client "KVS SARL" → Commercial : **Evans**
  - Client "ELVIS DOLLAR" → Commercial : **Valerie**

---

## 8. Cas d'usage complet

### Scénario : Ajout d'un nouveau commercial et de ses clients

1. **Créer le commercial** (`/admin/commerciaux`) :
   - Nom : `Marie`
   - Contact : `695000000`
   - Chef de Zone : `Ruth - Zone: DOUALA 4`

2. **Créer les clients** (`/admin/clients`) :
   - Pour chaque client :
     - Remplir les informations
     - Zone : `DOUALA 4`
     - Commercial : `Marie` (apparaît maintenant dans la liste)

3. **Vérification côté mobile** :
   - Le merchandiser AYANGMA voit maintenant aussi les clients de Marie
   - En ouvrant un formulaire de visite pour un client de Marie, le champ "Commercial" affiche "Marie"

---

## 9. Scripts de test disponibles

### Test de la hiérarchie complète :
```bash
cd backend
python test_hierarchie_complete.py
```

Ce script vérifie :
- ✅ Responsable el charif existe et est correctement configuré
- ✅ Chef de Zone Ruth est bien rattaché à el charif
- ✅ 6 Commerciaux sont bien rattachés à Ruth
- ✅ Merchandiser AYANGMA est bien rattaché à Ruth
- ✅ Tous les 45 clients ont un commercial assigné
- ✅ Les relations commercial → clients fonctionnent

### Test de workflow complet :
```bash
cd backend
python test_complete_workflow.py
```

---

## 10. Endpoints API utilisés

### Backend - Routes principales :

**Utilisateurs et profils :**
- `POST /admin/full-user` : Création utilisateur + profil (Responsable/Chef de Zone/Merchandiser)
- `GET /admin/users/search` : Recherche utilisateurs
- `GET /responsables/` : Liste des responsables
- `GET /chefs-zone/` : Liste des chefs de zone

**Commerciaux :**
- `POST /admin/commerciaux/` : Créer un commercial
- `GET /admin/commerciaux/` : Liste des commerciaux
- `GET /chef-zone/{id}/commerciaux` : Commerciaux d'un chef de zone

**Clients :**
- `POST /admin/clients/` : Créer un client
- `GET /admin/clients/search` : Recherche clients (avec relation commercial chargée)
- `GET /clients/{id}` : Détails client (avec commercial)
- `GET /merchandiser/clients` : Clients visibles par le merchandiser connecté

---

## 11. Troubleshooting

### Le commercial n'apparaît pas dans la liste lors de création de client
**Cause** : Aucun chef de zone n'est assigné à la zone sélectionnée
**Solution** : Créer d'abord un chef de zone pour cette zone

### Le merchandiser ne voit aucun client dans l'app mobile
**Cause** : Aucun commercial n'existe sous son chef de zone
**Solution** : Créer des commerciaux rattachés au même chef de zone que le merchandiser

### Le formulaire de visite affiche toujours le même commercial
**Cause** : Backend ne charge pas la relation commercial
**Solution** : Vérifiée et corrigée - le backend charge maintenant la relation avec `joinedload`

### Un client affiche "Commercial #40" au lieu du nom
**Cause** : Frontend affiche l'ID au lieu du nom
**Solution** : Corrigée - le frontend affiche maintenant `c.commercial?.nom`

---

## 12. Identifiants de test - Zone DOUALA 4

### Responsable :
- Email : `elcharif@sp.com`
- Mot de passe : `elcharif123`

### Chef de Zone :
- Email : `ruth@sp.com`
- Mot de passe : `ruth123`

### Merchandiser :
- Email : `ayangma.francois@sp.com`
- Mot de passe : `ayangma123`

### Commerciaux (DOUALA 4) :
- Chantal : 12 clients
- Evans : 14 clients
- Valerie : 13 clients
- Josepha : 2 clients
- Dief : 3 clients
- Nelly : 1 client

**Total : 45 clients dans la zone DOUALA 4**

---

## 13. Résumé des corrections apportées

### Backend :
1. ✅ Schéma `Client` : Ajout de l'objet `commercial` complet dans la réponse API
2. ✅ Endpoints avec `joinedload` :
   - `GET /clients/{id}`
   - `GET /clients/`
   - `GET /merchandiser/clients`
   - `GET /admin/clients/search` (via crud.py)

### Frontend Web :
3. ✅ `ClientManagementPage.js` : Affichage du nom commercial au lieu de l'ID

### Mobile App :
4. ✅ `VisitFormScreen.js` : Utilisation de `clientData.commercial?.nom`

### Données :
5. ✅ Script `import_ayangma_data_v2.py` : Hiérarchie correcte
6. ✅ Création de 6 commerciaux rattachés au chef de zone Ruth
7. ✅ Assignation correcte des 45 clients aux commerciaux

---

## Conclusion

Le système de hiérarchie est maintenant **complet et fonctionnel** à tous les niveaux :
- ✅ Interface administrateur web
- ✅ Application mobile merchandiser
- ✅ API backend avec relations
- ✅ Base de données avec données de test

Toutes les insertions faites via l'interface administrateur respecteront automatiquement les relations hiérarchiques.
