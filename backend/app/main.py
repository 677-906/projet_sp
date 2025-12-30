# Fichier: app/main.py - VERSION FINALE COMPLÈTE ET INTÉGRALE

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, File, UploadFile
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
import datetime
import io
import csv
import os
import shutil
from pathlib import Path

from . import models, schemas, crud, security, database
from .websocket_manager import manager
import asyncio
import threading

models.Base.metadata.create_all(bind=database.engine)
app = FastAPI(title="API Source du Pays")

# Configuration CORS - Autoriser toutes les origines en développement
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://10.105.50.117",
    "http://10.105.50.117:3000",
    "http://84.200.73.61",
    "http://84.200.73.61:3000",
    "http://10.0.2.2:8000",  # Pour émulateur Android
    "*"  # Autoriser toutes les origines en développement
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)



@app.on_event("startup")
def startup_event():
    """
    Cette fonction s'exécute une seule fois au démarrage de l'API.
    Nous l'utilisons pour créer les données de base si elles n'existent pas.
    """
    db = database.SessionLocal()
    try:
        # 1. Vérifier si des rôles existent
        if db.query(models.Role).count() == 0:
            print("Aucun rôle trouvé, création des rôles par défaut...")
            db.add(models.Role(nom="Administrateur", description="Gère tout le système"))
            db.add(models.Role(nom="Responsable", description="Supervise plusieurs chefs de zone"))
            db.add(models.Role(nom="Chef de Zone", description="Valide les visites de ses merchandisers"))
            db.add(models.Role(nom="Merchandiser", description="Employé terrain"))
            db.commit()

        # 2. Vérifier si un admin existe
        admin_role = db.query(models.Role).filter(models.Role.nom == "Administrateur").first()
        if admin_role:
            admin_user = db.query(models.User).filter(models.User.role_id == admin_role.id).first()
            if not admin_user:
                print("Aucun admin trouvé, création de l'admin par défaut...")
                admin_data = schemas.UserCreate(
                    nom="Admin",
                    email="admin@gmail.com",
                    password="admin237", # CHANGEZ CECI
                    role_id=admin_role.id
                )
                crud.create_user(db, user=admin_data)
                print("Admin par défaut créé avec succès.")

    finally:
        db.close()

# --- Dépendances ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Helper pour créer et envoyer une notification en temps réel
def create_and_broadcast_notification(db: Session, notification: schemas.NotificationCreate):
    """Crée une notification et l'envoie via WebSocket en temps réel"""
    # Créer la notification en base
    db_notification = crud.create_notification(db, notification)

    # Préparer les données à envoyer
    notification_data = {
        "id": db_notification.id,
        "type": db_notification.type,
        "titre": db_notification.titre,
        "message": db_notification.message,
        "visite_id": db_notification.visite_id,
        "is_read": db_notification.is_read,
        "created_at": db_notification.created_at.isoformat() if db_notification.created_at else None
    }

    # Broadcaster dans un thread séparé pour ne pas bloquer
    def broadcast_in_thread():
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(manager.send_personal_notification(notification.user_id, notification_data))
            loop.close()
        except Exception as e:
            print(f"Erreur broadcast notification: {e}")

    thread = threading.Thread(target=broadcast_in_thread, daemon=True)
    thread.start()

    return db_notification

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Impossible de valider les identifiants", headers={"WWW-Authenticate": "Bearer"})
    token_data = security.verify_token(token, credentials_exception)
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception

    # Vérifier si le token correspond au token actif stocké
    if user.active_token != token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expirée. Une nouvelle connexion a été effectuée sur un autre appareil.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user
def get_current_admin_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.role or current_user.role.nom.lower() != "administrateur":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Action réservée aux administrateurs")
    return current_user

# --- Routes d'Authentification et Publiques ---
@app.post("/token", response_model=schemas.Token, tags=["Authentification"])
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

    # Créer un nouveau token
    access_token = security.create_access_token(data={"sub": user.email})

    # Stocker le nouveau token comme token actif (cela invalide les anciennes sessions)
    user.active_token = access_token
    user.last_login_at = datetime.datetime.utcnow()
    db.commit()

    return {"access_token": access_token, "token_type": "bearer", "user_role": user.role.nom}
