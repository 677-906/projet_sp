# Migration: Ajouter la table commerciaux et le champ commercial_id à clients

from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.begin() as conn:
        # 1. Créer la table commerciaux
        print("Création de la table commerciaux...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS commerciaux (
                id SERIAL PRIMARY KEY,
                nom VARCHAR(100) NOT NULL,
                contact VARCHAR(100),
                chef_zone_id INTEGER NOT NULL REFERENCES chefs_zone(id) ON DELETE CASCADE
            );
        """))
        print("OK - Table commerciaux creee")

        # 2. Ajouter la colonne commercial_id à la table clients
        print("Ajout de la colonne commercial_id a la table clients...")
        try:
            conn.execute(text("""
                ALTER TABLE clients
                ADD COLUMN commercial_id INTEGER REFERENCES commerciaux(id) ON DELETE SET NULL;
            """))
            print("OK - Colonne commercial_id ajoutee")
        except Exception as e:
            if "already exists" in str(e) or "existe deja" in str(e):
                print("WARN - La colonne commercial_id existe deja")
            else:
                raise e

        print("\nOK - Migration terminee avec succes!")

if __name__ == "__main__":
    migrate()
