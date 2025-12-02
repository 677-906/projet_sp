"""
Script de migration pour convertir les colonnes Time en String dans la table visites
"""
import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def migrate_time_to_string():
    """Convertit les colonnes heure_debut et heure_fin de Time vers String"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

    with engine.begin() as conn:
        print("🔄 Début de la migration des colonnes time vers string...")

        # 1. Créer des colonnes temporaires de type TEXT
        print("  → Création des colonnes temporaires...")
        conn.execute(text("""
            ALTER TABLE visites
            ADD COLUMN heure_debut_temp TEXT
        """))
        conn.execute(text("""
            ALTER TABLE visites
            ADD COLUMN heure_fin_temp TEXT
        """))

        # 2. Copier les valeurs converties dans les colonnes temporaires
        print("  → Conversion des valeurs existantes...")
        conn.execute(text("""
            UPDATE visites
            SET heure_debut_temp = CASE
                WHEN heure_debut IS NOT NULL
                THEN to_char(heure_debut, 'HH24:MI')
                ELSE NULL
            END
        """))
        conn.execute(text("""
            UPDATE visites
            SET heure_fin_temp = CASE
                WHEN heure_fin IS NOT NULL
                THEN to_char(heure_fin, 'HH24:MI')
                ELSE NULL
            END
        """))

        # 3. Supprimer les anciennes colonnes
        print("  → Suppression des anciennes colonnes...")
        conn.execute(text("ALTER TABLE visites DROP COLUMN heure_debut"))
        conn.execute(text("ALTER TABLE visites DROP COLUMN heure_fin"))

        # 4. Renommer les colonnes temporaires
        print("  → Renommage des colonnes...")
        conn.execute(text("ALTER TABLE visites RENAME COLUMN heure_debut_temp TO heure_debut"))
        conn.execute(text("ALTER TABLE visites RENAME COLUMN heure_fin_temp TO heure_fin"))

        print("✅ Migration terminée avec succès!")
        print("   Les colonnes heure_debut et heure_fin sont maintenant de type String (format HH:MM)")

if __name__ == "__main__":
    try:
        migrate_time_to_string()
    except Exception as e:
        print(f"❌ Erreur lors de la migration: {e}")
        sys.exit(1)
