"""
Script de test pour vérifier que toutes les routes API fonctionnent
"""
import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import json

API_URL = "http://192.168.88.242:8000"

def test_login():
    """Test de connexion"""
    print("🔐 Test de connexion...")
    response = requests.post(f"{API_URL}/token", data={
        "username": "merch@example.com",  # Email merchandiser de test
        "password": "password"
    })
    if response.status_code == 200:
        print("✅ Connexion réussie")
        return response.json()["access_token"]
    else:
        print(f"❌ Échec connexion: {response.status_code}")
        return None

def test_get_clients(token):
    """Test récupération des clients"""
    print("\n👥 Test récupération clients...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/clients/", headers=headers)
    if response.status_code == 200:
        clients = response.json()
        print(f"✅ {len(clients)} clients récupérés")
        return clients[0] if clients else None
    else:
        print(f"❌ Échec: {response.status_code}")
        return None

def test_get_produits(token):
    """Test récupération des produits"""
    print("\n📦 Test récupération produits...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/produits/", headers=headers)
    if response.status_code == 200:
        produits = response.json()
        print(f"✅ {len(produits)} produits récupérés")
        for p in produits[:5]:
            print(f"   - {p.get('article', p.get('nom_produit'))}")
        return produits
    else:
        print(f"❌ Échec: {response.status_code}")
        return None

def test_get_concurrents(token):
    """Test récupération des concurrents"""
    print("\n🏢 Test récupération concurrents...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/concurrents/", headers=headers)
    if response.status_code == 200:
        concurrents = response.json()
        print(f"✅ {len(concurrents)} concurrents récupérés")
        return concurrents
    else:
        print(f"❌ Échec: {response.status_code}")
        return None

def test_submit_visite(token, client_id, concurrent_id):
    """Test soumission d'une visite"""
    print("\n📝 Test soumission visite...")
    headers = {"Authorization": f"Bearer {token}"}

    visite_data = {
        "client_id": client_id,
        "fifo_respecte": True,
        "planogramme_respecte": True,
        "observations_generales": "Test observation",
        "heure_debut": "10:00",
        "heure_fin": "11:00",
        "base": "DOUALA",
        "type_outil": "FRIGO",
        "marque_outil": "SUPERMONT",
        "etat_outil": "BON ETAT",
        "ruptures": "",
        "type_rupture": "",
        "type_incidents": "",
        "articles_incidents": "",
        "quantite_incidents": None,
        "observation_planogramme": "",
        "reseau_distribution": "TT",
        "type_client": "DIRECT",
        "client_direct_nom": "",
        "releves_stock": [],
        "details_produits": [],
        "veilles_concurrentielles": [
            {
                "concurrent_id": concurrent_id,
                "marque": "SP",
                "nombre_packs": 10,
                "activite_observee": "Test",
                "mecanisme": "Test mécanisme"
            }
        ]
    }

    response = requests.post(f"{API_URL}/visites/", headers=headers, json=visite_data)
    if response.status_code in [200, 201]:
        print("✅ Visite soumise avec succès")
        return response.json()
    else:
        print(f"❌ Échec: {response.status_code}")
        print(f"   Détails: {response.text}")
        return None

if __name__ == "__main__":
    print("=" * 50)
    print("🧪 TEST API - Rapport de Visite Merchandiser")
    print("=" * 50)

    # 1. Test connexion
    token = test_login()
    if not token:
        print("\n❌ Impossible de continuer sans token")
        exit(1)

    # 2. Test récupération clients
    client = test_get_clients(token)
    if not client:
        print("\n⚠️ Pas de clients disponibles")
        client_id = 1  # Valeur par défaut
    else:
        client_id = client["id"]

    # 3. Test récupération produits
    produits = test_get_produits(token)

    # 4. Test récupération concurrents
    concurrents = test_get_concurrents(token)
    if not concurrents:
        print("\n⚠️ Pas de concurrents disponibles")
        concurrent_id = 1
    else:
        concurrent_id = concurrents[0]["id"]

    # 5. Test soumission visite
    visite = test_submit_visite(token, client_id, concurrent_id)

    print("\n" + "=" * 50)
    if visite:
        print("✅ TOUS LES TESTS RÉUSSIS")
    else:
        print("⚠️ CERTAINS TESTS ONT ÉCHOUÉ")
    print("=" * 50)
