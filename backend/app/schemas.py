# Fichier: app/schemas.py - VERSION FINALE COMPLÈTE ET INTÉGRALE

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# ==============================================================================
# 1. SCHÉMAS DE BASE ET DE CRÉATION (Utilisés pour valider les données entrantes)
# ==============================================================================

# --- Rôles ---
class RoleBase(BaseModel):
    nom: str
    description: Optional[str] = None
class RoleCreate(RoleBase):
    pass

# --- Utilisateurs ---
class UserBase(BaseModel):
    email: EmailStr
    nom: str
class UserCreate(UserBase):
    password: str
    role_id: int

class UserUpdate(BaseModel):
    nom: Optional[str] = None
    email: Optional[EmailStr] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None  # Optionnel : pour réinitialiser le mot de passe

# --- Profils Métier (pour les routes de création dédiées) ---
class ResponsableCreate(BaseModel):
    user_id: int
    base: Optional[str] = None
    zone: Optional[str] = None

class ChefZoneCreate(BaseModel):
    user_id: int
    responsable_id: int
    zone: Optional[str] = None
    est_superviseur: Optional[bool] = False

class MerchandiserCreate(BaseModel):
    user_id: int
    chef_zone_id: int
    sous_zone: Optional[str] = None  # Sous-zone au sein de la zone du chef (ex: A1, A2)

# --- Création Complète d'Utilisateur (pour l'Admin) ---
class FullUserCreate(BaseModel):
    nom: str
    email: EmailStr
    password: str
    role_nom: str  # Administrateur, Responsable, Chef de Zone, Merchandiser
    base: Optional[str] = None  # Pour Responsable
    zone: Optional[str] = None  # Pour Chef de Zone
    sous_zone: Optional[str] = None  # Pour Merchandiser (sous-zone au sein de la zone du chef)
    responsable_id: Optional[int] = None  # Pour Chef de Zone
    chef_zone_id: Optional[int] = None  # Pour Merchandiser
    est_superviseur: Optional[bool] = False  # Pour Chef de Zone (indique si c'est un superviseur GMS)

# --- Données de Référence ---
class CommercialBase(BaseModel):
    nom: str
    contact: Optional[str] = None
    chef_zone_id: int

class CommercialCreate(CommercialBase):
    pass

class CommercialUpdate(BaseModel):
    nom: Optional[str] = None
    contact: Optional[str] = None
    chef_zone_id: Optional[int] = None

class ResponsableUpdate(BaseModel):
    base: Optional[str] = None
    zone: Optional[str] = None

class ChefZoneUpdate(BaseModel):
    zone: Optional[str] = None
    responsable_id: Optional[int] = None
    est_superviseur: Optional[bool] = None

class MerchandiserUpdate(BaseModel):
    chef_zone_id: Optional[int] = None
    sous_zone: Optional[str] = None  # Sous-zone au sein de la zone du chef

class ClientBase(BaseModel):
    nom_client: str
    contact: Optional[str] = None
    typologie: Optional[str] = None
    localisation: Optional[str] = None
    zone: Optional[str] = None
    sous_zone: Optional[str] = None
    lieu_dit: Optional[str] = None
    commercial_nom: Optional[str] = None  # LEGACY
    commercial_id: Optional[int] = None
    merchandiser_id: Optional[int] = None
    est_gms: Optional[bool] = False
    # Coordonnées GPS du client
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    nom_client: Optional[str] = None
    contact: Optional[str] = None
    typologie: Optional[str] = None
    localisation: Optional[str] = None
    zone: Optional[str] = None
    sous_zone: Optional[str] = None
    lieu_dit: Optional[str] = None
    commercial_nom: Optional[str] = None  # LEGACY
    commercial_id: Optional[int] = None
    merchandiser_id: Optional[int] = None
    est_gms: Optional[bool] = None
    # Coordonnées GPS du client
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class CategorieProduitBase(BaseModel):
    nom: str
