"""
Script d'importation des données du merchandiser AYANGMA François
Zone: DOUALA 4
Commercial: el charif / Ruth
"""

import sys
import os
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
    """Crée la hiérarchie: Responsable -> Chef de Zone -> Merchandiser"""
    db = SessionLocal()

    try:
        # 1. Vérifier/Créer le Responsable
        responsable_user = db.query(models.User).filter(models.User.email == "responsable.douala@sp.com").first()

        if not responsable_user:
            responsable_user = models.User(
                nom="Responsable DOUALA",
                email="responsable.douala@sp.com",
                password_hash=security.get_password_hash("resp123"),
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
            # Si l'utilisateur existe, vérifier son profil
            responsable_profile = responsable_user.responsable_profile
            if not responsable_profile:
                # Créer le profil s'il n'existe pas
                responsable_profile = models.Responsable(
                    user_id=responsable_user.id,
                    base="DOUALA"
                )
                db.add(responsable_profile)
                db.flush()
                print(f"[OK] Profil Responsable cree pour: {responsable_user.nom}")
            else:
                print(f"[EXIST] Responsable deja existant: {responsable_user.nom}")

        # 2. Vérifier/Créer le Chef de Zone
        chef_zone_user = db.query(models.User).filter(models.User.email == "elcharif@sp.com").first()

        if not chef_zone_user:
            chef_zone_user = models.User(
                nom="el charif",
                email="elcharif@sp.com",
                password_hash=security.get_password_hash("chef123"),
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
            # Si l'utilisateur existe, vérifier son profil
            chef_zone_profile = chef_zone_user.chef_zone_profile
            if not chef_zone_profile:
                # Créer le profil s'il n'existe pas
                chef_zone_profile = models.ChefZone(
                    user_id=chef_zone_user.id,
                    responsable_id=responsable_profile.id,
                    zone="DOUALA 4"
                )
                db.add(chef_zone_profile)
                db.flush()
                print(f"[OK] Profil Chef de Zone cree pour: {chef_zone_user.nom}")
            else:
                print(f"[EXIST] Chef de Zone deja existant: {chef_zone_user.nom}")

        # 3. Vérifier/Créer le Commercial
        commercial = db.query(models.Commercial).filter(
            models.Commercial.nom == "Ruth",
            models.Commercial.chef_zone_id == chef_zone_profile.id
        ).first()

        if not commercial:
            commercial = models.Commercial(
                nom="Ruth",
                contact="698539444",
                chef_zone_id=chef_zone_profile.id
            )
            db.add(commercial)
            db.flush()
            print(f"[OK] Commercial cree: Ruth")
        else:
            print(f"[EXIST] Commercial deja existant: Ruth")

        # 4. Vérifier/Créer le Merchandiser AYANGMA François
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
            print(f"[OK] Merchandiser cree: AYANGMA Francois")
        else:
            # Si l'utilisateur existe, vérifier son profil
            merchandiser_profile = merchandiser_user.merchandiser_profile
            if not merchandiser_profile:
                # Créer le profil s'il n'existe pas
                merchandiser_profile = models.Merchandiser(
                    user_id=merchandiser_user.id,
                    chef_zone_id=chef_zone_profile.id
                )
                db.add(merchandiser_profile)
                db.flush()
                print(f"[OK] Profil Merchandiser cree pour: AYANGMA Francois")
            else:
                print(f"[EXIST] Merchandiser deja existant: AYANGMA Francois")

        db.commit()

        return {
            'chef_zone_id': chef_zone_profile.id,
            'commercial_id': commercial.id,
            'merchandiser_id': merchandiser_profile.id,
            'merchandiser_user_id': merchandiser_user.id
        }

    except Exception as e:
        db.rollback()
        print(f"[ERREUR] Creation hierarchie: {e}")
        raise
    finally:
        db.close()


def create_clients(chef_zone_id, commercial_id):
    """Crée tous les clients de la zone DOUALA 4"""
    db = SessionLocal()

    clients_data = [
        {"nom": "KABILA NDOBO", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "NDOBO MINISTERE SOYA", "contact": "698539444"},
        {"nom": "KVS SARL", "typologie": "SUPERETTES", "localisation": "BONABERI", "lieu_dit": "MARCHE GRAND BAOBAB", "contact": "695530480"},
        {"nom": "PLENITUDE SARL", "typologie": "SUPERETTES", "localisation": "BONABERI", "lieu_dit": "MINISTERE DU SOYA", "contact": "674610822"},
        {"nom": "SUPERETTE SIAKA", "typologie": "SUPERETTES", "localisation": "BONABERI", "lieu_dit": "BESSEKE", "contact": "677832589"},
        {"nom": "SODISPAR SARL", "typologie": "SUPERETTES", "localisation": "BONABERI", "lieu_dit": "CARREFOUR CENTRE CAISSE", "contact": "691386556"},
        {"nom": "sao market beedi", "typologie": "SUPERETTES", "localisation": "BEEDI", "lieu_dit": "EN FACE PB MALANGUE", "contact": "696593247"},
        {"nom": "STE BAO GAME SARL", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "CARREFOUR MUTZIG", "contact": "690621809"},
        {"nom": "PLANET STORE", "typologie": "1/2 GROSSISTE", "localisation": "BONABERI", "lieu_dit": "BONENDALLE ABATTOIR", "contact": "698528750"},
        {"nom": "MR MOTUBA MAWUSE", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "BONENDALLE", "contact": "652243493"},
        {"nom": "BOULANGERIE SAWA", "typologie": "SUPERETTES", "localisation": "BONABERI", "lieu_dit": "BONAMBAPPE", "contact": "694401124"},
        {"nom": "ETS FEDA", "typologie": "1/2 GROSSISTE", "localisation": "BONABERI", "lieu_dit": "CENTRE CAISSE", "contact": "691202507"},
        {"nom": "NGO ANICET FON", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "CENTRE CAISSE FACE EGLISE EEC", "contact": "675531921"},
        {"nom": "SOCIETE SAINTE REBECCA SARL", "typologie": "SUPERETTES", "localisation": "BONABERI", "lieu_dit": "CARREFOUR MUTZIG", "contact": "651282036"},
        {"nom": "YAMDJEU JESSY", "typologie": "1/2 GROSSISTE", "localisation": "BONABERI", "lieu_dit": "DERRIERE CHATEAUX", "contact": "675830364"},
        {"nom": "ABAO", "typologie": "1/2 GROSSISTE", "localisation": "BONABERI", "lieu_dit": "FACE AFRIQUE GAZ", "contact": "697768472"},
        {"nom": "HELEN NGEH", "typologie": "1/2 GROSSISTE", "localisation": "BONABERI", "lieu_dit": "FACE SANTA LUCIA", "contact": "670292937"},
        {"nom": "AMINA GARE ROUTIER", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "GARE ROUTIERE", "contact": "697137192"},
        {"nom": "LANDA BAR", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "GARAGE SP", "contact": "677692199"},
        {"nom": "MME DISSAKE", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "RAIL", "contact": "681980575"},
        {"nom": "MIEGUIM PIERRE", "typologie": "1/2 GROSSISTE", "localisation": "BONABERI", "lieu_dit": "AVANT RAIL ENTREE PMUC", "contact": "699030315"},
        {"nom": "JOLIANNETTE SARL", "typologie": "SUPERETTES", "localisation": "BONABERI", "lieu_dit": "APRES LYCEE POLYVALENT DE BONABERI", "contact": "696685071"},
        {"nom": "ELVIS DOLLAR", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "PÉAGE TIKO", "contact": "671467422"},
        {"nom": "MR ASOEGWE CLETUS", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "AVANT PONT MOUNGO", "contact": "677629437"},
        {"nom": "ETS PERFORMANCES", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "MABANDA PONT DU BOIS", "contact": "675686878"},
        {"nom": "MME NGEM NDEH", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "MABANDA WAMBA", "contact": "654147400"},
        {"nom": "BOULANGERIE EXCLUSIVE", "typologie": "SUPERETTES", "localisation": "BONABERI", "lieu_dit": "MARCHE MABANDA", "contact": "658874891"},
        {"nom": "PETIT PRIX", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "MARCHE MABANDA", "contact": "677322816"},
        {"nom": "PLANET STORE MABANDA", "typologie": "1/2 GROSSISTE", "localisation": "BONABERI", "lieu_dit": "MARCHE MABANDA", "contact": "671457190"},
        {"nom": "ETS GLOBAL L&E", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "FACE CARREFOUR MARKET", "contact": "672514993"},
        {"nom": "TAMOLA MICHEL", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "MABANDA GENDARMERIE", "contact": "690361483"},
        {"nom": "ANGELA CITY", "typologie": "RESTAURANTS", "localisation": "BESSEKE", "lieu_dit": "TROPICANA", "contact": "696841441"},
        {"nom": "DOMINO MABANDA", "typologie": "SUPERETTES", "localisation": "BONABERI", "lieu_dit": "MARCHE MABANDA", "contact": "656183774"},
        {"nom": "EWOH PROSPER MAYARH", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "LYCEE DE MABANDA", "contact": "677796716"},
        {"nom": "FEA ASANG", "typologie": "GROSSISTE", "localisation": "BEKOKO", "lieu_dit": "BABENGA", "contact": "676666630"},
        {"nom": "MAMA BONHEUR", "typologie": "GROSSISTE", "localisation": "BOMONO", "lieu_dit": "APRES STATION BLESSING", "contact": "693256287"},
        {"nom": "SANTANA", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "BOCOM ENTREE ISENBECK", "contact": "675191849"},
        {"nom": "ETS NGUEPI", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "FORET BAR", "contact": "675757106"},
        {"nom": "COLINCE PLANET", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "FORET BAR", "contact": "653636365"},
        {"nom": "ETS STALLOME", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "GRAND HANGARD", "contact": "650692765"},
        {"nom": "JAPONAIS", "typologie": "1/2 GROSSISTE", "localisation": "BONABERI", "lieu_dit": "SANTA LUCIA FACE AFRIQUE GAZ", "contact": "679804655"},
        {"nom": "LEUSSEU ARISTIDE", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "KWASSA KWASSA", "contact": "676327619"},
        {"nom": "STE ARA LTD", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "KWASSA KWASSA", "contact": "679488859"},
        {"nom": "BOULANGERIE DU RAIL", "typologie": "SUPERETTES", "localisation": "BONABERI", "lieu_dit": "RAILS", "contact": "691036685"},
        {"nom": "ETS ANGELES", "typologie": "GROSSISTE", "localisation": "BONABERI", "lieu_dit": "PETIT PONT BESSEKE", "contact": "696841441"},
    ]

    try:
        client_ids = {}
        created_count = 0
        existing_count = 0

        for client_data in clients_data:
            # Vérifier si le client existe déjà
            existing_client = db.query(models.Client).filter(
                models.Client.nom_client == client_data["nom"],
                models.Client.zone == "DOUALA 4"
            ).first()

            if not existing_client:
                client = models.Client(
                    nom_client=client_data["nom"],
                    typologie=client_data["typologie"],
                    localisation=client_data["localisation"],
                    zone="DOUALA 4",
                    lieu_dit=client_data["lieu_dit"],
                    contact=client_data["contact"],
                    commercial_id=commercial_id,
                    commercial_nom="Ruth"  # Legacy field
                )
                db.add(client)
                db.flush()
                client_ids[client_data["nom"]] = client.id
                created_count += 1
            else:
                client_ids[client_data["nom"]] = existing_client.id
                existing_count += 1

        db.commit()
        print(f"[OK] {created_count} clients crees, {existing_count} deja existants pour la zone DOUALA 4")

        return client_ids

    except Exception as e:
        db.rollback()
        print(f"[ERREUR] Creation clients: {e}")
        raise
    finally:
        db.close()


def main():
    print("=" * 80)
    print("IMPORTATION DES DONNEES - MERCHANDISER AYANGMA FRANCOIS")
    print("=" * 80)
    print()

    # 1. Créer la hiérarchie
    print("Etape 1: Creation de la hierarchie utilisateur")
    hierarchy = create_hierarchy()
    print()

    # 2. Créer les clients
    print("Etape 2: Creation des clients")
    client_ids = create_clients(hierarchy['chef_zone_id'], hierarchy['commercial_id'])
    print()

    print("=" * 80)
    print("[SUCCES] IMPORTATION TERMINEE!")
    print("=" * 80)
    print()
    print("IDENTIFIANTS DE CONNEXION:")
    print(f"   Email: ayangma.francois@sp.com")
    print(f"   Mot de passe: ayangma123")
    print()
    print(f"STATISTIQUES:")
    print(f"   - Zone: DOUALA 4")
    print(f"   - Chef de Zone: el charif")
    print(f"   - Commercial: Ruth")
    print(f"   - Clients crees: {len(client_ids)}")
    print()


if __name__ == "__main__":
    main()
