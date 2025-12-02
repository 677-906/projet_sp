# Script de diagnostic pour vérifier les dépendances d'un utilisateur
# Usage: python -m backend.check_user_dependencies

from backend.app import models
from backend.app.database import SessionLocal

def check_user_dependencies(user_id: int):
    """Vérifie toutes les dépendances d'un utilisateur avant suppression."""
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()

        if not user:
            print(f"[X] Utilisateur ID {user_id} non trouve")
            return

        print(f"\n{'='*60}")
        print(f"DIAGNOSTIC UTILISATEUR ID {user_id}")
        print(f"{'='*60}")
        print(f"Nom: {user.nom}")
        print(f"Email: {user.email}")
        print(f"Role: {user.role.nom if user.role else 'N/A'}")
        print(f"{'='*60}\n")

        has_dependencies = False

        # Vérifier selon le rôle
        if user.role.nom.lower() == 'chef de zone' and user.chef_zone_profile:
            print("Verification des dependances CHEF DE ZONE...")

            # Merchandisers rattachés
            nb_merchandisers = db.query(models.Merchandiser).filter(
                models.Merchandiser.chef_zone_id == user.chef_zone_profile.id
            ).count()

            if nb_merchandisers > 0:
                has_dependencies = True
                print(f"  [X] {nb_merchandisers} merchandiser(s) rattache(s)")
                merchandisers = db.query(models.Merchandiser).filter(
                    models.Merchandiser.chef_zone_id == user.chef_zone_profile.id
                ).all()
                for m in merchandisers:
                    print(f"     - {m.user.nom if m.user else 'N/A'} (ID: {m.id})")
            else:
                print(f"  [OK] Aucun merchandiser rattache")

            # Commerciaux rattachés
            nb_commerciaux = db.query(models.Commercial).filter(
                models.Commercial.chef_zone_id == user.chef_zone_profile.id
            ).count()

            if nb_commerciaux > 0:
                has_dependencies = True
                print(f"  [X] {nb_commerciaux} commercial/commerciaux rattache(s)")
                commerciaux = db.query(models.Commercial).filter(
                    models.Commercial.chef_zone_id == user.chef_zone_profile.id
                ).all()
                for c in commerciaux:
                    print(f"     - {c.nom} (ID: {c.id})")
            else:
                print(f"  [OK] Aucun commercial rattache")

        elif user.role.nom.lower() == 'merchandiser' and user.merchandiser_profile:
            print("Verification des dependances MERCHANDISER...")

            # Visites enregistrées
            nb_visites = db.query(models.Visite).filter(
                models.Visite.merchandiser_id == user.merchandiser_profile.id
            ).count()

            if nb_visites > 0:
                has_dependencies = True
                print(f"  [X] {nb_visites} visite(s) enregistree(s)")
                print(f"     Conseil: Supprimez les visites ou desactivez l'utilisateur")
            else:
                print(f"  [OK] Aucune visite enregistree")

        elif user.role.nom.lower() == 'responsable' and user.responsable_profile:
            print("Verification des dependances RESPONSABLE...")

            # Chefs de zone supervisés
            nb_chefs = db.query(models.ChefZone).filter(
                models.ChefZone.responsable_id == user.responsable_profile.id
            ).count()

            if nb_chefs > 0:
                has_dependencies = True
                print(f"  [X] {nb_chefs} chef(s) de zone supervise(s)")
                chefs = db.query(models.ChefZone).filter(
                    models.ChefZone.responsable_id == user.responsable_profile.id
                ).all()
                for c in chefs:
                    print(f"     - {c.user.nom if c.user else 'N/A'} (ID: {c.id})")
            else:
                print(f"  [OK] Aucun chef de zone supervise")

        else:
            print("Role: Administrateur")
            print("  [OK] Pas de dependances specifiques")

        print(f"\n{'='*60}")
        if has_dependencies:
            print("[X] SUPPRESSION BLOQUEE - Dependances trouvees")
            print("Actions requises:")
            print("   1. Reassignez les entites dependantes a un autre superviseur")
            print("   2. Ou supprimez d'abord les entites dependantes")
            print("   3. Ou desactivez l'utilisateur au lieu de le supprimer")
        else:
            print("[OK] SUPPRESSION POSSIBLE - Aucune dependance")
        print(f"{'='*60}\n")

    finally:
        db.close()

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        user_id = int(sys.argv[1])
    else:
        user_id = int(input("Entrez l'ID de l'utilisateur à vérifier: "))

    check_user_dependencies(user_id)
