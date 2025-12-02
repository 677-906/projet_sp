"""
Script de test pour vérifier le workflow de sélection du superviseur
basé sur le réseau de distribution MT.
"""

import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"

def test_superviseur_workflow():
    print("=== TEST DU WORKFLOW SUPERVISEUR ===\n")

    # 1. Connexion en tant qu'admin
    print("1. Connexion en tant qu'admin...")
    login_response = requests.post(
        f"{BASE_URL}/token",
        data={
            "username": "admin@gmail.com",
            "password": "admin237"
        }
    )

    if login_response.status_code != 200:
        print("❌ Échec de la connexion")
        print(login_response.text)
        return

    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Connexion réussie\n")

    # 2. Vérifier s'il existe un responsable
    print("2. Récupération des responsables...")
    responsables_response = requests.get(f"{BASE_URL}/responsables/", headers=headers)

    if responsables_response.status_code == 200 and responsables_response.json():
        responsables = responsables_response.json()
        responsable_id = responsables[0]["id"]
        print(f"✅ Responsable trouvé (ID: {responsable_id})\n")
    else:
        print("❌ Aucun responsable trouvé. Créez un responsable d'abord.")
        return

    # 3. Créer un superviseur pour la zone DOUALA 4
    print("3. Création d'un superviseur pour la zone DOUALA 4...")
    superviseur_data = {
        "nom": "Jean-Paul Mbarga",
        "email": "jp.mbarga@sp.com",
        "password": "supervisor123",
        "role_nom": "Chef de Zone",
        "zone": "DOUALA 4",
        "responsable_id": responsable_id,
        "est_superviseur": True
    }

    superviseur_response = requests.post(
        f"{BASE_URL}/admin/full-user",
        json=superviseur_data,
        headers=headers
    )

    if superviseur_response.status_code == 200:
        superviseur = superviseur_response.json()
        print(f"✅ Superviseur créé: {superviseur['nom']}")
        print(f"   Zone: DOUALA 4")
        print(f"   Est superviseur: True\n")
    else:
        # Peut-être que le superviseur existe déjà
        print("⚠️ Le superviseur existe peut-être déjà, continuons...\n")

    # 4. Tester l'endpoint /zone/{zone}/superviseur
    print("4. Test de l'endpoint GET /zone/DOUALA%204/superviseur...")
    zone_superviseur_response = requests.get(
        f"{BASE_URL}/zone/DOUALA 4/superviseur",
        headers=headers
    )

    if zone_superviseur_response.status_code == 200:
        superviseur_data = zone_superviseur_response.json()
        print("✅ Superviseur récupéré avec succès:")
        print(f"   Nom: {superviseur_data['user']['nom']}")
        print(f"   Zone: {superviseur_data['zone']}")
        print(f"   Est superviseur: {superviseur_data['est_superviseur']}\n")
    else:
        print(f"❌ Erreur lors de la récupération du superviseur")
        print(f"   Status: {zone_superviseur_response.status_code}")
        print(f"   Message: {zone_superviseur_response.text}\n")

    # 5. Vérifier l'endpoint /superviseurs/
    print("5. Test de l'endpoint GET /superviseurs/...")
    all_superviseurs_response = requests.get(
        f"{BASE_URL}/superviseurs/",
        headers=headers
    )

    if all_superviseurs_response.status_code == 200:
        superviseurs = all_superviseurs_response.json()
        print(f"✅ {len(superviseurs)} superviseur(s) trouvé(s):")
        for sup in superviseurs:
            print(f"   - {sup['user']['nom']} (Zone: {sup['zone']})")
        print()
    else:
        print(f"❌ Erreur lors de la récupération des superviseurs\n")

    # 6. Créer un client GMS pour tester
    print("6. Création d'un client GMS de test...")
    client_data = {
        "nom_client": "CARREFOUR AKWA",
        "typologie": "Hypermarché",
        "localisation": "Akwa, Douala",
        "zone": "DOUALA 4",
        "est_gms": True
    }

    client_response = requests.post(
        f"{BASE_URL}/admin/clients/",
        json=client_data,
        headers=headers
    )

    if client_response.status_code == 200:
        client = client_response.json()
        print(f"✅ Client GMS créé: {client['nom_client']}")
        print(f"   Zone: {client['zone']}")
        print(f"   Est GMS: {client.get('est_gms', False)}\n")
    else:
        print("⚠️ Le client existe peut-être déjà\n")

    print("=== TEST TERMINÉ ===")
    print("\n📱 INSTRUCTIONS POUR L'APP MOBILE:")
    print("1. Ouvrez l'app mobile et connectez-vous en tant que merchandiser")
    print("2. Créez une nouvelle visite pour le client 'CARREFOUR AKWA'")
    print("3. Dans la section 'Informations Client', sélectionnez 'MT (Moderne Trade)' comme réseau de distribution")
    print("4. Le champ 'Chef de Zone' devrait automatiquement devenir 'Superviseur'")
    print("5. Le nom 'Jean-Paul Mbarga' devrait s'afficher automatiquement")

if __name__ == "__main__":
    try:
        test_superviseur_workflow()
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur backend")
        print("   Assurez-vous que le serveur est démarré: uvicorn app.main:app --reload")
    except Exception as e:
        print(f"❌ Erreur: {e}")
