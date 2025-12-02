# Script pour uniformiser le format de toutes les zones (DOUALA X avec espace)

from app import models, database
from sqlalchemy.orm import Session
import re

def fix_all_zone_formats():
    db = Session(bind=database.engine)

    try:
        print("=== Correction du format de toutes les zones ===")

        # Pattern pour détecter DOUALA suivi d'un chiffre sans espace
        pattern = r'DOUALA(\d+)'

        # 1. Corriger les chefs de zone
        print("\n--- Chefs de zone ---")
        chefs = db.query(models.ChefZone).all()
        for chef in chefs:
            if chef.zone:
                match = re.match(pattern, chef.zone)
                if match:
                    old_zone = chef.zone
                    new_zone = f"DOUALA {match.group(1)}"
                    chef.zone = new_zone
                    print(f"  Chef {chef.user.nom if chef.user else 'N/A'}: {old_zone} -> {new_zone}")

        # 2. Corriger les clients
        print("\n--- Clients ---")
        clients = db.query(models.Client).all()
        for client in clients:
            if client.zone:
                match = re.match(pattern, client.zone)
                if match:
                    old_zone = client.zone
                    new_zone = f"DOUALA {match.group(1)}"
                    client.zone = new_zone
                    print(f"  Client {client.nom_client}: {old_zone} -> {new_zone}")

        # 3. Corriger les noms de commerciaux
        print("\n--- Commerciaux ---")
        commerciaux = db.query(models.Commercial).all()
        for commercial in commerciaux:
            if commercial.nom:
                # Remplacer DOUALAX par DOUALA X dans le nom
                new_name = re.sub(pattern, r'DOUALA \1', commercial.nom)
                if new_name != commercial.nom:
                    old_name = commercial.nom
                    commercial.nom = new_name
                    print(f"  {old_name} -> {new_name}")

        db.commit()
        print("\n=== Correction terminee avec succes! ===")

        # Afficher le résumé
        print("\n=== Zones distinctes apres correction ===")
        zones = db.query(models.Client.zone).distinct().filter(models.Client.zone.isnot(None)).all()
        for z in zones:
            if z[0]:
                count = db.query(models.Client).filter(models.Client.zone == z[0]).count()
                print(f"  - {z[0]}: {count} client(s)")

        print("\n=== Chefs de zone par zone ===")
        zones_chefs = db.query(models.ChefZone.zone).distinct().filter(models.ChefZone.zone.isnot(None)).all()
        for z in zones_chefs:
            if z[0]:
                count = db.query(models.ChefZone).filter(models.ChefZone.zone == z[0]).count()
                chefs_names = [c.user.nom for c in db.query(models.ChefZone).filter(models.ChefZone.zone == z[0]).all() if c.user]
                print(f"  - {z[0]}: {', '.join(chefs_names)}")

    except Exception as e:
        print(f"ERREUR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_all_zone_formats()