class CategorieProduitCreate(CategorieProduitBase):
    pass


class ProduitBase(BaseModel):
    nom_produit: str  # Marque/abréviation: SP, OP, VITAL, etc.
    article: Optional[str] = None  # Nom complet: EAU SUPERMONT 1.5L PACK(6), etc.
    marque: Optional[str] = None
    categorie_id: int

# Dans app/schemas.py
class ProduitUpdate(BaseModel):
    nom_produit: Optional[str] = None
    article: Optional[str] = None
    marque: Optional[str] = None
    categorie_id: Optional[int] = None

class ProduitCreate(ProduitBase):
    pass

class ConcurrentBase(BaseModel):
    nom: str
class ConcurrentCreate(ConcurrentBase):
    pass

# --- Détails de la Visite (pour la création) ---
class ReleveStockBase(BaseModel):
    produit_id: int
    quantite_en_stock: int = 0
    est_en_rupture: bool = False
    type_rupture: str = ''

class DetailVisiteProduitBase(BaseModel):
    produit_id: int
    type_detail: str # 'commande' ou 'incident'
    quantite: int
    observation: str = ''

class VeilleConcurrentielleBase(BaseModel):
    concurrent_id: int
    marque: str = ''
    nombre_packs: int = 0
    activite_observee: str = ''
    mecanisme: str = ''

# --- Visite (pour la création) ---
class VisiteBase(BaseModel):
    client_id: int

    # Horaires
    heure_debut: Optional[str] = None
    heure_fin: Optional[str] = None

    # Informations de base
    base: Optional[str] = None

    # Équipements
    type_outil: Optional[str] = None
    marque_outil: Optional[str] = None
    etat_outil: Optional[str] = None

    # Conformité
    fifo_respecte: bool = True
    planogramme_respecte: bool = True
    observation_planogramme: str = ''

    # Ruptures
    ruptures: str = ''
    type_rupture: str = ''

    # Incidents
    type_incidents: str = ''
    articles_incidents: str = ''
    quantite_incidents: Optional[int] = None

    # Observations
    observations_generales: str = ''

    # Informations commerciales
    reseau_distribution: Optional[str] = None
    type_client: Optional[str] = None
    client_direct_nom: Optional[str] = None

    # Géolocalisation - Position du merchandiser lors de la soumission
    latitude_soumission: Optional[float] = None
    longitude_soumission: Optional[float] = None
    precision_gps: Optional[float] = None

class VisiteCreate(VisiteBase):
    releves_stock: List[ReleveStockBase] = []
    details_produits: List[DetailVisiteProduitBase] = []
    veilles_concurrentielles: List[VeilleConcurrentielleBase] = []

class VisiteRejetData(BaseModel):
    commentaire: Optional[str] = None

# ==============================================================================
# 2. SCHÉMAS DE RÉPONSE (Utilisés pour formater les données sortantes)
# ==============================================================================
class Role(RoleBase):
    id: int
    class Config:
        from_attributes = True

class User(UserBase):
    id: int
    is_active: bool
    created_at: Optional[datetime] = None
    role: Role
    responsable_profile: Optional['ResponsableProfile'] = None
    chef_zone_profile: Optional['ChefZoneProfile'] = None
    merchandiser_profile: Optional['MerchandiserProfile'] = None
    class Config:
        from_attributes = True


class CategorieProduit(CategorieProduitBase):
    id: int
    class Config:
        from_attributes = True

# Schémas de profils sans user (pour éviter références circulaires dans User)
class ResponsableProfile(BaseModel):
    id: int
    base: Optional[str] = None
    zone: Optional[str] = None
    class Config:
        from_attributes = True

class ChefZoneProfile(BaseModel):
    id: int
    zone: Optional[str] = None
    responsable_id: Optional[int] = None
    est_superviseur: Optional[bool] = False
    class Config:
        from_attributes = True

