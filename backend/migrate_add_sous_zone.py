"""
Script de migration: Ajout du champ sous_zone
Date: 2025
Description: Ajoute le champ sous_zone aux tables chefs_zone et clients
"""

from app.database import engine, SessionLocal
from sqlalchemy import text

def run_migration():
    """Exécute la migration pour ajouter le champ sous_zone"""
    db = SessionLocal()
    try:
        print("🔄 Début de la migration: ajout du champ sous_zone...")

        # Ajout de la colonne sous_zone à la table chefs_zone
        try:
            db.execute(text("ALTER TABLE chefs_zone ADD COLUMN sous_zone VARCHAR(100)"))
            print("✅ Colonne sous_zone ajoutée à la table chefs_zone")
        except Exception as e:
            if "already exists" in str(e) or "duplicate column" in str(e).lower():
                print("ℹ️  La colonne sous_zone existe déjà dans la table chefs_zone")
            else:
                raise e

        # Ajout de la colonne sous_zone à la table clients
        try:
            db.execute(text("ALTER TABLE clients ADD COLUMN sous_zone VARCHAR(100)"))
            print("✅ Colonne sous_zone ajoutée à la table clients")
        except Exception as e:
            if "already exists" in str(e) or "duplicate column" in str(e).lower():
                print("ℹ️  La colonne sous_zone existe déjà dans la table clients")
            else:
                raise e

        db.commit()
        print("\n✅ Migration terminée avec succès!")
        print("\nLes tables suivantes ont été mises à jour:")
        print("  - chefs_zone: ajout du champ sous_zone (VARCHAR(100), nullable)")
        print("  - clients: ajout du champ sous_zone (VARCHAR(100), nullable)")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Erreur lors de la migration: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
