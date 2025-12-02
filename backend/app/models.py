# Fichier: app/models.py - VERSION AVEC NOUVELLE HIÉRARCHIE

import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, Date
)
from sqlalchemy.orm import relationship
from .database import Base

# --- DOMAINE: SÉCURITÉ & AUTHENTIFICATION ---

class Role(Base):
    __tablename__ = 'roles'
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.datetime.utcnow)
    role_id = Column(Integer, ForeignKey('roles.id'))

    # Gestion de session unique
    active_token = Column(Text, nullable=True)  # Token actuellement actif
    last_login_at = Column(TIMESTAMP, nullable=True)  # Dernière connexion

    # --- RELATIONS ---
    role = relationship("Role", back_populates="users")
    merchandiser_profile = relationship("Merchandiser", back_populates="user", uselist=False)
    chef_zone_profile = relationship("ChefZone", back_populates="user", uselist=False)
    responsable_profile = relationship("Responsable", back_populates="user", uselist=False)
    clients_crees = relationship("Client", back_populates="createur")


# --- DOMAINE: MÉTIER & ORGANISATION ---
# Hiérarchie: Responsable → Chef de Zone → Merchandiser

class Responsable(Base):
    __tablename__ = 'responsables'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    base = Column(String(100), nullable=True)  # DOUALA, YAOUNDE, etc.
    zone = Column(String(100), nullable=True)  # Zone spécifique: Douala 1A, Douala 1B, etc.

    user = relationship("User", back_populates="responsable_profile")
    chefs_zone = relationship("ChefZone", back_populates="responsable")

class ChefZone(Base):
    __tablename__ = 'chefs_zone'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    responsable_id = Column(Integer, ForeignKey('responsables.id'))
    zone = Column(String(100), nullable=True)
    est_superviseur = Column(Boolean, default=False)  # True = Superviseur GMS, False = Chef de Zone

    user = relationship("User", back_populates="chef_zone_profile")
    responsable = relationship("Responsable", back_populates="chefs_zone")
    merchandisers = relationship("Merchandiser", back_populates="chef_zone")
    commerciaux = relationship("Commercial", back_populates="chef_zone")

class Merchandiser(Base):
    __tablename__ = 'merchandisers'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    chef_zone_id = Column(Integer, ForeignKey('chefs_zone.id'))
    sous_zone = Column(String(100), nullable=True)  # Sous-zone au sein de la zone du chef (ex: A1, A2 pour zone A)

    chef_zone = relationship("ChefZone", back_populates="merchandisers")
    user = relationship("User", back_populates="merchandiser_profile")
    visites = relationship("Visite", back_populates="merchandiser")
    clients_assignes = relationship("Client", back_populates="merchandiser")

# --- DOMAINE: DONNÉES DE RÉFÉRENCE MÉTIER ---

class Commercial(Base):
    __tablename__ = 'commerciaux'
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    contact = Column(String(100), nullable=True)
    chef_zone_id = Column(Integer, ForeignKey('chefs_zone.id'), nullable=False)

    # Relations
    chef_zone = relationship("ChefZone", back_populates="commerciaux")
    clients = relationship("Client", back_populates="commercial")


class Client(Base):
    __tablename__ = 'clients'
    id = Column(Integer, primary_key=True, index=True)
    nom_client = Column(String(200), nullable=False)
    contact = Column(String(100), nullable=True)
    typologie = Column(String(100), nullable=True)
    localisation = Column(String(255), nullable=True)
    zone = Column(String(100), nullable=True)
    sous_zone = Column(String(100), nullable=True)  # Sous-zone au sein de la zone principale
    lieu_dit = Column(String(255), nullable=True)
    commercial_nom = Column(String(100), nullable=True)  # LEGACY - à supprimer après migration
    commercial_id = Column(Integer, ForeignKey('commerciaux.id'), nullable=True)
    merchandiser_id = Column(Integer, ForeignKey('merchandisers.id'), nullable=True)  # Merchandiser assigné
    createur_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    est_gms = Column(Boolean, default=False)  # True = GMS/Entreprise, False = Petite Surface

    # Relations
    createur = relationship("User", back_populates="clients_crees")
    commercial = relationship("Commercial", back_populates="clients")
    merchandiser = relationship("Merchandiser", back_populates="clients_assignes")
    visites = relationship("Visite", back_populates="client")

class Produit(Base):
    __tablename__ = 'produits'
    id = Column(Integer, primary_key=True, index=True)
    nom_produit = Column(String(200), nullable=False)  # Nom court: SP, OP, VITAL, etc.
    article = Column(String(255), nullable=True)  # Nom complet: EAU SUPERMONT 1.5L, etc.
    marque = Column(String(100), nullable=True)
    categorie_id = Column(Integer, ForeignKey('categories_produit.id'))

    categorie = relationship("CategorieProduit", back_populates="produits")


class CategorieProduit(Base):
    __tablename__ = 'categories_produit'
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), unique=True, nullable=False)
    
    # Relation inverse vers les produits
    produits = relationship("Produit", back_populates="categorie")


class Concurrent(Base):
    __tablename__ = 'concurrents'
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(255), unique=True, nullable=False)

