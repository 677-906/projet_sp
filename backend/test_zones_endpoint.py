# Test de l'endpoint /zones/

from app.main import app
from fastapi.testclient import TestClient
from app import models, database, security
from sqlalchemy.orm import Session

client = TestClient(app)

# Créer un token pour un merchandiser
db = Session(bind=database.engine)
user = db.query(models.User).filter(models.User.email == 'ayangma@projet-sp.com').first()

if not user:
    print("ERREUR: User merchandiser@sp.com non trouve")
    exit(1)

token = security.create_access_token(data={'sub': user.email})
print(f"Token cree pour: {user.email}")

# Tester l'endpoint /zones/
response = client.get('/zones/', headers={'Authorization': f'Bearer {token}'})

print(f"\nStatus Code: {response.status_code}")
print(f"Response: {response.json()}")

if response.status_code == 200:
    print("\nOK - L'endpoint fonctionne correctement!")
else:
    print("\nERREUR - L'endpoint ne fonctionne pas!")
