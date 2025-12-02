"""
Script pour analyser la hiérarchie complète dans Book1.1.xlsx
et extraire toutes les relations uniques
"""
import openpyxl
from collections import defaultdict

def analyze_book1_hierarchy():
    """Analyse le fichier Book1.1.xlsx et extrait toutes les hiérarchies"""

    print("=" * 100)
    print("ANALYSE DU FICHIER BOOK1.1.XLSX")
    print("=" * 100)

    wb = openpyxl.load_workbook('../Book1.1.xlsx')
    ws = wb.active

    # Structures pour stocker les relations uniques
    responsables = set()
    zones = defaultdict(set)  # zone -> {responsables}
    chefs_zone = defaultdict(set)  # zone -> {chefs}
    merchandisers = defaultdict(lambda: defaultdict(set))  # zone -> chef -> {merchandisers}
    commerciaux = defaultdict(lambda: defaultdict(set))  # zone -> chef -> {commerciaux}
    clients = defaultdict(lambda: defaultdict(set))  # commercial -> zone -> {clients}

    # Relations pour la hiérarchie complète
    responsable_to_chefs = defaultdict(set)  # responsable -> {chefs}
    chef_to_merchandisers = defaultdict(set)  # chef -> {merchandisers}
    chef_to_commerciaux = defaultdict(set)  # chef -> {commerciaux}
    commercial_to_clients = defaultdict(set)  # commercial -> {clients}

    # Parcourir toutes les lignes (skip header)
    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        zone = row[0]  # ZONE
        merchandiser = row[1]  # MARCHANDISEUR
        responsable = row[4]  # RESPONSABLE
        chef = row[5]  # CHEF DE ZONE
        commercial = row[8]  # COMMERCIAL
        client = row[10]  # NOM CLIENT
        contact = row[9]  # CONTACT

        if not zone or not merchandiser:
            continue

        # Collecter les données
        if responsable:
            responsables.add(responsable)
            zones[zone].add(responsable)
            if chef:
                responsable_to_chefs[responsable].add(chef)

        if chef:
            chefs_zone[zone].add(chef)
            if merchandiser:
                merchandisers[zone][chef].add(merchandiser)
                chef_to_merchandisers[chef].add(merchandiser)
            if commercial:
                commerciaux[zone][chef].add(commercial)
                chef_to_commerciaux[chef].add(commercial)

        if commercial and client:
            clients[commercial][zone].add((client, contact))
            commercial_to_clients[commercial].add((client, contact, zone))

    # Afficher les résultats
    print("\n" + "=" * 100)
    print("RESPONSABLES UNIQUES")
    print("=" * 100)
    for resp in sorted(responsables):
        print(f"  - {resp}")
        chefs = responsable_to_chefs[resp]
        for chef in sorted(chefs):
            print(f"      >> Chef: {chef}")

    print("\n" + "=" * 100)
    print("HIERARCHIE PAR ZONE")
    print("=" * 100)
    for zone in sorted(zones.keys()):
        print(f"\n[ZONE]: {zone}")
        print(f"   Responsable(s): {', '.join(sorted(zones[zone]))}")

        for chef in sorted(chefs_zone[zone]):
            print(f"\n   [CHEF DE ZONE]: {chef}")

            # Merchandisers pour ce chef dans cette zone
            merch_list = sorted(merchandisers[zone][chef])
            if merch_list:
                print(f"      Merchandisers ({len(merch_list)}):")
                for merch in merch_list:
                    print(f"        - {merch}")

            # Commerciaux pour ce chef dans cette zone
            comm_list = sorted(commerciaux[zone][chef])
            if comm_list:
                print(f"      Commerciaux ({len(comm_list)}):")
                for comm in comm_list:
                    # Compter clients pour ce commercial dans cette zone
                    clients_in_zone = len(clients[comm][zone])
                    print(f"        - {comm} ({clients_in_zone} clients)")

    print("\n" + "=" * 100)
    print("RESUME DES RELATIONS")
    print("=" * 100)
    print(f"Total Responsables: {len(responsables)}")
    print(f"Total Zones: {len(zones)}")
    print(f"Total Chefs de Zone: {len(set().union(*chefs_zone.values()))}")
    print(f"Total Merchandisers: {len(set().union(*[set().union(*m.values()) for m in merchandisers.values()]))}")
    print(f"Total Commerciaux: {len(set().union(*[set().union(*c.values()) for c in commerciaux.values()]))}")

    # Compter clients uniques
    all_clients = set()
    for comm in commercial_to_clients:
        for client, contact, zone in commercial_to_clients[comm]:
            all_clients.add((client, zone))
    print(f"Total Clients: {len(all_clients)}")

    print("\n" + "=" * 100)
    print("DETAILS PAR CHEF DE ZONE")
    print("=" * 100)
    for chef in sorted(chef_to_merchandisers.keys()):
        merch_count = len(chef_to_merchandisers[chef])
        comm_count = len(chef_to_commerciaux[chef])

        # Compter clients pour tous les commerciaux de ce chef
        total_clients = 0
        for comm in chef_to_commerciaux[chef]:
            total_clients += len(commercial_to_clients[comm])

        print(f"\n[CHEF]: {chef}")
        print(f"   - {merch_count} merchandiser(s)")
        print(f"   - {comm_count} commercial/commerciaux")
        print(f"   - {total_clients} client(s)")

        # Lister les merchandisers
        for merch in sorted(chef_to_merchandisers[chef]):
            print(f"      >> Merchandiser: {merch}")

    # Retourner les données pour le script de migration
    return {
        'responsables': responsables,
        'zones': zones,
        'chefs_zone': chefs_zone,
        'merchandisers': merchandisers,
        'commerciaux': commerciaux,
        'clients': clients,
        'responsable_to_chefs': responsable_to_chefs,
        'chef_to_merchandisers': chef_to_merchandisers,
        'chef_to_commerciaux': chef_to_commerciaux,
        'commercial_to_clients': commercial_to_clients
    }

if __name__ == "__main__":
    hierarchy_data = analyze_book1_hierarchy()
