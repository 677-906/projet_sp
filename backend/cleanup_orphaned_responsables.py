"""
Script pour nettoyer les responsables orphelins (sans user valide)
"""

import sys
import os

# Configurer l'encodage UTF-8
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ajouter le répertoire parent au path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models

def cleanup_orphaned_responsables():
    """Supprime les responsables dont le user_id ne correspond à aucun utilisateur"""
    db = SessionLocal()

    try:
        print("=" * 80)
        print("NETTOYAGE DES RESPONSABLES ORPHELINS")
        print("=" * 80)
        print()

        # 1. Récupérer tous les responsables
        print("Etape 1: Verification des responsables...")
        responsables = db.query(models.Responsable).all()
        print(f"[INFO] {len(responsables)} responsables trouvés")
        print()

        # 2. Identifier les responsables orphelins
        print("Etape 2: Identification des responsables orphelins...")
        orphelins = []
        for resp in responsables:
            # Vérifier si l'utilisateur existe
            user = db.query(models.User).filter(models.User.id == resp.user_id).first()
            if not user:
                orphelins.append(resp)
                print(f"[!] Responsable orphelin trouvé: ID={resp.id}, user_id={resp.user_id}, base={resp.base}")

        print(f"[INFO] {len(orphelins)} responsables orphelins identifiés")
        print()

        if len(orphelins) == 0:
            print("[OK] Aucun responsable orphelin à nettoyer")
            return

        # 3. Supprimer les responsables orphelins
        print("Etape 3: Suppression des responsables orphelins...")
        for resp in orphelins:
            # Vérifier s'il y a des chefs de zone liés
            chefs_zone = db.query(models.ChefZone).filter(
                models.ChefZone.responsable_id == resp.id
            ).all()

            if len(chefs_zone) > 0:
                print(f"[ATTENTION] Le responsable ID={resp.id} a {len(chefs_zone)} chefs de zone liés")
                print("  Les chefs de zone seront également affectés!")

            db.delete(resp)
            print(f"[OK] Responsable ID={resp.id} supprimé")

        db.commit()
        print()
        print(f"[SUCCES] {len(orphelins)} responsables orphelins supprimés")
        print()

        # 4. Vérification finale
        print("Etape 4: Verification finale...")
        responsables_restants = db.query(models.Responsable).all()
        print(f"[INFO] {len(responsables_restants)} responsables restants")

        for resp in responsables_restants:
            user = db.query(models.User).filter(models.User.id == resp.user_id).first()
            print(f"  - ID={resp.id}, User={user.nom if user else 'ERREUR'}, Base={resp.base}")

        print()
        print("=" * 80)
        print("[TERMINE] NETTOYAGE COMPLETE!")
        print("=" * 80)

    except Exception as e:
        db.rollback()
        print(f"[ERREUR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    cleanup_orphaned_responsables()
