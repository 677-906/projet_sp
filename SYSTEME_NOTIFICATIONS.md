# Système de Notifications Push

## Vue d'ensemble

Le système de notifications permet aux utilisateurs de recevoir des alertes en temps réel concernant les activités importantes du système de gestion de merchandising.

## Fonctionnalités Implémentées

### 1. Types de Notifications

Le système prend en charge trois types de notifications :

- **`visite_soumise`** : Alertes envoyées aux Chefs de Zone lorsqu'un merchandiser soumet une nouvelle visite à valider
- **`visite_validee`** : Confirmation envoyée au merchandiser lorsque sa visite est validée
- **`visite_rejetee`** : Notification envoyée au merchandiser avec la raison du rejet

### 2. Déclencheurs Automatiques

Les notifications sont créées automatiquement lors des événements suivants :

#### Soumission de visite
- **Quand** : Un merchandiser crée une nouvelle visite
- **Qui reçoit** : Le Chef de Zone responsable
- **Message** : "{Nom du merchandiser} a soumis une visite chez {Nom du client}."

#### Validation de visite
- **Quand** : Un Chef de Zone/Responsable valide une visite
- **Qui reçoit** : Le merchandiser qui a créé la visite
- **Message** : "Votre visite du {date} a été validée par {Nom du validateur}."

#### Rejet de visite
- **Quand** : Un Chef de Zone/Responsable rejette une visite
- **Qui reçoit** : Le merchandiser qui a créé la visite
- **Message** : "Votre visite du {date} a été rejetée par {Nom du validateur}.\n\nRaison: {commentaire}"

## Architecture Technique

### Backend (FastAPI)

#### Modèle de données
```python
class Notification(Base):
    id: int
    user_id: int              # Destinataire de la notification
    type: str                 # visite_soumise, visite_validee, visite_rejetee
    titre: str                # Titre de la notification
    message: str              # Contenu du message
    visite_id: int            # Référence à la visite (optionnel)
    is_read: bool             # Statut de lecture
    created_at: datetime      # Date de création
```

#### Endpoints API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/notifications/` | GET | Récupère les notifications de l'utilisateur connecté |
| `/notifications/unread-count` | GET | Compte les notifications non lues |
| `/notifications/{id}/read` | PUT | Marque une notification comme lue |
| `/notifications/read-all` | PUT | Marque toutes les notifications comme lues |

#### Fonctions CRUD
- `create_notification()` : Crée une nouvelle notification
- `get_user_notifications()` : Récupère les notifications d'un utilisateur
- `get_unread_notifications_count()` : Compte les notifications non lues
- `mark_notification_as_read()` : Marque une notification comme lue
- `mark_all_notifications_as_read()` : Marque toutes les notifications comme lues

### Frontend Web (React)

#### Composant NotificationCenter
Un composant dropdown qui affiche :
- Une icône de cloche avec badge de compteur
- Liste des notifications récentes (10 dernières)
- Possibilité de marquer comme lu
- Rafraîchissement automatique toutes les 30 secondes

**Intégration** :
- Ajouté dans `ChefZoneLayout.js`
- Ajouté dans `ResponsableLayout.js`
- Position : En haut à droite de la barre de navigation

**Styles** :
- Notifications non lues : fond bleu clair avec point bleu
- Notifications lues : fond blanc
- Animations au survol
- Responsive mobile

### Frontend Mobile (React Native / Expo)

#### Écran NotificationsScreen
- Nouvel onglet dans la navigation principale
- Liste complète des notifications
- Pull-to-refresh pour actualiser
- Badge visuel pour les notifications non lues
- Bouton "Tout marquer comme lu"

**Navigation** :
- Accessible via l'onglet "Notifications" (icône de cloche)
- Entre les onglets "Clients" et "Profil"

## Utilisation

### Pour les Chefs de Zone

1. **Recevoir des notifications de visites à valider** :
   - Une notification apparaît automatiquement quand un merchandiser soumet une visite
   - Le badge affiche le nombre de notifications non lues
   - Cliquez sur la cloche pour voir les détails

2. **Consulter les notifications** :
   - **Web** : Cliquez sur l'icône de cloche en haut à droite
   - **Mobile** : Allez dans l'onglet "Notifications"

3. **Marquer comme lu** :
   - **Web** : Cliquez sur la notification
   - **Mobile** : Touchez la notification non lue

### Pour les Merchandisers

1. **Recevoir des notifications de validation/rejet** :
   - Notification automatique après validation ou rejet
   - Badge rouge avec le nombre de nouvelles notifications

