# Fichier: app/crud.py - VERSION FINALE COMPLÈTE ET INTÉGRALE

from sqlalchemy.orm import Session, joinedload
from . import models, schemas, security

# --- Utilisateurs et Profils ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).options(joinedload(models.User.role), joinedload(models.User.merchandiser_profile), joinedload(models.User.superviseur_profile)).filter(models.User.email == email).first()
def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(email=user.email, nom=user.nom, password_hash=hashed_password, role_id=user.role_id)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
# Dans app/crud.py

# ... (vos fonctions get_user_by_email, create_user, etc.)

# --- LA FONCTION MANQUANTE EST ICI ---
def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    """Met à jour un utilisateur dans la base de données."""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
    
    # On récupère les données envoyées SANS les valeurs non définies
    update_data = user_update.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        # Utilise setattr pour mettre à jour les champs dynamiquement
        setattr(db_user, key, value)
            
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_superviseur_profile(db: Session, user_id: int):
    db_profile = models.Superviseur(user_id=user_id)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile
def create_merchandiser_profile(db: Session, profile: schemas.MerchandiserCreate):
    db_profile = models.Merchandiser(**profile.dict())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile
def create_full_user(db: Session, user_data: schemas.FullUserCreate):
    if user_data.role_nom.lower() == 'administrateur':
        # On lève une erreur explicite qui sera renvoyée à l'utilisateur
        raise ValueError("La création d'un administrateur n'est pas autorisée.")
    role = db.query(models.Role).filter(models.Role.nom.ilike(user_data.role_nom)).first()
    if not role:
        raise ValueError("Le rôle spécifié n'existe pas")
    user_to_create = schemas.UserCreate(nom=user_data.nom, email=user_data.email, password=user_data.password, role_id=role.id)
    db_user = create_user(db, user=user_to_create)
    
    if user_data.role_nom.lower() == 'superviseur':
        create_superviseur_profile(db, user_id=db_user.id)
    elif user_data.role_nom.lower() == 'merchandiser':
        if not user_data.manager_id or not user_data.zone_geographique:
            raise ValueError("Manager ID et Zone sont requis pour un merchandiser")
        merchandiser_profile_data = schemas.MerchandiserCreate(user_id=db_user.id, zone_geographique=user_data.zone_geographique, manager_id=user_data.manager_id)
        create_merchandiser_profile(db, profile=merchandiser_profile_data)
    db.refresh(db_user)
    return db_user



def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return db_user
    return None

# --- Données de Référence ---
def get_clients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Client).offset(skip).limit(limit).all()
def create_client(db: Session, client: schemas.ClientCreate):
    db_client = models.Client(**client.dict())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


def delete_client(db: Session, client_id: int):
    """Supprime un client de la base de données."""
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if db_client:
        # Attention: si des visites sont liées à ce client, cela peut causer une erreur
        # d'intégrité référentielle. Une vraie application gérerait ce cas
        # (ex: suppression en cascade ou anonymisation).
        db.delete(db_client)
        db.commit()
        return db_client
    return None

def update_client(db: Session, client_id: int, client_update: schemas.ClientUpdate):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        return None
    update_data = client_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_client, key, value)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def search_clients(db: Session, query: str):
    search_filter = models.Client.nom_client.ilike(f"%{query}%") | models.Client.contact.ilike(f"%{query}%")
    return db.query(models.Client).filter(search_filter).all()

def get_produits(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Produit).offset(skip).limit(limit).all()
def create_produit(db: Session, produit: schemas.ProduitCreate):
    db_produit = models.Produit(**produit.dict())
    db.add(db_produit)
    db.commit()
    db.refresh(db_produit)
    return db_produit

def delete_produit(db: Session, produit_id: int):
    """Supprime un produit de la base de données."""
    db_produit = db.query(models.Produit).filter(models.Produit.id == produit_id).first()
    if db_produit:
        db.delete(db_produit)
        db.commit()
        return db_produit
    return None

# Dans app/crud.py
def update_produit(db: Session, produit_id: int, produit_update: schemas.ProduitUpdate):
    db_produit = db.query(models.Produit).filter(models.Produit.id == produit_id).first()
    if not db_produit:
        return None
    update_data = produit_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_produit, key, value)
    db.add(db_produit)
    db.commit()
    db.refresh(db_produit)
    return db_produit

def search_produits(db: Session, query: str):
    search_filter = models.Produit.nom_produit.ilike(f"%{query}%") | models.Produit.marque.ilike(f"%{query}%")
    return db.query(models.Produit).filter(search_filter).all()

def get_categories_produit(db: Session, skip: int = 0, limit: int = 100):
    """Récupère la liste de toutes les catégories de produits."""
    return db.query(models.CategorieProduit).offset(skip).limit(limit).all()

def create_categorie_produit(db: Session, categorie: schemas.CategorieProduitCreate):
    """Crée une nouvelle catégorie de produit."""
    db_categorie = models.CategorieProduit(**categorie.dict())
    db.add(db_categorie)
    db.commit()
    db.refresh(db_categorie)
    return db_categorie

def get_concurrent_by_nom(db: Session, nom: str):
    return db.query(models.Concurrent).filter(models.Concurrent.nom == nom).first()
def get_concurrents(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Concurrent).offset(skip).limit(limit).all()
def create_concurrent(db: Session, concurrent: schemas.ConcurrentCreate):
    db_concurrent = models.Concurrent(nom=concurrent.nom)
    db.add(db_concurrent)
    db.commit()
    db.refresh(db_concurrent)
    return db_concurrent

# --- Visites ---
def create_visite(db: Session, visite: schemas.VisiteCreate, merchandiser_id: int):
    db_visite = models.Visite(client_id=visite.client_id, merchandiser_id=merchandiser_id, observations_generales=visite.observations_generales, fifo_respecte=visite.fifo_respecte, planogramme_respecte=visite.planogramme_respecte)
    db.add(db_visite)
    for stock_item in visite.releves_stock:
        db_stock = models.ReleveStock(**stock_item.dict(), visite=db_visite)
        db.add(db_stock)
    for detail_item in visite.details_produits:
        db_detail = models.DetailVisiteProduit(**detail_item.dict(), visite=db_visite)
        db.add(db_detail)
    for veille_item in visite.veilles_concurrentielles:
        db_veille = models.VeilleConcurrentielle(**veille_item.dict(), visite=db_visite)
        db.add(db_veille)
    db.commit()
    db.refresh(db_visite)
    return db_visite


def log_activity(db: Session, user_id: int, action: str):
    """Enregistre une nouvelle activité dans le journal."""
    db_log = models.ActiviteLog(user_id=user_id, action=action)
    db.add(db_log)
    