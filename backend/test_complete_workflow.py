"""
Script de test complet du workflow:
1. Créer une visite avec tous les champs
2. Valider la visite
3. Tester l'export Excel
"""

import sys
import os

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.database import SessionLocal
from app import models, schemas
from datetime import date, time

def create_test_visit():
    """Crée une visite de test complète avec tous les champs"""
    db = SessionLocal()

    try:
        # Récupérer les IDs nécessaires
        merchandiser = db.query(models.Merchandiser).first()
        client = db.query(models.Client).first()
        produits = db.query(models.Produit).limit(5).all()
        concurrent = db.query(models.Concurrent).first()

        if not merchandiser:
            print("❌ Aucun merchandiser trouvé. Exécutez init_db.py d'abord.")
            return None

        if not client:
            print("❌ Aucun client trouvé. Exécutez init_db.py d'abord.")
            return None

        print(f"📝 Création d'une visite de test pour le merchandiser: {merchandiser.user.nom}")
        print(f"📍 Client: {client.nom_client}")

        # Créer la visite avec TOUS les champs
        visite = models.Visite(
            merchandiser_id=merchandiser.id,
            client_id=client.id,
            date_visite=date.today(),

            # Horaires
            heure_debut=time(10, 30),
            heure_fin=time(11, 15),

            # Informations de base
            base="DOUALA",

            # Équipements
            type_outil="FRIGO",
            marque_outil="PLANET",
            etat_outil="BON ETAT",

            # Conformité
            fifo_respecte=True,
            planogramme_respecte=True,
            observation_planogramme="Planogramme bien respecté",

            # Ruptures
            ruptures="American Cola 1.25L; Bubble Up Lemon 0.35L",
            type_rupture="SANS GAZ",

            # Incidents
            type_incidents="ETIQUETTES DECOLLEES",
            articles_incidents="Planet Orange 1.25L",
            quantite_incidents=2,

            # Observations
            observations_generales="Visite de test - Client satisfait",

            # Informations commerciales
            reseau_distribution="MT",
            type_client="DIRECT",
            client_direct_nom=client.nom_client,

            # Statut
            statut_validation="soumis"
        )

        db.add(visite)
        db.flush()

        # Ajouter des relevés de stock pour plusieurs produits
        print("📦 Ajout des relevés de stock...")
        stocks_data = [
            {"nom": "SP", "quantite": 250},
            {"nom": "OP", "quantite": 125},
            {"nom": "VITAL", "quantite": 25},
            {"nom": "BG SP", "quantite": 48},
            {"nom": "BG BC", "quantite": 35},
        ]

        for stock_info in stocks_data:
            produit = db.query(models.Produit).filter(
                models.Produit.nom_produit == stock_info["nom"]
            ).first()

            if produit:
                releve = models.ReleveStock(
                    visite_id=visite.id,
                    produit_id=produit.id,
                    quantite_en_stock=stock_info["quantite"],
                    est_en_rupture=False
                )
                db.add(releve)

        # Ajouter des détails produits (commandes)
        print("🛒 Ajout des commandes...")
        if produits:
            for i, produit in enumerate(produits[:3]):
                detail = models.DetailVisiteProduit(
                    visite_id=visite.id,
                    produit_id=produit.id,
                    type_detail="commande",
                    quantite=10 * (i + 1),
                    observation=f"Commande test {i+1}"
                )
                db.add(detail)

        # Ajouter de la veille concurrentielle
        if concurrent:
            print("👁️ Ajout de la veille concurrentielle...")
            veille = models.VeilleConcurrentielle(
                visite_id=visite.id,
                concurrent_id=concurrent.id,
                marque="Coca Cola",
                nombre_packs=15,
                activite_observee="Promotion en cours",
                mecanisme="Réduction 20%"
            )
            db.add(veille)

        db.commit()
        db.refresh(visite)

        print(f"✅ Visite créée avec ID: {visite.id}")
        print(f"   - {len(visite.releves_stock)} relevés de stock")
        print(f"   - {len(visite.details_produits)} détails produits")
        print(f"   - {len(visite.veilles_concurrentielles)} veilles concurrentielles")

        return visite.id

    except Exception as e:
        print(f"❌ Erreur lors de la création de la visite: {e}")
        db.rollback()
        return None
    finally:
        db.close()


def validate_visit(visite_id):
    """Valide la visite créée"""
    db = SessionLocal()

    try:
        visite = db.query(models.Visite).filter(models.Visite.id == visite_id).first()

        if not visite:
            print(f"❌ Visite {visite_id} non trouvée")
            return False

        chef_zone = db.query(models.ChefZone).first()

        if not chef_zone:
            print("❌ Aucun chef de zone trouvé")
            return False

        visite.statut_validation = "valide"
        visite.validateur_id = chef_zone.id
        visite.date_validation = date.today()

        db.commit()

        print(f"✅ Visite {visite_id} validée par {chef_zone.user.nom}")
        return True

    except Exception as e:
        print(f"❌ Erreur lors de la validation: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def test_excel_export():
    """Teste la génération du fichier Excel"""
    db = SessionLocal()

    try:
        from app.export_excel import export_visites_to_excel

        # Récupérer les visites validées
        visites = db.query(models.Visite).filter(
            models.Visite.statut_validation == "valide"
        ).all()

        if not visites:
            print("❌ Aucune visite validée à exporter")
            return False

        print(f"📊 Export de {len(visites)} visite(s) validée(s)...")

        # Générer le fichier Excel
        excel_file = export_visites_to_excel(db, visites)

        # Sauvegarder le fichier pour inspection
        with open("test_export.xlsx", "wb") as f:
            f.write(excel_file.getvalue())

        print("✅ Fichier Excel généré: test_export.xlsx")
        print("   Vous pouvez l'ouvrir pour vérifier le format")

        return True

    except Exception as e:
        print(f"❌ Erreur lors de l'export Excel: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def main():
    print("\n" + "=" * 60)
    print("TEST COMPLET DU WORKFLOW")
    print("=" * 60 + "\n")

    # Étape 1: Créer une visite
    print("ÉTAPE 1: Création d'une visite de test")
    print("-" * 60)
    visite_id = create_test_visit()

    if not visite_id:
        print("\n❌ Échec de la création de la visite. Arrêt du test.")
        sys.exit(1)

    # Étape 2: Valider la visite
    print("\n" + "=" * 60)
    print("ÉTAPE 2: Validation de la visite")
    print("-" * 60)
    success = validate_visit(visite_id)

    if not success:
        print("\n❌ Échec de la validation. Arrêt du test.")
        sys.exit(1)

    # Étape 3: Tester l'export Excel
    print("\n" + "=" * 60)
    print("ÉTAPE 3: Export Excel")
    print("-" * 60)
    success = test_excel_export()

    if success:
        print("\n" + "=" * 60)
        print("✅ ✅ ✅ TOUS LES TESTS RÉUSSIS ! ✅ ✅ ✅")
        print("=" * 60)
        print("\nLe fichier 'test_export.xlsx' a été généré.")
        print("Ouvrez-le pour vérifier qu'il correspond au format Book2.xlsx")
    else:
        print("\n❌ Échec de l'export Excel")
        sys.exit(1)


if __name__ == "__main__":
    main()
