# Script pour assigner un commercial a un client
# Usage: python -m backend.assign_commercial

from backend.app import models
from backend.app.database import SessionLocal

def assign_commercial():
    """Assigne le commercial Esther (ID 8) au client ETS LOGISTIQUE."""
    db = SessionLocal()
    try:
        print("\n" + "="*80)
        print("ASSIGNATION COMMERCIAL")
        print("="*80 + "\n")

        # Récupérer le client
        client = db.query(models.Client).filter(models.Client.nom_client == "ETS LOGISTIQUE").first()

        if not client:
            print("[ERREUR] Client ETS LOGISTIQUE non trouve!")
            return

        # Récupérer le commercial Esther
        commercial = db.query(models.Commercial).filter(models.Commercial.nom == "Esther").first()

        if not commercial:
            print("[ERREUR] Commercial Esther non trouve!")
            return

        print(f"Client: {client.nom_client}")
        print(f"Commercial actuel: {client.commercial.nom if client.commercial else 'Aucun'}")
        print(f"\nNouveau commercial: {commercial.nom} (ID: {commercial.id})")

        # Assigner
        client.commercial_id = commercial.id
        db.commit()

        print("\n[OK] Commercial assigne avec succes!")
        print(f"     {client.nom_client} -> {commercial.nom}")

        # Vérifier
        db.refresh(client)
        print(f"\nVerification:")
        print(f"  client.commercial_id: {client.commercial_id}")
        print(f"  client.commercial.nom: {client.commercial.nom if client.commercial else 'N/A'}")

        print("\n")

    except Exception as e:
        print(f"\n[ERREUR] {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    assign_commercial()
