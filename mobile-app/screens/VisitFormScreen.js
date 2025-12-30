import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Switch, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axiosInstance, { uploadFile } from '../api/axiosConfig';
import LightPicker from '../components/LightPicker';
import * as ImagePicker from 'expo-image-picker';




// Structure des groupes de marques pour la veille concurrentielle
const MARQUES_VEILLE_STRUCTURE = [
  {
    groupName: '',
    marques: ['SP', 'OP', 'VITAL', 'TANGUI', 'MADIBA', 'CEILO', 'SANO', 'AQUABELLE', 'ULTIME LIGHT', 'VALCLAIR']
  },
  {
    groupName: 'BG',
    marques: ['BG SP', 'BG BC', 'BG ELIM', 'BG GRACEDOM', 'BG UCB', 'BG BRASAF']
  },
  {
    groupName: 'ED',
    marques: ['ED SP', 'ED BC', 'ED ELIM']
  },
  {
    groupName: 'AUTRES',
    marques: ['AUTRES', 'AUTRES BG', 'AUTRES ED']
  }
];

// Composant pour une ligne de veille
const VeilleMarqueRow = React.memo(({ marque, veilleData, handleUpdateVeille, concurrentsForPicker }) => (
  <View style={styles.tableDataRow}>
    <Text style={[styles.tableCell, { width: 120 }]}>{marque}</Text>
    <TextInput
      style={[styles.tableInput, { width: 80 }]}
      keyboardType="numeric"
      value={veilleData?.packs || ''}
      onChangeText={(value) => handleUpdateVeille(marque, 'packs', value)}
      scrollEnabled={false}
    />
    <View style={{ width: 150 }}>
      <LightPicker
        onValueChange={(value) => handleUpdateVeille(marque, 'concurrent', value)}
        items={concurrentsForPicker}
        placeholder={{ label: "...", value: null }}
        value={veilleData?.concurrent}
      />
    </View>
    <TextInput
      style={[styles.tableInput, { width: 150 }]}
      value={veilleData?.activite || ''}
      onChangeText={(value) => handleUpdateVeille(marque, 'activite', value)}
      multiline={false}
      scrollEnabled={false}
      blurOnSubmit={true}
    />
    <TextInput
      style={[styles.tableInput, { width: 150 }]}
      value={veilleData?.mecanisme || ''}
      onChangeText={(value) => handleUpdateVeille(marque, 'mecanisme', value)}
      multiline={false}
      scrollEnabled={false}
      blurOnSubmit={true}
    />
  </View>
));

// Composant pour un groupe accordéon
const VeilleGroupeAccordion = React.memo(({ group, groupIndex, veillesData, handleUpdateVeille, concurrentsForPicker, groupTotal }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const groupTitle = group.groupName ? `Groupe ${group.groupName}` : 'Marques Principales';

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.accordionHeader}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={24}
            color="#007bff"
          />
          <Text style={styles.accordionTitle}>{groupTitle}</Text>
          <Text style={styles.accordionTotal}>Total: {groupTotal} packs</Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={true}
          removeClippedSubviews={true}
          nestedScrollEnabled={true}
        >
          <View>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: 120 }]}>MARQUES</Text>
              <Text style={[styles.tableHeaderCell, { width: 80 }]}>PACKS</Text>
              <Text style={[styles.tableHeaderCell, { width: 150 }]}>CONCURRENT</Text>
              <Text style={[styles.tableHeaderCell, { width: 150 }]}>ACTIVITE</Text>
              <Text style={[styles.tableHeaderCell, { width: 150 }]}>MECANISME</Text>
            </View>

            {group.marques.map((marque) => (
              <VeilleMarqueRow
                key={marque}
                marque={marque}
                veilleData={veillesData[marque]}
                handleUpdateVeille={handleUpdateVeille}
                concurrentsForPicker={concurrentsForPicker}
              />
            ))}

            <View style={styles.tableTotalRow}>
              <Text style={[styles.tableTotalCell, { width: 120 }]}>
                TOTAL{group.groupName ? ' ' + group.groupName : ''}
              </Text>
              <Text style={[styles.tableTotalCell, { width: 80 }]}>
                {groupTotal}
              </Text>
              <Text style={[styles.tableTotalCell, { width: 150 }]}></Text>
              <Text style={[styles.tableTotalCell, { width: 150 }]}></Text>
              <Text style={[styles.tableTotalCell, { width: 150 }]}></Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
});

export default function VisitFormScreen({ route, navigation }) {
  const { clientId: clientIdParam, clientName: clientNameParam, zone: zoneFromParams, visitId } = route.params || {};
  const isEditMode = !!visitId;
  const insets = useSafeAreaInsets();


  // ===== STEP MANAGEMENT =====
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4; // Mise à jour du nombre total d'étapes
    const stepLabels = ['Infos', 'Équipements', 'Stocks & Veille', 'Photos']; // Mise à jour des labels


  const [photoAvant, setPhotoAvant] = useState(null);
  const [photoApres, setPhotoApres] = useState(null);

  // ===== CLIENT INFO =====
  const [clientId, setClientId] = useState(clientIdParam);
  const [clientName, setClientName] = useState(clientNameParam);

  // ===== STEP 1: BASIC INFO =====
  const [zone, setZone] = useState(zoneFromParams || '');
  const [reseauDistribution, setReseauDistribution] = useState('');
  const [selectedChefZone, setSelectedChefZone] = useState(null);
  const [selectedSuperviseur, setSelectedSuperviseur] = useState(null);
  const [selectedCommercial, setSelectedCommercial] = useState(null);
  const [lieuDit, setLieuDit] = useState('');
  // Heure de début = heure actuelle au chargement du formulaire
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };
  const [heureDebut, setHeureDebut] = useState(getCurrentTime());
  const [heureFin, setHeureFin] = useState('');
  const [base, setBase] = useState('DOUALA');

  // ===== STEP 2: EQUIPMENT & COMPLIANCE =====
  const [equipements, setEquipements] = useState([]);
  const [fifo, setFifo] = useState(true);
  const [planogramme, setPlanogramme] = useState(true);
  const [observationPlanogramme, setObservationPlanogramme] = useState('');
  const [ruptures, setRuptures] = useState([]);
  const [incidents, setIncidents] = useState([]);

  // ===== STEP 3: VEILLE & OBSERVATIONS =====
  const [veillesData, setVeillesData] = useState({});
  const [typeClient, setTypeClient] = useState('DIRECT');
  const [clientDirectNom, setClientDirectNom] = useState(clientNameParam || '');
  const [observations, setObservations] = useState('');

  // ===== STEP 4: PHOTOS RAYON =====
  // Chaque type de rayon contient un tableau de rayons individuels
  const [photosRayon, setPhotosRayon] = useState({
    'Rayon Froid': [{ avant: null, apres: null }],
    'Rayon Ordinaire': [{ avant: null, apres: null }]
  });



  // --- NOUVEAU COMPOSANT POUR L'ÉTAPE 4: PHOTOS ---
