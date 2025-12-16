# Gestion GMS et Superviseurs

## Vue d'ensemble

Le système prend en charge la distinction entre deux types de clients et leurs gestionnaires respectifs :

- **GMS (Grandes et Moyennes Surfaces) / Entreprises** : Gérés par des **Superviseurs**
- **Petites Surfaces** : Gérées par des **Chefs de Zone**

## Architecture

### Modèles de données

#### Table `clients`
- **`est_gms`** (Boolean) : Indique si le client est une GMS ou une Petite Surface
  - `true` = GMS/Entreprise
  - `false` = Petite Surface (défaut)

#### Table `chefs_zone`
- **`est_superviseur`** (Boolean) : Indique si c'est un Superviseur GMS ou un Chef de Zone
  - `true` = Superviseur GMS
  - `false` = Chef de Zone (défaut)

## Fonctionnalités

### 1. Création de Client (Web App)

Lors de la création d'un client, l'administrateur peut cocher la case "GMS" pour indiquer qu'il s'agit d'une Grande/Moyenne Surface.

**Interface** :
- Formulaire de création de client
- Nouvelle case à cocher : ☐ **Client GMS** (Grande/Moyenne Surface)

### 2. Création de Chef de Zone / Superviseur (Web App)

Lors de la création d'un Chef de Zone, l'administrateur peut cocher la case "Superviseur" pour indiquer qu'il gère des GMS.

**Interface** :
- Formulaire de création d'utilisateur (rôle: Chef de Zone)
- Nouvelle case à cocher : ☐ **Superviseur GMS**

### 3. Affichage Dynamique (Mobile App)

Dans le formulaire de visite sur l'application mobile :

- **Si le client est une Petite Surface** :
  - Label : "Chef de Zone"
  - Affiche le nom du Chef de Zone

- **Si le client est une GMS** :
  - Label : "Superviseur"
  - Affiche le nom du Superviseur

**Exemple** :
```
Client : CARREFOUR AKWA (GMS)
Superviseur : Jean-Paul Mbarga
```

```
Client : EPICERIE DU COIN (Petite Surface)
Chef de Zone : Marie Kom
```

### 4. Export Excel

Le fichier Excel exporté contient maintenant **55 colonnes** (au lieu de 54) :

**Nouvelle colonne ajoutée** :
- **TYPE SURFACE** (colonne 13) : "GMS" ou "Petite Surface"

**Colonne modifiée** :
- **CHEF DE ZONE** devient **CHEF DE ZONE/SUPERVISEUR** (colonne 6)

## Installation

### 1. Exécuter le script de migration

Pour ajouter les nouveaux champs sans perdre les données existantes :

```bash
cd backend
python add_gms_fields.py
```

Ce script :
- ✅ Ajoute le champ `est_gms` dans la table `clients`
- ✅ Ajoute le champ `est_superviseur` dans la table `chefs_zone`
- ✅ Ne supprime aucune donnée existante

### 2. Redémarrer le backend

```bash
cd backend
uvicorn app.main:app --reload
```

## Utilisation

### Administrateur (Web App)

#### Créer un client GMS

1. Aller dans "Gestion Clients"
2. Cliquer sur "Nouveau Client"
3. Remplir le formulaire
4. **Cocher "Client GMS"** si c'est une grande surface
5. Sauvegarder

#### Créer un Superviseur

1. Aller dans "Gestion Utilisateurs"
2. Créer un nouvel utilisateur avec le rôle "Chef de Zone"
3. **Cocher "Superviseur GMS"** pour en faire un superviseur
4. Sauvegarder

### Merchandiser (Mobile App)

Lors de la création d'une visite :

1. Sélectionner un client
2. Le système affiche automatiquement :
   - "Chef de Zone : [Nom]" si c'est une petite surface
   - "Superviseur : [Nom]" si c'est une GMS
3. Remplir le reste du formulaire normalement

### Chef de Zone / Superviseur (Web App)

L'interface reste identique pour les deux types. La seule différence visible :

- Le titre peut être affiché différemment selon le profil
- Les rapports peuvent être filtrés par type de surface

## Données Existantes

**Par défaut**, tous les clients et chefs de zone existants sont considérés comme :
- Clients : Petites Surfaces (`est_gms = false`)
- Chefs de Zone : Chefs de Zone classiques (`est_superviseur = false`)

Pour modifier un client existant en GMS :
1. Aller dans la liste des clients
2. Éditer le client
3. Cocher "Client GMS"
4. Sauvegarder

Pour transformer un Chef de Zone en Superviseur :
1. Aller dans la liste des utilisateurs
2. Éditer le Chef de Zone concerné
3. Cocher "Superviseur GMS"
4. Sauvegarder

