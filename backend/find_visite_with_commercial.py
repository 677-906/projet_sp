# Script pour trouver une visite avec un commercial
# Usage: python -m backend.find_visite_with_commercial

from backend.app import models
from backend.app.database import SessionLocal

def find_visite_with_commercial():
    """Trouve une visite dont le client a un commercial."""
    db = SessionLocal()
    try:
        print("\n" + "="*80)
        print("RECHERCHE VISITE AVEC COMMERCIAL")
        print("="*80 + "\n")

        # Récupérer toutes les visites
        visites = db.query(models.Visite).all()

        print(f"Total visites: {len(visites)}\n")
        print("-" * 80)
        print(f"{'Visite ID':<12} {'Client':<30} {'commercial_id':<15} {'Commercial':<20}")
        print("-" * 80)

        visite_trouvee = None

        for visite in visites:
            client = visite.client
            commercial_id_str = str(client.commercial_id) if client.commercial_id else "NULL"
            commercial_nom = client.commercial.nom if (client and client.commercial) else "NULL"

            print(f"{visite.id:<12} {client.nom_client[:28]:<30} {commercial_id_str:<15} {commercial_nom:<20}")

            if client.commercial_id and not visite_trouvee:
                visite_trouvee = visite

        print("-" * 80)

        if visite_trouvee:
            print(f"\n[OK] Visite trouvee avec commercial: Visite ID {visite_trouvee.id}")
            print(f"     Client: {visite_trouvee.client.nom_client}")
            print(f"     Commercial: {visite_trouvee.client.commercial.nom}")
        else:
            print("\n[ATTENTION] Aucune visite avec commercial trouvee!")
            print("            Toutes les visites concernent des clients sans commercial.")

        print("\n")

    finally:
        db.close()

if __name__ == "__main__":
    find_visite_with_commercial()
