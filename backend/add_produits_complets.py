"""
Script pour AJOUTER les produits avec noms complets (pour ruptures et incidents)
SANS supprimer les produits courts existants (utilisés pour veille concurrentielle)
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

# Liste complète des produits avec noms complets pour ruptures et incidents
PRODUITS_COMPLETS = [
    "American Cola 0.35 litre pack de 12",
    "American Cola 1.25 L pack(6)",
    "American Cola Zero 1.25 L pack(6)",
    "Bubble Up Agrumes 0.35 litre pack 12",
    "Bubble Up Agrumes 1.25 L pack(6)",
    "Bubble Up Bitter 0.35 litre pack 12",
    "Bubble Up Bitter 1.25 L pack(6)",
    "Bubble Up Chapman 1.25 L pack(6)",
    "Bubble Up Djinja 0.35 litre pack 12",
    "Bubble Up Lemon 1.25 L pack(6)",
    "Bubble Up Tonic 0.35 litre",
    "Eau Minerale Opur 1.5 litre(6)",
    "Eau Minerale Opur 10 litres",
    "Eau Minerale Opur 20 litres",
    "Eau Minerale Supermont 0.5 litre (12)",
    "Eau Minerale Supermont 1.5 litre(6)",
    "Eau Minerale Supermont 10 litres",
    "Planet cocktail 0.35 litre pack de 12",
    "Planet Cocktail 1.25 L pack(6)",
    "Planet Coco Ananas 1.25L pack 6",
    "Planet Fruits Rouges 0.35L pack 12",
    "Planet Fruits Rouges 1.25L pack 6",
    "Planet Grénadine 0.35 litre pack 12",
    "Planet Orange 0.35 litre pack 12",
    "Planet Pomme 1.25 L pack(6)",
    "Planet Tropical 0.35L pack 12",
    "Planet Tropical 1.25L pack 6",
    "Reaktor 0.33 litre pack 12",
    "Reaktor 0.5 litre pack 12",
    "Reaktor Dark 0.5 litre pack 12"
]

def add_produits_complets():
    """Ajoute les produits complets SANS supprimer les existants"""
    db = SessionLocal()

    try:
        print("=" * 80)
        print("AJOUT DES PRODUITS AVEC NOMS COMPLETS")
        print("(Les produits courts SP, OP, etc. sont conserves)")
        print("=" * 80)
        print()

        # 1. Vérifier les produits existants
        print("Etape 1: Verification des produits existants...")
        produits_existants = db.query(models.Produit).all()
        print(f"[INFO] {len(produits_existants)} produits actuels (pour veille concurrentielle)")
        for p in produits_existants[:5]:
            print(f"  - {p.nom_produit}")
        if len(produits_existants) > 5:
            print(f"  ... et {len(produits_existants)-5} autres")
        print()

        # 2. Vérifier/créer la catégorie
        print("Etape 2: Verification de la categorie...")
        categorie = db.query(models.CategorieProduit).filter(
            models.CategorieProduit.nom == "Boissons"
        ).first()

        if not categorie:
            categorie = models.CategorieProduit(nom="Boissons")
            db.add(categorie)
            db.flush()
            print("[OK] Categorie 'Boissons' creee")
        else:
            print("[OK] Categorie 'Boissons' existe (ID: {})".format(categorie.id))
        print()

        # 3. Ajouter les nouveaux produits complets
        print("Etape 3: Ajout des produits complets pour ruptures/incidents...")
        created_count = 0
        skipped_count = 0

        for article_complet in PRODUITS_COMPLETS:
            # Vérifier si le produit existe déjà
            existing = db.query(models.Produit).filter(
                models.Produit.article == article_complet
            ).first()

            if existing:
                skipped_count += 1
                continue

            # Extraire un nom court pour nom_produit
            mots = article_complet.split()
            if len(mots) >= 2:
                nom_produit = " ".join(mots[0:2])
            else:
                nom_produit = mots[0] if mots else article_complet[:20]

            produit = models.Produit(
                nom_produit=nom_produit,
                article=article_complet,
                marque=mots[0] if mots else "",  # Premier mot comme marque
                categorie_id=categorie.id
            )
            db.add(produit)
            created_count += 1

        db.commit()
        print(f"[OK] {created_count} nouveaux produits ajoutes")
        if skipped_count > 0:
            print(f"[INFO] {skipped_count} produits deja existants ignores")
        print()

        # 4. Afficher le résumé
        print("Etape 4: Recapitulatif...")
        tous_produits = db.query(models.Produit).all()

        # Produits courts (pour veille concurrentielle)
        produits_courts = [p for p in tous_produits if not p.article or len(p.article) < 20]
        print(f"Produits courts (veille concurrentielle): {len(produits_courts)}")

        # Produits complets (pour ruptures/incidents)
        produits_complets = [p for p in tous_produits if p.article and len(p.article) >= 20]
        print(f"Produits complets (ruptures/incidents): {len(produits_complets)}")
        print()

        print("Exemples de produits complets:")
        for p in produits_complets[:5]:
            print(f"  - {p.article}")
        if len(produits_complets) > 5:
            print(f"  ... et {len(produits_complets)-5} autres")
        print()

        print("=" * 80)
        print("[SUCCES] PRODUITS AJOUTES!")
        print("=" * 80)
        print()
        print(f"Total produits dans la base: {len(tous_produits)}")
        print(f"  - Produits courts (veille concurrentielle): {len(produits_courts)}")
        print(f"  - Produits complets (ruptures/incidents): {len(produits_complets)}")
        print()

    except Exception as e:
        db.rollback()
        print(f"[ERREUR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    add_produits_complets()
