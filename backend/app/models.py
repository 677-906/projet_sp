# Fichier: app/models.py - VERSION CORRIGÉE ET SIMPLIFIÉE

import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, Date, Time
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
    
    # --- RELATIONS ---
    role = relationship("Role", back_populates="users")
    merchandiser_profile = relationship("Merchandiser", back_populates="user", uselist=False)
    superviseur_profile = relationship("Superviseur", back_populates="user", uselist=False)
    clients_crees = relationship("Client", back_populates="createur")
    

# --- DOMAINE: MÉTIER & ORGANISATION ---

class Superviseur(Base):
    __tablename__ = 'superviseurs'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    
    user = relationship("User", back_populates="superviseur_profile")
    merchandisers = relationship("Merchandiser", back_populates="manager")

class Merchandiser(Base):
    __tablename__ = 'merchandisers'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    zone_geographique = Column(String(100), nullable=True)
    manager_id = Column(Integer, ForeignKey('superviseurs.id'))
    
    manager = relationship("Superviseur", back_populates="merchandisers")
    user = relationship("User", back_populates="merchandiser_profile")
    visites = relationship("Visite", back_populates="merchandiser")

# --- DOMAINE: DONNÉES DE RÉFÉRENCE MÉTIER ---

class Client(Base):
    __tablename__ = 'clients'
    id = Column(Integer, primary_key=True, index=True)
    nom_client = Column(String(200), nullable=False)
    contact = Column(String(100), nullable=True)
    typologie = Column(String(100), nullable=True)
    localisation = Column(String(255), nullable=True)
    createur_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    createur = relationship("User", back_populates="clients_crees")   

    visites = relationship("Visite", back_populates="client")

class Produit(Base):
    __tablename__ = 'produits'
    id = Column(Integer, primary_key=True, index=True)
    nom_produit = Column(String(200), nullable=False)
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
    statut_validation = Column(String(50), default='soumis')
    observations_generales = Column(Text, nullable=True)
    fifo_respecte = Column(Boolean, default=True)
    planogramme_respecte = Column(Boolean, default=True)
    validateur_id = Column(Integer, ForeignKey('superviseurs.id'), nullable=True)
    date_validation = Column(Date, nullable=True)
    heure_debut = Column(Time, nullable=True)
    
    merchandiser = relationship("Merchandiser", back_populates="visites")
    validateur = relationship("Superviseur")
    client = relationship("Client", back_populates="visites")
    releves_stock = relationship("ReleveStock", back_populates="visite")
    details_produits = relationship("DetailVisiteProduit", back_populates="visite")
    veilles_concurrentielles = relationship("VeilleConcurrentielle", back_populates="visite")

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