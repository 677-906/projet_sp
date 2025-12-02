"""
Script de migration pour ajouter la colonne heure_validation a la table visites
"""
from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def add_heure_validation_column():
    """Ajoute la colonne heure_validation a la table visites"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

    with engine.begin() as connection:
        try:
            # Verifier si la colonne existe deja
            result = connection.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='visites' AND column_name='heure_validation'
            """))

            if result.fetchone() is None:
                # Ajouter la colonne si elle n'existe pas
                connection.execute(text("""
                    ALTER TABLE visites
                    ADD COLUMN heure_validation VARCHAR(10)
                """))
                print("[OK] Colonne 'heure_validation' ajoutee avec succes a la table 'visites'")
            else:
                print("[INFO] La colonne 'heure_validation' existe deja")

        except Exception as e:
            print(f"[ERREUR] Erreur lors de la migration: {e}")
            raise

if __name__ == "__main__":
    add_heure_validation_column()
