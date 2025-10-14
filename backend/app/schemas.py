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
    is_active: Optional[bool] = None # <-- Assurez-vous qu'il est là

# --- Profils Métier (pour les routes de création dédiées) ---
class SuperviseurCreate(BaseModel):
    user_id: int
class MerchandiserCreate(BaseModel):
    user_id: int
    zone_geographique: str
    manager_id: int

# --- Création Complète d'Utilisateur (pour l'Admin) ---
class FullUserCreate(BaseModel):
    nom: str
    email: EmailStr
    password: str
    role_nom: str
    zone_geographique: Optional[str] = None
    manager_id: Optional[int] = None

# --- Données de Référence ---
class ClientBase(BaseModel):
    nom_client: str
    contact: Optional[str] = None
    typologie: Optional[str] = None
    localisation: Optional[str] = None
class ClientCreate(ClientBase):
    pass

class CategorieProduitBase(BaseModel):
    nom: str
class CategorieProduitCreate(CategorieProduitBase):
    pass


class ProduitBase(BaseModel):
    nom_produit: str
    marque: Optional[str] = None
    categorie_id: int

# Dans app/schemas.py
class ProduitUpdate(BaseModel):
    nom_produit: Optional[str] = None
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
    observations_generales: str = ''
    fifo_respecte: bool = True
    planogramme_respecte: bool = True
class VisiteCreate(VisiteBase):
    releves_stock: List[ReleveStockBase] = []
    details_produits: List[DetailVisiteProduitBase] = []
    veilles_concurrentielles: List[VeilleConcurrentielleBase] = []

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
    role: Role
    class Config:
        from_attributes = True


class CategorieProduit(CategorieProduitBase):
    id: int
    class Config:
        from_attributes = True

class Superviseur(BaseModel):
    id: int
    user: User
    class Config:
        from_attributes = True

class Merchandiser(BaseModel):
    id: int
    user: User
    zone_geographique: Optional[str]
    class Config:
        from_attributes = True

class Client(ClientBase):
    id: int
    class Config:
        from_attributes = True


class ClientUpdate(BaseModel):
    nom_client: Optional[str] = None
    contact: Optional[str] = None
    typologie: Optional[str] = None
    localisation: Optional[str] = None

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

class Visite(VisiteBase):
    id: int
    merchandiser_id: int
    date_visite: date
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
    merchandiser: Merchandiser
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


