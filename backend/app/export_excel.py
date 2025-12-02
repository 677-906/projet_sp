"""
Fonction d'export Excel pour les visites validées
Format: identique à Book2.xlsx (54 colonnes)
"""

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from sqlalchemy.orm import Session
from typing import List
from . import models
import io


def export_visites_to_excel(db: Session, visites: List[models.Visite]) -> io.BytesIO:
    """
    Exporte les visites au format Excel identique à Book2.xlsx

    Args:
        db: Session de base de données
        visites: Liste des visites à exporter (normalement validées uniquement)

    Returns:
        BytesIO contenant le fichier Excel
    """

    # Créer un nouveau workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Visites"

    # Définir les 55 colonnes (ajout de TYPE SURFACE)
    headers = [
        'ZONE', 'MARCHANDISEUR', 'DATE', 'BASE', 'RESPONSABLE', 'CHEF DE ZONE/SUPERVISEUR',
        'HEURE AR', 'HEURE DE', 'COMMERCIAL', 'CONTACT', 'NOM CLIENT', 'TYPOLOGIE',
        'TYPE SURFACE', 'LOCALISATION', 'LIEU DIT', 'TYPE OUTIL', 'MARQUE', 'ETATS', 'FIFO',
        'RUPTURES', 'TYPE INCIDENTS', 'ARTICLE', 'QUANTITE', 'OBSERVATION',
        'SP', 'OP', 'VITAL', 'TANGUI', 'MADIBA', 'CEILO', 'SANO', 'AQUABELLE',
        'ULTIME LIGHT', 'VALCLAIR', 'AUTRES',
        'BG SP', 'BG BC', 'BG ELIM', 'BG GRACEDOM', 'BG UCB', 'BRASAF', 'AUTRES BG',
        'ED SP', 'ED BC', 'ED ELIM', 'AUTRES ED',
        'CONCURRENT', 'ACTIVITE', 'MECANISME',
        'RESEAU DE DISTRIBUTION', 'PLANOGRAMME', 'OB PLANOGRAMME',
        'TYPE CLIENT', 'CLIENT DIRECT', 'ID'
    ]

    # Écrire les en-têtes
    ws.append(headers)

    # Styliser les en-têtes
    header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")

    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Les 22 produits dans l'ordre exact du fichier Excel
    produits_ordre = [
        'SP', 'OP', 'VITAL', 'TANGUI', 'MADIBA', 'CEILO', 'SANO', 'AQUABELLE',
        'ULTIME LIGHT', 'VALCLAIR', 'AUTRES',
        'BG SP', 'BG BC', 'BG ELIM', 'BG GRACEDOM', 'BG UCB', 'BRASAF', 'AUTRES BG',
        'ED SP', 'ED BC', 'ED ELIM', 'AUTRES ED'
    ]

    # Traiter chaque visite
    for visite in visites:
        # Récupérer les informations hiérarchiques
        merchandiser = visite.merchandiser
        merchandiser_nom = merchandiser.user.nom if merchandiser else ""

        chef_zone = merchandiser.chef_zone if merchandiser else None
        chef_zone_nom = chef_zone.user.nom if chef_zone else ""
        zone = chef_zone.zone if chef_zone else ""

        responsable = chef_zone.responsable if chef_zone else None
        responsable_nom = responsable.user.nom if responsable else ""
        base = visite.base or (responsable.base if responsable else "")

        # Client
        client = visite.client

        # Créer un dictionnaire des stocks par produit (depuis veilles_concurrentielles)
        stocks_par_produit = {}
        for veille in visite.veilles_concurrentielles:
            marque = veille.marque
            if marque in stocks_par_produit:
                # Si la marque existe déjà, additionner les packs
                stocks_par_produit[marque] += veille.nombre_packs or 0
            else:
                stocks_par_produit[marque] = veille.nombre_packs or 0

        # Récupérer les informations de veille concurrentielle
        concurrent_info = ""
        activite_info = ""
        mecanisme_info = ""

        if visite.veilles_concurrentielles:
            # Concaténer toutes les veilles
            concurrents = []
            activites = []
            mecanismes = []

            for veille in visite.veilles_concurrentielles:
                if veille.concurrent:
                    concurrents.append(veille.concurrent.nom)
                if veille.activite_observee:
                    activites.append(veille.activite_observee)
                if veille.mecanisme:
                    mecanismes.append(veille.mecanisme)

            concurrent_info = "; ".join(concurrents) if concurrents else ""
            activite_info = "; ".join(activites) if activites else ""
            mecanisme_info = "; ".join(mecanismes) if mecanismes else ""

        # Déterminer le type de surface et le label du chef
        type_surface = "GMS" if client.est_gms else "Petite Surface"

        # Commercial - Utiliser la relation en priorité, puis le champ LEGACY
        commercial_nom = ""
        if client.commercial:
            commercial_nom = client.commercial.nom
        elif client.commercial_nom:
            commercial_nom = client.commercial_nom

        # Construire la ligne
        row = [
            zone,  # ZONE
            merchandiser_nom,  # MARCHANDISEUR
            visite.date_visite,  # DATE
            base,  # BASE
            responsable_nom,  # RESPONSABLE
            chef_zone_nom,  # CHEF DE ZONE/SUPERVISEUR
            visite.heure_debut,  # HEURE AR (heure d'arrivée = début de la visite)
            visite.heure_fin,  # HEURE DE (heure de départ = fin de la visite)
            commercial_nom,  # COMMERCIAL
            client.contact or "",  # CONTACT
            client.nom_client or "",  # NOM CLIENT
            client.typologie or "",  # TYPOLOGIE
            type_surface,  # TYPE SURFACE (GMS ou Petite Surface)
            client.localisation or "",  # LOCALISATION
            client.lieu_dit or "",  # LIEU DIT
            visite.type_outil or "",  # TYPE OUTIL
            visite.marque_outil or "",  # MARQUE
            visite.etat_outil or "",  # ETATS
            "OUI" if visite.fifo_respecte else "NON",  # FIFO
            visite.ruptures or "",  # RUPTURES
            visite.type_incidents or "",  # TYPE INCIDENTS
            visite.articles_incidents or "",  # ARTICLE
            visite.quantite_incidents or "",  # QUANTITE
            visite.observations_generales or "",  # OBSERVATION
        ]

        # Ajouter les stocks des 22 produits dans l'ordre
        for produit_nom in produits_ordre:
            row.append(stocks_par_produit.get(produit_nom, ""))

        # Ajouter les informations finales
        row.extend([
            concurrent_info,  # CONCURRENT
            activite_info,  # ACTIVITE
            mecanisme_info,  # MECANISME
            visite.reseau_distribution or "",  # RESEAU DE DISTRIBUTION
            "OUI" if visite.planogramme_respecte else "NON",  # PLANOGRAMME
            visite.observation_planogramme or "",  # OB PLANOGRAMME
            visite.type_client or "",  # TYPE CLIENT
            visite.client_direct_nom or "",  # CLIENT DIRECT
            visite.id  # ID
        ])

        ws.append(row)

    # Ajuster la largeur des colonnes
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width

    # Sauvegarder dans un BytesIO
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return output
