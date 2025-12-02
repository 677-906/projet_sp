"""
Fonction d'export Excel pour le tableau de bord zoning (tableau croisé dynamique)
"""

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models
import io


def export_zoning_to_excel(db: Session) -> io.BytesIO:
    """
    Exporte le tableau de bord zoning au format Excel avec tableau croisé dynamique

    Args:
        db: Session de base de données

    Returns:
        BytesIO contenant le fichier Excel
    """

    # Créer un nouveau workbook
    wb = Workbook()

    # === FEUILLE 1: VUE D'ENSEMBLE PAR ZONE ===
    ws_overview = wb.active
    ws_overview.title = "Vue d'ensemble"

    # En-têtes pour la vue d'ensemble
    headers_overview = [
        'ZONE', 'RESPONSABLE', 'CHEF DE ZONE', 'NB COMMERCIAUX', 'NB MERCHANDISERS',
        'NB CLIENTS', 'NB VISITES TOTAL', 'NB VISITES VALIDEES', 'TAUX VALIDATION (%)',
        'NB CLIENTS VISITES', 'TAUX COUVERTURE (%)'
    ]

    ws_overview.append(headers_overview)

    # Styliser les en-têtes
    header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")

    for cell in ws_overview[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Récupérer toutes les zones distinctes
    zones_from_clients = db.query(models.Client.zone).distinct().filter(models.Client.zone.isnot(None)).all()
    zones_from_chefs = db.query(models.ChefZone.zone).distinct().filter(models.ChefZone.zone.isnot(None)).all()

    all_zones = set()
    for zone_tuple in zones_from_clients:
        if zone_tuple[0]:
            all_zones.add(zone_tuple[0])
    for zone_tuple in zones_from_chefs:
        if zone_tuple[0]:
            all_zones.add(zone_tuple[0])

    # Pour chaque zone, collecter les données
    for zone_name in sorted(all_zones):
        # Récupérer les chefs de zone
        chefs_zone = db.query(models.ChefZone).filter(models.ChefZone.zone == zone_name).all()

        if not chefs_zone:
            # Zone sans chef de zone
            row = [
                zone_name,
                "",  # RESPONSABLE
                "",  # CHEF DE ZONE
                0,   # NB COMMERCIAUX
                0,   # NB MERCHANDISERS
                db.query(models.Client).filter(models.Client.zone == zone_name).count(),  # NB CLIENTS
                0,   # NB VISITES TOTAL
                0,   # NB VISITES VALIDEES
                0,   # TAUX VALIDATION
                0,   # NB CLIENTS VISITES
                0    # TAUX COUVERTURE
            ]
            ws_overview.append(row)
            continue

        # Pour chaque chef de zone dans cette zone
        for chef_zone in chefs_zone:
            # Responsable
            responsable_nom = ""
            if chef_zone.responsable and chef_zone.responsable.user:
                responsable_nom = chef_zone.responsable.user.nom

            # Chef de zone
            chef_nom = chef_zone.user.nom if chef_zone.user else ""

            # Commerciaux
            nb_commerciaux = db.query(models.Commercial).filter(
                models.Commercial.chef_zone_id == chef_zone.id
            ).count()

            # Merchandisers
            merchandisers = db.query(models.Merchandiser).filter(
                models.Merchandiser.chef_zone_id == chef_zone.id
            ).all()
            nb_merchandisers = len(merchandisers)
            merchandiser_ids = [m.id for m in merchandisers]

            # Clients dans cette zone
            nb_clients = db.query(models.Client).filter(
                models.Client.zone == zone_name
            ).count()

            # Visites des merchandisers de ce chef de zone
            nb_visites_total = 0
            nb_visites_validees = 0
            nb_clients_visites = 0

            if merchandiser_ids:
                nb_visites_total = db.query(models.Visite).filter(
                    models.Visite.merchandiser_id.in_(merchandiser_ids)
                ).count()

                nb_visites_validees = db.query(models.Visite).filter(
                    models.Visite.merchandiser_id.in_(merchandiser_ids),
                    models.Visite.statut_validation == 'valide'
                ).count()

                # Nombre de clients uniques visités
                clients_visites = db.query(models.Visite.client_id).filter(
                    models.Visite.merchandiser_id.in_(merchandiser_ids)
                ).distinct().all()
                nb_clients_visites = len(clients_visites)

            # Calculs des taux
            taux_validation = (nb_visites_validees / nb_visites_total * 100) if nb_visites_total > 0 else 0
            taux_couverture = (nb_clients_visites / nb_clients * 100) if nb_clients > 0 else 0

            row = [
                zone_name,
                responsable_nom,
                chef_nom,
                nb_commerciaux,
                nb_merchandisers,
                nb_clients,
                nb_visites_total,
                nb_visites_validees,
                round(taux_validation, 2),
                nb_clients_visites,
                round(taux_couverture, 2)
            ]
            ws_overview.append(row)

    # === FEUILLE 2: DÉTAIL PAR ZONE - CLIENTS ===
    ws_clients = wb.create_sheet(title="Clients par Zone")

    headers_clients = [
        'ZONE', 'CHEF DE ZONE', 'COMMERCIAL', 'MERCHANDISER',
        'NOM CLIENT', 'CONTACT', 'TYPOLOGIE', 'LOCALISATION', 'LIEU DIT',
        'NB VISITES', 'DERNIERE VISITE'
    ]
    ws_clients.append(headers_clients)

    # Styliser les en-têtes
    for cell in ws_clients[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Récupérer tous les clients avec leurs relations
    from sqlalchemy.orm import joinedload

    clients = db.query(models.Client).options(
        joinedload(models.Client.commercial),
        joinedload(models.Client.merchandiser)
    ).order_by(models.Client.zone, models.Client.nom_client).all()

    for client in clients:
        # Chef de zone
        chef_zone_nom = ""
        if client.zone:
            chef = db.query(models.ChefZone).filter(models.ChefZone.zone == client.zone).first()
            if chef and chef.user:
                chef_zone_nom = chef.user.nom

        # Commercial
        commercial_nom = ""
        if client.commercial:
            commercial_nom = client.commercial.nom

        # Merchandiser
        merchandiser_nom = ""
        if client.merchandiser and client.merchandiser.user:
            merchandiser_nom = client.merchandiser.user.nom

        # Nombre de visites
        nb_visites = db.query(models.Visite).filter(
            models.Visite.client_id == client.id
        ).count()

        # Dernière visite
        derniere_visite = db.query(models.Visite).filter(
            models.Visite.client_id == client.id
        ).order_by(models.Visite.date_visite.desc()).first()

        derniere_visite_date = derniere_visite.date_visite if derniere_visite else None

        row = [
            client.zone or "",
            chef_zone_nom,
            commercial_nom,
            merchandiser_nom,
            client.nom_client,
            client.contact or "",
            client.typologie or "",
            client.localisation or "",
            client.lieu_dit or "",
            nb_visites,
            derniere_visite_date
        ]
        ws_clients.append(row)

    # === FEUILLE 3: DÉTAIL PAR ZONE - MERCHANDISERS ===
    ws_merchandisers = wb.create_sheet(title="Merchandisers par Zone")

    headers_merchandisers = [
        'ZONE', 'CHEF DE ZONE', 'RESPONSABLE', 'MERCHANDISER', 'EMAIL',
        'NB CLIENTS ASSIGNES', 'NB VISITES TOTAL', 'NB VISITES VALIDEES',
        'NB VISITES EN ATTENTE', 'NB VISITES REJETEES', 'TAUX VALIDATION (%)'
    ]
    ws_merchandisers.append(headers_merchandisers)

    # Styliser les en-têtes
    for cell in ws_merchandisers[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Récupérer tous les merchandisers
    merchandisers = db.query(models.Merchandiser).options(
        joinedload(models.Merchandiser.user),
        joinedload(models.Merchandiser.chef_zone)
    ).all()

    for merchandiser in merchandisers:
        # Chef de zone
        chef_zone_nom = ""
        zone_nom = ""
        if merchandiser.chef_zone:
            if merchandiser.chef_zone.user:
                chef_zone_nom = merchandiser.chef_zone.user.nom
            zone_nom = merchandiser.chef_zone.zone or ""

        # Responsable
        responsable_nom = ""
        if merchandiser.chef_zone and merchandiser.chef_zone.responsable:
            if merchandiser.chef_zone.responsable.user:
                responsable_nom = merchandiser.chef_zone.responsable.user.nom

        # Merchandiser
        merchandiser_nom = merchandiser.user.nom if merchandiser.user else ""
        merchandiser_email = merchandiser.user.email if merchandiser.user else ""

        # Nombre de clients assignés
        nb_clients_assignes = db.query(models.Client).filter(
            models.Client.merchandiser_id == merchandiser.id
        ).count()

        # Statistiques des visites
        nb_visites_total = db.query(models.Visite).filter(
            models.Visite.merchandiser_id == merchandiser.id
        ).count()

        nb_visites_validees = db.query(models.Visite).filter(
            models.Visite.merchandiser_id == merchandiser.id,
            models.Visite.statut_validation == 'valide'
        ).count()

        nb_visites_en_attente = db.query(models.Visite).filter(
            models.Visite.merchandiser_id == merchandiser.id,
            models.Visite.statut_validation == 'soumis'
        ).count()

        nb_visites_rejetees = db.query(models.Visite).filter(
            models.Visite.merchandiser_id == merchandiser.id,
            models.Visite.statut_validation == 'rejete'
        ).count()

        taux_validation = (nb_visites_validees / nb_visites_total * 100) if nb_visites_total > 0 else 0

        row = [
            zone_nom,
            chef_zone_nom,
            responsable_nom,
            merchandiser_nom,
            merchandiser_email,
            nb_clients_assignes,
            nb_visites_total,
            nb_visites_validees,
            nb_visites_en_attente,
            nb_visites_rejetees,
            round(taux_validation, 2)
        ]
        ws_merchandisers.append(row)

    # === FEUILLE 4: STATISTIQUES PAR TYPOLOGIE ===
    ws_typologie = wb.create_sheet(title="Par Typologie")

    headers_typologie = [
        'ZONE', 'TYPOLOGIE', 'NB CLIENTS', 'NB VISITES', 'TAUX COUVERTURE (%)'
    ]
    ws_typologie.append(headers_typologie)

    # Styliser les en-têtes
    for cell in ws_typologie[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Grouper par zone et typologie
    typologies_par_zone = db.query(
        models.Client.zone,
        models.Client.typologie,
        func.count(models.Client.id).label('nb_clients')
    ).filter(
        models.Client.zone.isnot(None),
        models.Client.typologie.isnot(None)
    ).group_by(
        models.Client.zone,
        models.Client.typologie
    ).all()

    for zone, typologie, nb_clients in typologies_par_zone:
        # Nombre de clients de cette typologie qui ont été visités
        clients_ids = [c.id for c in db.query(models.Client).filter(
            models.Client.zone == zone,
            models.Client.typologie == typologie
        ).all()]

        nb_visites = 0
        nb_clients_visites = 0

        if clients_ids:
            nb_visites = db.query(models.Visite).filter(
                models.Visite.client_id.in_(clients_ids)
            ).count()

            clients_visites = db.query(models.Visite.client_id).filter(
                models.Visite.client_id.in_(clients_ids)
            ).distinct().all()
            nb_clients_visites = len(clients_visites)

        taux_couverture = (nb_clients_visites / nb_clients * 100) if nb_clients > 0 else 0

        row = [
            zone,
            typologie,
            nb_clients,
            nb_visites,
            round(taux_couverture, 2)
        ]
        ws_typologie.append(row)

    # Ajuster la largeur des colonnes pour toutes les feuilles
    for ws in [ws_overview, ws_clients, ws_merchandisers, ws_typologie]:
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
