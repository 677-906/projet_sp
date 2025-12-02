from app.database import SessionLocal
from app import models

db = SessionLocal()
user = db.query(models.User).filter(models.User.email == 'ali@projet-sp.com').first()

if user:
    print(f"User ID: {user.id}")
    print(f"User Name: {user.nom}")
    print(f"User Role: {user.role.nom if user.role else 'None'}")

    if user.responsable_profile:
        print(f"\nResponsable Profile ID: {user.responsable_profile.id}")
        print(f"Base: {user.responsable_profile.base}")
        print(f"Zone: {user.responsable_profile.zone}")
    else:
        print("\nNo responsable_profile found")
else:
    print("User not found")

db.close()
