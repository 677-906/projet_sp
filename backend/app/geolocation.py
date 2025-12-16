# Fichier: app/geolocation.py - Calcul de distance GPS (Haversine)

import math
from typing import Optional, Tuple

# Seuil de distance pour considérer le merchandiser "sur site" (en mètres)
SEUIL_DISTANCE_SUR_SITE = 25


def calculer_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcule la distance en mètres entre deux points GPS (formule de Haversine).
    """
    R = 6371000  # Rayon de la Terre en mètres

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) ** 2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return round(R * c, 2)


def verifier_presence_sur_site(
    lat_client: Optional[float],
    lon_client: Optional[float],
    lat_merchandiser: Optional[float],
    lon_merchandiser: Optional[float],
    seuil: float = SEUIL_DISTANCE_SUR_SITE
) -> Tuple[Optional[float], Optional[bool]]:
    """
    Verifie si le merchandiser est sur site.

    Returns:
        (distance_en_metres, est_sur_site) ou (None, None) si calcul impossible
    """
    if None in (lat_client, lon_client, lat_merchandiser, lon_merchandiser):
        return (None, None)

    distance = calculer_distance(lat_client, lon_client, lat_merchandiser, lon_merchandiser)
    est_sur_site = distance <= seuil

    return (distance, est_sur_site)
