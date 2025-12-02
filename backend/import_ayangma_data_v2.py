"""
Script d'importation CORRIGÉ des données du merchandiser AYANGMA François
Zone: DOUALA 4
Hiérarchie correcte:
  - Responsable: el charif
  - Chef de Zone: Ruth
  - Commerciaux: Chantal, Evans, Josepha, Dief, Valerie, Nelly
  - Merchandiser: AYANGMA François
"""

import sys
import os
import json
from datetime import datetime, date

# Configurer l'encodage UTF-8 pour la sortie console
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ajouter le répertoire parent au path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app import models, security

def create_hierarchy():
    """Crée la hiérarchie correcte: Responsable (el charif) -> Chef de Zone (Ruth) -> Merchandiser (AYANGMA)"""
    db = SessionLocal()

    try:
        # 1. Vérifier/Créer le Responsable "el charif"
        responsable_user = db.query(models.User).filter(models.User.email == "elcharif@sp.com").first()

        if not responsable_user:
            responsable_user = models.User(
                nom="el charif",
                email="elcharif@sp.com",
                password_hash=security.get_password_hash("elcharif123"),
                is_active=True,
                role_id=2  # Responsable
            )
            db.add(responsable_user)
            db.flush()

            responsable_profile = models.Responsable(
                user_id=responsable_user.id,
                base="DOUALA"
            )
            db.add(responsable_profile)
            db.flush()
            print(f"[OK] Responsable cree: {responsable_user.nom}")
        else:
            # Si l'utilisateur existe, vérifier/créer son profil
            responsable_profile = responsable_user.responsable_profile
            if not responsable_profile:
                responsable_profile = models.Responsable(
                    user_id=responsable_user.id,
                    base="DOUALA"
                )
                db.add(responsable_profile)
                db.flush()
                print(f"[OK] Profil Responsable cree pour: {responsable_user.nom}")
            else:
                print(f"[EXIST] Responsable deja existant: {responsable_user.nom}")

        # 2. Vérifier/Créer le Chef de Zone "Ruth"
        chef_zone_user = db.query(models.User).filter(models.User.email == "ruth@sp.com").first()

        if not chef_zone_user:
            chef_zone_user = models.User(
                nom="Ruth",
                email="ruth@sp.com",
                password_hash=security.get_password_hash("ruth123"),
                is_active=True,
                role_id=3  # Chef de Zone
            )
            db.add(chef_zone_user)
            db.flush()

            chef_zone_profile = models.ChefZone(
                user_id=chef_zone_user.id,
                responsable_id=responsable_profile.id,
                zone="DOUALA 4"
            )
            db.add(chef_zone_profile)
            db.flush()
            print(f"[OK] Chef de Zone cree: {chef_zone_user.nom} (Zone: DOUALA 4)")
        else:
            # Si l'utilisateur existe, vérifier/créer son profil
            chef_zone_profile = chef_zone_user.chef_zone_profile
            if not chef_zone_profile:
                chef_zone_profile = models.ChefZone(
                    user_id=chef_zone_user.id,
                    responsable_id=responsable_profile.id,
                    zone="DOUALA 4"
                )
                db.add(chef_zone_profile)
                db.flush()
                print(f"[OK] Profil Chef de Zone cree pour: {chef_zone_user.nom}")
            else:
                # Vérifier que le chef de zone est bien sous le bon responsable
                if chef_zone_profile.responsable_id != responsable_profile.id:
                    chef_zone_profile.responsable_id = responsable_profile.id
                    print(f"[UPDATE] Chef de Zone rattache au responsable el charif")
                print(f"[EXIST] Chef de Zone deja existant: {chef_zone_user.nom}")

        # 3. Vérifier/Créer le Merchandiser AYANGMA François
        merchandiser_user = db.query(models.User).filter(models.User.email == "ayangma.francois@sp.com").first()

        if not merchandiser_user:
            merchandiser_user = models.User(
                nom="AYANGMA François",
                email="ayangma.francois@sp.com",
                password_hash=security.get_password_hash("ayangma123"),
                is_active=True,
                role_id=4  # Merchandiser
            )
            db.add(merchandiser_user)
            db.flush()

            merchandiser_profile = models.Merchandiser(
                user_id=merchandiser_user.id,
                chef_zone_id=chef_zone_profile.id
            )
            db.add(merchandiser_profile)
            db.flush()
            print(f"[OK] Merchandiser cree: AYANGMA François")
        else:
            # Si l'utilisateur existe, vérifier/créer son profil
            merchandiser_profile = merchandiser_user.merchandiser_profile
            if not merchandiser_profile:
                merchandiser_profile = models.Merchandiser(
                    user_id=merchandiser_user.id,
                    chef_zone_id=chef_zone_profile.id
                )
                db.add(merchandiser_profile)
                db.flush()
                print(f"[OK] Profil Merchandiser cree pour: AYANGMA François")
            else:
                # Vérifier que le merchandiser est bien sous le bon chef de zone
                if merchandiser_profile.chef_zone_id != chef_zone_profile.id:
                    merchandiser_profile.chef_zone_id = chef_zone_profile.id
                    print(f"[UPDATE] Merchandiser rattache au chef de zone Ruth")
                print(f"[EXIST] Merchandiser deja existant: AYANGMA François")

        db.commit()

        return {
            'chef_zone_id': chef_zone_profile.id,
            'merchandiser_id': merchandiser_profile.id,
            'merchandiser_user_id': merchandiser_user.id
        }

    except Exception as e:
        db.rollback()
        print(f"[ERREUR] Creation hierarchie: {e}")
        raise
    finally:
        db.close()


