"""
Script d'initialisation de la base de données
Réinitialise la base et crée les tables avec la nouvelle structure hiérarchique
"""

import sys
import os

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.database import engine, Base, SessionLocal
from app.models import (
    Role, User, Responsable, ChefZone, Merchandiser,
    Client, Produit, CategorieProduit, Concurrent
)
from app.security import get_password_hash

def init_database():
    """Réinitialise et initialise la base de données"""

    print("🔄 Suppression des anciennes tables...")
    # On doit supprimer manuellement avec CASCADE pour PostgreSQL
    from sqlalchemy import text
    db = SessionLocal()
    try:
        # Récupérer toutes les tables
        result = db.execute(text(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
        ))
        tables = [row[0] for row in result]

        # Supprimer chaque table avec CASCADE
        for table in tables:
            db.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
        db.commit()
        print(f"✅ {len(tables)} tables supprimées")
    except Exception as e:
        print(f"⚠️ Erreur lors de la suppression: {e}")
        db.rollback()
    finally:
        db.close()

    print("✅ Création des nouvelles tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("📝 Création des rôles...")
        roles_data = [
            {"nom": "Administrateur", "description": "Accès complet au système"},
            {"nom": "Responsable", "description": "Supervise plusieurs chefs de zone"},
            {"nom": "Chef de Zone", "description": "Valide les visites de ses merchandisers"},
            {"nom": "Merchandiser", "description": "Effectue les visites terrain"}
        ]

        roles = {}
        for role_data in roles_data:
            role = Role(**role_data)
            db.add(role)
            db.flush()
            roles[role.nom] = role

        print("👤 Création des utilisateurs de test...")

        # Admin
        admin_user = User(
            nom="Admin Système",
            email="admin@projet-sp.com",
            password_hash=get_password_hash("admin123"),
            role_id=roles["Administrateur"].id
        )
        db.add(admin_user)
        db.flush()

        # Responsable
        responsable_user = User(
            nom="El Charif",
            email="elcharif@projet-sp.com",
            password_hash=get_password_hash("resp123"),
            role_id=roles["Responsable"].id
        )
        db.add(responsable_user)
        db.flush()

        responsable_profile = Responsable(
            user_id=responsable_user.id,
            base="DOUALA"
        )
        db.add(responsable_profile)
        db.flush()

        # Chef de Zone
        chef_zone_user = User(
            nom="Ruth",
            email="ruth@projet-sp.com",
            password_hash=get_password_hash("chef123"),
            role_id=roles["Chef de Zone"].id
        )
        db.add(chef_zone_user)
        db.flush()

        chef_zone_profile = ChefZone(
            user_id=chef_zone_user.id,
            responsable_id=responsable_profile.id,
            zone="DOUALA 4"
        )
        db.add(chef_zone_profile)
        db.flush()

        # Merchandiser
        merchandiser_user = User(
            nom="AYANGMA François",
            email="ayangma@projet-sp.com",
            password_hash=get_password_hash("merch123"),
            role_id=roles["Merchandiser"].id
        )
        db.add(merchandiser_user)
        db.flush()

        merchandiser_profile = Merchandiser(
            user_id=merchandiser_user.id,
            chef_zone_id=chef_zone_profile.id
        )
        db.add(merchandiser_profile)

        print("📦 Création des catégories de produits...")
        categories_data = [
            {"nom": "Eaux"},
            {"nom": "Boissons Gazeuses"},
            {"nom": "Eaux Diverses"}
        ]

        categories = {}
        for cat_data in categories_data:
            cat = CategorieProduit(**cat_data)
            db.add(cat)
            db.flush()
            categories[cat.nom] = cat

        print("🍾 Création des 22 produits de base...")
        produits_data = [
            # Eaux
            {"nom_produit": "SP", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "OP", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "VITAL", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "TANGUI", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "MADIBA", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "CEILO", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "SANO", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "AQUABELLE", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "ULTIME LIGHT", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "VALCLAIR", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "AUTRES", "categorie_id": categories["Eaux"].id},

            # Boissons Gazeuses
            {"nom_produit": "BG SP", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "BG BC", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "BG ELIM", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "BG GRACEDOM", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "BG UCB", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "BRASAF", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "AUTRES BG", "categorie_id": categories["Boissons Gazeuses"].id},

            # Eaux Diverses
            {"nom_produit": "ED SP", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "ED BC", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "ED ELIM", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "AUTRES ED", "categorie_id": categories["Eaux Diverses"].id},
        ]

        for prod_data in produits_data:
            prod = Produit(**prod_data)
            db.add(prod)

        print("🛒 Ajout des articles détaillés pour ruptures et incidents...")
        articles_detailles = [
            # American Cola
            {"nom_produit": "American Cola 0.35L", "article": "American Cola 0.35 litre pack de 12", "marque": "American Cola", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "American Cola 1.25L", "article": "American Cola 1.25 L pack(6)", "marque": "American Cola", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "American Cola Zero 1.25L", "article": "American Cola Zero 1.25 L pack(6)", "marque": "American Cola", "categorie_id": categories["Boissons Gazeuses"].id},

            # Bubble Up
            {"nom_produit": "Bubble Up Agrumes 0.35L", "article": "Bubble Up Agrumes 0.35 litre pack 12", "marque": "Bubble Up", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "Bubble Up Agrumes 1.25L", "article": "Bubble Up Agrumes 1.25 L pack(6)", "marque": "Bubble Up", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "Bubble Up Bitter 0.35L", "article": "Bubble Up Bitter 0.35 litre pack 12", "marque": "Bubble Up", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "Bubble Up Bitter 1.25L", "article": "Bubble Up Bitter 1.25 L pack(6)", "marque": "Bubble Up", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "Bubble Up Chapman 1.25L", "article": "Bubble Up Chapman 1.25 L pack(6)", "marque": "Bubble Up", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "Bubble Up Djinja 0.35L", "article": "Bubble Up Djinja 0.35 litre pack 12", "marque": "Bubble Up", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "Bubble Up Lemon 1.25L", "article": "Bubble Up Lemon 1.25 L pack(6)", "marque": "Bubble Up", "categorie_id": categories["Boissons Gazeuses"].id},
            {"nom_produit": "Bubble Up Tonic 0.35L", "article": "Bubble Up Tonic 0.35 litre", "marque": "Bubble Up", "categorie_id": categories["Boissons Gazeuses"].id},

            # Eau Opur
            {"nom_produit": "Opur 1.5L", "article": "Eau Minerale Opur 1.5 litre(6)", "marque": "Opur", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "Opur 10L", "article": "Eau Minerale Opur 10 litres", "marque": "Opur", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "Opur 20L", "article": "Eau Minerale Opur 20 litres", "marque": "Opur", "categorie_id": categories["Eaux"].id},

            # Eau Supermont
            {"nom_produit": "Supermont 0.5L", "article": "Eau Minerale Supermont 0.5 litre (12)", "marque": "Supermont", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "Supermont 1.5L", "article": "Eau Minerale Supermont 1.5 litre(6)", "marque": "Supermont", "categorie_id": categories["Eaux"].id},
            {"nom_produit": "Supermont 10L", "article": "Eau Minerale Supermont 10 litres", "marque": "Supermont", "categorie_id": categories["Eaux"].id},

            # Planet
            {"nom_produit": "Planet Cocktail 0.35L", "article": "Planet cocktail 0.35 litre pack de 12", "marque": "Planet", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "Planet Cocktail 1.25L", "article": "Planet Cocktail 1.25 L pack(6)", "marque": "Planet", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "Planet Coco Ananas 1.25L", "article": "Planet Coco Ananas 1.25L pack 6", "marque": "Planet", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "Planet Fruits Rouges 0.35L", "article": "Planet Fruits Rouges 0.35L pack 12", "marque": "Planet", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "Planet Fruits Rouges 1.25L", "article": "Planet Fruits Rouges 1.25L pack 6", "marque": "Planet", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "Planet Grenadine 0.35L", "article": "Planet Grénadine 0.35 litre pack 12", "marque": "Planet", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "Planet Orange 0.35L", "article": "Planet Orange 0.35 litre pack 12", "marque": "Planet", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "Planet Pomme 1.25L", "article": "Planet Pomme 1.25 L pack(6)", "marque": "Planet", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "Planet Tropical 0.35L", "article": "Planet Tropical 0.35L pack 12", "marque": "Planet", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "Planet Tropical 1.25L", "article": "Planet Tropical 1.25L pack 6", "marque": "Planet", "categorie_id": categories["Eaux Diverses"].id},

            # Reaktor
            {"nom_produit": "Reaktor 0.33L", "article": "Reaktor 0.33 litre pack 12", "marque": "Reaktor", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "Reaktor 0.5L", "article": "Reaktor 0.5 litre pack 12", "marque": "Reaktor", "categorie_id": categories["Eaux Diverses"].id},
            {"nom_produit": "Reaktor Dark 0.5L", "article": "Reaktor Dark 0.5 litre pack 12", "marque": "Reaktor", "categorie_id": categories["Eaux Diverses"].id},
        ]

        for article_data in articles_detailles:
            article = Produit(**article_data)
            db.add(article)

        print("🏢 Création de clients de test...")
        clients_data = [
            {
                "nom_client": "KABILA NDOBO",
                "contact": "698539444",
                "typologie": "GROSSISTE",
                "localisation": "BONABERI",
                "zone": "DOUALA 4",
                "lieu_dit": "NDOBO MINISTERE SOYA",
                "commercial_nom": "Chantal",
                "createur_id": admin_user.id
            },
            {
                "nom_client": "KVS SARL",
                "contact": "695530480",
                "typologie": "SUPERETTES",
                "localisation": "BONABERI",
                "zone": "DOUALA 4",
                "lieu_dit": "MARCHE GRAND BAOBAB",
                "commercial_nom": "Chantal",
                "createur_id": admin_user.id
            },
            {
                "nom_client": "SUPERMARCHÉ SCORE",
                "contact": "677123456",
                "typologie": "GRANDE SURFACE",
                "localisation": "AKWA",
                "zone": "DOUALA 4",
                "lieu_dit": "BOULEVARD DE LA LIBERTE",
                "commercial_nom": "Evans",
                "createur_id": admin_user.id
            },
            {
                "nom_client": "BOUTIQUE CHAMPION",
                "contact": "699876543",
                "typologie": "DETAILLANT",
                "localisation": "MAKEPE",
                "zone": "DOUALA 4",
                "lieu_dit": "CARREFOUR MAKEPE",
                "commercial_nom": "Evans",
                "createur_id": admin_user.id
            },
            {
                "nom_client": "DEPOT BELLE VIE",
                "contact": "655234567",
                "typologie": "GROSSISTE",
                "localisation": "NEW BELL",
                "zone": "DOUALA 4",
                "lieu_dit": "MARCHE NEW BELL",
                "commercial_nom": "Chantal",
                "createur_id": admin_user.id
            },
            {
                "nom_client": "MAGASIN PLATEAU",
                "contact": "690345678",
                "typologie": "SUPERETTES",
                "localisation": "BONANJO",
                "zone": "DOUALA 4",
                "lieu_dit": "RUE JOFFRE",
                "commercial_nom": "Evans",
                "createur_id": admin_user.id
            },
            {
                "nom_client": "DISTRIBUTION MODERNE",
                "contact": "678456789",
                "typologie": "GROSSISTE",
                "localisation": "BASSA",
                "zone": "DOUALA 4",
                "lieu_dit": "NDOKOTI",
                "commercial_nom": "Chantal",
                "createur_id": admin_user.id
            },
            {
                "nom_client": "EPICERIE DU COIN",
                "contact": "696567890",
                "typologie": "DETAILLANT",
                "localisation": "DEIDO",
                "zone": "DOUALA 4",
                "lieu_dit": "ROND POINT DEIDO",
                "commercial_nom": "Evans",
                "createur_id": admin_user.id
            }
        ]

        for client_data in clients_data:
            client = Client(**client_data)
            db.add(client)

        print("🏭 Création de concurrents...")
        concurrents_data = [
            {"nom": "COCA COLA"},
            {"nom": "GUINNESS"},
            {"nom": "UCB"},
            {"nom": "SABC"}
        ]

        for conc_data in concurrents_data:
            conc = Concurrent(**conc_data)
            db.add(conc)

        db.commit()

        print("\n✅ ✅ ✅ BASE DE DONNÉES INITIALISÉE AVEC SUCCÈS ! ✅ ✅ ✅\n")
        print("=" * 60)
        print("COMPTES DE TEST CRÉÉS:")
        print("=" * 60)
        print(f"Admin:        admin@projet-sp.com / admin123")
        print(f"Responsable:  elcharif@projet-sp.com / resp123")
        print(f"Chef de Zone: ruth@projet-sp.com / chef123")
        print(f"Merchandiser: ayangma@projet-sp.com / merch123")
        print("=" * 60)
        print(f"✅ 4 rôles créés")
        print(f"✅ 4 utilisateurs créés")
        print(f"✅ 3 catégories de produits créées")
        print(f"✅ 52 produits créés (22 de base + 30 articles détaillés)")
        print(f"✅ 8 clients de test créés")
        print(f"✅ 4 concurrents créés")
        print("=" * 60)
        print("\n💡 PROCHAINE ÉTAPE:")
        print("Connectez-vous en tant qu'admin pour gérer les utilisateurs via l'interface web")
        print("=" * 60)

    except Exception as e:
        print(f"❌ ERREUR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("INITIALISATION DE LA BASE DE DONNÉES - PROJET SP")
    print("=" * 60 + "\n")
    init_database()
