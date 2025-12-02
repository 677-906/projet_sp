# Script pour verifier un client specifique
# Usage: python -m backend.check_client_specific

from backend.app import models
from backend.app.database import SessionLocal

def check_client_specific():
    """Verifie le client ETS LOGISTIQUE."""
    db = SessionLocal()
    try:
        print("\n" + "="*80)
        print("VERIFICATION CLIENT ETS LOGISTIQUE")
        print("="*80 + "\n")

        client = db.query(models.Client).filter(models.Client.nom_client == "ETS LOGISTIQUE").first()

        if not client:
            print("[ERREUR] Client ETS LOGISTIQUE non trouve!")
            return

        print(f"Client ID: {client.id}")
        print(f"Nom: {client.nom_client}")
        print(f"Zone: {client.zone}")
        print(f"commercial_id: {client.commercial_id}")
        print(f"commercial_nom (LEGACY): {client.commercial_nom}")

        print("\n" + "-" * 80)
        print("RELATION COMMERCIAL:")
        print("-" * 80)

        if client.commercial_id:
            # Charger explicitement la relation
            commercial = db.query(models.Commercial).filter(models.Commercial.id == client.commercial_id).first()
            if commercial:
                print(f"[OK] Commercial trouve!")
                print(f"     ID: {commercial.id}")
                print(f"     Nom: {commercial.nom}")
                print(f"     Chef Zone ID: {commercial.chef_zone_id}")
            else:
                print(f"[ERREUR] Commercial ID {client.commercial_id} n'existe pas!")
        else:
            print("[INFO] Aucun commercial_id assigne")

        # Tester l'accès via la relation
        print("\n" + "-" * 80)
        print("TEST RELATION ORM:")
        print("-" * 80)

        try:
            if client.commercial:
                print(f"[OK] client.commercial accessible: {client.commercial.nom}")
            else:
                print(f"[PROBLEME] client.commercial est None/NULL")
        except Exception as e:
            print(f"[ERREUR] Exception lors de l'acces a client.commercial: {str(e)}")

        print("\n")

    finally:
        db.close()

if __name__ == "__main__":
    check_client_specific()
