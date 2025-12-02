# Script pour corriger les noms des commerciaux contenant DOUALA4

from app import models, database
from sqlalchemy.orm import Session

def fix_commercial_names():
    db = Session(bind=database.engine)

    try:
        print("=== Correction des noms de commerciaux ===")

        # Récupérer tous les commerciaux avec DOUALA4 dans leur nom
        commerciaux = db.query(models.Commercial).filter(
            models.Commercial.nom.like('%DOUALA4%')
        ).all()

        print(f"Commerciaux trouves avec 'DOUALA4': {len(commerciaux)}")

        for commercial in commerciaux:
            old_name = commercial.nom
            new_name = old_name.replace('DOUALA4', 'DOUALA 4')
            commercial.nom = new_name
            print(f"  {old_name} -> {new_name}")

        db.commit()
        print("\n=== Correction terminee avec succes! ===")

        # Afficher tous les commerciaux de la zone DOUALA 4
        print("\n=== Commerciaux de la zone DOUALA 4 ===")
        commerciaux_douala4 = db.query(models.Commercial).join(models.ChefZone).filter(
            models.ChefZone.zone == 'DOUALA 4'
        ).all()

        for com in commerciaux_douala4:
            clients_count = db.query(models.Client).filter(
                models.Client.commercial_id == com.id
            ).count()
            print(f"  - {com.nom}: {clients_count} client(s)")

    except Exception as e:
        print(f"ERREUR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_commercial_names()
