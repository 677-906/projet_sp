# Fichier: app/main.py - VERSION FINALE COMPLÈTE ET INTÉGRALE

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
import datetime
import io
import csv
from fastapi.responses import StreamingResponse

from . import models, schemas, crud, security, database

models.Base.metadata.create_all(bind=database.engine)
app = FastAPI(title="API Source du Pays")

# Configuration CORS
origins = ["http://localhost", "http://localhost:3000", "http://10.105.50.117"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])



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
            db.add(models.Role(nom="Superviseur", description="Gère une équipe de merchandisers"))
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
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Impossible de valider les identifiants", headers={"WWW-Authenticate": "Bearer"})
    token_data = security.verify_token(token, credentials_exception)
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
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
    return {"access_token": security.create_access_token(data={"sub": user.email}), "token_type": "bearer", "user_role": user.role.nom}
@app.get("/users/me/", response_model=schemas.User, tags=["Authentification"])
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user
@app.get("/roles/", response_model=List[schemas.Role], tags=["Données de Référence"])
def read_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()

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


# Dans main.py, dans la section Admin
@app.get("/admin/users/search", response_model=List[schemas.User], tags=["Admin - Gestion Utilisateurs"])
def search_users(
    query: str = "",
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Recherche des utilisateurs par nom ou email."""
    if not query:
        return db.query(models.User).all()
    # On fait une recherche insensible à la casse
    search_filter = models.User.nom.ilike(f"%{query}%") | models.User.email.ilike(f"%{query}%")
    return db.query(models.User).filter(search_filter).all()

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
    """Supprime un utilisateur."""
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Un administrateur ne peut pas se supprimer lui-même.")

    deleted_user = crud.delete_user(db, user_id=user_id)
    if not deleted_user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return 

# --- Routes Superviseur ---
@app.get("/superviseur/dashboard-stats", tags=["Superviseur - Tableau de Bord"])
def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.superviseur_profile:
        raise HTTPException(status_code=403, detail="Accès réservé aux superviseurs")
    superviseur_id = current_user.superviseur_profile.id
    visites_en_attente = db.query(models.Visite).join(models.Merchandiser).filter(models.Visite.statut_validation == 'soumis', models.Merchandiser.manager_id == superviseur_id).count()
    statuts_query = db.query(models.Visite.statut_validation, func.count(models.Visite.id)).join(models.Merchandiser).filter(models.Merchandiser.manager_id == superviseur_id).group_by(models.Visite.statut_validation).all()
    performance_query = db.query(models.User.nom, func.count(models.Visite.id)).join(models.Merchandiser, models.Merchandiser.user_id == models.User.id).join(models.Visite, models.Visite.merchandiser_id == models.Merchandiser.id).filter(models.Merchandiser.manager_id == superviseur_id).group_by(models.User.nom).all()
    return {"visitesEnAttente": visites_en_attente, "statutsData": dict(statuts_query), "performanceEquipe": dict(performance_query)}

@app.get("/superviseur/visites/en-attente", response_model=List[schemas.VisiteInfo], tags=["Superviseur - Validation"])
def read_visites_en_attente(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.superviseur_profile:
        raise HTTPException(status_code=403, detail="Accès réservé aux superviseurs")
    return db.query(models.Visite).join(models.Merchandiser).filter(models.Visite.statut_validation == 'soumis', models.Merchandiser.manager_id == current_user.superviseur_profile.id).all()

@app.get("/admin/visites/en-attente/all", tags=["Admin - Rapports"])
def read_all_visites_en_attente_pour_admin(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Récupère TOUS les rapports en attente de TOUTES les équipes."""
    return db.query(models.Visite).filter(models.Visite.statut_validation == 'soumis').all()

@app.get("/superviseurs/", response_model=List[schemas.Superviseur], tags=["Admin - Gestion Utilisateurs"])
def read_all_superviseurs(
    db: Session = Depends(get_db),
    # On protège la route pour que seuls les admins puissent voir la liste
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Récupère la liste de tous les profils de superviseurs."""
    superviseurs = db.query(models.Superviseur).all()
    return superviseurs

@app.get("/superviseur/visites/historique", response_model=List[schemas.VisiteInfo], tags=["Superviseur - Rapports"])
def read_historique_visites_equipe(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Récupère l'historique des visites (validées ET rejetées) de l'équipe du superviseur."""
    if not current_user.superviseur_profile:
        raise HTTPException(status_code=403, detail="Accès réservé aux superviseurs")
    
    superviseur_id = current_user.superviseur_profile.id

    visites = (
        db.query(models.Visite)
        .join(models.Merchandiser)
        .filter(
            # On ne cherche que le statut 'valide'
            models.Visite.statut_validation == 'valide', 
            models.Merchandiser.manager_id == superviseur_id
        )
        .order_by(models.Visite.date_visite.desc())
        .all()
    )
    return visites


@app.get("/superviseur/export/visites-validees", tags=["Superviseur - Rapports"])
def export_visites_validees(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Exporte les rapports validés avec une ligne par détail pour une meilleure lisibilité.
    """
    if not current_user.superviseur_profile:
        raise HTTPException(status_code=403, detail="Accès réservé aux superviseurs")

    # 1. Récupérer les données avec eager loading
    visites = (
        db.query(models.Visite)
        .join(models.Merchandiser)
        .filter(
            models.Visite.statut_validation == 'valide',
            models.Merchandiser.manager_id == current_user.superviseur_profile.id
        )
        .options(
            joinedload(models.Visite.client),
            joinedload(models.Visite.merchandiser).joinedload(models.Merchandiser.user),
            joinedload(models.Visite.releves_stock).joinedload(models.ReleveStock.produit),
            joinedload(models.Visite.details_produits).joinedload(models.DetailVisiteProduit.produit),
            joinedload(models.Visite.veilles_concurrentielles).joinedload(models.VeilleConcurrentielle.concurrent)
        )
        .order_by(models.Visite.date_visite.desc())
        .all()
    )

    if not visites:
        raise HTTPException(status_code=404, detail="Aucune visite validée à exporter")

    output = io.StringIO()
    writer = csv.writer(output)

    # 2. Définir un en-tête complet et clair
    header = [
        # Infos générales de la visite
        'ID Visite', 'Date Visite', 'Nom Client', 'Localisation Client', 'Nom Merchandiser',
        'Observations Générales', 'FIFO Respecté', 'Planogramme Respecté',
        # Type de détail sur la ligne
        'Type de Ligne',
        # Champs pour Relevé de Stock
        'Produit (Stock)', 'Quantité en Stock', 'En Rupture', 'Type de Rupture',
        # Champs pour Détail Produit (Commande/Incident)
        'Produit (Détail)', 'Type de Détail', 'Quantité', 'Observation du Détail',
        # Champs pour Veille Concurrentielle
        'Concurrent', 'Marque', 'Nombre de Packs', 'Activité Observée', 'Mécanisme'
    ]
    writer.writerow(header)

    # 3. Traiter chaque visite
    for visite in visites:
        # Préparer la base de la ligne, commune à tous les détails de cette visite
        base_row = {
            'ID Visite': visite.id,
            'Date Visite': visite.date_visite.isoformat() if visite.date_visite else '',
            'Nom Client': visite.client.nom_client,
            'Localisation Client': visite.client.localisation,
            'Nom Merchandiser': visite.merchandiser.user.nom,
            'Observations Générales': visite.observations_generales,
            'FIFO Respecté': 'Oui' if visite.fifo_respecte else 'Non',
            'Planogramme Respecté': 'Oui' if visite.planogramme_respecte else 'Non',
        }

        has_details = False

        # Lignes pour les relevés de stock
        for rs in visite.releves_stock:
            has_details = True
            row = base_row.copy()
            row.update({
                'Type de Ligne': 'Relevé de Stock',
                'Produit (Stock)': rs.produit.nom_produit,
                'Quantité en Stock': rs.quantite_en_stock,
                'En Rupture': 'Oui' if rs.est_en_rupture else 'Non',
                'Type de Rupture': rs.type_rupture,
            })
            writer.writerow([row.get(h, '') for h in header])

        # Lignes pour les détails produits
        for dp in visite.details_produits:
            has_details = True
            row = base_row.copy()
            row.update({
                'Type de Ligne': 'Détail Produit',
                'Produit (Détail)': dp.produit.nom_produit,
                'Type de Détail': dp.type_detail,
                'Quantité': dp.quantite,
                'Observation du Détail': dp.observation,
            })
            writer.writerow([row.get(h, '') for h in header])

        # Lignes pour la veille concurrentielle
        for vc in visite.veilles_concurrentielles:
            has_details = True
            row = base_row.copy()
            row.update({
                'Type de Ligne': 'Veille Concurrentielle',
                'Concurrent': vc.concurrent.nom,
                'Marque': vc.marque,
                'Nombre de Packs': vc.nombre_packs,
                'Activité Observée': vc.activite_observee,
                'Mécanisme': vc.mecanisme,
            })
            writer.writerow([row.get(h, '') for h in header])

        # Si une visite n'a aucun détail, on écrit quand même une ligne avec les infos générales
        if not has_details:
            row = base_row.copy()
            row['Type de Ligne'] = 'Visite (sans détails)'
            writer.writerow([row.get(h, '') for h in header])


    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=rapport_visites_detaille_{datetime.date.today()}.csv"}
    )


# --- Routes de Visites ---
@app.post("/visites/", response_model=schemas.Visite, tags=["Visites"])
def create_visite(visite: schemas.VisiteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.merchandiser_profile:
        raise HTTPException(status_code=403, detail="Seul un merchandiser peut créer une visite")
    return crud.create_visite(db=db, visite=visite, merchandiser_id=current_user.merchandiser_profile.id)
@app.get("/visites/{visite_id}", response_model=schemas.VisiteDetail, tags=["Visites"])
def read_visite_details(visite_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_visite = db.query(models.Visite).filter(models.Visite.id == visite_id).first()
    if not db_visite:
        raise HTTPException(status_code=404, detail="Visite non trouvée")
    return db_visite
@app.put("/visites/{visite_id}/valider", response_model=schemas.Visite, tags=["Superviseur - Validation"])
def valider_visite(
    visite_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Change le statut d'une visite à 'valide'."""
    # On vérifie que l'utilisateur est bien un superviseur
    if not current_user.superviseur_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux superviseurs")
    # 1. On récupère la visite depuis la base de données
    db_visite = db.query(models.Visite).filter(models.Visite.id == visite_id).first()
    
    # 2. On vérifie si la visite existe
    if not db_visite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visite non trouvée")
    
    db_visite.statut_validation = 'valide'
    db_visite.validateur_id = current_user.superviseur_profile.id
    
    db.commit()
    db.refresh(db_visite)
    return db_visite


@app.put("/visites/{visite_id}/rejeter", response_model=schemas.Visite, tags=["Superviseur - Validation"])
def rejeter_visite(
    visite_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Change le statut d'une visite à 'rejete'."""
    # On vérifie que l'utilisateur est bien un superviseur
    if not current_user.superviseur_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux superviseurs")

    # 1. On récupère la visite depuis la base de données
    db_visite = db.query(models.Visite).filter(models.Visite.id == visite_id).first()
    
    # 2. On vérifie si la visite existe
    if not db_visite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visite non trouvée")

    db_visite.statut_validation = 'rejete'
    db_visite.validateur_id = current_user.superviseur_profile.id
    
    db.commit()
    db.refresh(db_visite)
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

# --- Routes de Données de Référence ---
@app.get("/clients/", response_model=List[schemas.Client], tags=["Données de Référence"])
def read_clients(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_clients(db)
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