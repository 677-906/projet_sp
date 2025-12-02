-- Migration: Ajout du champ sous_zone aux tables chefs_zone et clients
-- Date: 2025
-- Description: Ajoute le champ sous_zone (optionnel) pour permettre une hiérarchie zone -> sous-zone

-- Ajout de la colonne sous_zone à la table chefs_zone
ALTER TABLE chefs_zone ADD COLUMN IF NOT EXISTS sous_zone VARCHAR(100);

-- Ajout de la colonne sous_zone à la table clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sous_zone VARCHAR(100);

-- Commentaires pour la documentation
COMMENT ON COLUMN chefs_zone.sous_zone IS 'Sous-zone optionnelle au sein de la zone principale';
COMMENT ON COLUMN clients.sous_zone IS 'Sous-zone optionnelle au sein de la zone principale';

-- Afficher les résultats
SELECT 'Migration terminée: colonne sous_zone ajoutée aux tables chefs_zone et clients' AS status;
