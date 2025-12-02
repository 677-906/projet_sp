"""
Migration : Ajouter les champs de gestion de session unique
- active_token : Token actuellement actif pour l'utilisateur
- last_login_at : Date/heure de la dernière connexion
"""

from sqlalchemy import create_engine, text

# Utiliser la même configuration que database.py
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:carelle%402025@localhost:5432/SP_db"

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

    with engine.connect() as connection:
        # Commencer une transaction
        trans = connection.begin()

        try:
            print("🔄 Ajout des colonnes de session unique...")

            # Ajouter la colonne active_token
            connection.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS active_token TEXT;
            """))
            print("✅ Colonne 'active_token' ajoutée")

            # Ajouter la colonne last_login_at
            connection.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
            """))
            print("✅ Colonne 'last_login_at' ajoutée")

            # Valider la transaction
            trans.commit()
            print("\n✅ Migration terminée avec succès!")
            print("\n📝 Note: À la prochaine connexion, les utilisateurs devront se reconnecter.")
            print("   Les anciennes sessions seront automatiquement invalidées.")

        except Exception as e:
            trans.rollback()
            print(f"\n❌ Erreur lors de la migration: {e}")
            raise

if __name__ == "__main__":
    migrate()
