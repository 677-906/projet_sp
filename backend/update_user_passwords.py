"""
Script pour mettre à jour les mots de passe des utilisateurs créés lors de la migration
"""
from app.database import SessionLocal
from app import models
from app.security import get_password_hash

def update_passwords():
    """Met à jour les mots de passe des utilisateurs avec le hash par défaut"""

    print("=" * 100)
    print("MISE A JOUR DES MOTS DE PASSE DES UTILISATEURS")
    print("=" * 100)

    db = SessionLocal()

    try:
        # Mot de passe par défaut pour tous les nouveaux utilisateurs
        default_password = "pass123"
        password_hash = get_password_hash(default_password)

        # Trouver tous les utilisateurs avec le hash par défaut invalide
        users_to_update = db.query(models.User).filter(
            models.User.password_hash == "$2b$12$defaulthash"
        ).all()

        print(f"\n{len(users_to_update)} utilisateur(s) trouvé(s) avec mot de passe invalide\n")

        if len(users_to_update) == 0:
            print("Aucun utilisateur à mettre à jour.")
            return

        print("Mise à jour des mots de passe...\n")

        # Mettre à jour chaque utilisateur
        for user in users_to_update:
            user.password_hash = password_hash

            # Déterminer le rôle
            role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
            role_name = role.nom if role else "Inconnu"

            print(f"  [MAJ] {user.nom} ({role_name}) - Email: {user.email}")

        db.commit()

        print("\n" + "=" * 100)
        print("RESUME DES IDENTIFIANTS")
        print("=" * 100)
        print(f"\nMot de passe par défaut pour tous: {default_password}\n")

        # Afficher les identifiants par rôle
        roles_map = {
            1: "Administrateur",
            2: "Responsable",
            3: "Chef de Zone",
            4: "Merchandiser"
        }

        for role_id, role_name in roles_map.items():
            users = db.query(models.User).filter(models.User.role_id == role_id).all()

            if users:
                print(f"\n[{role_name.upper()}]")
                print("-" * 100)
                for user in users:
                    print(f"  Email: {user.email:50s} | Nom: {user.nom}")

        print("\n" + "=" * 100)
        print("MISE A JOUR TERMINEE AVEC SUCCES!")
        print("=" * 100)
        print(f"\nTous les utilisateurs peuvent maintenant se connecter avec:")
        print(f"  - Leur email (voir ci-dessus)")
        print(f"  - Mot de passe: {default_password}")

    except Exception as e:
        print(f"\nERREUR: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_passwords()