def create_commerciaux(chef_zone_id):
    """Crée les 6 commerciaux sous le chef de zone Ruth"""
    db = SessionLocal()

    commerciaux_noms = ["Chantal", "Evans", "Josepha", "Dief", "Valerie", "Nelly"]

    try:
        commercial_ids = {}
        created_count = 0
        existing_count = 0

        for nom in commerciaux_noms:
            # Vérifier si le commercial existe déjà
            existing_commercial = db.query(models.Commercial).filter(
                models.Commercial.nom == nom,
                models.Commercial.chef_zone_id == chef_zone_id
            ).first()

            if not existing_commercial:
                commercial = models.Commercial(
                    nom=nom,
                    contact="",  # Pas de contact dans les données sources
                    chef_zone_id=chef_zone_id
                )
                db.add(commercial)
                db.flush()
                commercial_ids[nom] = commercial.id
                created_count += 1
            else:
                commercial_ids[nom] = existing_commercial.id
                existing_count += 1

        db.commit()
        print(f"[OK] {created_count} commerciaux crees, {existing_count} deja existants pour la zone DOUALA 4")

        return commercial_ids

    except Exception as e:
        db.rollback()
        print(f"[ERREUR] Creation commerciaux: {e}")
        raise
    finally:
        db.close()


def create_clients(commercial_ids):
    """Crée tous les clients avec le bon commercial assigné"""
    db = SessionLocal()

    # Charger les données depuis le fichier JSON
    json_path = os.path.join(os.path.dirname(__file__), 'clients_ayangma_data.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        clients_by_commercial = json.load(f)

    try:
        client_ids = {}
        created_count = 0
        existing_count = 0
        updated_count = 0

        for commercial_nom, clients_data in clients_by_commercial.items():
            commercial_id = commercial_ids.get(commercial_nom)

            if not commercial_id:
                print(f"[WARNING] Commercial {commercial_nom} introuvable, clients ignorés")
                continue

            for client_data in clients_data:
                # Vérifier si le client existe déjà
                existing_client = db.query(models.Client).filter(
                    models.Client.nom_client == client_data["nom"],
                    models.Client.zone == "DOUALA 4"
                ).first()

                if not existing_client:
                    # Créer le nouveau client
                    client = models.Client(
                        nom_client=client_data["nom"],
                        typologie=client_data["typologie"].strip(),
                        localisation=client_data["localisation"],
                        zone="DOUALA 4",
                        lieu_dit=client_data["lieu_dit"],
                        contact=client_data["contact"],
                        commercial_id=commercial_id,
                        commercial_nom=commercial_nom  # Legacy field
                    )
                    db.add(client)
                    db.flush()
                    client_ids[client_data["nom"]] = client.id
                    created_count += 1
                else:
                    # Mettre à jour le commercial si différent
                    if existing_client.commercial_id != commercial_id:
                        existing_client.commercial_id = commercial_id
                        existing_client.commercial_nom = commercial_nom
                        updated_count += 1

                    client_ids[client_data["nom"]] = existing_client.id
                    existing_count += 1

        db.commit()
        print(f"[OK] {created_count} clients crees, {existing_count} deja existants, {updated_count} mis a jour pour la zone DOUALA 4")

        return client_ids

    except Exception as e:
        db.rollback()
        print(f"[ERREUR] Creation clients: {e}")
        raise
    finally:
        db.close()


def main():
    print("=" * 80)
    print("IMPORTATION CORRIGEE DES DONNEES - MERCHANDISER AYANGMA FRANCOIS")
    print("=" * 80)
    print()

    # 1. Créer la hiérarchie
    print("Etape 1: Creation de la hierarchie utilisateur")
    print("  Responsable: el charif")
    print("  Chef de Zone: Ruth (DOUALA 4)")
    print("  Merchandiser: AYANGMA François")
    hierarchy = create_hierarchy()
    print()

    # 2. Créer les commerciaux
    print("Etape 2: Creation des commerciaux")
    print("  Commerciaux: Chantal, Evans, Josepha, Dief, Valerie, Nelly")
    commercial_ids = create_commerciaux(hierarchy['chef_zone_id'])
    print()

    # 3. Créer les clients
    print("Etape 3: Creation des clients avec assignation correcte aux commerciaux")
    client_ids = create_clients(commercial_ids)
    print()

    print("=" * 80)
    print("[SUCCES] IMPORTATION TERMINEE!")
    print("=" * 80)
    print()
    print("IDENTIFIANTS DE CONNEXION:")
    print(f"   Responsable - Email: elcharif@sp.com, Mot de passe: elcharif123")
    print(f"   Chef de Zone - Email: ruth@sp.com, Mot de passe: ruth123")
    print(f"   Merchandiser - Email: ayangma.francois@sp.com, Mot de passe: ayangma123")
    print()
    print(f"STATISTIQUES:")
    print(f"   - Zone: DOUALA 4")
    print(f"   - Responsable: el charif")
    print(f"   - Chef de Zone: Ruth")
    print(f"   - Commerciaux: {len(commercial_ids)}")
    print(f"   - Clients crees/mis a jour: {len(client_ids)}")
    print()


if __name__ == "__main__":
    main()
