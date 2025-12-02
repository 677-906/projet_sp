# Script pour forcer l'assignation d'un commercial
# Usage: python -m backend.force_assign_commercial

from sqlalchemy import text
from backend.app.database import SessionLocal

def force_assign():
    """Force l'assignation avec SQL brut."""
    db = SessionLocal()
    try:
        print("\n" + "="*80)
        print("FORCE ASSIGNATION COMMERCIAL")
        print("="*80 + "\n")

        # Vérifier l'état actuel
        result = db.execute(text("SELECT id, nom_client, commercial_id, commercial_nom FROM clients WHERE nom_client = 'ETS LOGISTIQUE'")).fetchone()

        if not result:
            print("[ERREUR] Client non trouve!")
            return

        print("AVANT:")
        print(f"  ID: {result[0]}")
        print(f"  Nom: {result[1]}")
        print(f"  commercial_id: {result[2]}")
        print(f"  commercial_nom: {result[3]}")

        # Forcer l'update
        db.execute(text("UPDATE clients SET commercial_id = 8 WHERE nom_client = 'ETS LOGISTIQUE'"))
        db.commit()

        print("\n[OK] UPDATE SQL execute!")

        # Vérifier après
        result = db.execute(text("SELECT id, nom_client, commercial_id, commercial_nom FROM clients WHERE nom_client = 'ETS LOGISTIQUE'")).fetchone()

        print("\nAPRES:")
        print(f"  ID: {result[0]}")
        print(f"  Nom: {result[1]}")
        print(f"  commercial_id: {result[2]}")
        print(f"  commercial_nom: {result[3]}")

        print("\n")

    except Exception as e:
        print(f"\n[ERREUR] {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    force_assign()
