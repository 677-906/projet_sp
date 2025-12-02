"""
Script pour peupler les articles de produits
"""
import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.database import SessionLocal
from app import models

def populate_articles():
    db = SessionLocal()
    try:
        # Supprimer tous les produits existants
        db.query(models.Produit).delete()
        db.commit()
        print("✓ Anciens produits supprimés")

        # Récupérer les catégories
        cat_eau = db.query(models.CategorieProduit).filter(models.CategorieProduit.nom == "EAU").first()
        cat_gazeuse = db.query(models.CategorieProduit).filter(models.CategorieProduit.nom == "BOISSON GAZEUSE").first()
        cat_jus = db.query(models.CategorieProduit).filter(models.CategorieProduit.nom == "JUS").first()
        cat_energie = db.query(models.CategorieProduit).filter(models.CategorieProduit.nom == "BOISSON ÉNERGÉTIQUE").first()

        # Créer les catégories si elles n'existent pas
        if not cat_eau:
            cat_eau = models.CategorieProduit(nom="EAU")
            db.add(cat_eau)
        if not cat_gazeuse:
            cat_gazeuse = models.CategorieProduit(nom="BOISSON GAZEUSE")
            db.add(cat_gazeuse)
        if not cat_jus:
            cat_jus = models.CategorieProduit(nom="JUS")
            db.add(cat_jus)
        if not cat_energie:
            cat_energie = models.CategorieProduit(nom="BOISSON ÉNERGÉTIQUE")
            db.add(cat_energie)
        db.commit()
        db.refresh(cat_eau)
        db.refresh(cat_gazeuse)
        db.refresh(cat_jus)
        db.refresh(cat_energie)

        # Liste des articles à ajouter
        articles = [
            # American Cola (Boisson Gazeuse)
            {"nom_produit": "AMERICAN COLA", "article": "American Cola 0.35 litre pack de 12", "marque": "AMERICAN COLA", "categorie_id": cat_gazeuse.id},
            {"nom_produit": "AMERICAN COLA", "article": "American Cola 1.25 L pack(6)", "marque": "AMERICAN COLA", "categorie_id": cat_gazeuse.id},
            {"nom_produit": "AMERICAN COLA", "article": "American Cola Zero 1.25 L pack(6)", "marque": "AMERICAN COLA", "categorie_id": cat_gazeuse.id},

            # Bubble Up (Boisson Gazeuse)
            {"nom_produit": "BUBBLE UP", "article": "Bubble Up Agrumes 0.35 litre pack 12", "marque": "BUBBLE UP", "categorie_id": cat_gazeuse.id},
            {"nom_produit": "BUBBLE UP", "article": "Bubble Up Agrumes 1.25 L pack(6)", "marque": "BUBBLE UP", "categorie_id": cat_gazeuse.id},
            {"nom_produit": "BUBBLE UP", "article": "Bubble Up Bitter 0.35 litre pack 12", "marque": "BUBBLE UP", "categorie_id": cat_gazeuse.id},
            {"nom_produit": "BUBBLE UP", "article": "Bubble Up Bitter 1.25 L pack(6)", "marque": "BUBBLE UP", "categorie_id": cat_gazeuse.id},
            {"nom_produit": "BUBBLE UP", "article": "Bubble Up Chapman 1.25 L pack(6)", "marque": "BUBBLE UP", "categorie_id": cat_gazeuse.id},
            {"nom_produit": "BUBBLE UP", "article": "Bubble Up Djinja 0.35 litre pack 12", "marque": "BUBBLE UP", "categorie_id": cat_gazeuse.id},
            {"nom_produit": "BUBBLE UP", "article": "Bubble Up Lemon 1.25 L pack(6)", "marque": "BUBBLE UP", "categorie_id": cat_gazeuse.id},
            {"nom_produit": "BUBBLE UP", "article": "Bubble Up Tonic 0.35 litre", "marque": "BUBBLE UP", "categorie_id": cat_gazeuse.id},

            # Opur (Eau)
            {"nom_produit": "OP", "article": "Eau Minerale Opur 1.5 litre(6)", "marque": "OPUR", "categorie_id": cat_eau.id},
            {"nom_produit": "OP", "article": "Eau Minerale Opur 10 litres", "marque": "OPUR", "categorie_id": cat_eau.id},
            {"nom_produit": "OP", "article": "Eau Minerale Opur 20 litres", "marque": "OPUR", "categorie_id": cat_eau.id},

            # Supermont (Eau)
            {"nom_produit": "SP", "article": "Eau Minerale Supermont 0.5 litre (12)", "marque": "SUPERMONT", "categorie_id": cat_eau.id},
            {"nom_produit": "SP", "article": "Eau Minerale Supermont 1.5 litre(6)", "marque": "SUPERMONT", "categorie_id": cat_eau.id},
            {"nom_produit": "SP", "article": "Eau Minerale Supermont 10 litres", "marque": "SUPERMONT", "categorie_id": cat_eau.id},

            # Planet (Jus)
            {"nom_produit": "PLANET", "article": "Planet cocktail 0.35 litre pack de 12", "marque": "PLANET", "categorie_id": cat_jus.id},
            {"nom_produit": "PLANET", "article": "Planet Cocktail 1.25 L pack(6)", "marque": "PLANET", "categorie_id": cat_jus.id},
            {"nom_produit": "PLANET", "article": "Planet Coco Ananas 1.25L pack 6", "marque": "PLANET", "categorie_id": cat_jus.id},
            {"nom_produit": "PLANET", "article": "Planet Fruits Rouges 0.35L pack 12", "marque": "PLANET", "categorie_id": cat_jus.id},
            {"nom_produit": "PLANET", "article": "Planet Fruits Rouges 1.25L pack 6", "marque": "PLANET", "categorie_id": cat_jus.id},
            {"nom_produit": "PLANET", "article": "Planet Grénadine 0.35 litre pack 12", "marque": "PLANET", "categorie_id": cat_jus.id},
            {"nom_produit": "PLANET", "article": "Planet Orange 0.35 litre pack 12", "marque": "PLANET", "categorie_id": cat_jus.id},
            {"nom_produit": "PLANET", "article": "Planet Pomme 1.25 L pack(6)", "marque": "PLANET", "categorie_id": cat_jus.id},
            {"nom_produit": "PLANET", "article": "Planet Tropical 0.35L pack 12", "marque": "PLANET", "categorie_id": cat_jus.id},
            {"nom_produit": "PLANET", "article": "Planet Tropical 1.25L pack 6", "marque": "PLANET", "categorie_id": cat_jus.id},

            # Reaktor (Boisson Énergétique)
            {"nom_produit": "REAKTOR", "article": "Reaktor 0.33 litre pack 12", "marque": "REAKTOR", "categorie_id": cat_energie.id},
            {"nom_produit": "REAKTOR", "article": "Reaktor 0.5 litre pack 12", "marque": "REAKTOR", "categorie_id": cat_energie.id},
            {"nom_produit": "REAKTOR", "article": "Reaktor Dark 0.5 litre pack 12", "marque": "REAKTOR", "categorie_id": cat_energie.id},
        ]

        # Ajouter tous les articles
        for article_data in articles:
            produit = models.Produit(**article_data)
            db.add(produit)

        db.commit()
        print(f"✓ {len(articles)} articles créés avec succès!")

        # Afficher un résumé
        total = db.query(models.Produit).count()
        print(f"\n📊 Total produits en base: {total}")

    except Exception as e:
        print(f"❌ ERREUR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_articles()