## Cas d'usage

### Exemple 1 : Hypermarché

**Client** : CASINO DOUALA
- Type : GMS (coché)
- Typologie : Hypermarché
- Zone : DOUALA 4

**Superviseur** : Jean-Paul Mbarga
- Rôle : Chef de Zone
- Superviseur GMS : Oui (coché)
- Zone : DOUALA 4

**Dans l'app mobile** :
```
📋 Visite chez CASINO DOUALA
Superviseur : Jean-Paul Mbarga
```

**Dans l'export Excel** :
```
CHEF DE ZONE/SUPERVISEUR | TYPE SURFACE
Jean-Paul Mbarga         | GMS
```

### Exemple 2 : Petite Épicerie

**Client** : BOUTIQUE BELLE VIE
- Type : Petite Surface (non coché)
- Typologie : Épicerie
- Zone : DOUALA 4

**Chef de Zone** : Marie Kom
- Rôle : Chef de Zone
- Superviseur GMS : Non (non coché)
- Zone : DOUALA 4

**Dans l'app mobile** :
```
📋 Visite chez BOUTIQUE BELLE VIE
Chef de Zone : Marie Kom
```

**Dans l'export Excel** :
```
CHEF DE ZONE/SUPERVISEUR | TYPE SURFACE
Marie Kom                | Petite Surface
```

## Fichiers Modifiés

### Backend
- `backend/app/models.py` : Ajout des champs `est_gms` et `est_superviseur`
- `backend/app/schemas.py` : Mise à jour des schémas Pydantic
- `backend/app/crud.py` : Support du nouveau champ dans `create_full_user`
- `backend/app/export_excel.py` : Ajout de la colonne TYPE SURFACE (55 colonnes)
- `backend/add_gms_fields.py` : Script de migration

### Frontend Web
À implémenter :
- Formulaire de création/édition de client : case à cocher "Client GMS"
- Formulaire de création d'utilisateur : case à cocher "Superviseur GMS"

### Frontend Mobile
À implémenter :
- Affichage dynamique du label "Chef de Zone" vs "Superviseur"
- Détection automatique basée sur `client.est_gms`

## API

### Récupérer les informations d'un client

```javascript
GET /clients/{client_id}

Response:
{
  "id": 123,
  "nom_client": "CASINO DOUALA",
  "typologie": "Hypermarché",
  "est_gms": true,  // ← Nouveau champ
  ...
}
```

### Créer un client GMS

```javascript
POST /admin/clients/

Body:
{
  "nom_client": "SCORE MAKEPE",
  "typologie": "Supermarché",
  "est_gms": true,  // ← Indiquer qu'c'est une GMS
  "zone": "DOUALA 4",
  ...
}
```

### Créer un Superviseur

```javascript
POST /admin/full-user

Body:
{
  "nom": "Jean-Paul Mbarga",
  "email": "jp.mbarga@sp.com",
  "password": "password123",
  "role_nom": "Chef de Zone",
  "zone": "DOUALA 4",
  "responsable_id": 1,
  "est_superviseur": true  // ← Indique que c'est un superviseur
}
```

## Questions Fréquentes

**Q : Un merchandiser peut-il gérer à la fois des GMS et des petites surfaces ?**
R : Oui, le système le permet. Le label s'adapte automatiquement selon le type de client visité.

**Q : Comment identifier rapidement les GMS dans la liste des clients ?**
R : Dans le futur, un filtre "Type de Surface" sera ajouté. En attendant, vérifiez le champ `est_gms`.

**Q : La colonne Excel existante est-elle impactée ?**
R : Oui, le fichier passe de 54 à 55 colonnes. La colonne "CHEF DE ZONE" devient "CHEF DE ZONE/SUPERVISEUR" et une nouvelle colonne "TYPE SURFACE" est ajoutée.

**Q : Les rapports Power BI doivent-ils être modifiés ?**
R : Oui, vous devrez mettre à jour votre modèle Power BI pour prendre en compte la nouvelle colonne TYPE SURFACE.

## Roadmap

### Phase 1 (Actuelle)
- ✅ Modèles de données
- ✅ Export Excel avec TYPE SURFACE
- ✅ Script de migration

### Phase 2 (À venir)
- ⏳ Interface web pour marquer les clients GMS
- ⏳ Interface web pour marquer les superviseurs
- ⏳ Affichage dynamique dans l'app mobile

### Phase 3 (Futur)
- 📅 Filtres par type de surface dans les rapports
- 📅 Statistiques séparées GMS vs Petites Surfaces
- 📅 Tableaux de bord dédiés pour les superviseurs

---

**Date de création** : 2025-01-24
**Version** : 1.0
**Auteur** : Système de gestion Source du Pays
