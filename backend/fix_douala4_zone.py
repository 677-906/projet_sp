# Script pour corriger DOUALA4 en DOUALA 4

from app import models, database
from sqlalchemy.orm import Session

def fix_zone_names():
    db = Session(bind=database.engine)

    try:
        # 1. Mettre à jour les chefs de zone
        print("=== Correction des chefs de zone ===")
        chefs = db.query(models.ChefZone).filter(models.ChefZone.zone == 'DOUALA4').all()
        print(f"Chefs de zone trouves avec 'DOUALA4': {len(chefs)}")

        for chef in chefs:
            old_zone = chef.zone
            chef.zone = 'DOUALA 4'
            print(f"  Chef {chef.user.nom if chef.user else 'N/A'}: {old_zone} -> DOUALA 4")

        # 2. Mettre à jour les clients
        print("\n=== Correction des clients ===")
        clients = db.query(models.Client).filter(models.Client.zone == 'DOUALA4').all()
        print(f"Clients trouves avec 'DOUALA4': {len(clients)}")

        for client in clients:
            old_zone = client.zone
            client.zone = 'DOUALA 4'
            print(f"  Client {client.nom_client}: {old_zone} -> DOUALA 4")

        # 3. Vérifier les commerciaux (ils sont liés aux chefs de zone, donc pas besoin de les modifier directement)
        print("\n=== Verification des commerciaux ===")
        commerciaux_douala4 = db.query(models.Commercial).join(models.ChefZone).filter(
            models.ChefZone.zone == 'DOUALA 4'
        ).all()
        print(f"Commerciaux lies a la zone DOUALA 4: {len(commerciaux_douala4)}")
        for com in commerciaux_douala4:
            print(f"  - {com.nom}")

        db.commit()
        print("\n=== Correction terminee avec succes! ===")

        # Afficher le résumé des zones
        print("\n=== Zones distinctes apres correction ===")
        zones_clients = db.query(models.Client.zone).distinct().filter(models.Client.zone.isnot(None)).all()
        for z in zones_clients:
            if z[0]:
                count = db.query(models.Client).filter(models.Client.zone == z[0]).count()
                print(f"  - {z[0]}: {count} client(s)")

    except Exception as e:
        print(f"ERREUR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_zone_names()
