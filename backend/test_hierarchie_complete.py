"""
Script de test pour vérifier la hiérarchie complète du système
Teste la création et les relations entre toutes les entités
"""

import sys
import os

# Configurer l'encodage UTF-8
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ajouter le répertoire parent au path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models

def test_hierarchie():
    """Teste la hiérarchie complète: Responsable -> Chef de Zone -> Commercial/Merchandiser -> Clients"""
    db = SessionLocal()

    try:
        print("=" * 80)
        print("TEST DE LA HIERARCHIE COMPLETE DU SYSTEME")
        print("=" * 80)
        print()

        # 1. Vérifier le Responsable "el charif"
        print("1. RESPONSABLE")
        responsable = db.query(models.Responsable).join(models.User).filter(
            models.User.email == "elcharif@sp.com"
        ).first()

        if responsable:
            print(f"   [OK] Responsable: {responsable.user.nom}")
            print(f"       Email: {responsable.user.email}")
            print(f"       Base: {responsable.base}")
            print(f"       Role: {responsable.user.role.nom}")
        else:
            print("   [ERREUR] Responsable el charif introuvable")
            return False
        print()

        # 2. Vérifier le Chef de Zone "Ruth"
        print("2. CHEF DE ZONE")
        chef_zone = db.query(models.ChefZone).join(models.User).filter(
            models.User.email == "ruth@sp.com"
        ).first()

        if chef_zone:
            print(f"   [OK] Chef de Zone: {chef_zone.user.nom}")
            print(f"       Email: {chef_zone.user.email}")
            print(f"       Zone: {chef_zone.zone}")
            print(f"       Role: {chef_zone.user.role.nom}")
            print(f"       Responsable: {chef_zone.responsable.user.nom if chef_zone.responsable else 'AUCUN'}")

            # Vérifier que le chef de zone est bien sous el charif
            if chef_zone.responsable_id == responsable.id:
                print(f"       [OK] Rattachement au responsable el charif: OUI")
            else:
                print(f"       [ERREUR] Chef de zone non rattache a el charif")
                return False
        else:
            print("   [ERREUR] Chef de Zone Ruth introuvable")
            return False
        print()

        # 3. Vérifier les Commerciaux
        print("3. COMMERCIAUX")
        commerciaux = db.query(models.Commercial).filter(
            models.Commercial.chef_zone_id == chef_zone.id
        ).all()

        print(f"   [OK] {len(commerciaux)} commerciaux sous le chef de zone Ruth:")
        for comm in commerciaux:
            nb_clients = db.query(models.Client).filter(
                models.Client.commercial_id == comm.id,
                models.Client.zone == "DOUALA 4"
            ).count()
            print(f"       - {comm.nom}: {nb_clients} clients")
        print()

        # 4. Vérifier le Merchandiser "AYANGMA François"
        print("4. MERCHANDISER")
        merchandiser = db.query(models.Merchandiser).join(models.User).filter(
            models.User.email == "ayangma.francois@sp.com"
        ).first()

        if merchandiser:
            print(f"   [OK] Merchandiser: {merchandiser.user.nom}")
            print(f"       Email: {merchandiser.user.email}")
            print(f"       Role: {merchandiser.user.role.nom}")
            print(f"       Chef de Zone: {merchandiser.chef_zone.user.nom if merchandiser.chef_zone else 'AUCUN'}")

            # Vérifier que le merchandiser est bien sous Ruth
            if merchandiser.chef_zone_id == chef_zone.id:
                print(f"       [OK] Rattachement au chef de zone Ruth: OUI")
            else:
                print(f"       [ERREUR] Merchandiser non rattache a Ruth")
                return False
        else:
            print("   [ERREUR] Merchandiser AYANGMA François introuvable")
            return False
        print()

        # 5. Vérifier les Clients avec leurs Commerciaux
        print("5. CLIENTS")
        total_clients = db.query(models.Client).filter(
            models.Client.zone == "DOUALA 4"
        ).count()

        # Compter les clients avec commercial assigné
        clients_avec_commercial = db.query(models.Client).filter(
            models.Client.zone == "DOUALA 4",
            models.Client.commercial_id.isnot(None)
        ).count()

        print(f"   [OK] Total clients DOUALA 4: {total_clients}")
        print(f"   [OK] Clients avec commercial assigne: {clients_avec_commercial}")

        # Vérifier quelques clients avec leurs commerciaux
        print(f"\n   Exemple de clients avec leurs commerciaux:")
        clients_sample = db.query(models.Client).filter(
            models.Client.zone == "DOUALA 4"
        ).order_by(models.Client.nom_client).limit(5).all()

        for client in clients_sample:
            commercial_nom = client.commercial.nom if client.commercial else 'AUCUN'
            print(f"       - {client.nom_client:30} -> Commercial: {commercial_nom}")
        print()

        # 6. Test de la hiérarchie complète
        print("6. VERIFICATION DE LA HIERARCHIE COMPLETE")
        print(f"   Responsable: {responsable.user.nom}")
        print(f"       |")
        print(f"       +-- Chef de Zone: {chef_zone.user.nom} (Zone: {chef_zone.zone})")
        print(f"           |")
        print(f"           +-- {len(commerciaux)} Commerciaux")
        for comm in commerciaux[:3]:  # Afficher les 3 premiers
            nb = db.query(models.Client).filter(models.Client.commercial_id == comm.id).count()
            print(f"           |   +-- {comm.nom}: {nb} clients")
        if len(commerciaux) > 3:
            print(f"           |   +-- ... et {len(commerciaux)-3} autres")
        print(f"           |")
        print(f"           +-- Merchandiser: {merchandiser.user.nom}")
        print()

        print("=" * 80)
        print("[SUCCES] HIERARCHIE COMPLETE ET COHERENTE!")
        print("=" * 80)
        return True

    except Exception as e:
        print(f"\n[ERREUR] {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = test_hierarchie()
    sys.exit(0 if success else 1)
