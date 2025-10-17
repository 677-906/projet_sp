-- Ce script met à jour la base de données pour qu'elle corresponde aux nouvelles fonctionnalités.
-- Exécutez ces commandes sur votre base de données PostgreSQL.

-- Commande 1: Ajoute la colonne 'zone' à la table des superviseurs
ALTER TABLE superviseurs ADD COLUMN zone VARCHAR(100);

-- Commande 2: Ajoute la colonne 'zone' à la table des clients
ALTER TABLE clients ADD COLUMN zone VARCHAR(100);

-- Commande 3: Ajoute la colonne 'lieu_dit' (secteur) à la table des clients
ALTER TABLE clients ADD COLUMN lieu_dit VARCHAR(255);

-- Commande 4: Ajoute la colonne 'commercial_nom' à la table des clients
ALTER TABLE clients ADD COLUMN commercial_nom VARCHAR(100);

-- Commande 5: Supprime l'ancienne colonne 'zone_geographique' de la table des merchandisers
ALTER TABLE merchandisers DROP COLUMN zone_geographique;

-- NOTE: Après avoir exécuté ces commandes, l'application devrait fonctionner correctement.