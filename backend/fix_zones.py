# Script pour nettoyer les espaces dans les noms de zones
# Usage: python -m backend.fix_zones

from backend.app import models
from backend.app.database import SessionLocal

def fix_zones():
    """Nettoie tous les espaces en début et fin de nom de zone."""
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("NETTOYAGE DES ZONES")
        print("="*60 + "\n")

        # 1. Nettoyer les zones dans ChefZone
        chefs_zone = db.query(models.ChefZone).all()
        chefs_updated = 0

        print("Nettoyage des zones des Chefs de Zone...")
        print("-" * 60)
        for chef in chefs_zone:
            if chef.zone:
                zone_avant = chef.zone
                zone_apres = chef.zone.strip()
                if zone_avant != zone_apres:
                    print(f"Chef {chef.user.nom if chef.user else 'N/A'}:")
                    print(f"  Avant: '{zone_avant}'")
                    print(f"  Apres: '{zone_apres}'")
                    chef.zone = zone_apres
                    chefs_updated += 1

        # 2. Nettoyer les zones dans Client
        clients = db.query(models.Client).all()
        clients_updated = 0

        print("\nNettoyage des zones des Clients...")
        print("-" * 60)
        for client in clients:
            if client.zone:
                zone_avant = client.zone
                zone_apres = client.zone.strip()
                if zone_avant != zone_apres:
                    print(f"Client {client.nom_client}:")
                    print(f"  Avant: '{zone_avant}'")
                    print(f"  Apres: '{zone_apres}'")
                    client.zone = zone_apres
                    clients_updated += 1

        # Sauvegarder les modifications
        if chefs_updated > 0 or clients_updated > 0:
            db.commit()
            print("\n" + "="*60)
            print("RESULTATS:")
            print(f"  - {chefs_updated} Chef(s) de Zone mis a jour")
            print(f"  - {clients_updated} Client(s) mis a jour")
            print("="*60 + "\n")
            print("[OK] Nettoyage termine avec succes!")
        else:
            print("\n[INFO] Aucune zone a nettoyer. Tout est deja correct!")

        print("="*60 + "\n")

    except Exception as e:
        print(f"\n[ERREUR] Une erreur est survenue: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_zones()
