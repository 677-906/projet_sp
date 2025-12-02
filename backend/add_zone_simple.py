"""
Script de migration pour ajouter le champ 'zone' a la table 'responsables'
"""

from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def add_zone_to_responsables():
    """Ajoute la colonne 'zone' a la table responsables si elle n'existe pas deja"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

    with engine.begin() as connection:
        # Verifier si la colonne existe deja
        result = connection.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='responsables' AND column_name='zone'
        """))

        if result.fetchone() is None:
            print("Ajout de la colonne 'zone' a la table responsables...")
            connection.execute(text("""
                ALTER TABLE responsables
                ADD COLUMN zone VARCHAR(100)
            """))
            print("SUCCES: Colonne 'zone' ajoutee avec succes!")
        else:
            print("AVERTISSEMENT: La colonne 'zone' existe deja dans la table responsables.")

    print("Migration terminee.")

if __name__ == "__main__":
    add_zone_to_responsables()
