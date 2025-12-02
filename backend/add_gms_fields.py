"""
Script pour ajouter les champs GMS et Superviseur
SANS supprimer les données existantes
"""

import sys
import os

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.database import engine, SessionLocal
from sqlalchemy import text, inspect

def add_gms_fields():
    """Ajoute les champs est_gms et est_superviseur"""

    db = SessionLocal()

    try:
        print("\n" + "=" * 60)
        print("AJOUT DES CHAMPS GMS ET SUPERVISEUR")
        print("=" * 60 + "\n")

        inspector = inspect(engine)

        # Vérifier et ajouter le champ est_gms dans la table clients
        print("📝 Vérification de la table 'clients'...")
        columns_clients = [col['name'] for col in inspector.get_columns('clients')]

        if 'est_gms' not in columns_clients:
            print("➕ Ajout du champ 'est_gms' dans la table 'clients'...")
            db.execute(text(
                "ALTER TABLE clients ADD COLUMN est_gms BOOLEAN DEFAULT FALSE"
            ))
            db.commit()
            print("✅ Champ 'est_gms' ajouté avec succès")
        else:
            print("⏭️  Le champ 'est_gms' existe déjà dans la table 'clients'")

        # Vérifier et ajouter le champ est_superviseur dans la table chefs_zone
        print("\n📝 Vérification de la table 'chefs_zone'...")
        columns_chefs_zone = [col['name'] for col in inspector.get_columns('chefs_zone')]

        if 'est_superviseur' not in columns_chefs_zone:
            print("➕ Ajout du champ 'est_superviseur' dans la table 'chefs_zone'...")
            db.execute(text(
                "ALTER TABLE chefs_zone ADD COLUMN est_superviseur BOOLEAN DEFAULT FALSE"
            ))
            db.commit()
            print("✅ Champ 'est_superviseur' ajouté avec succès")
        else:
            print("⏭️  Le champ 'est_superviseur' existe déjà dans la table 'chefs_zone'")

        print("\n" + "=" * 60)
        print("RÉSUMÉ")
        print("=" * 60)
        print("✅ Migration terminée avec succès")
        print("\nVous pouvez maintenant :")
        print("  1. Créer des clients en spécifiant s'ils sont GMS ou non")
        print("  2. Créer des chefs de zone en spécifiant s'ils sont superviseurs")
        print("  3. Le système affichera automatiquement le bon label")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"❌ ERREUR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    add_gms_fields()
