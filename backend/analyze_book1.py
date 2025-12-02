"""
Script pour analyser le contenu du fichier Book1.1.xlsx
"""

import sys
import os
from openpyxl import load_workbook

# Configurer l'encodage UTF-8
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def analyze_excel_file():
    """Analyse la structure du fichier Book1.1.xlsx"""

    # Chemin vers le fichier
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Book1.1.xlsx")

    print("=" * 80)
    print("ANALYSE DU FICHIER BOOK1.1.XLSX")
    print("=" * 80)
    print()

    try:
        # Charger le workbook
        wb = load_workbook(file_path, data_only=True)

        print(f"Nombre de feuilles: {len(wb.sheetnames)}")
        print(f"Noms des feuilles: {wb.sheetnames}")
        print()

        # Analyser chaque feuille
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]

            print("=" * 80)
            print(f"FEUILLE: {sheet_name}")
            print("=" * 80)

            # Dimensions
            print(f"Dimensions: {ws.dimensions}")
            print(f"Nombre de lignes: {ws.max_row}")
            print(f"Nombre de colonnes: {ws.max_column}")
            print()

            # Afficher les en-têtes (première ligne)
            if ws.max_row > 0:
                print("En-têtes (première ligne):")
                headers = []
                for col in range(1, min(ws.max_column + 1, 50)):  # Limite à 50 colonnes
                    cell_value = ws.cell(row=1, column=col).value
                    if cell_value:
                        headers.append(f"  Col {col}: {cell_value}")

                for header in headers:
                    print(header)
                print()

            # Afficher quelques lignes de données
            if ws.max_row > 1:
                print(f"Aperçu des données (lignes 2-{min(6, ws.max_row)}):")
                for row_idx in range(2, min(7, ws.max_row + 1)):
                    row_data = []
                    for col_idx in range(1, min(ws.max_column + 1, 10)):  # Limite à 10 premières colonnes
                        cell_value = ws.cell(row=row_idx, column=col_idx).value
                        row_data.append(str(cell_value) if cell_value is not None else "")
                    print(f"  Ligne {row_idx}: {' | '.join(row_data)}")
                print()

            print()

        print("=" * 80)
        print("[SUCCES] ANALYSE TERMINEE!")
        print("=" * 80)

    except Exception as e:
        print(f"[ERREUR] {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    analyze_excel_file()
