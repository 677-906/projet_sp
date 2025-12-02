# Script pour tester le detail de visite avec toutes les relations
# Usage: python -m backend.test_visite_detail_complete

from backend.app import models, schemas
from backend.app.database import SessionLocal
from sqlalchemy.orm import joinedload

def test_visite_detail():
    """Teste la serialisation d'une visite avec Pydantic."""
    db = SessionLocal()
    try:
        print("\n" + "="*80)
        print("TEST SERIALISATION VISITE DETAIL")
        print("="*80 + "\n")

        # Récupérer la visite 2 (ETS LOGISTIQUE) avec toutes les relations
        visite = (
            db.query(models.Visite)
            .options(
                joinedload(models.Visite.merchandiser).joinedload(models.Merchandiser.user),
                joinedload(models.Visite.merchandiser).joinedload(models.Merchandiser.chef_zone).joinedload(models.ChefZone.user),
                joinedload(models.Visite.client).joinedload(models.Client.commercial),
                joinedload(models.Visite.releves_stock).joinedload(models.ReleveStock.produit),
                joinedload(models.Visite.details_produits).joinedload(models.DetailVisiteProduit.produit),
                joinedload(models.Visite.veilles_concurrentielles).joinedload(models.VeilleConcurrentielle.concurrent)
            )
            .filter(models.Visite.id == 2)
            .first()
        )

        if not visite:
            print("[ERREUR] Visite 2 non trouvee!")
            return

        print("DONNEES CHARGEES DEPUIS LA BASE:")
        print("-" * 80)
        print(f"Visite ID: {visite.id}")
        print(f"Client: {visite.client.nom_client}")
        print(f"Client Zone: {visite.client.zone}")
        print(f"Client commercial_id: {visite.client.commercial_id}")

        if visite.client.commercial:
            print(f"Client commercial (ORM): {visite.client.commercial.nom}")
        else:
            print(f"Client commercial (ORM): NULL")

        print(f"\nMerchandiser: {visite.merchandiser.user.nom}")

        if visite.merchandiser.chef_zone:
            print(f"Chef de Zone: {visite.merchandiser.chef_zone.user.nom}")
            print(f"Zone: {visite.merchandiser.chef_zone.zone}")
        else:
            print(f"Chef de Zone: NULL")

        print("\n" + "="*80)
        print("TEST SERIALISATION PYDANTIC")
        print("="*80 + "\n")

        try:
            # Tenter de sérialiser avec le schéma VisiteDetail
            visite_detail = schemas.VisiteDetail.model_validate(visite)

            print("[OK] Serialisation Pydantic reussie!")

            # Vérifier le client.commercial
            print("\n" + "-" * 80)
            print("VERIFICATION CLIENT.COMMERCIAL:")
            print("-" * 80)

            if visite_detail.client.commercial:
                print(f"[OK] commercial present!")
                print(f"     ID: {visite_detail.client.commercial.id}")
                print(f"     Nom: {visite_detail.client.commercial.nom}")
            else:
                print(f"[PROBLEME] commercial absent (None)")

            # Vérifier merchandiser.chef_zone
            print("\n" + "-" * 80)
            print("VERIFICATION MERCHANDISER.CHEF_ZONE:")
            print("-" * 80)

            if visite_detail.merchandiser.chef_zone:
                print(f"[OK] chef_zone present!")
                print(f"     ID: {visite_detail.merchandiser.chef_zone.id}")
                print(f"     Nom: {visite_detail.merchandiser.chef_zone.user.nom}")
                print(f"     Zone: {visite_detail.merchandiser.chef_zone.zone}")
            else:
                print(f"[PROBLEME] chef_zone absent (None)")

            # Convertir en dict pour voir le JSON
            print("\n" + "-" * 80)
            print("PREVIEW JSON (extrait):")
            print("-" * 80)

            visite_dict = visite_detail.model_dump()

            print(f"client.nom_client: {visite_dict['client']['nom_client']}")
            print(f"client.zone: {visite_dict['client']['zone']}")
            print(f"client.commercial: {visite_dict['client'].get('commercial', 'CLE ABSENTE')}")

            print(f"\nmerchandiser.user.nom: {visite_dict['merchandiser']['user']['nom']}")
            print(f"merchandiser.chef_zone: {visite_dict['merchandiser'].get('chef_zone', 'CLE ABSENTE')}")

        except Exception as e:
            print(f"[ERREUR] Echec serialisation Pydantic: {str(e)}")
            import traceback
            traceback.print_exc()

        print("\n")

    finally:
        db.close()

if __name__ == "__main__":
    test_visite_detail()
