"""
Script pour ajouter la table notifications
SANS supprimer les données existantes
"""

import sys
import os

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.database import engine
from app.models import Notification
from sqlalchemy import inspect

def add_notifications_table():
    """Ajoute la table notifications si elle n'existe pas déjà"""

    try:
        print("\n" + "=" * 60)
        print("AJOUT DE LA TABLE NOTIFICATIONS")
        print("=" * 60 + "\n")

        # Vérifier si la table existe déjà
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        if 'notifications' in existing_tables:
            print("⏭️  La table 'notifications' existe déjà. Rien à faire.")
            return

        print("📝 Création de la table 'notifications'...")

        # Créer seulement la table Notification
        Notification.__table__.create(engine)

        print("✅ Table 'notifications' créée avec succès !")
        print("\n" + "=" * 60)
        print("TERMINÉ")
        print("=" * 60)
        print("✅ Le système de notifications est maintenant opérationnel.\n")

    except Exception as e:
        print(f"❌ ERREUR: {e}")
        raise


if __name__ == "__main__":
    add_notifications_table()
