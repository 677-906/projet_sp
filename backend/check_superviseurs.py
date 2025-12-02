# Script pour vérifier les superviseurs dans la base de données
# Usage: python -m backend.check_superviseurs

from backend.app import models
from backend.app.database import SessionLocal

def check_superviseurs():
    """Vérifie tous les superviseurs et chefs de zone dans la base de données."""
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("VERIFICATION DES SUPERVISEURS GMS")
        print("="*60 + "\n")

        # Récupérer tous les chefs de zone
        all_chefs = db.query(models.ChefZone).all()
        print(f"Total de Chefs de Zone dans la base: {len(all_chefs)}\n")

        if len(all_chefs) == 0:
            print("[ATTENTION] Aucun Chef de Zone trouve dans la base de donnees!")
            return

        # Afficher tous les chefs de zone
        print("Liste de tous les Chefs de Zone:")
        print("-" * 60)
        for chef in all_chefs:
            user_nom = chef.user.nom if chef.user else "N/A"
            zone = chef.zone if chef.zone else "Aucune zone"
            est_superviseur = "OUI" if chef.est_superviseur else "NON"
            print(f"ID: {chef.id} | Nom: {user_nom} | Zone: {zone} | Superviseur: {est_superviseur}")

        print("\n" + "="*60)

        # Récupérer seulement les superviseurs
        superviseurs = db.query(models.ChefZone).filter(
            models.ChefZone.est_superviseur == True
        ).all()

        print(f"Total de Superviseurs GMS: {len(superviseurs)}\n")

        if len(superviseurs) == 0:
            print("[PROBLEME] Aucun superviseur GMS trouve!")
            print("\nSOLUTION: Vous devez marquer au moins un Chef de Zone comme superviseur.")
            print("Executez: python -m backend.set_superviseur <chef_zone_id>")
        else:
            print("Liste des Superviseurs GMS:")
            print("-" * 60)
            for sup in superviseurs:
                user_nom = sup.user.nom if sup.user else "N/A"
                zone = sup.zone if sup.zone else "Aucune zone"
                print(f"ID: {sup.id} | Nom: {user_nom} | Zone: {zone}")

        # Vérifier les zones uniques
        print("\n" + "="*60)
        zones_query = db.query(models.ChefZone.zone).distinct().filter(
            models.ChefZone.zone.isnot(None)
        ).all()
        zones = [z[0] for z in zones_query if z[0]]

        print(f"Zones existantes: {len(zones)}")
        print("-" * 60)
        for zone in sorted(zones):
            # Compter les superviseurs par zone
            nb_superviseurs = db.query(models.ChefZone).filter(
                models.ChefZone.zone == zone,
                models.ChefZone.est_superviseur == True
            ).count()
            status = "[OK]" if nb_superviseurs > 0 else "[MANQUANT]"
            print(f"{status} Zone: {zone} - {nb_superviseurs} superviseur(s)")

        print("="*60 + "\n")

    finally:
        db.close()

if __name__ == "__main__":
    check_superviseurs()
