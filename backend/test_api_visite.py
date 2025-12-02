# Script pour tester l'API de detail de visite
# Usage: python -m backend.test_api_visite

import requests
import json
from backend.app import models
from backend.app.database import SessionLocal

def test_visite_api():
    """Teste l'API de detail de visite."""
    db = SessionLocal()
    try:
        # Récupérer une visite existante
        visite = db.query(models.Visite).first()

        if not visite:
            print("[ERREUR] Aucune visite trouvee dans la base de donnees!")
            return

        print("\n" + "="*80)
        print(f"TEST API - DETAIL VISITE ID {visite.id}")
        print("="*80 + "\n")

        # Afficher les infos de la visite depuis la base de données
        print("DONNEES BASE DE DONNEES:")
        print("-" * 80)
        print(f"Visite ID: {visite.id}")
        print(f"Merchandiser: {visite.merchandiser.user.nom if visite.merchandiser and visite.merchandiser.user else 'N/A'}")
        print(f"Client: {visite.client.nom_client if visite.client else 'N/A'}")
        print(f"Client Zone: {visite.client.zone if visite.client else 'N/A'}")
        print(f"Client commercial_id: {visite.client.commercial_id if visite.client else 'N/A'}")
        print(f"Client commercial_nom (LEGACY): {visite.client.commercial_nom if visite.client else 'N/A'}")

        if visite.client and visite.client.commercial:
            print(f"Commercial (relation): {visite.client.commercial.nom}")
        else:
            print(f"Commercial (relation): NULL (pas de relation)")

        if visite.merchandiser and visite.merchandiser.chef_zone:
            print(f"Chef de Zone: {visite.merchandiser.chef_zone.user.nom if visite.merchandiser.chef_zone.user else 'N/A'}")
            print(f"Zone: {visite.merchandiser.chef_zone.zone}")
        else:
            print(f"Chef de Zone: N/A (pas de relation)")

        print("\n" + "="*80)
        print("TEST API ENDPOINT")
        print("="*80 + "\n")

        # Tester l'endpoint API (sans authentification pour ce test)
        # Note: En production, il faudrait s'authentifier
        url = f"http://127.0.0.1:8000/visites/{visite.id}"

        print(f"URL: {url}")
        print("\nTentative de connexion a l'API...\n")

        try:
            response = requests.get(url, timeout=5)

            if response.status_code == 401:
                print("[INFO] Authentification requise (normal)")
                print("      L'API fonctionne, mais necessite un token.")
            elif response.status_code == 200:
                print("[OK] API accessible!")
                data = response.json()
                print("\nRESPONSE JSON:")
                print("-" * 80)
                print(json.dumps(data, indent=2, ensure_ascii=False))
                print("-" * 80)

                # Vérifier si le commercial est présent
                if 'client' in data and 'commercial' in data['client'] and data['client']['commercial']:
                    print("\n[OK] Commercial present dans la reponse!")
                    print(f"     Nom: {data['client']['commercial']['nom']}")
                else:
                    print("\n[PROBLEME] Commercial absent de la reponse!")
                    if 'client' in data:
                        print(f"Client data: {data['client']}")

                # Vérifier merchandiser.chef_zone
                if 'merchandiser' in data and 'chef_zone' in data['merchandiser'] and data['merchandiser']['chef_zone']:
                    print("\n[OK] Chef de Zone present dans la reponse!")
                    print(f"     Nom: {data['merchandiser']['chef_zone']['user']['nom']}")
                    print(f"     Zone: {data['merchandiser']['chef_zone']['zone']}")
                else:
                    print("\n[PROBLEME] Chef de Zone absent de la reponse!")

            else:
                print(f"[ERREUR] Statut HTTP: {response.status_code}")
                print(f"Response: {response.text}")

        except requests.exceptions.ConnectionError:
            print("[ERREUR] Impossible de se connecter a l'API!")
            print("         Le backend est-il demarre? (uvicorn app.main:app --reload)")
        except Exception as e:
            print(f"[ERREUR] Exception: {str(e)}")

        print("\n")

    finally:
        db.close()

if __name__ == "__main__":
    test_visite_api()