const Step4Photos = ({ photoAvant, photoApres, onTakePhoto }) => (
  <ScrollView contentContainerStyle={styles.stepContentContainer}>
    <Text style={styles.sectionTitle}>📸 Photos du Rayon</Text>
    <View style={styles.photoContainer}>
      <TouchableOpacity onPress={() => onTakePhoto('avant')} style={styles.photoBox}>
        {!photoAvant ? (
          <>
            <Ionicons name="camera-outline" size={40} color="#007bff" />
            <Text style={styles.photoBoxText}>Prendre photo AVANT</Text>
          </>
        ) : (
          <Image source={{ uri: photoAvant.uri }} style={styles.photoPreview} />
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onTakePhoto('apres')} style={styles.photoBox}>
        {!photoApres ? (
          <>
            <Ionicons name="camera-reverse-outline" size={40} color="#28a745" />
            <Text style={styles.photoBoxText}>Prendre photo APRÈS</Text>
          </>
        ) : (
          <Image source={{ uri: photoApres.uri }} style={styles.photoPreview} />
        )}
      </TouchableOpacity>
    </View>
  </ScrollView>
);
// ----------------------------------------------------

  // ===== PICKER DATA =====
  const [chefsZone, setChefsZone] = useState([]);
  const [commerciaux, setCommerciaux] = useState([]);
  const [articlesForPicker, setArticlesForPicker] = useState([]);
  const [concurrentsForPicker, setConcurrentsForPicker] = useState([]);

  // ===== EDIT MODE DATA =====
  const [stocksExistants, setStocksExistants] = useState([]);
  const [commandesExistantes, setCommandesExistantes] = useState([]);
  const [commentaireRejet, setCommentaireRejet] = useState('');

  // ===== LOADING STATES =====
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== AUTO-SAVE =====
  const STORAGE_KEY = `visit_draft_${clientIdParam}_${visitId || 'new'}`;
  const autoSaveIntervalRef = useRef(null);

  // Fonction pour sauvegarder les données du formulaire
  const saveFormData = async () => {
    try {
      const formData = {
        reseauDistribution,
        heureDebut,
        equipements,
        fifo,
        planogramme,
        observationPlanogramme,
        ruptures,
        incidents,
        veillesData,
        typeClient,
        clientDirectNom,
        observations,
        savedAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      console.log('[AUTO-SAVE] Données sauvegardées à', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('[AUTO-SAVE] Erreur de sauvegarde:', error);
    }
  };


  const takePhoto = async (type) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert("L'accès à la caméra est requis !");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!result.canceled) {
      if (type === 'avant') setPhotoAvant(result.assets[0]);
      else setPhotoApres(result.assets[0]);
    }
  };



  // Fonction pour charger les données sauvegardées
  const loadSavedFormData = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const data = JSON.parse(savedData);
        const savedTime = new Date(data.savedAt).toLocaleString();

        Alert.alert(
          'Données récupérées',
          `Une sauvegarde du ${savedTime} a été trouvée. Voulez-vous reprendre où vous en étiez ?`,
          [
            {
              text: 'Non, recommencer',
              style: 'cancel',
              onPress: () => AsyncStorage.removeItem(STORAGE_KEY)
            },
            {
              text: 'Oui, restaurer',
              onPress: () => {
                // Restaurer toutes les données
                if (data.reseauDistribution) setReseauDistribution(data.reseauDistribution);
                if (data.heureDebut) setHeureDebut(data.heureDebut);
                if (data.equipements) setEquipements(data.equipements);
                if (data.fifo !== undefined) setFifo(data.fifo);
                if (data.planogramme !== undefined) setPlanogramme(data.planogramme);
                if (data.observationPlanogramme) setObservationPlanogramme(data.observationPlanogramme);
                if (data.ruptures) setRuptures(data.ruptures);
                if (data.incidents) setIncidents(data.incidents);
                if (data.veillesData) setVeillesData(data.veillesData);
                if (data.typeClient) setTypeClient(data.typeClient);
                if (data.clientDirectNom) setClientDirectNom(data.clientDirectNom);
                if (data.observations) setObservations(data.observations);
                console.log('[AUTO-SAVE] Données restaurées');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('[AUTO-SAVE] Erreur de chargement:', error);
    }
  };

  // Fonction pour effacer la sauvegarde (après soumission réussie)
  const clearSavedFormData = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('[AUTO-SAVE] Sauvegarde effacée');
    } catch (error) {
      console.error('[AUTO-SAVE] Erreur suppression:', error);
    }
  };

  // ===== COUNTERS FOR UNIQUE KEYS =====
  const equipKeyCounter = useRef(0);
  const ruptureKeyCounter = useRef(0);
  const incidentKeyCounter = useRef(0);

  // ===== OPTIONS =====
  const typeOutilOptions = [
    { label: 'FRIGO', value: 'FRIGO' },
    { label: 'VITRINE', value: 'VITRINE' },
    { label: 'PLAQUE BRANDEE', value: 'PLAQUE BRANDEE' },
    { label: 'PARASOL', value: 'PARASOL' },
    { label: 'GLACIERE', value: 'GLACIERE' },
    { label: 'AUTRE', value: 'AUTRE' },
  ];

  const marqueOptions = [
    { label: 'SUPERMONT', value: 'SUPERMONT' },
    { label: 'OPUR', value: 'OPUR' },
    { label: 'AMERICAN COLA', value: 'AMERICAN COLA' },
    { label: 'BUBBLE UP', value: 'BUBBLE UP' },
    { label: 'PLANET', value: 'PLANET' },
    { label: 'REAKTOR', value: 'REAKTOR' },
    { label: 'CAPRISUN', value: 'CAPRISUN' },
    { label: 'AYANA', value: 'AYANA' },
  ];

  const etatOptions = [
    { label: 'BON ETAT', value: 'BON ETAT' },
    { label: 'MOYEN', value: 'MOYEN' },
    { label: 'MAUVAIS ETAT', value: 'MAUVAIS ETAT' },
  ];

  const typeIncidentOptions = [
    { label: 'PEREMPTION 2 MOIS', value: 'PEREMPTION 2 MOIS' },
    { label: 'SANS GAZ', value: 'SANS GAZ' },
    { label: 'BOUCHON', value: 'BOUCHON' },
    { label: 'PERIME', value: 'PERIME' },
    { label: 'ETIQUETTES DECOLLEES', value: 'ETIQUETTES DECOLLEES' },
    { label: 'BOUTEILLES CASSEES', value: 'BOUTEILLES CASSEES' },
    { label: 'AUTRES', value: 'AUTRES' }
  ];

  // ===== LOAD INITIAL DATA =====
  useEffect(() => {
    // En mode édition, on n'a pas besoin de clientId au départ (on le récupère de la visite)
    if (!clientId && !isEditMode) return;

    const fetchData = async () => {
      try {
        console.log('[DEBUG] fetchData - clientId:', clientId, 'visitId:', visitId, 'isEditMode:', isEditMode);

        // En mode édition sans clientId, charger d'abord la visite pour récupérer le client
        let actualClientId = clientId;
        let visitData = null;

        if (isEditMode && visitId) {
          console.log('[DEBUG] Mode édition - Chargement visite en premier:', visitId);
          const visitRes = await axiosInstance.get(`/visites/${visitId}`);
          visitData = visitRes.data;
          console.log('[DEBUG] Visite chargée:', visitData?.client?.nom_client);

          if (visitData && visitData.client) {
            actualClientId = visitData.client.id || visitData.client_id;
            setClientId(actualClientId);
            setClientName(visitData.client.nom_client || '');
            setZone(visitData.client.zone || '');
          }
        }

        // Charger les données de référence (produits, concurrents, etc.)
        console.log('[DEBUG] Chargement des données de référence...');

        // Charger chaque donnée séparément pour éviter qu'un échec bloque tout
        let chefsZoneRes = { data: [] };
        let produitsRes = { data: [] };
        let concurrentsRes = { data: [] };
        let clientRes = null;

        try {
          chefsZoneRes = await axiosInstance.get('/chefs-zone/');
          console.log('[DEBUG] Chefs zone chargés:', chefsZoneRes.data?.length);
        } catch (e) {
          console.error('[ERROR] Chargement chefs zone:', e.message);
        }

        try {
          produitsRes = await axiosInstance.get('/produits/');
          console.log('[DEBUG] Produits chargés:', produitsRes.data?.length);
        } catch (e) {
          console.error('[ERROR] Chargement produits:', e.message);
        }

        try {
          concurrentsRes = await axiosInstance.get('/concurrents/');
          console.log('[DEBUG] Concurrents chargés:', concurrentsRes.data?.length);
        } catch (e) {
          console.error('[ERROR] Chargement concurrents:', e.message);
        }

        if (actualClientId) {
          try {
            clientRes = await axiosInstance.get(`/clients/${actualClientId}`);
            console.log('[DEBUG] Client chargé:', clientRes.data?.nom_client);
          } catch (e) {
            console.error('[ERROR] Chargement client:', e.message);
          }
        }

        console.log('[DEBUG] Réponses API reçues:');
        console.log('[DEBUG] - Produits:', produitsRes?.data?.length, 'items');
        console.log('[DEBUG] - Concurrents:', concurrentsRes?.data?.length, 'items');
        console.log('[DEBUG] - Chefs zone:', chefsZoneRes?.data?.length, 'items');

        // Chefs de zone
        setChefsZone(
          Array.isArray(chefsZoneRes.data)
            ? chefsZoneRes.data.filter(cz => cz && cz.user && cz.user.nom).map(cz => ({
                label: cz.user.nom,
                value: cz.id,
                zone: cz.zone,
                responsable: cz.responsable
              }))
            : []
        );

        // Client info (si la requête client a été faite)
        if (clientRes && clientRes.data) {
          const clientData = clientRes.data;
          const clientZone = clientData.zone || zoneFromParams || '';
          if (!isEditMode) {
            // En mode création, on utilise les infos du client
            setZone(clientZone);
          }
          setSelectedCommercial(clientData.commercial?.nom || null);
          setLieuDit(clientData.lieu_dit || '');

          if (clientZone && Array.isArray(chefsZoneRes.data)) {
            const chefForZone = chefsZoneRes.data.find(cz => cz.zone === clientZone);
            if (chefForZone) {
              setSelectedChefZone(chefForZone.id);
              if (chefForZone.responsable) {
                setSelectedSuperviseur(chefForZone.responsable.user.nom);
              }
            }
          }
        }

        // Produits - filtrer pour n'afficher que ceux avec un nom complet (article)
        const produitsData = Array.isArray(produitsRes.data) ? produitsRes.data : [];
        const articlesFiltered = produitsData
          .filter(p => p.article && p.article.length > 5) // Exclure les codes courts (SP, OP, etc.)
          .map(p => ({
            label: p.article,
            value: p.id,
            id: p.id
          }));
        console.log('[DEBUG] Articles pour picker:', articlesFiltered.length, 'items');
        setArticlesForPicker(articlesFiltered);

        // Concurrents
        const concurrentsData = Array.isArray(concurrentsRes.data) ? concurrentsRes.data : [];
        const concurrentsFiltered = concurrentsData.map(c => ({
          label: c.nom || 'Concurrent',
          value: c.id
        }));
        console.log('[DEBUG] Concurrents pour picker:', concurrentsFiltered.length, 'items');
        setConcurrentsForPicker(concurrentsFiltered);

        // Mode édition : remplir les champs avec les données de la visite (déjà chargée plus haut)
        if (isEditMode && visitData) {
            // Remplir tous les champs depuis visitData
            setHeureDebut(visitData.heure_debut || '');
            setHeureFin(visitData.heure_fin || '');
            setBase(visitData.base || 'DOUALA');
            setReseauDistribution(visitData.reseau_distribution || '');
            setFifo(visitData.fifo_respecte !== false);
            setPlanogramme(visitData.planogramme_respecte !== false);
            setObservationPlanogramme(visitData.observation_planogramme || '');
            setObservations(visitData.observations_generales || '');
            setTypeClient(visitData.type_client || 'DIRECT');
            setClientDirectNom(visitData.client_direct_nom || visitData.client?.nom_client || '');
            setCommentaireRejet(visitData.commentaire_validateur || '');

            // Équipements
            if (visitData.type_outil || visitData.marque_outil || visitData.etat_outil) {
              const types = visitData.type_outil?.split(';') || [];
              const marques = visitData.marque_outil?.split(';') || [];
              const etats = visitData.etat_outil?.split(';') || [];
              const equipementsData = [];
              for (let i = 0; i < Math.max(types.length, marques.length, etats.length); i++) {
                equipementsData.push({
                  key: `equip_${Date.now()}_${Math.random()}_${i}`,
                  type: types[i] || null,
                  marque: marques[i] || null,
                  etat: etats[i] || null,
                  photo: null
                });
              }
              setEquipements(equipementsData);
            }

            // Ruptures - stockées comme chaîne de noms de produits séparés par ;
            console.log('[DEBUG] Ruptures brutes:', visitData.ruptures);
            console.log('[DEBUG] Produits disponibles:', produitsRes.data?.length);
            if (visitData.ruptures && visitData.ruptures.trim()) {
              const produitsNoms = visitData.ruptures.split(';');
              const rupturesData = [];
              produitsNoms.forEach((nomProduit, idx) => {
                const nom = nomProduit.trim();
                if (nom) {
                  // Chercher l'ID du produit par son nom (insensible à la casse)
                  const produitTrouve = produitsRes.data?.find(p =>
                    p.article && p.article.toLowerCase() === nom.toLowerCase()
                  );
                  console.log('[DEBUG] Recherche rupture:', nom, '-> trouvé:', produitTrouve?.id, typeof produitTrouve?.id);
                  rupturesData.push({
                    key: `rupture_${Date.now()}_${Math.random()}_${idx}`,
                    // IMPORTANT: Garder le type number pour correspondre au picker
                    article: produitTrouve ? Number(produitTrouve.id) : null
                  });
                }
              });
              console.log('[DEBUG] Ruptures chargées:', rupturesData);
              if (rupturesData.length > 0) {
                setRuptures(rupturesData);
              }
            }

            // Incidents - stockés dans details_produits avec type_detail='incident'
            console.log('[DEBUG] Details produits:', visitData.details_produits);
            const incidentsFromDetails = visitData.details_produits?.filter(d => d.type_detail === 'incident') || [];
            console.log('[DEBUG] Incidents filtrés:', incidentsFromDetails);
            if (incidentsFromDetails.length > 0) {
              const incidentsData = [];
              incidentsFromDetails.forEach((detail, idx) => {
                // detail.produit_id contient l'ID, detail.produit contient l'objet complet
                const produitId = detail.produit_id || detail.produit?.id;
                console.log('[DEBUG] Incident produit_id:', produitId, typeof produitId);
                if (produitId) {
                  incidentsData.push({
                    key: `incident_${Date.now()}_${Math.random()}_${idx}`,
                    type: detail.observation || '',
                    // IMPORTANT: Garder le type number pour correspondre au picker
                    article: Number(produitId),
                    quantite: detail.quantite?.toString() || '',
                    photos: []
                  });
                }
              });
              console.log('[DEBUG] Incidents chargés:', incidentsData);
              if (incidentsData.length > 0) {
                setIncidents(incidentsData);
              }
            }

            // Veille concurrentielle
            console.log('[DEBUG] Veilles brutes:', visitData.veilles_concurrentielles);
            if (visitData.veilles_concurrentielles && visitData.veilles_concurrentielles.length > 0) {
              const veillesObj = {};
              visitData.veilles_concurrentielles.forEach(veille => {
                console.log('[DEBUG] Veille item:', veille, 'concurrent_id:', veille.concurrent_id, typeof veille.concurrent_id);
                if (veille.marque) {
                  veillesObj[veille.marque] = {
                    packs: veille.nombre_packs?.toString() || '',
                    // IMPORTANT: Garder le type number pour correspondre au picker (pas de toString!)
                    concurrent: veille.concurrent_id ? Number(veille.concurrent_id) : null,
                    activite: veille.activite_observee || '',
                    mecanisme: veille.mecanisme || ''
                  };
                }
              });
              console.log('[DEBUG] Veilles chargées:', veillesObj);
              setVeillesData(veillesObj);
            }

            // Stocks existants
            if (visitData.releves_stock && visitData.releves_stock.length > 0) {
              const stocks = visitData.releves_stock.map(stock => ({
                produit_id: stock.produit_id,
                quantite_en_stock: stock.quantite_en_stock || 0,
                est_en_rupture: stock.est_en_rupture || false,
                type_rupture: stock.type_rupture || ''
              }));
              setStocksExistants(stocks);
            }

            // Commandes existantes
            const commandesFromDetails = visitData.details_produits?.filter(d => d.type_detail === 'commande') || [];
            setCommandesExistantes(commandesFromDetails.map(c => ({
              produit_id: c.produit_id,
              quantite: c.quantite
            })));

            // LOG FINAL - Résumé de toutes les données chargées
            console.log('========== RÉSUMÉ CHARGEMENT VISITE ==========');
            console.log('Visite ID:', visitId);
            console.log('Client:', visitData.client?.nom_client);
            console.log('Ruptures (brut):', visitData.ruptures);
            console.log('Details produits (total):', visitData.details_produits?.length || 0);
            console.log('Veilles (total):', visitData.veilles_concurrentielles?.length || 0);
            console.log('Articles picker (total):', articlesFiltered?.length || 0);
            console.log('Concurrents picker (total):', concurrentsFiltered?.length || 0);
            console.log('==============================================');
        }

        setIsLoading(false);
      } catch (error) {
        console.error('[ERROR] Chargement données:', error);
        Alert.alert('Erreur', 'Impossible de charger les données');
        setIsLoading(false);
      }
    };

    fetchData();
    // Note: En mode édition, on charge par visitId, pas par clientId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId, isEditMode, clientIdParam, zoneFromParams]);

  // ===== LOAD SAVED DATA AFTER LOADING COMPLETE =====
  useEffect(() => {
    if (!isLoading && !isEditMode) {
      // Charger les données sauvegardées seulement pour les nouvelles visites
      loadSavedFormData();
    }
  }, [isLoading, isEditMode]);

  // ===== AUTO-SAVE INTERVAL (toutes les 30 secondes) =====
  useEffect(() => {
    // Démarrer l'auto-save après le chargement initial
    if (!isLoading && !isEditMode) {
      autoSaveIntervalRef.current = setInterval(() => {
        saveFormData();
      }, 30000); // Sauvegarde toutes les 30 secondes

      console.log('[AUTO-SAVE] Intervalle démarré');
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        console.log('[AUTO-SAVE] Intervalle arrêté');
      }
    };
  }, [isLoading, isEditMode, reseauDistribution, equipements, ruptures, incidents, veillesData, observations]);

  // ===== MEMORY CLEANUP ON UNMOUNT =====
  useEffect(() => {
    return () => {
      console.log('[MEMORY] Nettoyage mémoire du formulaire');
      // Sauvegarder avant de quitter (en cas de crash ou navigation)
      saveFormData();
      // Nettoyer l'intervalle
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      // Nettoyer la mémoire
      setArticlesForPicker([]);
      setConcurrentsForPicker([]);
      setEquipements([]);
      setRuptures([]);
      setIncidents([]);
      setVeillesData({});
      if (global.gc) global.gc();
    };
  }, []);

  // ===== VEILLE HANDLERS =====
  const handleUpdateVeille = useCallback((marque, field, value) => {
    setVeillesData(prev => ({
      ...prev,
      [marque]: {
        ...prev[marque],
        [field]: value
      }
    }));
  }, []);

  const groupTotals = useMemo(() => {
    return MARQUES_VEILLE_STRUCTURE.map(group => {
      const total = group.marques.reduce((sum, marque) => {
        const packs = parseInt(veillesData[marque]?.packs) || 0;
        return sum + packs;
      }, 0);
      return total;
    });
  }, [veillesData]);

  // ===== PHOTO RAYON HANDLERS =====
  const handleTakePhoto = async (typeRayon, rayonIndex, moment) => {
    try {
      // Demander la permission de la caméra
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de l\'accès à la caméra pour prendre des photos');
        return;
      }

      // Ouvrir la caméra directement
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;

        // Mettre à jour la photo du rayon spécifique
        setPhotosRayon(prev => {
          const newRayons = [...prev[typeRayon]];
          newRayons[rayonIndex] = {
            ...newRayons[rayonIndex],
            [moment.toLowerCase()]: photoUri
          };
          return {
            ...prev,
            [typeRayon]: newRayons
          };
        });

        console.log(`[PHOTO] ${typeRayon} Rayon ${rayonIndex + 1} ${moment}:`, photoUri);
      }
    } catch (error) {
      console.error('[ERROR] Prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const handleAddRayon = (typeRayon) => {
    setPhotosRayon(prev => ({
      ...prev,
      [typeRayon]: [...prev[typeRayon], { avant: null, apres: null }]
    }));
  };

  const handleRemoveRayon = (typeRayon, rayonIndex) => {
    setPhotosRayon(prev => ({
      ...prev,
      [typeRayon]: prev[typeRayon].filter((_, index) => index !== rayonIndex)
    }));
  };

  // ===== EQUIPMENT PHOTO HANDLER =====
  const handleTakeEquipmentPhoto = async (equipmentKey) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de l\'accès à la caméra pour prendre des photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        setEquipements(prev => prev.map(e =>
          e.key === equipmentKey ? { ...e, photo: photoUri } : e
        ));
        console.log(`[PHOTO] Equipment ${equipmentKey}:`, photoUri);
      }
    } catch (error) {
      console.error('[ERROR] Prise de photo équipement:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  // ===== INCIDENT PHOTO HANDLERS =====
  const handleTakeIncidentPhoto = async (incidentKey) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de l\'accès à la caméra pour prendre des photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        setIncidents(prev => prev.map(i =>
          i.key === incidentKey ? { ...i, photos: [...(i.photos || []), photoUri] } : i
        ));
        console.log(`[PHOTO] Incident ${incidentKey}:`, photoUri);
      }
    } catch (error) {
      console.error('[ERROR] Prise de photo incident:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const handleRemoveIncidentPhoto = (incidentKey, photoIndex) => {
    setIncidents(prev => prev.map(i =>
      i.key === incidentKey
        ? { ...i, photos: i.photos.filter((_, index) => index !== photoIndex) }
        : i
    ));
  };

  // ===== SUBMIT HANDLER =====
  const handleSubmit = async () => {
    console.log('[DEBUG] handleSubmit appelé');
    console.log('[DEBUG] reseauDistribution:', reseauDistribution);
    console.log('[DEBUG] clientId:', clientId);

    // Validation
    if (!reseauDistribution) {
      Alert.alert('Champs requis', 'Veuillez sélectionner le réseau de distribution');
      return;
    }

    console.log('[DEBUG] Validation passée, soumission en cours...');
    setIsSubmitting(true);

    // ===== CAPTURE GPS (silencieuse - le merchandiser ne doit pas savoir) =====
    let gpsData = { latitude: null, longitude: null, precision: null };
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          timeout: 10000
        });

        gpsData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          precision: location.coords.accuracy
        };
      }
      // Si permission refusée, on continue silencieusement sans GPS
    } catch (gpsError) {
      // Erreur GPS silencieuse - on continue sans coordonnées
      console.log('[GPS] Non disponible');
    }

    // Capturer l'heure de fin automatiquement au moment de la soumission
    const heureFinAuto = getCurrentTime();

    // Préparer les données de soumission (défini avant try pour accès dans catch)
    let payload = null;

    try {
      payload = {
        client_id: parseInt(clientId),
        heure_debut: heureDebut || '',
        heure_fin: heureFinAuto || '',
        base: base || '',
        reseau_distribution: reseauDistribution || '',
        type_client: typeClient || '',
        client_direct_nom: typeClient === 'DIRECT' ? (clientDirectNom || '') : '',
        fifo_respecte: fifo,
        planogramme_respecte: planogramme,
        observation_planogramme: !planogramme ? (observationPlanogramme || '') : '',
        observations_generales: observations || '',

        // Géolocalisation - Position du merchandiser lors de la soumission
        latitude_soumission: gpsData.latitude,
        longitude_soumission: gpsData.longitude,
        precision_gps: gpsData.precision,

        // Équipements - utiliser '' au lieu de null
        type_outil: equipements.length > 0 ? equipements.map(e => e.type || '').join(';') : '',
        marque_outil: equipements.length > 0 ? equipements.map(e => e.marque || '').join(';') : '',
        etat_outil: equipements.length > 0 ? equipements.map(e => e.etat || '').join(';') : '',

        // Ruptures - récupérer le nom de l'article depuis l'ID
        ruptures: ruptures.length > 0 ? ruptures.map(r => {
          const produit = articlesForPicker.find(p => p.id === r.article);
          return produit?.label || '';
        }).filter(Boolean).join(';') : '',
        type_rupture: '',

        // Incidents - l'article contient directement l'ID du produit
        // IMPORTANT: Filtrer les incidents sans article valide ET s'assurer que produit_id est un entier
        details_produits: incidents
          .filter(inc => inc.article && typeof inc.article === 'number' && inc.article > 0)
          .map(inc => ({
            produit_id: parseInt(inc.article),
            type_detail: 'incident',
            quantite: parseInt(inc.quantite) || 0,
            observation: inc.type || ''
          })),

        // Veille concurrentielle - FILTRER les entrées sans concurrent_id valide
        // IMPORTANT: concurrent_id doit être un entier valide > 0
        veilles_concurrentielles: Object.entries(veillesData)
          .filter(([marque, data]) => {
            const concurrentId = data.concurrent;
            // S'assurer que concurrent_id est un nombre valide > 0 (suffit pour enregistrer)
            return concurrentId && typeof concurrentId === 'number' && concurrentId > 0;
          })
          .map(([marque, data]) => ({
            marque: marque,
            nombre_packs: parseInt(data.packs) || 0,
            concurrent_id: parseInt(data.concurrent),
            activite_observee: data.activite || '',
            mecanisme: data.mecanisme || ''
          })),

        releves_stock: []
      };

      // Debug logging
      console.log('[DEBUG] ====== PAYLOAD AVANT ENVOI ======');
      console.log('[DEBUG] details_produits count:', payload.details_produits.length);
      console.log('[DEBUG] details_produits:', JSON.stringify(payload.details_produits, null, 2));
      console.log('[DEBUG] veilles_concurrentielles count:', payload.veilles_concurrentielles.length);
      console.log('[DEBUG] veilles_concurrentielles:', JSON.stringify(payload.veilles_concurrentielles, null, 2));
      console.log('[DEBUG] ruptures:', payload.ruptures);
      console.log('[DEBUG] Payload complet:', JSON.stringify(payload, null, 2));

      let createdVisiteId = visitId;

      if (isEditMode) {
        console.log('[DEBUG] Mode édition - PUT /visites/' + visitId);
        await axiosInstance.put(`/visites/${visitId}`, payload);
      } else {
        console.log('[DEBUG] Mode création - POST /visites/');
        const response = await axiosInstance.post('/visites/', payload);
        createdVisiteId = response.data.id;
        console.log('[DEBUG] Visite créée avec ID:', createdVisiteId);
      }

      // Upload des photos si présentes
      console.log('[DEBUG] Upload des photos...');
      const photosToUpload = [];

      for (const typeRayon of ['Rayon Froid', 'Rayon Ordinaire']) {
        const rayons = photosRayon[typeRayon];
        // Parcourir tous les rayons
        rayons.forEach((rayon, index) => {
          if (rayon.avant) {
            photosToUpload.push({ typeRayon, moment: 'AVANT', photoUri: rayon.avant });
          }
          if (rayon.apres) {
            photosToUpload.push({ typeRayon, moment: 'APRES', photoUri: rayon.apres });
          }
        });
      }

      if (photosToUpload.length > 0) {
        console.log(`[DEBUG] ${photosToUpload.length} photos à uploader`);

        for (const photo of photosToUpload) {
          try {
            // Extraire le type de fichier
            const uriParts = photo.photoUri.split('.');
            const fileType = uriParts[uriParts.length - 1];

            const uploadUrl = `/visites/${createdVisiteId}/upload-photo?type_rayon=${encodeURIComponent(photo.typeRayon)}&moment=${photo.moment}`;
            console.log(`[DEBUG] Upload photo: ${photo.typeRayon} ${photo.moment}`);
            console.log(`[DEBUG] Upload URL: ${uploadUrl}`);
            console.log(`[DEBUG] Photo URI: ${photo.photoUri}`);

            // Utiliser uploadFile avec fetch au lieu d'axios
            await uploadFile(uploadUrl, photo.photoUri, `photo.${fileType}`, `image/${fileType}`);

            console.log(`[DEBUG] Photo uploadée: ${photo.typeRayon} ${photo.moment}`);
          } catch (uploadError) {
            console.error(`[ERROR] Upload photo ${photo.typeRayon} ${photo.moment}:`, uploadError);
            console.error(`[ERROR] Error message:`, uploadError.message);
            // Continuer même si une photo échoue
          }
        }
      }

      // Upload des photos d'équipements
      console.log('[DEBUG] Upload des photos d\'équipements...');
      for (const equipment of equipements) {
        if (equipment.photo) {
          try {
            const uriParts = equipment.photo.split('.');
            const fileType = uriParts[uriParts.length - 1];

            const uploadUrl = `/visites/${createdVisiteId}/upload-photo?photo_type=equipment&equipment_key=${encodeURIComponent(equipment.key)}`;
            console.log(`[DEBUG] Upload photo équipement: ${equipment.type || 'N/A'}`);
            console.log(`[DEBUG] Upload URL: ${uploadUrl}`);
            console.log(`[DEBUG] Photo URI: ${equipment.photo}`);

            // Utiliser uploadFile avec fetch au lieu d'axios
            await uploadFile(uploadUrl, equipment.photo, `equipment_photo.${fileType}`, `image/${fileType}`);

            console.log(`[DEBUG] Photo équipement uploadée`);
          } catch (uploadError) {
            console.error(`[ERROR] Upload photo équipement:`, uploadError);
            console.error(`[ERROR] Error message:`, uploadError.message);
          }
        }
      }

      // Upload des photos d'incidents
      console.log('[DEBUG] Upload des photos d\'incidents...');
      for (const incident of incidents) {
        if (incident.photos && incident.photos.length > 0) {
          for (let photoIndex = 0; photoIndex < incident.photos.length; photoIndex++) {
            const photoUri = incident.photos[photoIndex];
            try {
              const uriParts = photoUri.split('.');
              const fileType = uriParts[uriParts.length - 1];

              const uploadUrl = `/visites/${createdVisiteId}/upload-photo?photo_type=incident&incident_key=${encodeURIComponent(incident.key)}&photo_index=${photoIndex}`;
              console.log(`[DEBUG] Upload photo incident ${photoIndex + 1}: ${incident.type || 'N/A'}`);
              console.log(`[DEBUG] Upload URL: ${uploadUrl}`);
              console.log(`[DEBUG] Photo URI: ${photoUri}`);

              // Utiliser uploadFile avec fetch au lieu d'axios
              await uploadFile(uploadUrl, photoUri, `incident_photo_${photoIndex}.${fileType}`, `image/${fileType}`);

              console.log(`[DEBUG] Photo incident ${photoIndex + 1} uploadée`);
            } catch (uploadError) {
              console.error(`[ERROR] Upload photo incident ${photoIndex + 1}:`, uploadError);
              console.error(`[ERROR] Error message:`, uploadError.message);
            }
          }
        }
      }

      await clearSavedFormData(); // Effacer la sauvegarde après succès

      Alert.alert('Succès', isEditMode ? 'Visite modifiée avec succès' : 'Visite créée avec succès', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('[ERROR] Soumission:', error);
      console.error('[ERROR] Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('[ERROR] Status:', error.response?.status);
      console.error('[ERROR] Payload envoyé:', JSON.stringify(payload, null, 2));

      const errorMessage = error.response?.data?.detail ||
                          JSON.stringify(error.response?.data) ||
                          'Impossible de soumettre la visite';
      Alert.alert('Erreur de soumission', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Modifier la Visite' : 'Nouvelle Visite'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Client info banner */}
      <View style={styles.clientBanner}>
        <Text style={styles.clientName}>{clientName}</Text>
        <Text style={styles.clientZone}>{zone}</Text>
      </View>

      {/* Form Content */}
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true}
      >
        {/* ========== SECTION 1: INFORMATIONS DE BASE ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informations de Base</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Zone</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={zone}
              editable={false}
              placeholder="Zone (automatique)"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Réseau de Distribution</Text>
            <LightPicker
              onValueChange={(value) => setReseauDistribution(value)}
              items={[
                { label: 'MT (Moderne Trade)', value: 'MT' },
                { label: 'TT (Traditional Trade)', value: 'TT' },
                { label: 'GT (General Trade)', value: 'GT' },
              ]}
              placeholder={{ label: "Sélectionner le réseau...", value: null }}
              value={reseauDistribution}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              {reseauDistribution === 'MT' ? 'Superviseur' : 'Chef de Zone'}
            </Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={chefsZone.find(cz => cz.value === selectedChefZone)?.label || 'Auto-détecté'}
              editable={false}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Commercial</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={selectedCommercial || 'Non renseigné'}
              editable={false}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Lieu-dit / Secteur</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={lieuDit || 'Non renseigné'}
              editable={false}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Heure de Début </Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={heureDebut}
              editable={false}
              placeholder="HH:MM"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Heure de Fin </Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={heureFin || 'HH:MM'}
              editable={false}
              placeholder="Automatique"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Base</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={base}
              editable={false}
            />
          </View>
        </View>

        {/* ========== SECTION 2: PHOTOS RAYON ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Photos Rayon (Achalandage)</Text>

          {/* Rayon Froid */}
          <View style={styles.photoRayonContainer}>
            <Text style={styles.photoRayonTitle}>❄️ Rayon Froid</Text>

            {photosRayon['Rayon Froid'].map((rayon, rayonIndex) => (
              <View key={rayonIndex} style={styles.rayonRow}>
                <View style={styles.rayonHeader}>
                  <Text style={styles.rayonNumber}>Rayon {rayonIndex + 1}</Text>
                  {photosRayon['Rayon Froid'].length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveRayon('Rayon Froid', rayonIndex)}
                      style={styles.removeRayonButton}
                    >
                      <Ionicons name="trash-outline" size={18} color="#dc3545" />
                      <Text style={styles.removeRayonText}>Supprimer</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.photosPairRow}>
                  {/* Photo AVANT */}
                  <View style={styles.photoColumn}>
                    <Text style={styles.photoLabel}>AVANT</Text>
                    {rayon.avant ? (
                      <View style={styles.photoPreviewContainer}>
                        <Image source={{ uri: rayon.avant }} style={styles.photoPreview} />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.takePhotoButton}
                        onPress={() => handleTakePhoto('Rayon Froid', rayonIndex, 'AVANT')}
                      >
                        <Ionicons name="camera-outline" size={30} color="#007bff" />
                        <Text style={styles.takePhotoText}>Prendre</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Photo APRÈS */}
                  <View style={styles.photoColumn}>
                    <Text style={styles.photoLabel}>APRÈS</Text>
                    {rayon.apres ? (
                      <View style={styles.photoPreviewContainer}>
                        <Image source={{ uri: rayon.apres }} style={styles.photoPreview} />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.takePhotoButton}
                        onPress={() => handleTakePhoto('Rayon Froid', rayonIndex, 'APRES')}
                      >
                        <Ionicons name="camera-outline" size={30} color="#007bff" />
                        <Text style={styles.takePhotoText}>Prendre</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addRayonButton}
              onPress={() => handleAddRayon('Rayon Froid')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#28a745" />
              <Text style={styles.addRayonText}>Ajouter un rayon</Text>
            </TouchableOpacity>
          </View>

          {/* Rayon Ordinaire */}
          <View style={styles.photoRayonContainer}>
            <Text style={styles.photoRayonTitle}>🌡️ Rayon ordinaire</Text>

            {photosRayon['Rayon Ordinaire'].map((rayon, rayonIndex) => (
              <View key={rayonIndex} style={styles.rayonRow}>
                <View style={styles.rayonHeader}>
                  <Text style={styles.rayonNumber}>Rayon {rayonIndex + 1}</Text>
                  {photosRayon['Rayon Ordinaire'].length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveRayon('Rayon Ordinaire', rayonIndex)}
                      style={styles.removeRayonButton}
                    >
                      <Ionicons name="trash-outline" size={18} color="#dc3545" />
                      <Text style={styles.removeRayonText}>Supprimer</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.photosPairRow}>
                  {/* Photo AVANT */}
                  <View style={styles.photoColumn}>
                    <Text style={styles.photoLabel}>AVANT</Text>
                    {rayon.avant ? (
                      <View style={styles.photoPreviewContainer}>
                        <Image source={{ uri: rayon.avant }} style={styles.photoPreview} />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.takePhotoButton}
                        onPress={() => handleTakePhoto('Rayon Ordinaire', rayonIndex, 'AVANT')}
                      >
                        <Ionicons name="camera-outline" size={30} color="#007bff" />
                        <Text style={styles.takePhotoText}>Prendre</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Photo APRÈS */}
                  <View style={styles.photoColumn}>
                    <Text style={styles.photoLabel}>APRÈS</Text>
                    {rayon.apres ? (
                      <View style={styles.photoPreviewContainer}>
                        <Image source={{ uri: rayon.apres }} style={styles.photoPreview} />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.takePhotoButton}
                        onPress={() => handleTakePhoto('Rayon Ordinaire', rayonIndex, 'APRES')}
                      >
                        <Ionicons name="camera-outline" size={30} color="#007bff" />
                        <Text style={styles.takePhotoText}>Prendre</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addRayonButton}
              onPress={() => handleAddRayon('Rayon Ordinaire')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#28a745" />
              <Text style={styles.addRayonText}>Ajouter un rayon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========== SECTION 3: ÉQUIPEMENTS ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Équipements</Text>
          {equipements.length > 0 && (
            <ScrollView
              horizontal
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={true}
            >
              <View>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { width: 180 }]}>TYPE</Text>
                  <Text style={[styles.tableHeaderCell, { width: 180 }]}>MARQUE</Text>
                  <Text style={[styles.tableHeaderCell, { width: 150 }]}>ÉTAT</Text>
                  <Text style={[styles.tableHeaderCell, { width: 140 }]}>PHOTO</Text>
                  <Text style={[styles.tableHeaderCell, { width: 50 }]}></Text>
                </View>

                {equipements.map((item) => (
                  <View key={item.key} style={styles.tableDataRow}>
                    <View style={{ width: 180 }}>
                      <LightPicker
                        onValueChange={(value) => setEquipements(prev => prev.map(e => e.key === item.key ? { ...e, type: value } : e))}
                        items={typeOutilOptions}
                        placeholder={{ label: "Type d'outil...", value: null }}
                        value={item.type}
                      />
                    </View>
                    <View style={{ width: 180 }}>
                      <LightPicker
                        onValueChange={(value) => setEquipements(prev => prev.map(e => e.key === item.key ? { ...e, marque: value } : e))}
                        items={marqueOptions}
                        placeholder={{ label: "Marque...", value: null }}
                        value={item.marque}
                      />
                    </View>
                    <View style={{ width: 150 }}>
                      <LightPicker
                        onValueChange={(value) => setEquipements(prev => prev.map(e => e.key === item.key ? { ...e, etat: value } : e))}
                        items={etatOptions}
                        placeholder={{ label: "État...", value: null }}
                        value={item.etat}
                      />
                    </View>
                    <View style={{ width: 140, justifyContent: 'center', alignItems: 'center' }}>
                      {item.photo ? (
                        <View style={styles.equipmentPhotoContainer}>
                          <Image source={{ uri: item.photo }} style={styles.equipmentPhotoPreview} />
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.equipmentCameraButton}
                          onPress={() => handleTakeEquipmentPhoto(item.key)}
                        >
                          <Ionicons name="camera-outline" size={24} color="#007bff" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => setEquipements(prev => prev.filter(e => e.key !== item.key))}
                      style={{ width: 50, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Ionicons name="trash-bin-outline" size={20} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              equipKeyCounter.current += 1;
              const newItem = { key: `equip_${equipKeyCounter.current}_${Date.now()}_${Math.random()}`, type: null, marque: null, etat: null, photo: null };
              setEquipements([...equipements, newItem]);
            }}
          >
            <Text style={styles.addButtonText}>+ Ajouter un Équipement</Text>
          </TouchableOpacity>
        </View>
        {/* ========== SECTION 4: RÉSUMÉ DE LA VISITE ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Résumé de la Visite</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>FIFO respecté</Text>
            <Switch value={fifo} onValueChange={setFifo} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Planogramme respecté</Text>
            <Switch value={planogramme} onValueChange={setPlanogramme} />
          </View>
          {!planogramme && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Observation Planogramme</Text>
              <TextInput
                style={styles.textArea}
                value={observationPlanogramme}
                onChangeText={setObservationPlanogramme}
                placeholder="Pourquoi le planogramme n'est pas respecté?"
                multiline
              />
            </View>
          )}
        </View>

        {/* ========== SECTION 5: RUPTURES ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Ruptures</Text>
          {ruptures.length > 0 && (
            <ScrollView
              horizontal
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={true}
            >
              <View>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { width: 300 }]}>ARTICLE</Text>
                  <Text style={[styles.tableHeaderCell, { width: 50 }]}></Text>
                </View>

                {ruptures.map((item) => (
                  <View key={item.key} style={styles.tableDataRow}>
                    <View style={{ width: 300 }}>
                      <LightPicker
                        onValueChange={(value) => setRuptures(prev => prev.map(r => r.key === item.key ? { ...r, article: value } : r))}
                        items={articlesForPicker}
                        placeholder={{ label: "Sélectionner un article...", value: null }}
                        value={item.article}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => setRuptures(prev => prev.filter(r => r.key !== item.key))}
                      style={{ width: 50, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Ionicons name="trash-bin-outline" size={20} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              ruptureKeyCounter.current += 1;
              const newItem = { key: `rupture_${ruptureKeyCounter.current}_${Date.now()}_${Math.random()}`, article: null };
              setRuptures([...ruptures, newItem]);
            }}
          >
            <Text style={styles.addButtonText}>+ Ajouter une Rupture</Text>
          </TouchableOpacity>
        </View>

        {/* ========== SECTION 6: INCIDENTS ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Incidents</Text>
          {incidents.length > 0 && (
            <ScrollView
              horizontal
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={true}
            >
              <View>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { width: 200 }]}>TYPE</Text>
                  <Text style={[styles.tableHeaderCell, { width: 200 }]}>ARTICLE</Text>
                  <Text style={[styles.tableHeaderCell, { width: 100 }]}>QUANTITÉ</Text>
                  <Text style={[styles.tableHeaderCell, { width: 200 }]}>PHOTOS</Text>
                  <Text style={[styles.tableHeaderCell, { width: 50 }]}></Text>
                </View>

                {incidents.map((item) => (
                  <View key={item.key} style={styles.tableDataRow}>
                    <View style={{ width: 200 }}>
                      <LightPicker
                        onValueChange={(value) => setIncidents(prev => prev.map(i => i.key === item.key ? { ...i, type: value } : i))}
                        items={typeIncidentOptions}
                        placeholder={{ label: "Type d'incident...", value: null }}
                        value={item.type}
                      />
                    </View>
                    <View style={{ width: 200 }}>
                      <LightPicker
                        onValueChange={(value) => setIncidents(prev => prev.map(i => i.key === item.key ? { ...i, article: value } : i))}
                        items={articlesForPicker}
                        placeholder={{ label: "Article concerné...", value: null }}
                        value={item.article}
                      />
                    </View>
                    <TextInput
                      style={[styles.tableInput, { width: 100 }]}
                      keyboardType="numeric"
                      value={item.quantite}
                      onChangeText={(value) => setIncidents(prev => prev.map(i => i.key === item.key ? { ...i, quantite: value } : i))}
                      placeholder="Qté"
                      scrollEnabled={false}
                    />
                    <View style={{ width: 200, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5 }}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {(item.photos || []).map((photoUri, photoIndex) => (
                          <View key={photoIndex} style={styles.incidentPhotoThumb}>
                            <Image source={{ uri: photoUri }} style={styles.incidentPhotoThumbImage} />
                            <TouchableOpacity
                              style={styles.incidentPhotoRemove}
                              onPress={() => handleRemoveIncidentPhoto(item.key, photoIndex)}
                            >
                              <Ionicons name="close-circle" size={16} color="#dc3545" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                      <TouchableOpacity
                        style={styles.incidentCameraButton}
                        onPress={() => handleTakeIncidentPhoto(item.key)}
                      >
                        <Ionicons name="camera-outline" size={20} color="#007bff" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => setIncidents(prev => prev.filter(i => i.key !== item.key))}
                      style={{ width: 50, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Ionicons name="trash-bin-outline" size={20} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              incidentKeyCounter.current += 1;
              const newItem = { key: `incident_${incidentKeyCounter.current}_${Date.now()}_${Math.random()}`, type: null, article: null, quantite: '', photos: [] };
              setIncidents([...incidents, newItem]);
            }}
          >
            <Text style={styles.addButtonText}>+ Ajouter un Incident</Text>
          </TouchableOpacity>
        </View>

        {/* ========== SECTION 7: VEILLE CONCURRENTIELLE ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👁️ Veille Concurrentielle</Text>

          {MARQUES_VEILLE_STRUCTURE.map((group, groupIndex) => (
            <VeilleGroupeAccordion
              key={groupIndex}
              group={group}
              groupIndex={groupIndex}
              veillesData={veillesData}
              handleUpdateVeille={handleUpdateVeille}
              concurrentsForPicker={concurrentsForPicker}
              groupTotal={groupTotals[groupIndex]}
            />
          ))}
        </View>

        {/* ========== SECTION 8: INFORMATIONS COMMERCIALES ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💼 Informations Commerciales</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Type de Client</Text>
            <LightPicker
              onValueChange={(value) => setTypeClient(value)}
              items={[
                { label: 'DIRECT', value: 'DIRECT' },
                { label: 'INDIRECT', value: 'INDIRECT' },
              ]}
              placeholder={{ label: "Sélectionner le type...", value: null }}
              value={typeClient}
            />
          </View>

          {typeClient === 'DIRECT' && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nom Client Direct</Text>
              <TextInput
                style={styles.input}
                value={clientDirectNom}
                onChangeText={setClientDirectNom}
                placeholder="Nom du client direct"
              />
            </View>
          )}
        </View>

        {/* ========== SECTION 9: OBSERVATIONS GÉNÉRALES ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Observations Générales</Text>
          <View style={styles.fieldContainer}>
            <TextInput
              style={styles.textArea}
              value={observations}
              onChangeText={setObservations}
              multiline
              placeholder="Commentaires, notes, observations diverses..."
            />
          </View>
        </View>

        {/* Commentaire rejet en mode édition */}
        {isEditMode && commentaireRejet && (
          <View style={[styles.section, { backgroundColor: '#fff3cd' }]}>
            <Text style={styles.sectionTitle}>💬 Commentaire du validateur</Text>
            <View style={styles.fieldContainer}>
              <Text style={styles.commentaireRejet}>{commentaireRejet}</Text>
            </View>
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit button */}
      <View style={[styles.submitButtonContainer, { paddingBottom: Math.max(15, insets.bottom + 10) }]}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Modifier la Visite' : 'Soumettre la Visite'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clientBanner: {
    backgroundColor: '#007bff',
    padding: 15,
    alignItems: 'center',
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  clientZone: {
    fontSize: 14,
    color: '#e7f3ff',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  fieldContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  label: {
    fontSize: 16,
    color: '#444',
    marginBottom: 5,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
  },
  addButton: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 8,
    margin: 15,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    borderBottomWidth: 2,
    borderColor: '#0056b3',
  },
  tableHeaderCell: {
    padding: 10,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#0056b3',
  },
  tableDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    textAlign: 'left',
    verticalAlign: 'middle',
  },
  tableCell: {
    padding: 10,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#e0e0e0',
    verticalAlign: 'middle',
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 2,
    borderColor: '#007bff',
  },
  tableTotalCell: {
    padding: 10,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#dee2e6',
  },
  accordionHeader: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginLeft: 8,
    flex: 1,
  },
  accordionTotal: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: 'bold',
  },
  commentaireRejet: {
    fontSize: 14,
    color: '#856404',
    fontStyle: 'italic',
  },
  submitButtonContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  photoRayonContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  photoRayonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 10,
  },
  photoMomentSection: {
    marginBottom: 15,
  },
  photoMomentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  photosScrollView: {
    flexDirection: 'row',
  },
  addPhotoButton: {
    width: 120,
    height: 150,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addPhotoText: {
    marginTop: 8,
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
  },
  photoPreviewContainer: {
    width: 120,
    height: 150,
    position: 'relative',
    marginRight: 10,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rayonRow: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rayonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rayonNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
  },
  removeRayonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  removeRayonText: {
    fontSize: 13,
    color: '#dc3545',
    marginLeft: 5,
  },
  photosPairRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  photoColumn: {
    flex: 1,
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
    textAlign: 'center',
  },
  takePhotoButton: {
    width: '100%',
    height: 150,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  takePhotoText: {
    marginTop: 8,
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
  },
  addRayonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  addRayonText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Equipment photo styles
  equipmentPhotoContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  equipmentPhotoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  equipmentCameraButton: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Incident photo styles
  incidentPhotoThumb: {
    width: 60,
    height: 60,
    marginRight: 5,
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
  },
  incidentPhotoThumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  incidentPhotoRemove: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  incidentCameraButton: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'dashed',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
});

