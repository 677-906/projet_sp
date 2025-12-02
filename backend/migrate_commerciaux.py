# Script pour migrer commercial_nom vers commercial_id
# Usage: python -m backend.migrate_commerciaux

from backend.app import models
from backend.app.database import SessionLocal

def migrate_commerciaux():
    """Migre les commercial_nom (LEGACY) vers commercial_id."""
    db = SessionLocal()
    try:
        print("\n" + "="*80)
        print("MIGRATION DES COMMERCIAUX (commercial_nom -> commercial_id)")
        print("="*80 + "\n")

        # Récupérer tous les clients avec commercial_nom mais sans commercial_id
        clients_a_migrer = db.query(models.Client).filter(
            models.Client.commercial_nom.isnot(None),
            models.Client.commercial_id.is_(None)
        ).all()

        if not clients_a_migrer:
            print("[INFO] Aucun client a migrer. Tous les clients utilisent deja commercial_id!")
            return

        print(f"Clients a migrer: {len(clients_a_migrer)}\n")

        # Récupérer tous les commerciaux disponibles
        commerciaux = {c.nom.lower().strip(): c for c in db.query(models.Commercial).all()}

        if not commerciaux:
            print("[ERREUR] Aucun commercial trouve dans la base de donnees!")
            print("         Impossible de faire la migration.")
            return

        print(f"Commerciaux disponibles: {len(commerciaux)}")
        for nom in commerciaux.keys():
            print(f"  - {nom} (ID: {commerciaux[nom].id})")

        print("\n" + "-" * 80)
        print("MIGRATION EN COURS...")
        print("-" * 80 + "\n")

        migrations_reussies = 0
        migrations_echouees = 0

        for client in clients_a_migrer:
            commercial_nom_key = client.commercial_nom.lower().strip()

            if commercial_nom_key in commerciaux:
                commercial = commerciaux[commercial_nom_key]
                print(f"[OK] Client '{client.nom_client}': '{client.commercial_nom}' -> Commercial ID {commercial.id}")
                client.commercial_id = commercial.id
                # On garde commercial_nom pour compatibilité si besoin
                migrations_reussies += 1
            else:
                print(f"[ECHEC] Client '{client.nom_client}': Commercial '{client.commercial_nom}' non trouve!")
                migrations_echouees += 1

        # Sauvegarder les modifications
        if migrations_reussies > 0:
            db.commit()
            print("\n" + "="*80)
            print("RESULTATS:")
            print(f"  Migrations reussies: {migrations_reussies}")
            print(f"  Migrations echouees: {migrations_echouees}")
            print("="*80 + "\n")
            print("[OK] Migration terminee avec succes!")

            if migrations_echouees > 0:
                print("\n[ATTENTION] Certains commerciaux n'ont pas ete trouves.")
                print("            Verifiez les noms et ajoutez-les manuellement si necessaire.")
        else:
            print("\n[INFO] Aucune migration effectuee.")

        print("\n")

    except Exception as e:
        print(f"\n[ERREUR] Une erreur est survenue: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_commerciaux()
