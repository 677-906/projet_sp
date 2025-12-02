"""
Script de migration pour restructurer la base de données selon Book1.1.xlsx
ATTENTION: Ce script modifie la base de données existante
"""
import openpyxl
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
from collections import defaultdict
import sys

def get_or_create_responsable(db: Session, nom: str):
    """Récupère ou crée un Responsable"""
    # Normaliser le nom (supprimer espaces multiples, capitaliser)
    nom_normalized = ' '.join(nom.strip().split()).title()

    # Chercher dans les utilisateurs existants (insensible à la casse)
    user = db.query(models.User).filter(
        models.User.nom.ilike(nom_normalized),
        models.User.role_id == 2
    ).first()

    if user:
        # Vérifier s'il a un profil Responsable
        responsable = db.query(models.Responsable).filter(models.Responsable.user_id == user.id).first()
        if responsable:
            return responsable
        else:
            # Créer le profil Responsable
            responsable = models.Responsable(user_id=user.id, base="Multi-zones")
            db.add(responsable)
            db.commit()
            db.refresh(responsable)
            return responsable
    else:
        # Créer un nouvel utilisateur + profil Responsable
        new_user = models.User(
            nom=nom_normalized,
            email=f"{nom_normalized.lower().replace(' ', '_')}@sp.com",
            password_hash="$2b$12$defaulthash",  # Hash par défaut
            role_id=2  # Responsable
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        responsable = models.Responsable(user_id=new_user.id, base="Multi-zones")
        db.add(responsable)
        db.commit()
        db.refresh(responsable)
        print(f"  [CREE] Responsable: {nom_normalized}")
        return responsable

def get_or_create_chef_zone(db: Session, nom: str, zone: str, responsable_id: int):
    """Récupère ou crée un Chef de Zone"""
    # Normaliser le nom
    nom_normalized = ' '.join(nom.strip().split()).title()

    # Chercher dans les utilisateurs existants (insensible à la casse)
    user = db.query(models.User).filter(
        models.User.nom.ilike(nom_normalized),
        models.User.role_id == 3
    ).first()

    if user:
        # Vérifier s'il a un profil ChefZone
        chef = db.query(models.ChefZone).filter(models.ChefZone.user_id == user.id).first()
        if chef:
            # Mettre à jour le responsable si nécessaire
            if chef.responsable_id != responsable_id:
                chef.responsable_id = responsable_id
                db.commit()
            return chef
        else:
            # Créer le profil ChefZone
            chef = models.ChefZone(
                user_id=user.id,
                zone=zone,
                responsable_id=responsable_id
            )
            db.add(chef)
            db.commit()
            db.refresh(chef)
            return chef
    else:
        # Créer un nouvel utilisateur + profil ChefZone
        new_user = models.User(
            nom=nom_normalized,
            email=f"{nom_normalized.lower().replace(' ', '_')}@sp.com",
            password_hash="$2b$12$defaulthash",
            role_id=3  # Chef de Zone
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        chef = models.ChefZone(
            user_id=new_user.id,
            zone=zone,
            responsable_id=responsable_id
        )
        db.add(chef)
        db.commit()
        db.refresh(chef)
        print(f"  [CREE] Chef de Zone: {nom_normalized} (Zone: {zone})")
        return chef

def get_or_create_merchandiser(db: Session, nom: str, zone: str, chef_zone_id: int):
    """Récupère ou crée un Merchandiser"""
    # Normaliser le nom
    nom_normalized = ' '.join(nom.strip().split()).title()

    # Chercher dans les utilisateurs existants (insensible à la casse)
    user = db.query(models.User).filter(
        models.User.nom.ilike(nom_normalized),
        models.User.role_id == 4
    ).first()

    if user:
        # Vérifier s'il a un profil Merchandiser
        merchandiser = db.query(models.Merchandiser).filter(models.Merchandiser.user_id == user.id).first()
        if merchandiser:
            # Mettre à jour le chef de zone si nécessaire
            if merchandiser.chef_zone_id != chef_zone_id:
                merchandiser.chef_zone_id = chef_zone_id
                db.commit()
            return merchandiser
        else:
            # Créer le profil Merchandiser
            merchandiser = models.Merchandiser(
                user_id=user.id,
                chef_zone_id=chef_zone_id
            )
            db.add(merchandiser)
            db.commit()
            db.refresh(merchandiser)
            return merchandiser
    else:
        # Créer un nouvel utilisateur + profil Merchandiser
        new_user = models.User(
            nom=nom_normalized,
            email=f"{nom_normalized.lower().replace(' ', '_')}@sp.com",
            password_hash="$2b$12$defaulthash",
            role_id=4  # Merchandiser
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        merchandiser = models.Merchandiser(
            user_id=new_user.id,
            chef_zone_id=chef_zone_id
        )
        db.add(merchandiser)
        db.commit()
        db.refresh(merchandiser)
        print(f"  [CREE] Merchandiser: {nom_normalized} (Zone: {zone})")
        return merchandiser

def get_or_create_commercial(db: Session, nom: str, chef_zone_id: int):
    """Récupère ou crée un Commercial"""
    # Normaliser le nom (première lettre en majuscule)
    nom_normalized = nom.strip().capitalize()

    # Chercher le commercial existant pour ce chef de zone
    commercial = db.query(models.Commercial).filter(
        models.Commercial.nom == nom_normalized,
        models.Commercial.chef_zone_id == chef_zone_id
    ).first()

    if commercial:
        return commercial
    else:
        # Créer un nouveau commercial
        commercial = models.Commercial(
            nom=nom_normalized,
            contact="",
            chef_zone_id=chef_zone_id
        )
        db.add(commercial)
        db.commit()
        db.refresh(commercial)
        print(f"  [CREE] Commercial: {nom_normalized}")
        return commercial

def update_client_commercial(db: Session, client_nom: str, zone: str, commercial_id: int):
    """Met à jour le commercial d'un client"""
    client = db.query(models.Client).filter(
        models.Client.nom_client == client_nom,
        models.Client.zone == zone
    ).first()

    if client:
        if client.commercial_id != commercial_id:
            client.commercial_id = commercial_id
            db.commit()
    return client

def migrate_from_book1():
    """Migre les données de Book1.1.xlsx vers la base de données"""

    print("=" * 100)
    print("MIGRATION DES DONNEES DEPUIS BOOK1.1.XLSX")
    print("=" * 100)

    # Charger le fichier Excel
    wb = openpyxl.load_workbook('../Book1.1.xlsx')
    ws = wb.active

    db = SessionLocal()

    try:
        # Structures pour éviter les doublons
        responsables_map = {}  # nom -> responsable_id
        chefs_map = {}  # (nom, zone) -> chef_id
        merchandisers_map = {}  # (nom, zone) -> merchandiser_id
        commerciaux_map = {}  # (nom, chef_id) -> commercial_id

        # Collections pour les statistiques
        responsable_chef_relations = defaultdict(set)

        print("\n[ETAPE 1] Extraction des relations uniques...")

        # Premier passage: collecter toutes les relations
        relations = []
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            zone = row[0]
            merchandiser = row[1]
            responsable = row[4]
            chef = row[5]
            commercial = row[8]
            client = row[10]

            if not zone or not merchandiser:
                continue

            relations.append({
                'zone': zone,
                'merchandiser': merchandiser,
                'responsable': responsable,
                'chef': chef,
                'commercial': commercial,
                'client': client
            })

        print(f"  Total de {len(relations)} lignes extraites")

        # Deuxième passage: créer/mettre à jour les entités
        print("\n[ETAPE 2] Creation/Mise a jour des Responsables...")

        for rel in relations:
            if rel['responsable'] and rel['responsable'] not in responsables_map:
                resp = get_or_create_responsable(db, rel['responsable'])
                responsables_map[rel['responsable']] = resp.id

        print(f"  Total: {len(responsables_map)} responsables")

        print("\n[ETAPE 3] Creation/Mise a jour des Chefs de Zone...")

        # Stratégie: pour chaque chef, trouver le responsable le plus fréquent
        chef_responsable_votes = defaultdict(lambda: defaultdict(int))

        for rel in relations:
            if rel['chef'] and rel['responsable']:
                chef_responsable_votes[rel['chef']][rel['responsable']] += 1

        # Assigner chaque chef au responsable majoritaire
        chef_to_responsable = {}
        for chef, votes in chef_responsable_votes.items():
            best_resp = max(votes.items(), key=lambda x: x[1])[0]
            chef_to_responsable[chef] = best_resp

        # Créer les chefs avec leur zone principale
        chef_zones = defaultdict(lambda: defaultdict(int))
        for rel in relations:
            if rel['chef'] and rel['zone']:
                chef_zones[rel['chef']][rel['zone']] += 1

        for chef, zones in chef_zones.items():
            primary_zone = max(zones.items(), key=lambda x: x[1])[0]
            responsable_nom = chef_to_responsable.get(chef)

            if responsable_nom:
                responsable_id = responsables_map[responsable_nom]
                key = (chef, primary_zone)

                if key not in chefs_map:
                    chef_obj = get_or_create_chef_zone(db, chef, primary_zone, responsable_id)
                    chefs_map[key] = chef_obj.id
                    # Aussi créer une entrée sans la zone pour faciliter la recherche
                    if chef not in chefs_map:
                        chefs_map[chef] = chef_obj.id

        print(f"  Total: {len(chefs_map)} chefs de zone")

        print("\n[ETAPE 4] Creation/Mise a jour des Merchandisers...")

        # Pour chaque merchandiser, trouver son chef principal (le plus fréquent)
        merchandiser_chef_votes = defaultdict(lambda: defaultdict(int))

        for rel in relations:
            if rel['merchandiser'] and rel['chef']:
                merchandiser_chef_votes[rel['merchandiser']][rel['chef']] += 1

        for merchandiser, votes in merchandiser_chef_votes.items():
            best_chef = max(votes.items(), key=lambda x: x[1])[0]

            # Trouver la zone principale de ce merchandiser
            merch_zones = defaultdict(int)
            for rel in relations:
                if rel['merchandiser'] == merchandiser:
                    merch_zones[rel['zone']] += 1

            primary_zone = max(merch_zones.items(), key=lambda x: x[1])[0]

            # Récupérer le chef_zone_id
            chef_id = chefs_map.get(best_chef) or chefs_map.get((best_chef, primary_zone))

            if chef_id:
                key = (merchandiser, primary_zone)
                if key not in merchandisers_map:
                    merch_obj = get_or_create_merchandiser(db, merchandiser, primary_zone, chef_id)
                    merchandisers_map[key] = merch_obj.id

        print(f"  Total: {len(merchandisers_map)} merchandisers")

        print("\n[ETAPE 5] Creation/Mise a jour des Commerciaux...")

        # Pour chaque commercial, trouver son chef principal
        commercial_chef_votes = defaultdict(lambda: defaultdict(int))

        for rel in relations:
            if rel['commercial'] and rel['chef']:
                commercial_chef_votes[rel['commercial']][rel['chef']] += 1

        for commercial, votes in commercial_chef_votes.items():
            best_chef = max(votes.items(), key=lambda x: x[1])[0]
            chef_id = chefs_map.get(best_chef)

            if chef_id:
                key = (commercial, chef_id)
                if key not in commerciaux_map:
                    comm_obj = get_or_create_commercial(db, commercial, chef_id)
                    commerciaux_map[key] = comm_obj.id

        print(f"  Total: {len(commerciaux_map)} commerciaux")

        print("\n[ETAPE 6] Mise a jour des clients avec leurs commerciaux...")

        clients_updated = 0
        for rel in relations:
            if rel['commercial'] and rel['chef'] and rel['client']:
                chef_id = chefs_map.get(rel['chef'])
                if chef_id:
                    key = (rel['commercial'], chef_id)
                    commercial_id = commerciaux_map.get(key)

                    if commercial_id:
                        client = update_client_commercial(db, rel['client'], rel['zone'], commercial_id)
                        if client:
                            clients_updated += 1

        print(f"  Total: {clients_updated} clients mis a jour")

        print("\n[ETAPE 7] Verification de la structure...")

        # Vérifier la structure finale
        total_chefs = db.query(models.ChefZone).count()
        total_merchandisers = db.query(models.Merchandiser).count()
        total_commerciaux = db.query(models.Commercial).count()

        print(f"  Chefs de zone dans la DB: {total_chefs}")
        print(f"  Merchandisers dans la DB: {total_merchandisers}")
        print(f"  Commerciaux dans la DB: {total_commerciaux}")

        # Vérifier la distribution des merchandisers
        print("\n[DISTRIBUTION DES MERCHANDISERS PAR CHEF]")
        chefs = db.query(models.ChefZone).all()
        for chef in chefs:
            merch_count = db.query(models.Merchandiser).filter(
                models.Merchandiser.chef_zone_id == chef.id
            ).count()
            user = db.query(models.User).filter(models.User.id == chef.user_id).first()
            print(f"  {user.nom}: {merch_count} merchandiser(s)")

        print("\n" + "=" * 100)
        print("MIGRATION TERMINEE AVEC SUCCES!")
        print("=" * 100)

    except Exception as e:
        print(f"\nERREUR lors de la migration: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("\nATTENTION: Ce script va modifier la base de donnees existante.")
    print("Il va reorganiser les relations hierarchiques selon Book1.1.xlsx")

    response = input("\nVoulez-vous continuer? (oui/non): ")

    if response.lower() in ['oui', 'o', 'yes', 'y']:
        migrate_from_book1()
    else:
        print("Migration annulee.")
