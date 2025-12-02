"""
Script pour ajouter des tableaux croisés dynamiques au fichier Book1.1.xlsx
"""

import sys
import os
from openpyxl import load_workbook
from openpyxl.styles import Font, Alignment, PatternFill

# Configurer l'encodage UTF-8
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def add_pivot_tables_to_book1():
    """Ajoute des tableaux croisés dynamiques au fichier Book1.1.xlsx"""

    # Chemin vers le fichier
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Book1.1.xlsx")
    output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Book1.1_avec_pivots.xlsx")

    print("=" * 80)
    print("AJOUT DE TABLEAUX CROISES DYNAMIQUES A BOOK1.1.XLSX")
    print("=" * 80)
    print()

    try:
        # Charger le workbook
        print("Etape 1: Chargement du fichier...")
        wb = load_workbook(file_path)
        ws_data = wb.active
        print(f"[OK] Fichier chargé: {ws_data.max_row} lignes, {ws_data.max_column} colonnes")
        print()

        # === FEUILLE 1: RECAP PAR ZONE ===
        print("Etape 2: Création de la feuille 'Récap par Zone'...")
        ws_zone = wb.create_sheet(title="Récap par Zone")

        # En-têtes
        headers = ['ZONE', 'NB VISITES', 'NB MERCHANDISERS', 'NB COMMERCIAUX', 'NB CLIENTS']
        ws_zone.append(headers)

        # Styliser les en-têtes
        header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF")
        for cell in ws_zone[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        # Collecter les données par zone
        zones_data = {}
        for row_idx in range(2, ws_data.max_row + 1):
            zone = ws_data.cell(row=row_idx, column=1).value  # ZONE (col A)
            merchandiser = ws_data.cell(row=row_idx, column=2).value  # MARCHANDISEUR (col B)
            commercial = ws_data.cell(row=row_idx, column=9).value  # COMMERCIAL (col I)
            client = ws_data.cell(row=row_idx, column=11).value  # NOM CLIENT (col K)

            if zone and zone not in zones_data:
                zones_data[zone] = {
                    'visites': 0,
                    'merchandisers': set(),
                    'commerciaux': set(),
                    'clients': set()
                }

            if zone:
                zones_data[zone]['visites'] += 1
                if merchandiser:
                    zones_data[zone]['merchandisers'].add(merchandiser)
                if commercial:
                    zones_data[zone]['commerciaux'].add(commercial)
                if client:
                    zones_data[zone]['clients'].add(client)

        # Ajouter les données
        for zone in sorted(zones_data.keys()):
            data = zones_data[zone]
            ws_zone.append([
                zone,
                data['visites'],
                len(data['merchandisers']),
                len(data['commerciaux']),
                len(data['clients'])
            ])

        print(f"[OK] Feuille 'Récap par Zone' créée avec {len(zones_data)} zones")
        print()

        # === FEUILLE 2: RECAP PAR MERCHANDISER ===
        print("Etape 3: Création de la feuille 'Récap par Merchandiser'...")
        ws_merc = wb.create_sheet(title="Récap par Merchandiser")

        headers_merc = ['ZONE', 'MERCHANDISER', 'NB VISITES', 'NB COMMERCIAUX', 'NB CLIENTS']
        ws_merc.append(headers_merc)

        # Styliser les en-têtes
        for cell in ws_merc[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        # Collecter les données par merchandiser
        merc_data = {}
        for row_idx in range(2, ws_data.max_row + 1):
            zone = ws_data.cell(row=row_idx, column=1).value
            merchandiser = ws_data.cell(row=row_idx, column=2).value
            commercial = ws_data.cell(row=row_idx, column=9).value
            client = ws_data.cell(row=row_idx, column=11).value

            if merchandiser:
                key = (zone, merchandiser)
                if key not in merc_data:
                    merc_data[key] = {
                        'visites': 0,
                        'commerciaux': set(),
                        'clients': set()
                    }

                merc_data[key]['visites'] += 1
                if commercial:
                    merc_data[key]['commerciaux'].add(commercial)
                if client:
                    merc_data[key]['clients'].add(client)

        # Ajouter les données
        for (zone, merchandiser) in sorted(merc_data.keys()):
            data = merc_data[(zone, merchandiser)]
            ws_merc.append([
                zone,
                merchandiser,
                data['visites'],
                len(data['commerciaux']),
                len(data['clients'])
            ])

        print(f"[OK] Feuille 'Récap par Merchandiser' créée avec {len(merc_data)} merchandisers")
        print()

        # === FEUILLE 3: RECAP PAR COMMERCIAL ===
        print("Etape 4: Création de la feuille 'Récap par Commercial'...")
        ws_comm = wb.create_sheet(title="Récap par Commercial")

        headers_comm = ['ZONE', 'COMMERCIAL', 'NB VISITES', 'NB CLIENTS', 'NB MERCHANDISERS']
        ws_comm.append(headers_comm)

        # Styliser les en-têtes
        for cell in ws_comm[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        # Collecter les données par commercial
        comm_data = {}
        for row_idx in range(2, ws_data.max_row + 1):
            zone = ws_data.cell(row=row_idx, column=1).value
            merchandiser = ws_data.cell(row=row_idx, column=2).value
            commercial = ws_data.cell(row=row_idx, column=9).value
            client = ws_data.cell(row=row_idx, column=11).value

            if commercial:
                key = (zone, commercial)
                if key not in comm_data:
                    comm_data[key] = {
                        'visites': 0,
                        'clients': set(),
                        'merchandisers': set()
                    }

                comm_data[key]['visites'] += 1
                if client:
                    comm_data[key]['clients'].add(client)
                if merchandiser:
                    comm_data[key]['merchandisers'].add(merchandiser)

        # Ajouter les données
        for (zone, commercial) in sorted(comm_data.keys()):
            data = comm_data[(zone, commercial)]
            ws_comm.append([
                zone,
                commercial,
                data['visites'],
                len(data['clients']),
                len(data['merchandisers'])
            ])

        print(f"[OK] Feuille 'Récap par Commercial' créée avec {len(comm_data)} commerciaux")
        print()

        # === FEUILLE 4: RECAP PRODUITS PAR ZONE ===
        print("Etape 5: Création de la feuille 'Produits par Zone'...")
        ws_prod = wb.create_sheet(title="Produits par Zone")

        # Liste des produits (colonnes 24 à 45)
        produits = ['SP', 'OP', 'VITAL', 'TANGUI', 'MADIBA', 'CEILO', 'SANO', 'AQUABELLE',
                    'ULTIME LIGHT', 'VALCLAIR', 'AUTRES', 'BG SP', 'BG BC', 'BG ELIM',
                    'BG GRACEDOM', 'BG UCB', 'BRASAF', 'AUTRES BG', 'ED SP', 'ED BC',
                    'ED ELIM', 'AUTRES ED']

        headers_prod = ['ZONE'] + produits + ['TOTAL']
        ws_prod.append(headers_prod)

        # Styliser les en-têtes
        for cell in ws_prod[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        # Collecter les stocks par zone
        stocks_par_zone = {}
        for row_idx in range(2, ws_data.max_row + 1):
            zone = ws_data.cell(row=row_idx, column=1).value

            if zone and zone not in stocks_par_zone:
                stocks_par_zone[zone] = {prod: 0 for prod in produits}

            if zone:
                # Lire les colonnes 24 à 45 (produits)
                for idx, prod in enumerate(produits):
                    col_num = 24 + idx
                    value = ws_data.cell(row=row_idx, column=col_num).value
                    if value and isinstance(value, (int, float)):
                        stocks_par_zone[zone][prod] += value

        # Ajouter les données
        for zone in sorted(stocks_par_zone.keys()):
            stocks = stocks_par_zone[zone]
            row_data = [zone]
            total = 0
            for prod in produits:
                row_data.append(stocks[prod])
                total += stocks[prod]
            row_data.append(total)
            ws_prod.append(row_data)

        print(f"[OK] Feuille 'Produits par Zone' créée avec {len(stocks_par_zone)} zones")
        print()

        # === FEUILLE 5: TYPOLOGIE PAR ZONE ===
        print("Etape 6: Création de la feuille 'Typologie par Zone'...")
        ws_typo = wb.create_sheet(title="Typologie par Zone")

        headers_typo = ['ZONE', 'TYPOLOGIE', 'NB VISITES', 'NB CLIENTS']
        ws_typo.append(headers_typo)

        # Styliser les en-têtes
        for cell in ws_typo[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        # Collecter les données par typologie
        typo_data = {}
        for row_idx in range(2, ws_data.max_row + 1):
            zone = ws_data.cell(row=row_idx, column=1).value
            typologie = ws_data.cell(row=row_idx, column=12).value  # TYPOLOGIE (col L)
            client = ws_data.cell(row=row_idx, column=11).value

            if zone and typologie:
                key = (zone, typologie)
                if key not in typo_data:
                    typo_data[key] = {
                        'visites': 0,
                        'clients': set()
                    }

                typo_data[key]['visites'] += 1
                if client:
                    typo_data[key]['clients'].add(client)

        # Ajouter les données
        for (zone, typologie) in sorted(typo_data.keys()):
            data = typo_data[(zone, typologie)]
            ws_typo.append([
                zone,
                typologie,
                data['visites'],
                len(data['clients'])
            ])

        print(f"[OK] Feuille 'Typologie par Zone' créée avec {len(typo_data)} combinaisons")
        print()

        # Ajuster la largeur des colonnes pour toutes les feuilles
        print("Etape 7: Ajustement de la largeur des colonnes...")
        for ws in [ws_zone, ws_merc, ws_comm, ws_prod, ws_typo]:
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

        print("[OK] Largeurs des colonnes ajustées")
        print()

        # Sauvegarder le fichier
        print(f"Etape 8: Sauvegarde du fichier dans '{output_path}'...")
        wb.save(output_path)
        print("[OK] Fichier sauvegardé avec succès!")
        print()

        print("=" * 80)
        print("[SUCCES] TABLEAUX CROISES DYNAMIQUES AJOUTES!")
        print("=" * 80)
        print()
        print(f"Fichier de sortie: {output_path}")
        print()
        print("5 nouvelles feuilles créées:")
        print("  1. Récap par Zone - Vue d'ensemble par zone")
        print("  2. Récap par Merchandiser - Activité de chaque merchandiser")
        print("  3. Récap par Commercial - Activité de chaque commercial")
        print("  4. Produits par Zone - Stocks totaux par produit et par zone")
        print("  5. Typologie par Zone - Analyse par typologie de client")
        print()

    except Exception as e:
        print(f"[ERREUR] {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    add_pivot_tables_to_book1()
