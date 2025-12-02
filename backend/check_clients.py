# Script pour verifier les commerciaux des clients
# Usage: python -m backend.check_clients

from backend.app import models
from backend.app.database import SessionLocal

def check_clients():
    """Verifie les informations commerciales des clients."""
    db = SessionLocal()
    try:
        print("\n" + "="*80)
        print("VERIFICATION DES COMMERCIAUX DES CLIENTS")
        print("="*80 + "\n")

        clients = db.query(models.Client).all()

        if not clients:
            print("[INFO] Aucun client trouve dans la base de donnees!")
            return

        print(f"Total clients: {len(clients)}\n")
        print("-" * 80)
        print(f"{'ID':<5} {'Nom Client':<30} {'commercial_id':<15} {'commercial_nom':<20}")
        print("-" * 80)

        clients_sans_commercial_id = 0
        clients_avec_commercial_id = 0

        for client in clients:
            commercial_id_str = str(client.commercial_id) if client.commercial_id else "NULL"
            commercial_nom_str = client.commercial_nom if client.commercial_nom else "NULL"

            if not client.commercial_id:
                clients_sans_commercial_id += 1
            else:
                clients_avec_commercial_id += 1

            print(f"{client.id:<5} {client.nom_client[:28]:<30} {commercial_id_str:<15} {commercial_nom_str:<20}")

        print("-" * 80)
        print(f"\nRESUME:")
        print(f"  Clients avec commercial_id: {clients_avec_commercial_id}")
        print(f"  Clients sans commercial_id (LEGACY): {clients_sans_commercial_id}")

        if clients_sans_commercial_id > 0:
            print("\n[ATTENTION] Certains clients utilisent encore commercial_nom (LEGACY)")
            print("            Il faut migrer vers commercial_id pour afficher les commerciaux!")

        print("\n" + "="*80)
        print("LISTE DES COMMERCIAUX DISPONIBLES")
        print("="*80 + "\n")

        commerciaux = db.query(models.Commercial).all()

        if not commerciaux:
            print("[ATTENTION] Aucun commercial trouve dans la base de donnees!")
        else:
            print(f"Total commerciaux: {len(commerciaux)}\n")
            print("-" * 60)
            print(f"{'ID':<5} {'Nom':<30} {'Chef Zone ID':<15}")
            print("-" * 60)
            for c in commerciaux:
                print(f"{c.id:<5} {c.nom:<30} {c.chef_zone_id}")
            print("-" * 60)

        print("\n")

    finally:
        db.close()

if __name__ == "__main__":
    check_clients()
