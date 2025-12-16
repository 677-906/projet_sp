# Guide des Sous-Zones

## Vue d'ensemble

Le système prend maintenant en charge une hiérarchie **Zone → Sous-zone** pour permettre une organisation plus fine du territoire.

## Caractéristiques

- ✅ Les sous-zones sont **optionnelles**
- ✅ Toutes les zones n'ont pas besoin de sous-zones
- ✅ Un chef de zone peut être assigné à une sous-zone spécifique
- ✅ Les clients peuvent être assignés à une sous-zone

## Structure hiérarchique

```
Base (DOUALA, YAOUNDE)
  └── Zone (DOUALA 4, YAOUNDE 2)
       └── Sous-zone (Secteur A, Zone Nord) [OPTIONNEL]
```

## Utilisation

### 1. Création d'un Chef de Zone avec sous-zone

**Via l'interface web (Gestion Utilisateurs):**
1. Sélectionnez le rôle "Chef de Zone"
2. Choisissez le responsable
3. Entrez la zone (ex: DOUALA 4)
4. *Optionnel:* Entrez la sous-zone (ex: Secteur A)
5. Cochez "Superviseur GMS" si applicable

**Exemple:**
- Zone: `DOUALA 4`
- Sous-zone: `Secteur Nord` (optionnel)

### 2. Création d'un Client avec sous-zone

**Via l'interface web (Gestion Clients):**
1. Remplissez les informations du client
2. Sélectionnez la zone
3. *Optionnel:* Entrez la sous-zone
4. Sélectionnez le commercial et le merchandiser

**Exemple:**
- Zone: `YAOUNDE 2`
- Sous-zone: `Zone Industrielle` (optionnel)

### 3. Modification des sous-zones

Les sous-zones peuvent être modifiées via les modals de modification :
- Pour les chefs de zone : bouton "Modifier" dans la liste des utilisateurs
- Pour les clients : bouton "Modifier" dans la liste des clients

## Migration de la base de données

**IMPORTANT:** Avant d'utiliser les sous-zones, vous devez exécuter la migration de la base de données.

### Option 1: Script Python (Recommandé)

```bash
cd backend
python migrate_add_sous_zone.py
```

Ce script:
- ✅ Ajoute la colonne `sous_zone` à la table `chefs_zone`
- ✅ Ajoute la colonne `sous_zone` à la table `clients`
- ✅ Gère les erreurs si les colonnes existent déjà
- ✅ Affiche des messages de confirmation

### Option 2: SQL Direct

```bash
cd backend
psql -U votre_utilisateur -d projet_sp -f add_sous_zone_migration.sql
```

## API Endpoints

### Création d'un Chef de Zone avec sous-zone

```http
POST /admin/full-user
Content-Type: application/json

{
  "nom": "Jean Dupont",
  "email": "jean@example.com",
  "password": "password123",
  "role_nom": "Chef de Zone",
  "responsable_id": 1,
  "zone": "DOUALA 4",
  "sous_zone": "Secteur Nord",  // OPTIONNEL
  "est_superviseur": false
}
```

### Création d'un Client avec sous-zone

```http
POST /admin/clients/
Content-Type: application/json

{
  "nom_client": "Supermarché ABC",
  "zone": "YAOUNDE 2",
  "sous_zone": "Zone Industrielle",  // OPTIONNEL
  "commercial_id": 5,
  "est_gms": true
}
```

### Mise à jour d'un Chef de Zone

```http
PUT /admin/chefs-zone/{id}
Content-Type: application/json

{
  "zone": "DOUALA 4",
  "sous_zone": "Secteur Sud",  // OPTIONNEL (null pour supprimer)
  "responsable_id": 1,
  "est_superviseur": false
}
```

### Mise à jour d'un Client

```http
PUT /admin/clients/{id}
Content-Type: application/json

{
  "zone": "YAOUNDE 2",
  "sous_zone": "Zone Commerciale"  // OPTIONNEL (null pour supprimer)
}
```

## Base de données

### Modifications apportées

**Table `chefs_zone`:**
```sql
ALTER TABLE chefs_zone ADD COLUMN sous_zone VARCHAR(100);
```

**Table `clients`:**
```sql
ALTER TABLE clients ADD COLUMN sous_zone VARCHAR(100);
```

### Schéma des colonnes

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| zone | VARCHAR(100) | YES | Zone principale (ex: DOUALA 4) |
| sous_zone | VARCHAR(100) | YES | Sous-zone optionnelle (ex: Secteur A) |

## Cas d'usage

### Exemple 1: Zone sans sous-zone
```
Zone: DOUALA 1
Sous-zone: (vide)
```
✅ Valide - La zone peut fonctionner seule

### Exemple 2: Zone avec sous-zone
```
Zone: DOUALA 4
Sous-zone: Secteur Nord
```
✅ Valide - Subdivision pour une meilleure organisation

### Exemple 3: Plusieurs sous-zones dans la même zone
```
Chef 1:
  Zone: YAOUNDE 2
  Sous-zone: Zone Industrielle

Chef 2:
  Zone: YAOUNDE 2
  Sous-zone: Zone Commerciale
```
✅ Valide - Plusieurs chefs peuvent gérer différentes sous-zones de la même zone

## Affichage dans l'interface

### Liste des utilisateurs
- La sous-zone s'affiche après la zone si elle existe
- Format: `Zone (Sous-zone)` ou juste `Zone` si pas de sous-zone

### Liste des clients
- La sous-zone peut être affichée dans une colonne séparée
- Ou combinée avec la zone: `Zone - Sous-zone`

## Notes importantes

1. **Compatibilité ascendante**: Les zones existantes sans sous-zone continuent de fonctionner normalement
2. **Validation**: Aucune validation stricte n'est appliquée - libre format
3. **Unicité**: Plusieurs chefs peuvent avoir la même combinaison zone/sous-zone
4. **Modification**: Les sous-zones peuvent être ajoutées, modifiées ou supprimées à tout moment
5. **Export Excel**: Les sous-zones seront incluses dans les exports Excel (à implémenter si nécessaire)

## Recommandations

- Utilisez des noms de sous-zones cohérents (ex: "Secteur A", "Secteur B", etc.)
- Documentez votre nomenclature de sous-zones
- Formez les utilisateurs sur la différence zone/sous-zone
- N'utilisez les sous-zones que si nécessaire pour votre organisation

## Support

Pour toute question ou problème lié aux sous-zones, référez-vous à :
- `backend/app/models.py` - Modèles de données
- `backend/app/schemas.py` - Schémas Pydantic
- `backend/migrate_add_sous_zone.py` - Script de migration