@app.get("/users/me/", response_model=schemas.User, tags=["Authentification"])
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/logout", tags=["Authentification"])
def logout(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Déconnexion - Invalide la session actuelle"""
    current_user.active_token = None
    db.commit()
    return {"message": "Déconnexion réussie"}

@app.get("/roles/", response_model=List[schemas.Role], tags=["Données de Référence"])
def read_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()

# --- WebSocket pour notifications temps réel ---
@app.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """
    WebSocket pour recevoir les notifications en temps réel.
    Le client se connecte avec son user_id.
    """
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Garder la connexion ouverte
            data = await websocket.receive_text()
            # On peut traiter des messages du client si nécessaire
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"Erreur WebSocket: {e}")
        manager.disconnect(websocket, user_id)

# --- Routes Notifications ---
@app.get("/notifications/", response_model=List[schemas.Notification], tags=["Notifications"])
def get_notifications(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Récupère les notifications de l'utilisateur connecté."""
    return crud.get_user_notifications(db, user_id=current_user.id, skip=skip, limit=limit)


@app.get("/notifications/unread-count", response_model=int, tags=["Notifications"])
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Récupère le nombre de notifications non lues."""
    return crud.get_unread_notifications_count(db, user_id=current_user.id)


@app.put("/notifications/{notification_id}/read", response_model=schemas.Notification, tags=["Notifications"])
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Marque une notification comme lue."""
    notification = crud.mark_notification_as_read(db, notification_id=notification_id, user_id=current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    return notification


@app.put("/notifications/read-all", tags=["Notifications"])
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Marque toutes les notifications comme lues."""
    crud.mark_all_notifications_as_read(db, user_id=current_user.id)
    return {"message": "Toutes les notifications ont été marquées comme lues"}

# --- Routes Admin ---
@app.post("/admin/full-user", response_model=schemas.User, tags=["Admin - Gestion Utilisateurs"])
def create_full_user_and_profile(user_data: schemas.FullUserCreate, db: Session = Depends(get_db), admin_user: models.User = Depends(get_current_admin_user)):
    if crud.get_user_by_email(db, email=user_data.email):
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    try:
        return crud.create_full_user(db, user_data=user_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
@app.get("/admin/users", response_model=List[schemas.User], tags=["Admin - Gestion Utilisateurs"])
def read_all_users(db: Session = Depends(get_db), admin_user: models.User = Depends(get_current_admin_user)):
    return db.query(models.User).all()

@app.get("/admin/visites/validees", response_model=List[schemas.VisiteInfo], tags=["Admin - Rapports"])
def read_visites_validees(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100
):
    """Récupère la liste de tous les rapports de visite qui ont été validés."""
    visites = (
        db.query(models.Visite)
        .filter(models.Visite.statut_validation == 'valide')
        .order_by(models.Visite.date_visite.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return visites

@app.get("/admin/stats/total-visites", response_model=int, tags=["Admin - Statistiques"])
def get_total_visites_count(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Compte le nombre total de visites dans la base de données."""
    return db.query(models.Visite).count()

@app.post("/admin/clients/", response_model=schemas.Client, tags=["Admin - Gestion Données"])
def create_client_by_admin(
    client: schemas.ClientCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Permet à un admin de créer un nouveau client."""
    return crud.create_client(db=db, client=client)

# Dans app/main.py
@app.put("/admin/clients/{client_id}", response_model=schemas.Client, tags=["Admin - Gestion Données"])
def update_client(
    client_id: int,
    client_update: schemas.ClientUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    updated_client = crud.update_client(db, client_id=client_id, client_update=client_update)
    if not updated_client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return updated_client
    
@app.get("/admin/clients/search", response_model=List[schemas.Client], tags=["Admin - Gestion Données"])
def search_clients(
    query: str = "",
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    return crud.search_clients(db, query=query)


@app.delete("/admin/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin - Gestion Données"])
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Supprime un client.
    Accessible uniquement aux administrateurs.
    """
    deleted_client = crud.delete_client(db, client_id=client_id)
    if not deleted_client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return

# --- Routes Commerciaux ---
@app.post("/admin/commerciaux/", response_model=schemas.Commercial, tags=["Admin - Gestion Données"])
def create_commercial(
    commercial: schemas.CommercialCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Permet à un admin de créer un nouveau commercial."""
    return crud.create_commercial(db=db, commercial=commercial)

@app.get("/admin/commerciaux/", response_model=List[schemas.Commercial], tags=["Admin - Gestion Données"])
def get_all_commerciaux(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Récupère la liste de tous les commerciaux."""
    return db.query(models.Commercial).all()

@app.put("/admin/commerciaux/{commercial_id}", response_model=schemas.Commercial, tags=["Admin - Gestion Données"])
def update_commercial(
    commercial_id: int,
    commercial_update: schemas.CommercialUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Met à jour un commercial."""
    updated_commercial = crud.update_commercial(db, commercial_id=commercial_id, commercial_update=commercial_update)
    if not updated_commercial:
        raise HTTPException(status_code=404, detail="Commercial non trouvé")
    return updated_commercial

@app.delete("/admin/commerciaux/{commercial_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin - Gestion Données"])
def delete_commercial(
    commercial_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Supprime un commercial."""
    deleted_commercial = crud.delete_commercial(db, commercial_id=commercial_id)
    if not deleted_commercial:
        raise HTTPException(status_code=404, detail="Commercial non trouvé")
    return

@app.get("/admin/commerciaux/{commercial_id}/clients", response_model=List[schemas.Client], tags=["Admin - Gestion Données"])
def get_commercial_clients(
    commercial_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Récupère la liste des clients associés à un commercial."""
    commercial = db.query(models.Commercial).filter(models.Commercial.id == commercial_id).first()
    if not commercial:
        raise HTTPException(status_code=404, detail="Commercial non trouvé")
    return db.query(models.Client).filter(models.Client.commercial_id == commercial_id).all()

# --- Gestion des Zones ---
@app.get("/admin/zones/", tags=["Admin - Gestion Données"])
def get_all_zones_with_stats(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Récupère toutes les zones avec leurs statistiques."""
    # Récupérer les zones depuis les clients ET les chefs de zone
    zones_from_clients = db.query(models.Client.zone).distinct().filter(models.Client.zone.isnot(None)).all()
    zones_from_chefs = db.query(models.ChefZone.zone).distinct().filter(models.ChefZone.zone.isnot(None)).all()

    # Fusionner les deux listes et éliminer les doublons
    all_zones = set()
    for zone_tuple in zones_from_clients:
        if zone_tuple[0]:
            all_zones.add(zone_tuple[0])
    for zone_tuple in zones_from_chefs:
        if zone_tuple[0]:
            all_zones.add(zone_tuple[0])

    zones_stats = []

    for zone_name in all_zones:
        # Compter les chefs de zone
        nb_chefs = db.query(models.ChefZone).filter(models.ChefZone.zone == zone_name).count()

        # Compter les commerciaux
        commerciaux_ids = [c.id for c in db.query(models.ChefZone).filter(models.ChefZone.zone == zone_name).all()]
        nb_commerciaux = db.query(models.Commercial).filter(models.Commercial.chef_zone_id.in_(commerciaux_ids)).count() if commerciaux_ids else 0

        # Compter les clients
        nb_clients = db.query(models.Client).filter(models.Client.zone == zone_name).count()

        zones_stats.append({
            "zone": zone_name,
            "nb_chefs_zone": nb_chefs,
            "nb_commerciaux": nb_commerciaux,
            "nb_clients": nb_clients
        })

    return sorted(zones_stats, key=lambda x: x['zone'])

@app.get("/admin/zones/{zone_name}/details", tags=["Admin - Gestion Données"])
def get_zone_details(
    zone_name: str,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Récupère les détails d'une zone (chefs, commerciaux, clients)."""
    # Chefs de zone
    chefs = db.query(models.ChefZone).filter(models.ChefZone.zone == zone_name).all()

    # Commerciaux
    commerciaux_ids = [c.id for c in chefs]
    commerciaux = db.query(models.Commercial).filter(models.Commercial.chef_zone_id.in_(commerciaux_ids)).all() if commerciaux_ids else []

    # Clients
    clients = db.query(models.Client).filter(models.Client.zone == zone_name).all()

    return {
        "zone": zone_name,
        "chefs_zone": [{"id": c.id, "nom": c.user.nom if c.user else "N/A"} for c in chefs],
        "commerciaux": [{"id": c.id, "nom": c.nom} for c in commerciaux],
        "clients": [{"id": c.id, "nom": c.nom_client} for c in clients]
    }


# Dans main.py, dans la section Admin
@app.get("/admin/users/search", response_model=List[schemas.User], tags=["Admin - Gestion Utilisateurs"])
def search_users(
    query: str = "",
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Recherche des utilisateurs par nom ou email avec leurs profils associés."""
    # Charger les profils associés avec joinedload et leurs relations imbriquées
    base_query = db.query(models.User).options(
        joinedload(models.User.role),
        joinedload(models.User.responsable_profile).joinedload(models.Responsable.chefs_zone),
        joinedload(models.User.chef_zone_profile).joinedload(models.ChefZone.responsable).joinedload(models.Responsable.user),
        joinedload(models.User.chef_zone_profile).joinedload(models.ChefZone.merchandisers),
        joinedload(models.User.merchandiser_profile).joinedload(models.Merchandiser.chef_zone).joinedload(models.ChefZone.user),
        joinedload(models.User.merchandiser_profile).joinedload(models.Merchandiser.chef_zone).joinedload(models.ChefZone.responsable)
    )

    if not query:
        return base_query.all()

    # On fait une recherche insensible à la casse
    search_filter = models.User.nom.ilike(f"%{query}%") | models.User.email.ilike(f"%{query}%")
    return base_query.filter(search_filter).all()

# Dans app/main.py, dans la section des routes Admin

@app.put("/admin/users/{user_id}", response_model=schemas.User, tags=["Admin - Gestion Utilisateurs"])
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate, # Le schéma pour les données de mise à jour
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Met à jour les informations d'un utilisateur."""
    updated_user = crud.update_user(db, user_id=user_id, user_update=user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return updated_user

@app.put("/admin/responsables/{responsable_id}", tags=["Admin - Gestion Profils"])
def update_responsable(
    responsable_id: int,
    responsable_update: schemas.ResponsableUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Met à jour les informations d'un profil Responsable."""
    updated_responsable = crud.update_responsable(db, responsable_id=responsable_id, responsable_update=responsable_update)
    if not updated_responsable:
        raise HTTPException(status_code=404, detail="Profil Responsable non trouvé")
    return updated_responsable

@app.put("/admin/chefs-zone/{chef_zone_id}", tags=["Admin - Gestion Profils"])
def update_chef_zone(
    chef_zone_id: int,
    chef_zone_update: schemas.ChefZoneUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Met à jour les informations d'un profil Chef de Zone."""
    updated_chef_zone = crud.update_chef_zone(db, chef_zone_id=chef_zone_id, chef_zone_update=chef_zone_update)
    if not updated_chef_zone:
        raise HTTPException(status_code=404, detail="Profil Chef de Zone non trouvé")
    return updated_chef_zone

@app.put("/admin/merchandisers/{merchandiser_id}", tags=["Admin - Gestion Profils"])
def update_merchandiser(
    merchandiser_id: int,
    merchandiser_update: schemas.MerchandiserUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Met à jour les informations d'un profil Merchandiser."""
    updated_merchandiser = crud.update_merchandiser(db, merchandiser_id=merchandiser_id, merchandiser_update=merchandiser_update)
    if not updated_merchandiser:
        raise HTTPException(status_code=404, detail="Profil Merchandiser non trouvé")
    return updated_merchandiser

@app.get("/admin/stats/total-produits", response_model=int, tags=["Admin - Statistiques"])
def get_total_produits_count(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Compte le nombre total de produits dans le catalogue."""
    return db.query(models.Produit).count()

@app.get("/admin/dashboard-stats", tags=["Admin - Tableau de Bord"])
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Récupère toutes les statistiques agrégées pour le tableau de bord de l'admin.
    """
    total_users = db.query(models.User).count()
    total_visites = db.query(models.Visite).count()
    total_produits = db.query(models.Produit).count()
    
    roles_query = (
        db.query(models.Role.nom, func.count(models.User.id))
        .join(models.User, models.Role.id == models.User.role_id, isouter=True)
        .group_by(models.Role.nom)
        .all()
    )
    roles_distribution = {nom: count for nom, count in roles_query}

    return {
        "totalUsers": total_users,
        "totalVisits": total_visites,
        "totalProducts": total_produits,
        "rolesDistribution": roles_distribution
    }

@app.post("/produits/", response_model=schemas.Produit, tags=["Produits"])
def create_produit(
    produit: schemas.ProduitCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    return crud.create_produit(db=db, produit=produit)


@app.delete("/produits/{produit_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Produits"])
def delete_produit(
    produit_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Supprime un produit du catalogue.
    Accessible uniquement aux administrateurs.
    """
    deleted_produit = crud.delete_produit(db, produit_id=produit_id)
    if not deleted_produit:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return # On renvoie une réponse vide 204

# Dans main.py
@app.put("/admin/produits/{produit_id}", response_model=schemas.Produit, tags=["Admin - Gestion"])
def update_produit(
    produit_id: int,
    produit_update: schemas.ProduitUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    updated_produit = crud.update_produit(db, produit_id=produit_id, produit_update=produit_update)
    if not updated_produit:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return updated_produit
    
@app.get("/admin/produits/search", response_model=List[schemas.Produit], tags=["Admin - Gestion"])
def search_produits(
    query: str = "",
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    return crud.search_produits(db, query=query)

@app.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin - Gestion Utilisateurs"])
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Supprime un utilisateur et ses profils associés."""
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Un administrateur ne peut pas se supprimer lui-même.")

    # Vérifier si l'utilisateur existe
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # Vérifier les dépendances
    if user.role.nom.lower() == 'chef de zone' and user.chef_zone_profile:
        # Vérifier si le chef a des merchandisers
        nb_merchandisers = db.query(models.Merchandiser).filter(
            models.Merchandiser.chef_zone_id == user.chef_zone_profile.id
        ).count()
        if nb_merchandisers > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Impossible de supprimer ce chef de zone : {nb_merchandisers} merchandiser(s) lui sont rattachés. Réassignez-les d'abord."
            )

        # Vérifier si le chef a des commerciaux
        nb_commerciaux = db.query(models.Commercial).filter(
            models.Commercial.chef_zone_id == user.chef_zone_profile.id
        ).count()
        if nb_commerciaux > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Impossible de supprimer ce chef de zone : {nb_commerciaux} commercial/commerciaux lui sont rattachés. Réassignez-les d'abord."
            )

    if user.role.nom.lower() == 'merchandiser' and user.merchandiser_profile:
        # Vérifier si le merchandiser a des visites
        nb_visites = db.query(models.Visite).filter(
            models.Visite.merchandiser_id == user.merchandiser_profile.id
        ).count()
        if nb_visites > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Impossible de supprimer ce merchandiser : {nb_visites} visite(s) sont enregistrées. Supprimez-les d'abord ou archivez l'utilisateur en le désactivant."
            )

    if user.role.nom.lower() == 'responsable' and user.responsable_profile:
        # Vérifier si le responsable a des chefs de zone
        nb_chefs = db.query(models.ChefZone).filter(
            models.ChefZone.responsable_id == user.responsable_profile.id
        ).count()
        if nb_chefs > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Impossible de supprimer ce responsable : {nb_chefs} chef(s) de zone lui sont rattachés. Réassignez-les d'abord."
            )

    try:
        deleted_user = crud.delete_user(db, user_id=user_id)
        if not deleted_user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression : {str(e)}") 

# --- Routes Chef de Zone ---
@app.get("/chef-zone/dashboard-stats", tags=["Chef de Zone - Tableau de Bord"])
def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.chef_zone_profile:
        raise HTTPException(status_code=403, detail="Accès réservé aux chefs de zone")
    chef_zone_id = current_user.chef_zone_profile.id
    visites_en_attente = db.query(models.Visite).join(models.Merchandiser).filter(models.Visite.statut_validation == 'soumis', models.Merchandiser.chef_zone_id == chef_zone_id).count()
    statuts_query = db.query(models.Visite.statut_validation, func.count(models.Visite.id)).join(models.Merchandiser).filter(models.Merchandiser.chef_zone_id == chef_zone_id).group_by(models.Visite.statut_validation).all()
    performance_query = db.query(models.User.nom, func.count(models.Visite.id)).join(models.Merchandiser, models.Merchandiser.user_id == models.User.id).join(models.Visite, models.Visite.merchandiser_id == models.Merchandiser.id).filter(models.Merchandiser.chef_zone_id == chef_zone_id).group_by(models.User.nom).all()
    return {"visitesEnAttente": visites_en_attente, "statutsData": dict(statuts_query), "performanceEquipe": dict(performance_query)}

@app.get("/chef-zone/visites/en-attente", response_model=List[schemas.VisiteInfo], tags=["Chef de Zone - Validation"])
def read_visites_en_attente(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Récupère les visites en attente, triées du plus ancien au plus récent."""
    if not current_user.chef_zone_profile:
        raise HTTPException(status_code=403, detail="Accès réservé aux chefs de zone")
    return db.query(models.Visite).join(models.Merchandiser).filter(
        models.Visite.statut_validation == 'soumis',
        models.Merchandiser.chef_zone_id == current_user.chef_zone_profile.id
    ).order_by(models.Visite.date_visite.asc()).all()

@app.get("/chef-zone/visites/rejetees", response_model=List[schemas.VisiteInfo], tags=["Chef de Zone - Validation"])
def read_visites_rejetees(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Récupère les visites rejetées de l'équipe, triées du plus récent au plus ancien."""
    if not current_user.chef_zone_profile and not current_user.responsable_profile:
        raise HTTPException(status_code=403, detail="Accès réservé aux chefs de zone et responsables")

    if current_user.chef_zone_profile:
        # Chef de zone: voir les visites rejetées de son équipe
        return db.query(models.Visite).join(models.Merchandiser).filter(
            models.Visite.statut_validation == 'rejete',
            models.Merchandiser.chef_zone_id == current_user.chef_zone_profile.id
        ).order_by(models.Visite.date_visite.desc()).all()
    else:
        # Responsable: voir toutes les visites rejetées de ses chefs de zone
        chef_zone_ids = [cz.id for cz in current_user.responsable_profile.chefs_zone]
        return db.query(models.Visite).join(models.Merchandiser).filter(
            models.Visite.statut_validation == 'rejete',
            models.Merchandiser.chef_zone_id.in_(chef_zone_ids)
        ).order_by(models.Visite.date_visite.desc()).all()

@app.get("/admin/visites/en-attente/all", tags=["Admin - Rapports"])
def read_all_visites_en_attente_pour_admin(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Récupère TOUS les rapports en attente de TOUTES les équipes."""
    return db.query(models.Visite).filter(models.Visite.statut_validation == 'soumis').all()

@app.get("/chefs-zone/", response_model=List[schemas.ChefZone], tags=["Données de Référence"])
def read_all_chefs_zone(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Récupère la liste de tous les chefs de zone."""
    from sqlalchemy.orm import joinedload
    return db.query(models.ChefZone).options(joinedload(models.ChefZone.user)).all()

@app.get("/superviseurs/", response_model=List[schemas.ChefZone], tags=["Données de Référence"])
def read_all_superviseurs(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Récupère la liste de tous les superviseurs GMS."""
    from sqlalchemy.orm import joinedload
    return db.query(models.ChefZone).filter(models.ChefZone.est_superviseur == True).options(joinedload(models.ChefZone.user)).all()

@app.get("/zone/{zone}/superviseur", tags=["Données de Référence"])
def read_superviseur_by_zone(zone: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Récupère le superviseur GMS pour une zone donnée."""
    from sqlalchemy.orm import joinedload

    # Nettoyer la zone (enlever les espaces en début et fin)
    zone = zone.strip()

    superviseur = db.query(models.ChefZone).filter(
        models.ChefZone.zone == zone,
        models.ChefZone.est_superviseur == True
    ).options(joinedload(models.ChefZone.user)).first()

    # Retourner null au lieu d'une erreur si aucun superviseur trouvé
    if not superviseur:
        return None
    return superviseur

@app.get("/responsables/", response_model=List[schemas.Responsable], tags=["Données de Référence"])
def read_all_responsables(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Récupère la liste de tous les responsables."""
    from sqlalchemy.orm import joinedload
    return db.query(models.Responsable).options(joinedload(models.Responsable.user)).all()

@app.get("/chef-zone/{chef_zone_id}/commerciaux", response_model=List[schemas.Commercial], tags=["Données de Référence"])
def read_commerciaux_by_chef_zone(chef_zone_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Récupère la liste des commerciaux pour un chef de zone donné."""
    return db.query(models.Commercial).filter(models.Commercial.chef_zone_id == chef_zone_id).all()

@app.get("/chef-zone/{chef_zone_id}/merchandisers", response_model=List[schemas.Merchandiser], tags=["Données de Référence"])
def read_merchandisers_by_chef_zone(chef_zone_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Récupère la liste des merchandisers pour un chef de zone donné."""
    from sqlalchemy.orm import joinedload
    return db.query(models.Merchandiser).options(joinedload(models.Merchandiser.user)).filter(models.Merchandiser.chef_zone_id == chef_zone_id).all()

@app.get("/commercial/{commercial_nom}/clients", response_model=List[schemas.Client], tags=["Données de Référence"])
def read_clients_by_commercial(commercial_nom: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Récupère la liste des clients pour un nom de commercial donné."""
    return db.query(models.Client).filter(models.Client.commercial_nom == commercial_nom).all()

@app.get("/chef-zone/visites/historique", response_model=List[schemas.VisiteInfo], tags=["Chef de Zone - Rapports"])
def read_historique_visites_equipe(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Récupère l'historique des visites (validées ET rejetées) de l'équipe du chef de zone."""
    if not current_user.chef_zone_profile:
        raise HTTPException(status_code=403, detail="Accès réservé aux chefs de zone")

    chef_zone_id = current_user.chef_zone_profile.id

    visites = (
        db.query(models.Visite)
        .join(models.Merchandiser)
        .filter(
            # On ne cherche que le statut 'valide'
            models.Visite.statut_validation == 'valide',
            models.Merchandiser.chef_zone_id == chef_zone_id
        )
        .order_by(models.Visite.date_visite.desc())
        .all()
    )
    return visites


@app.get("/chef-zone/export/visites-validees", tags=["Chef de Zone - Rapports"])
def export_visites_validees(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Exporte tous les rapports validés de l'équipe du chef de zone au format Excel (Book2.xlsx).
    """
    if not current_user.chef_zone_profile:
        raise HTTPException(status_code=403, detail="Accès réservé aux chefs de zone")

    from .export_excel import export_visites_to_excel
    from sqlalchemy.orm import joinedload

    # 1. On récupère les données à exporter avec toutes les relations chargées
    visites_validees = (
        db.query(models.Visite)
        .join(models.Merchandiser)
        .options(
            joinedload(models.Visite.releves_stock).joinedload(models.ReleveStock.produit),
            joinedload(models.Visite.veilles_concurrentielles).joinedload(models.VeilleConcurrentielle.concurrent),
            joinedload(models.Visite.details_produits).joinedload(models.DetailVisiteProduit.produit),
            joinedload(models.Visite.merchandiser).joinedload(models.Merchandiser.user),
            joinedload(models.Visite.merchandiser).joinedload(models.Merchandiser.chef_zone).joinedload(models.ChefZone.user),
            joinedload(models.Visite.merchandiser).joinedload(models.Merchandiser.chef_zone).joinedload(models.ChefZone.responsable).joinedload(models.Responsable.user),
            joinedload(models.Visite.client).joinedload(models.Client.commercial)
        )
        .filter(
            models.Visite.statut_validation == 'valide',
            models.Merchandiser.chef_zone_id == current_user.chef_zone_profile.id
        )
        .all()
    )

    # 2. Générer le fichier Excel
    excel_file = export_visites_to_excel(db, visites_validees)

    # 3. Renvoyer le fichier
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=rapports_valides_{datetime.date.today()}.xlsx"
        }
    )


# --- Routes de Visites ---
@app.post("/visites/", response_model=schemas.Visite, tags=["Visites"])
def create_visite(visite: schemas.VisiteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.merchandiser_profile:
        raise HTTPException(status_code=403, detail="Seul un merchandiser peut créer une visite")

    # Créer la visite
    db_visite = crud.create_visite(db=db, visite=visite, merchandiser_id=current_user.merchandiser_profile.id)

    # Créer une notification pour le chef de zone
    merchandiser = current_user.merchandiser_profile
    if merchandiser.chef_zone and merchandiser.chef_zone.user:
        client = db.query(models.Client).filter(models.Client.id == visite.client_id).first()
        client_nom = client.nom_client if client else "Client inconnu"

        notification = schemas.NotificationCreate(
            user_id=merchandiser.chef_zone.user_id,
            type="visite_soumise",
            titre="Nouvelle visite à valider",
            message=f"{current_user.nom} a soumis une visite chez {client_nom}.",
            visite_id=db_visite.id
        )
        create_and_broadcast_notification(db, notification)

    return db_visite

# Créer le dossier uploads s'il n'existe pas
# Créer les dossiers pour chaque type de photo
UPLOAD_BASE_DIR = Path("backend/uploads")
UPLOAD_DIR_RAYON = UPLOAD_BASE_DIR / "photoRayon"
UPLOAD_DIR_EQUIPEMENT = UPLOAD_BASE_DIR / "equipement"
UPLOAD_DIR_INCIDENT = UPLOAD_BASE_DIR / "photoIncidents"

# Créer tous les dossiers
UPLOAD_DIR_RAYON.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR_EQUIPEMENT.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR_INCIDENT.mkdir(parents=True, exist_ok=True)

@app.post("/visites/{visite_id}/upload-photo", tags=["Visites"])
async def upload_photo(
    visite_id: int,
    file: UploadFile = File(...),
    type_rayon: Optional[str] = None,
    moment: Optional[str] = None,
    photo_type: Optional[str] = None,
    equipment_key: Optional[str] = None,
    incident_key: Optional[str] = None,
    photo_index: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Upload une photo pour une visite.
    Types supportés: rayon, equipment, incident
    Format du nom: {merchandiser_id}_{YYYYMMDD_HHMMSS}_{AV/AP}_{R/E/I}.ext
    """
    # Vérifier que la visite existe et appartient au merchandiser
    db_visite = db.query(models.Visite).filter(models.Visite.id == visite_id).first()
    if not db_visite:
        raise HTTPException(status_code=404, detail="Visite non trouvée")

    if not current_user.merchandiser_profile:
        raise HTTPException(status_code=403, detail="Seul un merchandiser peut uploader des photos")

    if db_visite.merchandiser_id != current_user.merchandiser_profile.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas modifier cette visite")

    # Obtenir l'ID du merchandiser
    merchandiser_id = db_visite.merchandiser_id

    # Générer le timestamp
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    # Extension du fichier
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'

    # Déterminer le type de photo et générer le nom approprié
    if type_rayon and moment:
        # Photo de rayon: {merchandiser_id}_{timestamp}_{AV/AP}_R.ext
        upload_dir = UPLOAD_DIR_RAYON
        folder_name = "photoRayon"
        moment_code = "AV" if moment.upper() == "AVANT" else "AP"
        filename = f"{merchandiser_id}_{timestamp}_{moment_code}_R.{file_extension}"

        # Sauvegarder le fichier
        file_path = upload_dir / filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Enregistrer dans la BD
        photo_url = f"/uploads/{folder_name}/{filename}"
        db_photo = models.PhotoRayon(
            visite_id=visite_id,
            type_rayon=type_rayon,
            moment=moment,
            photo_url=photo_url
        )
        db.add(db_photo)

    elif photo_type == "equipment" and equipment_key:
        # Photo d'équipement: {merchandiser_id}_{timestamp}_E.ext
        upload_dir = UPLOAD_DIR_EQUIPEMENT
        folder_name = "equipement"
        filename = f"{merchandiser_id}_{timestamp}_E.{file_extension}"

        # Sauvegarder le fichier
        file_path = upload_dir / filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Enregistrer dans la BD
        photo_url = f"/uploads/{folder_name}/{filename}"
        db_photo = models.PhotoEquipement(
            visite_id=visite_id,
            equipment_key=equipment_key,
            photo_url=photo_url
        )
        db.add(db_photo)

    elif photo_type == "incident" and incident_key is not None:
        # Photo d'incident: {merchandiser_id}_{timestamp}_I_{index}.ext
        upload_dir = UPLOAD_DIR_INCIDENT
        folder_name = "photoIncidents"
        index_suffix = f"_{photo_index}" if photo_index is not None else ""
        filename = f"{merchandiser_id}_{timestamp}_I{index_suffix}.{file_extension}"

        # Sauvegarder le fichier
        file_path = upload_dir / filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Enregistrer dans la BD
        photo_url = f"/uploads/{folder_name}/{filename}"
        db_photo = models.PhotoIncident(
            visite_id=visite_id,
            incident_key=incident_key,
            photo_index=photo_index or 0,
            photo_url=photo_url
        )
        db.add(db_photo)

    else:
        raise HTTPException(
            status_code=400,
            detail="Paramètres invalides. Fournir soit (type_rayon + moment), soit (photo_type=equipment + equipment_key), soit (photo_type=incident + incident_key)"
        )

    db.commit()
    db.refresh(db_photo)

    return {"photo_url": photo_url, "photo_id": db_photo.id}

@app.get("/uploads/photoRayon/{filename}")
async def get_photo_rayon(filename: str):
    """Récupérer une photo de rayon."""
    file_path = UPLOAD_DIR_RAYON / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Photo non trouvée")
    return FileResponse(file_path)

@app.get("/uploads/equipement/{filename}")
async def get_photo_equipement(filename: str):
    """Récupérer une photo d'équipement."""
    file_path = UPLOAD_DIR_EQUIPEMENT / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Photo non trouvée")
    return FileResponse(file_path)

@app.get("/uploads/photoIncidents/{filename}")
async def get_photo_incident(filename: str):
    """Récupérer une photo d'incident."""
    file_path = UPLOAD_DIR_INCIDENT / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Photo non trouvée")
    return FileResponse(file_path)

@app.get("/visites/{visite_id}", response_model=schemas.VisiteDetail, tags=["Visites"])
def read_visite_details(visite_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_visite = (
        db.query(models.Visite)
        .options(
            joinedload(models.Visite.merchandiser).joinedload(models.Merchandiser.user),
            joinedload(models.Visite.merchandiser).joinedload(models.Merchandiser.chef_zone).joinedload(models.ChefZone.user),
            joinedload(models.Visite.client).joinedload(models.Client.commercial),
            joinedload(models.Visite.releves_stock).joinedload(models.ReleveStock.produit),
            joinedload(models.Visite.details_produits).joinedload(models.DetailVisiteProduit.produit),
            joinedload(models.Visite.veilles_concurrentielles).joinedload(models.VeilleConcurrentielle.concurrent),
            joinedload(models.Visite.photos_rayon),
            joinedload(models.Visite.photos_equipement),
            joinedload(models.Visite.photos_incident)
        )
        .filter(models.Visite.id == visite_id)
        .first()
    )
    if not db_visite:
        raise HTTPException(status_code=404, detail="Visite non trouvée")
    return db_visite
@app.put("/visites/{visite_id}/valider", response_model=schemas.Visite, tags=["Chef de Zone - Validation"])
def valider_visite(
    visite_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Change le statut d'une visite à 'valide'."""
    # On vérifie que l'utilisateur est bien un chef de zone ou responsable
    if not current_user.chef_zone_profile and not current_user.responsable_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux chefs de zone et responsables")
    # 1. On récupère la visite depuis la base de données avec les relations
    db_visite = db.query(models.Visite).options(
        joinedload(models.Visite.client),
        joinedload(models.Visite.merchandiser).joinedload(models.Merchandiser.user)
    ).filter(models.Visite.id == visite_id).first()

    # 2. On vérifie si la visite existe
    if not db_visite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visite non trouvée")

    # 3. Mettre à jour le statut et stocker l'heure de validation
    db_visite.statut_validation = 'valide'
    db_visite.date_validation = datetime.date.today()
    db_visite.heure_validation = datetime.datetime.now().strftime("%H:%M:%S")

    if current_user.chef_zone_profile:
        db_visite.validateur_id = current_user.chef_zone_profile.id

    db.commit()
    db.refresh(db_visite)

    # 4. Créer une notification pour le merchandiser avec le nom du client et l'heure
    merchandiser_user_id = db_visite.merchandiser.user_id
    client_nom = db_visite.client.nom_client if db_visite.client else "Client inconnu"
    heure_validation = datetime.datetime.now().strftime("%H:%M")

    notification = schemas.NotificationCreate(
        user_id=merchandiser_user_id,
        type="visite_validee",
        titre="Visite validée ✅",
        message=f"Votre visite chez {client_nom} du {db_visite.date_visite} a été validée par {current_user.nom} à {heure_validation}.",
        visite_id=visite_id
    )
    create_and_broadcast_notification(db, notification)

    return db_visite


@app.put("/visites/{visite_id}/rejeter", response_model=schemas.Visite, tags=["Chef de Zone - Validation"])
def rejeter_visite(
    visite_id: int,
    rejet_data: schemas.VisiteRejetData = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Change le statut d'une visite à 'rejete' avec commentaire optionnel."""
    # On vérifie que l'utilisateur est bien un chef de zone ou responsable
    if not current_user.chef_zone_profile and not current_user.responsable_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux chefs de zone et responsables")

    # 1. On récupère la visite depuis la base de données avec les relations
    db_visite = db.query(models.Visite).options(
        joinedload(models.Visite.client),
        joinedload(models.Visite.merchandiser).joinedload(models.Merchandiser.user)
    ).filter(models.Visite.id == visite_id).first()

    # 2. On vérifie si la visite existe
    if not db_visite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visite non trouvée")

    # 3. Mettre à jour le statut et stocker l'heure de rejet
    db_visite.statut_validation = 'rejete'
    db_visite.date_validation = datetime.date.today()
    db_visite.heure_validation = datetime.datetime.now().strftime("%H:%M:%S")

    if current_user.chef_zone_profile:
        db_visite.validateur_id = current_user.chef_zone_profile.id

    # Ajouter le commentaire du validateur si fourni
    if rejet_data and rejet_data.commentaire:
        db_visite.commentaire_validateur = rejet_data.commentaire

    db.commit()
    db.refresh(db_visite)

    # 4. Créer une notification pour le merchandiser avec le nom du client et l'heure
    merchandiser_user_id = db_visite.merchandiser.user_id
    client_nom = db_visite.client.nom_client if db_visite.client else "Client inconnu"
    heure_rejet = datetime.datetime.now().strftime("%H:%M")
    commentaire_text = f"\n\nRaison: {rejet_data.commentaire}" if (rejet_data and rejet_data.commentaire) else ""

    notification = schemas.NotificationCreate(
        user_id=merchandiser_user_id,
        type="visite_rejetee",
        titre="Visite rejetée ❌",
        message=f"Votre visite chez {client_nom} du {db_visite.date_visite} a été rejetée par {current_user.nom} à {heure_rejet}.{commentaire_text}",
        visite_id=visite_id
    )
    create_and_broadcast_notification(db, notification)

    return db_visite


@app.put("/visites/{visite_id}", response_model=schemas.Visite, tags=["Visites"])
def update_visite(
    visite_id: int,
    visite_update: schemas.VisiteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Met à jour une visite existante (utilisé pour la correction de visites rejetées)."""
    # Récupérer la visite
    db_visite = db.query(models.Visite).filter(models.Visite.id == visite_id).first()

    if not db_visite:
        raise HTTPException(status_code=404, detail="Visite non trouvée")

    # Vérifier que l'utilisateur est le merchandiser qui a créé la visite
    if not current_user.merchandiser_profile or db_visite.merchandiser_id != current_user.merchandiser_profile.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à modifier cette visite")

    # Vérifier que la visite est rejetée (seulement les visites rejetées peuvent être modifiées)
    if db_visite.statut_validation not in ['rejete', 'soumis']:
        raise HTTPException(status_code=400, detail="Seules les visites rejetées ou en attente peuvent être modifiées")

    # Mettre à jour les champs de base
    for field, value in visite_update.dict(exclude={'releves_stock', 'details_produits', 'veilles_concurrentielles'}).items():
        if value is not None:
            setattr(db_visite, field, value)

    # Remettre le statut à 'soumis' pour une nouvelle validation
    db_visite.statut_validation = 'soumis'
    db_visite.validateur_id = None
    db_visite.date_validation = None
    db_visite.heure_validation = None
    db_visite.commentaire_validateur = None

    # Supprimer les anciens stocks, commandes et veilles
    db.query(models.ReleveStock).filter(models.ReleveStock.visite_id == visite_id).delete()
    db.query(models.DetailVisiteProduit).filter(models.DetailVisiteProduit.visite_id == visite_id).delete()
    db.query(models.VeilleConcurrentielle).filter(models.VeilleConcurrentielle.visite_id == visite_id).delete()

    # Ajouter les nouveaux stocks
    for stock_data in visite_update.releves_stock:
        db_stock = models.ReleveStock(visite_id=visite_id, **stock_data.dict())
        db.add(db_stock)

    # Ajouter les nouvelles commandes/incidents
    for detail_data in visite_update.details_produits:
        db_detail = models.DetailVisiteProduit(visite_id=visite_id, **detail_data.dict())
        db.add(db_detail)

    # Ajouter les nouvelles veilles
    for veille_data in visite_update.veilles_concurrentielles:
        db_veille = models.VeilleConcurrentielle(visite_id=visite_id, **veille_data.dict())
        db.add(db_veille)

    db.commit()
    db.refresh(db_visite)

    # Notifier le chef de zone de la nouvelle soumission
    if db_visite.merchandiser.chef_zone:
        client_nom = db_visite.client.nom_client if db_visite.client else "Client inconnu"
        notification = schemas.NotificationCreate(
            user_id=db_visite.merchandiser.chef_zone.user_id,
            type="visite_soumise",
            titre="Visite corrigée et resoumise",
            message=f"{current_user.nom} a corrigé et resoumis la visite chez {client_nom}.",
            visite_id=db_visite.id
        )
        create_and_broadcast_notification(db, notification)

    return db_visite


@app.get("/merchandiser/dashboard-stats", tags=["Merchandiser - Tableau de Bord"])
def get_merchandiser_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.merchandiser_profile:
        raise HTTPException(status_code=403, detail="Accès réservé aux merchandisers")
    
    merchandiser_id = current_user.merchandiser_profile.id
    today = datetime.date.today()

    # 1. Compter les visites du jour
    visites_aujourdhui = (
        db.query(models.Visite)
        .filter(
            models.Visite.merchandiser_id == merchandiser_id,
            models.Visite.date_visite == today
        )
        .count()
    )

    # 2. Récupérer les 3 dernières visites
    dernieres_visites = (
        db.query(models.Visite)
        .filter(models.Visite.merchandiser_id == merchandiser_id)
        .order_by(models.Visite.id.desc())
        .limit(3)
        .all()
    )

    # 3. (Exemple) Calculer le CA du mois (simplifié)
    # Pour une vraie appli, ce calcul serait plus complexe
    ca_du_mois = db.query(func.sum(models.DetailVisiteProduit.quantite)).join(models.Visite).filter(
        models.Visite.merchandiser_id == merchandiser_id,
        # Vous pourriez filtrer par mois ici
    ).scalar() or 0

    return {
        "visitesAujourdhui": visites_aujourdhui,
        "objectifVisitesJour": 8, # Objectif factice
        "caDuMois": ca_du_mois * 500, # Prix moyen factice
        "objectifCaMois": 2000000, # Objectif factice
        "dernieresVisites": dernieres_visites
    }

@app.get("/merchandiser/clients", response_model=List[schemas.Client], tags=["Merchandiser - Clients"])
def get_merchandiser_clients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Récupère la liste des clients assignés directement au merchandiser connecté.
    Seuls les clients avec merchandiser_id correspondant sont retournés.
    """
    if not current_user.merchandiser_profile:
        raise HTTPException(status_code=403, detail="Accès réservé aux merchandisers")

    merchandiser = current_user.merchandiser_profile

    # Récupérer uniquement les clients assignés à ce merchandiser
    from sqlalchemy.orm import joinedload
    clients = db.query(models.Client).options(
        joinedload(models.Client.commercial)
    ).filter(
        models.Client.merchandiser_id == merchandiser.id
    ).order_by(models.Client.nom_client).all()

    return clients

@app.get("/merchandiser/mes-visites", response_model=List[schemas.VisiteDetail], tags=["Merchandiser - Visites"])
def get_merchandiser_visites(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Récupère toutes les visites créées par le merchandiser connecté.
    """
    if not current_user.merchandiser_profile:
        raise HTTPException(status_code=403, detail="Accès réservé aux merchandisers")

    merchandiser = current_user.merchandiser_profile

    # Récupérer toutes les visites du merchandiser avec les relations
    from sqlalchemy.orm import joinedload
    visites = db.query(models.Visite).options(
        joinedload(models.Visite.client),
        joinedload(models.Visite.merchandiser).joinedload(models.Merchandiser.user),
        joinedload(models.Visite.releves_stock),
        joinedload(models.Visite.details_produits),
        joinedload(models.Visite.veilles_concurrentielles)
    ).filter(
        models.Visite.merchandiser_id == merchandiser.id
    ).order_by(models.Visite.date_visite.desc()).all()

    return visites

# --- Routes de Données de Référence ---
@app.get("/zones/", tags=["Données de Référence"])
def read_zones(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Récupère la liste des zones. Pour un merchandiser, retourne seulement sa zone."""

    # Si l'utilisateur est un merchandiser (role_id = 4)
    if current_user.role_id == 4:
        # Récupérer le profil merchandiser
        merchandiser = db.query(models.Merchandiser).filter(models.Merchandiser.user_id == current_user.id).first()
        if merchandiser and merchandiser.chef_zone:
            # Retourner seulement la zone de son chef
            return [{"zone": merchandiser.chef_zone.zone}]
        return []

    # Pour les autres rôles (admin, responsable, chef de zone): toutes les zones
    # Récupérer les zones depuis les clients ET les chefs de zone
    zones_from_clients = db.query(models.Client.zone).distinct().filter(models.Client.zone.isnot(None)).all()
    zones_from_chefs = db.query(models.ChefZone.zone).distinct().filter(models.ChefZone.zone.isnot(None)).all()

    # Fusionner et éliminer les doublons
    all_zones = set()
    for z in zones_from_clients:
        if z[0]:
            all_zones.add(z[0])
    for z in zones_from_chefs:
        if z[0]:
            all_zones.add(z[0])

    # Retourner la liste triée
    return [{"zone": z} for z in sorted(all_zones)]

@app.get("/clients/", response_model=List[schemas.Client], tags=["Données de Référence"])
def read_clients(zone: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Récupère tous les clients ou filtre par zone si le paramètre zone est fourni."""
    from sqlalchemy.orm import joinedload
    if zone:
        return db.query(models.Client).options(joinedload(models.Client.commercial)).filter(models.Client.zone == zone).all()
    return db.query(models.Client).options(joinedload(models.Client.commercial)).all()

@app.get("/clients/{client_id}", response_model=schemas.Client, tags=["Données de Référence"])
def read_client_by_id(client_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Récupère un client spécifique par son ID."""
    from sqlalchemy.orm import joinedload
    client = db.query(models.Client).options(joinedload(models.Client.commercial)).filter(models.Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return client

@app.put("/clients/{client_id}", response_model=schemas.Client, tags=["Données de Référence"])
def update_client_info(
    client_id: int,
    client_update: schemas.ClientUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Met à jour les informations d'un client."""
    updated_client = crud.update_client(db, client_id=client_id, client_update=client_update)
    if not updated_client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return updated_client

@app.get("/produits/", response_model=List[schemas.Produit], tags=["Données de Référence"])
def read_produits(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_produits(db)
@app.get("/concurrents/", response_model=List[schemas.Concurrent], tags=["Données de Référence"])
def read_concurrents(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_concurrents(db)


@app.get("/admin/activity-logs", response_model=List[schemas.ActiviteLog], tags=["Admin - Tableau de Bord"])
def read_activity_logs(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user),
    limit: int = 10
):
    """Récupère les dernières activités du système."""
    logs = db.query(models.ActiviteLog).order_by(models.ActiviteLog.timestamp.desc()).limit(limit).all()
    return logs



@app.post("/admin/categories-produit/", response_model=schemas.CategorieProduit, tags=["Admin - Gestion Données"])
def create_categorie_produit(
    categorie: schemas.CategorieProduitCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    # Ajouter une vérification pour l'unicité du nom
    return crud.create_categorie_produit(db, categorie=categorie)

@app.get("/categories-produit/", response_model=List[schemas.CategorieProduit], tags=["Données de Référence"])
def read_categories_produit(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_categories_produit(db)