2. **Voir les raisons de rejet** :
   - Le message de la notification contient le commentaire du Chef de Zone
   - Permet de comprendre et corriger les erreurs

### Pour les Responsables

- Mêmes fonctionnalités que les Chefs de Zone
- Peut valider/rejeter des visites et envoyer des notifications aux merchandisers

## Initialisation de la Base de Données

Après avoir ajouté le système de notifications, il est nécessaire de recréer la base de données pour ajouter la nouvelle table `notifications`.

```bash
cd backend
python -m backend.init_db
```

Cela va :
1. Supprimer toutes les tables existantes
2. Recréer les tables avec le nouveau modèle Notification
3. Réinitialiser les données de test

**ATTENTION** : Cette opération supprime toutes les données existantes !

## Améliorations Futures

### Phase 1 : Notifications Push Natives
- Intégration Firebase Cloud Messaging (FCM)
- Notifications push même quand l'app est fermée
- Gestion des tokens de notification
- Sons et vibrations personnalisés

### Phase 2 : WebSockets
- Notifications en temps réel sur l'application web
- Pas besoin de rafraîchir la page
- Mise à jour instantanée du badge

### Phase 3 : Préférences de Notifications
- Permettre aux utilisateurs de choisir quels types de notifications recevoir
- Paramètres de fréquence (immédiat, digest quotidien, etc.)
- Désactiver certains types de notifications

### Phase 4 : Notifications Enrichies
- Liens directs vers la visite concernée
- Actions rapides (Valider/Rejeter depuis la notification)
- Prévisualisation des détails de la visite
- Support des images/photos

### Phase 5 : Historique et Statistiques
- Page dédiée à l'historique complet
- Filtres par type, date, statut
- Statistiques sur les taux de lecture
- Export des notifications

## Dépannage

### Les notifications n'apparaissent pas

1. **Vérifier la connexion API** :
   - Assurez-vous que le backend est démarré
   - Vérifiez l'URL de l'API dans les paramètres

2. **Vérifier l'authentification** :
   - Reconnectez-vous si le token a expiré
   - Vérifiez que vous avez le bon rôle

3. **Actualiser manuellement** :
   - Web : Cliquez sur la cloche pour rafraîchir
   - Mobile : Tirez vers le bas pour actualiser

### Le badge ne se met pas à jour

- Web : Le badge se rafraîchit toutes les 30 secondes automatiquement
- Mobile : Allez dans l'onglet Notifications pour forcer la mise à jour

### Erreur "Notification non trouvée"

- La notification a peut-être été supprimée
- Rechargez la liste des notifications

## API Reference

### Créer une notification manuellement (depuis le code)

```python
from app import crud, schemas

notification = schemas.NotificationCreate(
    user_id=123,
    type="visite_soumise",
    titre="Nouvelle visite",
    message="Description de la notification",
    visite_id=456  # Optionnel
)

crud.create_notification(db, notification)
```

### Récupérer les notifications (depuis le frontend)

```javascript
// Web (React)
import api from '../api/axiosConfig';

const response = await api.get('/notifications/', {
  params: { limit: 10 }
});
const notifications = response.data;
```

```javascript
// Mobile (React Native)
import api from '../api/axiosConfig';

const response = await api.get('/notifications/', {
  params: { limit: 50 }
});
const notifications = response.data;
```

## Fichiers Modifiés

### Backend
- `backend/app/models.py` : Ajout du modèle Notification
- `backend/app/schemas.py` : Ajout des schémas Pydantic
- `backend/app/crud.py` : Fonctions CRUD pour les notifications
- `backend/app/main.py` : Endpoints API + logique automatique

### Frontend Web
- `web-app/src/components/NotificationCenter.js` : Composant principal
- `web-app/src/components/NotificationCenter.css` : Styles
- `web-app/src/components/ChefZoneLayout.js` : Intégration
- `web-app/src/components/ChefZoneLayout.css` : Styles navbar
- `web-app/src/components/ResponsableLayout.js` : Intégration
- `web-app/src/components/ResponsableLayout.css` : Styles navbar

### Frontend Mobile
- `mobile-app/screens/NotificationsScreen.js` : Écran de notifications
- `mobile-app/App.js` : Ajout de l'onglet Notifications

## Support

Pour toute question ou problème concernant le système de notifications, consultez :
- La documentation du projet dans `CLAUDE.md`
- Les logs du backend pour le débogage
- Les commentaires dans le code source

---

**Date de création** : 2025-01-24
**Version** : 1.0
**Auteur** : Système de gestion Source du Pays
