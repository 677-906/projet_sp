"""
Script de test pour créer des utilisateurs de chaque rôle
"""

from app.database import SessionLocal
from app import models, schemas, crud

def test_create_users():
    db = SessionLocal()

    try:
        # Récupérer le responsable et chef de zone existants
        responsable = db.query(models.Responsable).first()
        chef_zone = db.query(models.ChefZone).first()

        print("=" * 60)
        print("TEST DE CRÉATION D'UTILISATEURS")
        print("=" * 60)

        # 1. Test création Responsable
        print("\n1. Création d'un Responsable...")
        try:
            user_data = schemas.FullUserCreate(
                nom="Test Responsable",
                email="test.responsable@projet-sp.com",
                password="test123",
                role_nom="Responsable",
                base="YAOUNDE"
            )
            user = crud.create_full_user(db, user_data)
            print(f"✅ Responsable créé: {user.nom} ({user.email})")
        except Exception as e:
            print(f"❌ Erreur: {e}")

        # 2. Test création Chef de Zone
        if responsable:
            print(f"\n2. Création d'un Chef de Zone (sous responsable ID {responsable.id})...")
            try:
                user_data = schemas.FullUserCreate(
                    nom="Test Chef de Zone",
                    email="test.chef@projet-sp.com",
                    password="test123",
                    role_nom="Chef de Zone",
                    zone="YAOUNDE 1",
                    responsable_id=responsable.id
                )
                user = crud.create_full_user(db, user_data)
                print(f"✅ Chef de Zone créé: {user.nom} ({user.email})")
            except Exception as e:
                print(f"❌ Erreur: {e}")
        else:
            print("\n2. ⚠️ Pas de responsable en base, impossible de créer un chef de zone")

        # 3. Test création Merchandiser
        if chef_zone:
            print(f"\n3. Création d'un Merchandiser (sous chef de zone ID {chef_zone.id})...")
            try:
                user_data = schemas.FullUserCreate(
                    nom="Test Merchandiser",
                    email="test.merchandiser@projet-sp.com",
                    password="test123",
                    role_nom="Merchandiser",
                    chef_zone_id=chef_zone.id
                )
                user = crud.create_full_user(db, user_data)
                print(f"✅ Merchandiser créé: {user.nom} ({user.email})")
            except Exception as e:
                print(f"❌ Erreur: {e}")
        else:
            print("\n3. ⚠️ Pas de chef de zone en base, impossible de créer un merchandiser")

        print("\n" + "=" * 60)
        print("FIN DES TESTS")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    test_create_users()