class MerchandiserProfile(BaseModel):
    id: int
    chef_zone_id: Optional[int] = None
    sous_zone: Optional[str] = None
    class Config:
        from_attributes = True

# Schémas complets avec user (pour endpoints spécifiques)
class Responsable(BaseModel):
    id: int
    user: User
    base: Optional[str] = None
    zone: Optional[str] = None
    class Config:
        from_attributes = True

class ChefZone(BaseModel):
    id: int
    user: User
    responsable_id: Optional[int] = None
    zone: Optional[str] = None
    est_superviseur: Optional[bool] = False
    class Config:
        from_attributes = True

class Merchandiser(BaseModel):
    id: int
    user: User
    class Config:
        from_attributes = True

# Schéma enrichi pour Merchandiser avec relations complètes (pour VisiteDetail)
class MerchandiserDetail(BaseModel):
    id: int
    user: User
    chef_zone: Optional['ChefZone'] = None
    class Config:
        from_attributes = True

class Commercial(CommercialBase):
    id: int
    class Config:
        from_attributes = True

class Client(ClientBase):
    id: int
    commercial: Optional[Commercial] = None  # Inclure l'objet commercial complet
    class Config:
        from_attributes = True

class Produit(ProduitBase):
    id: int
    categorie: CategorieProduit
    class Config:
        from_attributes = True
        
class Concurrent(ConcurrentBase):
    id: int
    class Config:
        from_attributes = True

class ReleveStock(ReleveStockBase):
    id: int
    produit: Produit
    class Config:
        from_attributes = True

class DetailVisiteProduit(DetailVisiteProduitBase):
    id: int
    produit: Produit
    class Config:
        from_attributes = True

class VeilleConcurrentielle(VeilleConcurrentielleBase):
    id: int
    concurrent: Concurrent
    class Config:
        from_attributes = True

class Visite(BaseModel):
    id: int
    merchandiser_id: int
    client_id: int
    date_visite: date

    # Horaires - convertis en string
    heure_debut: Optional[str] = None
    heure_fin: Optional[str] = None

    # Informations de base
    base: Optional[str] = None

    # Équipements
    type_outil: Optional[str] = None
    marque_outil: Optional[str] = None
    etat_outil: Optional[str] = None

    # Conformité
    fifo_respecte: bool = True
    planogramme_respecte: bool = True
    observation_planogramme: str = ''

    # Ruptures
    ruptures: str = ''
    type_rupture: str = ''

    # Incidents
    type_incidents: str = ''
    articles_incidents: str = ''
    quantite_incidents: Optional[int] = None

    # Observations
    observations_generales: str = ''

    # Informations commerciales
    reseau_distribution: Optional[str] = None
    type_client: Optional[str] = None
    client_direct_nom: Optional[str] = None

    # Géolocalisation
    latitude_soumission: Optional[float] = None
    longitude_soumission: Optional[float] = None
    precision_gps: Optional[float] = None
    distance_client: Optional[float] = None
    est_sur_site: Optional[bool] = None

    # Validation
    statut_validation: str

    class Config:
        from_attributes = True

class VisiteInfo(BaseModel):
    id: int
    date_visite: date
    statut_validation: str
    client: Client
    merchandiser: Merchandiser
    class Config:
        from_attributes = True
        
class VisiteDetail(Visite):
    merchandiser: MerchandiserDetail
    client: Client
    releves_stock: List[ReleveStock] = []
    details_produits: List[DetailVisiteProduit] = []
    veilles_concurrentielles: List[VeilleConcurrentielle] = []
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user_role: str
class TokenData(BaseModel):
    email: Optional[str] = None


class ActiviteLog(BaseModel):
     id: int
     timestamp: datetime
     action: str
     user: Optional[User] = None
     class Config:
         from_attributes = True


# --- Notifications ---
class NotificationBase(BaseModel):
    titre: str
    message: str
    type: str
    visite_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    user_id: int

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Résoudre les références forward pour Pydantic
MerchandiserDetail.model_rebuild()