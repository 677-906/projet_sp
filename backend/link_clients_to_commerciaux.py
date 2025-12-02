# Script pour lier les clients existants aux commerciaux

from app import models, database
from sqlalchemy.orm import Session
import random

def link_clients():
    db = Session(bind=database.engine)

    try:
        # Récupérer tous les clients
        clients = db.query(models.Client).all()
        print(f"Clients trouves: {len(clients)}")

        # Récupérer tous les commerciaux
        commerciaux = db.query(models.Commercial).all()
        print(f"Commerciaux trouves: {len(commerciaux)}")

        if not commerciaux:
            print("ERREUR: Aucun commercial trouve!")
            return

        linked_count = 0

        for client in clients:
            # Si le client a déjà un commercial_id, on saute
            if client.commercial_id:
                print(f"Client '{client.nom_client}' a deja un commercial (ID={client.commercial_id})")
                continue

            # Assigner un commercial au hasard parmi tous les commerciaux disponibles
            commercial = random.choice(commerciaux)
            client.commercial_id = commercial.id

            # Mettre à jour la zone du client pour qu'elle corresponde à celle du commercial
            chef = db.query(models.ChefZone).filter(models.ChefZone.id == commercial.chef_zone_id).first()
            if chef and chef.zone:
                old_zone = client.zone
                client.zone = chef.zone
                linked_count += 1
                print(f"Client '{client.nom_client}' (Zone: {old_zone} -> {chef.zone}) -> Commercial '{commercial.nom}'")
            else:
                linked_count += 1
                print(f"Client '{client.nom_client}' -> Commercial '{commercial.nom}'")

        db.commit()
        print(f"\n=== {linked_count} clients lies a des commerciaux ===")

        # Afficher le résumé
        print("\n=== Resume des liaisons ===")
        for commercial in commerciaux:
            clients_count = db.query(models.Client).filter(
                models.Client.commercial_id == commercial.id
            ).count()
            chef = db.query(models.ChefZone).filter(models.ChefZone.id == commercial.chef_zone_id).first()
            zone = chef.zone if chef else "N/A"
            print(f"Commercial '{commercial.nom}' (Zone: {zone}) -> {clients_count} client(s)")

    except Exception as e:
        print(f"ERREUR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    link_clients()
