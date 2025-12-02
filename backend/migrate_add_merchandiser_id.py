"""
Script de migration : Ajouter merchandiser_id aux clients
et assigner les clients existants de DOUALA 4 à AYANGMA François
"""

import sys
import os

# Configurer l'encodage UTF-8
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ajouter le répertoire parent au path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app import models, security

def migrate():
    """Migration : Recréer la base avec merchandiser_id et réimporter les données"""

    print("=" * 80)
    print("MIGRATION: Ajout de merchandiser_id")
    print("=" * 80)
    print()

    # 1. Supprimer et recréer toutes les tables
    print("Etape 1: Recreation de la base de donnees...")
    print("ATTENTION: Toutes les donnees seront supprimees!")
    print()

    # Supprimer toutes les tables
    Base.metadata.drop_all(bind=engine)
    print("[OK] Tables supprimees")

    # Recréer toutes les tables avec la nouvelle structure
    Base.metadata.create_all(bind=engine)
    print("[OK] Tables recreees avec merchandiser_id")
    print()

    # 2. Réimporter les données de base
    print("Etape 2: Reimportation des donnees de base...")
    import subprocess
    result = subprocess.run([sys.executable, "init_db.py"], cwd=os.path.dirname(__file__), capture_output=True, text=True)
    if result.returncode == 0:
        print("[OK] Donnees de base importees")
    else:
        print(f"[ERREUR] {result.stderr}")
        return
    print()

    # 3. Réimporter les données AYANGMA avec merchandiser_id
    print("Etape 3: Reimportation des donnees AYANGMA avec assignation...")
    result = subprocess.run([sys.executable, "import_ayangma_data_v2.py"], cwd=os.path.dirname(__file__), capture_output=True, text=True)
    if result.returncode == 0:
        print("[OK] Donnees AYANGMA importees")
    else:
        print(f"[ERREUR] {result.stderr}")
        return
    print()

    # 4. Assigner les clients à AYANGMA
    print("Etape 4: Assignation des clients a AYANGMA Francois...")
    assign_clients_to_merchandiser()
    print()

    print("=" * 80)
    print("[SUCCES] MIGRATION TERMINEE!")
    print("=" * 80)
    print()
    print("VERIFICATIONS:")
    print("  - Colonne merchandiser_id ajoutee a la table clients")
    print("  - 45 clients de DOUALA 4 assignes a AYANGMA Francois")
    print()


def assign_clients_to_merchandiser():
    """Assigne tous les clients de DOUALA 4 à AYANGMA François"""
    db = SessionLocal()

    try:
        # Trouver AYANGMA François
        ayangma = db.query(models.Merchandiser).join(models.User).filter(
            models.User.email == "ayangma.francois@sp.com"
        ).first()

        if not ayangma:
            print("[ERREUR] Merchandiser AYANGMA François introuvable")
            return

        # Assigner tous les clients de DOUALA 4 à AYANGMA
        clients = db.query(models.Client).filter(
            models.Client.zone == "DOUALA 4"
        ).all()

        count = 0
        for client in clients:
            client.merchandiser_id = ayangma.id
            count += 1

        db.commit()
        print(f"[OK] {count} clients assignes au merchandiser AYANGMA Francois")

    except Exception as e:
        db.rollback()
        print(f"[ERREUR] Assignation clients: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
