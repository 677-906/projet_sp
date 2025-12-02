"""
Script de migration pour ajouter le champ 'zone' à la table 'responsables'
"""

from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def add_zone_to_responsables():
    """Ajoute la colonne 'zone' à la table responsables si elle n'existe pas déjà"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

    with engine.begin() as connection:
        # Vérifier si la colonne existe déjà
        result = connection.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='responsables' AND column_name='zone'
        """))

        if result.fetchone() is None:
            print("Ajout de la colonne 'zone' à la table responsables...")
            connection.execute(text("""
                ALTER TABLE responsables
                ADD COLUMN zone VARCHAR(100)
            """))
            print("✅ Colonne 'zone' ajoutée avec succès!")
        else:
            print("⚠️  La colonne 'zone' existe déjà dans la table responsables.")

    print("Migration terminée.")

if __name__ == "__main__":
    add_zone_to_responsables()
