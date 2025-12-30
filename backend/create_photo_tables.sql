-- Script SQL pour créer les tables de photos équipements et incidents
-- À exécuter sur la base de données SP_db

-- Table pour les photos d'équipements
CREATE TABLE IF NOT EXISTS photos_equipement (
    id SERIAL PRIMARY KEY,
    visite_id INTEGER NOT NULL REFERENCES visites(id) ON DELETE CASCADE,
    equipment_key VARCHAR(200) NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photos_equipement_visite_id ON photos_equipement(visite_id);

-- Table pour les photos d'incidents
CREATE TABLE IF NOT EXISTS photos_incident (
    id SERIAL PRIMARY KEY,
    visite_id INTEGER NOT NULL REFERENCES visites(id) ON DELETE CASCADE,
    incident_key VARCHAR(200) NOT NULL,
    photo_index INTEGER NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photos_incident_visite_id ON photos_incident(visite_id);

-- Vérifier que tout s'est bien passé
SELECT 'Tables créées avec succès!' AS message;
