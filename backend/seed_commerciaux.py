# Script pour ajouter des commerciaux de test

from app import models, database
from sqlalchemy.orm import Session

def seed_commerciaux():
    db = Session(bind=database.engine)

    try:
        # Récupérer les chefs de zone
        chefs_zone = db.query(models.ChefZone).all()

        if not chefs_zone:
            print("ERREUR: Aucun chef de zone trouvé!")
            return

        print(f"Chefs de zone trouves: {len(chefs_zone)}")

        # Liste de commerciaux à créer pour chaque zone
        commerciaux_data = [
            {"nom": "Jean KAMDEM", "contact": "+237 677 123 456"},
            {"nom": "Marie NGONO", "contact": "+237 677 234 567"},
            {"nom": "Paul MBARGA", "contact": "+237 677 345 678"},
            {"nom": "Sarah FOUDA", "contact": "+237 677 456 789"},
            {"nom": "Eric NDAM", "contact": "+237 677 567 890"},
        ]

        commerciaux_created = 0

        # Créer des commerciaux pour chaque chef de zone
        for chef in chefs_zone:
            print(f"\nAjout de commerciaux pour {chef.user.nom if chef.user else 'N/A'} - Zone: {chef.zone}")

            # Créer 2-3 commerciaux par zone
            for i, com_data in enumerate(commerciaux_data[:3]):
                # Ajouter suffixe pour différencier les zones
                nom = f"{com_data['nom']} ({chef.zone})"
                contact = com_data['contact']

                # Vérifier si le commercial existe déjà
                existing = db.query(models.Commercial).filter(
                    models.Commercial.nom == nom,
                    models.Commercial.chef_zone_id == chef.id
                ).first()

                if not existing:
                    commercial = models.Commercial(
                        nom=nom,
                        contact=contact,
                        chef_zone_id=chef.id
                    )
                    db.add(commercial)
                    commerciaux_created += 1
                    print(f"  - Cree: {nom}")
                else:
                    print(f"  - Existe deja: {nom}")

        db.commit()
        print(f"\n=== Total: {commerciaux_created} commerciaux crees ===")

        # Afficher tous les commerciaux
        print("\n=== Liste des commerciaux ===")
        all_commerciaux = db.query(models.Commercial).all()
        for com in all_commerciaux:
            chef = db.query(models.ChefZone).filter(models.ChefZone.id == com.chef_zone_id).first()
            zone = chef.zone if chef else "N/A"
            print(f"ID={com.id}, Nom={com.nom}, Zone={zone}, Contact={com.contact}")

    except Exception as e:
        print(f"ERREUR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_commerciaux()
