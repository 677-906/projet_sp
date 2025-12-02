"""
Script pour ajouter les articles détaillés manquants
SANS supprimer les données existantes
"""

import sys
import os

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.database import SessionLocal
from app.models import Produit, CategorieProduit

def add_missing_articles():
    """Ajoute uniquement les articles détaillés manquants"""

    db = SessionLocal()

    try:
        print("\n" + "=" * 60)
        print("AJOUT DES ARTICLES DÉTAILLÉS")
        print("=" * 60 + "\n")

        # Récupérer les catégories existantes
        print("📦 Récupération des catégories...")
        categories = {}
        for cat in db.query(CategorieProduit).all():
            categories[cat.nom] = cat

        if not categories:
            print("❌ ERREUR: Aucune catégorie trouvée. Veuillez initialiser la base d'abord.")
            return

        print(f"✅ {len(categories)} catégories trouvées")

        # Liste des articles à ajouter
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

        print(f"\n🛒 Ajout de {len(articles_detailles)} articles détaillés...")

        added_count = 0
        skipped_count = 0

        for article_data in articles_detailles:
            # Vérifier si l'article existe déjà
            existing = db.query(Produit).filter(
                Produit.nom_produit == article_data["nom_produit"]
            ).first()

            if existing:
                print(f"⏭️  Existe déjà: {article_data['nom_produit']}")
                skipped_count += 1
            else:
                article = Produit(**article_data)
                db.add(article)
                print(f"✅ Ajouté: {article_data['nom_produit']}")
                added_count += 1

        db.commit()

        print("\n" + "=" * 60)
        print("RÉSUMÉ")
        print("=" * 60)
        print(f"✅ {added_count} articles ajoutés")
        print(f"⏭️  {skipped_count} articles déjà existants (ignorés)")
        print(f"📊 Total articles dans la base: {db.query(Produit).count()}")
        print("=" * 60)
        print("\n✅ TERMINÉ ! Les articles sont maintenant disponibles dans les listes déroulantes.\n")

    except Exception as e:
        print(f"❌ ERREUR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    add_missing_articles()
