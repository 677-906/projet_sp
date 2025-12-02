"""
Script pour ajouter la colonne 'article' à la table produits
"""
import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.database import engine
from sqlalchemy import text

def add_article_column():
    with engine.begin() as conn:
        try:
            # Vérifier si la colonne existe déjà
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='produits' AND column_name='article'"
            ))
            if result.fetchone():
                print("OK - La colonne 'article' existe deja")
                return

            # Ajouter la colonne
            conn.execute(text("ALTER TABLE produits ADD COLUMN article VARCHAR(255)"))
            print("OK - Colonne 'article' ajoutee avec succes a la table produits")
        except Exception as e:
            print(f"ERREUR: {e}")

if __name__ == "__main__":
    add_article_column()