# --- DOMAINE: PROCESSUS OPÉRATIONNEL ---

class Visite(Base):
    __tablename__ = 'visites'
    id = Column(Integer, primary_key=True, index=True)
    merchandiser_id = Column(Integer, ForeignKey('merchandisers.id'))
    client_id = Column(Integer, ForeignKey('clients.id'))
    date_visite = Column(Date, default=datetime.date.today)

    # Horaires de la visite (format: "HH:MM")
    heure_debut = Column(String(10), nullable=True)
    heure_fin = Column(String(10), nullable=True)

    # Informations de base
    base = Column(String(100), nullable=True)  # DOUALA, YAOUNDE, etc.

    # Équipements/Outils
    type_outil = Column(String(255), nullable=True)  # FRIGO, PLAQUE BRANDEE, etc.
    marque_outil = Column(String(255), nullable=True)  # PLANET, AMERICAN COLA, etc.
    etat_outil = Column(String(255), nullable=True)  # BON ETAT, VIEUX, CASSÉ

    # Conformité
    fifo_respecte = Column(Boolean, default=True)
    planogramme_respecte = Column(Boolean, default=True)
    observation_planogramme = Column(Text, nullable=True)

    # Ruptures - stockées comme texte avec séparateur
    ruptures = Column(Text, nullable=True)  # Liste des produits en rupture séparés par ";"
    type_rupture = Column(String(255), nullable=True)  # SANS GAZ, AUTRES, etc.

    # Incidents
    type_incidents = Column(String(255), nullable=True)  # ETIQUETTES DECOLLEES, etc.
    articles_incidents = Column(Text, nullable=True)  # Produits concernés par incidents
    quantite_incidents = Column(Integer, nullable=True)

    # Observations générales
    observations_generales = Column(Text, nullable=True)

    # Informations commerciales
    reseau_distribution = Column(String(100), nullable=True)  # TT, MT, STATIONS, etc.
    type_client = Column(String(50), nullable=True)  # DIRECT, INDIRECT
    client_direct_nom = Column(String(200), nullable=True)  # Si type_client = INDIRECT

    # Validation
    statut_validation = Column(String(50), default='soumis')  # soumis, valide, rejete
    validateur_id = Column(Integer, ForeignKey('chefs_zone.id'), nullable=True)
    date_validation = Column(Date, nullable=True)
    heure_validation = Column(String(10), nullable=True)  # Format: "HH:MM:SS"
    commentaire_validateur = Column(Text, nullable=True)

    # Relations
    merchandiser = relationship("Merchandiser", back_populates="visites")
    validateur = relationship("ChefZone")
    client = relationship("Client", back_populates="visites")
    releves_stock = relationship("ReleveStock", back_populates="visite", cascade="all, delete-orphan")
    details_produits = relationship("DetailVisiteProduit", back_populates="visite", cascade="all, delete-orphan")
    veilles_concurrentielles = relationship("VeilleConcurrentielle", back_populates="visite", cascade="all, delete-orphan")

class ReleveStock(Base):
    __tablename__ = 'releves_stock'
    id = Column(Integer, primary_key=True, index=True)
    visite_id = Column(Integer, ForeignKey('visites.id'))
    produit_id = Column(Integer, ForeignKey('produits.id'))
    quantite_en_stock = Column(Integer, nullable=True)
    est_en_rupture = Column(Boolean, default=False)
    type_rupture = Column(String(100), nullable=True)

    visite = relationship("Visite", back_populates="releves_stock")
    produit = relationship("Produit")

class DetailVisiteProduit(Base):
    __tablename__ = 'details_visite_produit'
    id = Column(Integer, primary_key=True, index=True)
    visite_id = Column(Integer, ForeignKey('visites.id'))
    produit_id = Column(Integer, ForeignKey('produits.id'))
    type_detail = Column(String(50), nullable=False) # 'commande' ou 'incident'
    quantite = Column(Integer)
    observation = Column(Text, nullable=True)

    visite = relationship("Visite", back_populates="details_produits")
    produit = relationship("Produit")

# --- VERSION SIMPLIFIÉE ET CORRIGÉE DE LA VEILLE ---
class VeilleConcurrentielle(Base):
    __tablename__ = 'veilles_concurrentielles'
    id = Column(Integer, primary_key=True, index=True)
    visite_id = Column(Integer, ForeignKey('visites.id'))
    concurrent_id = Column(Integer, ForeignKey('concurrents.id'))
    
    marque = Column(String(255), nullable=True)
    
    nombre_packs = Column(Integer, nullable=True)
    activite_observee = Column(Text, nullable=True)
    mecanisme = Column(Text, nullable=True)

    visite = relationship("Visite", back_populates="veilles_concurrentielles")
    concurrent = relationship("Concurrent")

# Dans app/models.py

class ActiviteLog(Base):
    __tablename__ = 'activite_logs'
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(TIMESTAMP, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action = Column(Text, nullable=False)

    user = relationship("User")


class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    type = Column(String(50), nullable=False)  # visite_soumise, visite_validee, visite_rejetee
    titre = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    visite_id = Column(Integer, ForeignKey('visites.id'), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.datetime.utcnow)

    user = relationship("User")
    visite = relationship("Visite")