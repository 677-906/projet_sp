import React, { useState, useEffect, lazy, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosConfig';
import FormStepper from '../components/FormStepper';
import { Ionicons } from '@expo/vector-icons';

// Lazy load des étapes pour économiser la mémoire
const Step1BasicInfo = lazy(() => import('../components/Step1BasicInfo'));
const Step2EquipmentCompliance = lazy(() => import('../components/Step2EquipmentCompliance'));
const Step3StocksVeille = lazy(() => import('../components/Step3StocksVeille'));

export default function VisitFormScreen({ route, navigation }) {
  const { clientId: clientIdParam, clientName: clientNameParam, zone: zoneFromParams, visitId } = route.params || {};
  const isEditMode = !!visitId;

  // ===== STEP MANAGEMENT =====
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const stepLabels = ['Infos de base', 'Équipements', 'Stocks & Veille'];

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
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [base, setBase] = useState('DOUALA');

  // ===== STEP 2: EQUIPMENT & COMPLIANCE =====
  const [equipements, setEquipements] = useState([]);
  const [fifo, setFifo] = useState(true);
  const [planogramme, setPlanogramme] = useState(true);
  const [observationPlanogramme, setObservationPlanogramme] = useState('');
  const [ruptures, setRuptures] = useState([]);
  const [incidents, setIncidents] = useState([]);

  // ===== STEP 3: STOCKS & VEILLE =====
  const [veillesData, setVeillesData] = useState({});
  const [typeClient, setTypeClient] = useState('DIRECT');
  const [clientDirectNom, setClientDirectNom] = useState('');
  const [observations, setObservations] = useState('');

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

  // ===== STORAGE KEY FOR AUTO-SAVE =====
  const STORAGE_KEY = `visit_form_${clientId}_${visitId || 'new'}`;

  // ===== LOAD INITIAL DATA - PROGRESSIF PAR ÉTAPE =====
  useEffect(() => {
    if (!clientId) return;

    const fetchData = async () => {
      try {
        // ÉTAPE 1 : Charger seulement le client et les chefs de zone (minimum vital)
        const [chefsZoneRes, clientRes] = await Promise.all([
          axiosInstance.get('/chefs-zone/'),
          axiosInstance.get(`/clients/${clientId}`)
        ]);

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

        const clientData = clientRes.data;
        if (clientData) {
          const clientZone = clientData.zone || zoneFromParams || '';
          setZone(clientZone);
          setSelectedCommercial(clientData.commercial?.nom || null);
          setLieuDit(clientData.lieu_dit || '');

          if (clientZone && Array.isArray(chefsZoneRes.data)) {
            const matchingChefZone = chefsZoneRes.data.find(cz => cz.zone === clientZone);
            if (matchingChefZone) {
              setSelectedChefZone(matchingChefZone.id);

              if (matchingChefZone.responsable && matchingChefZone.responsable.base) {
                setBase(matchingChefZone.responsable.base);
              }

              try {
                const commerciauxRes = await axiosInstance.get(`/chef-zone/${matchingChefZone.id}/commerciaux`);
                if (Array.isArray(commerciauxRes.data)) {
                  setCommerciaux(commerciauxRes.data.map(name => ({ label: name, value: name })));
                }
              } catch (error) {
                console.error("Erreur chargement commerciaux:", error);
              }
            }
          }
        }

        // Initialiser heure début
        const now = new Date();
        const heureActuelle = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setHeureDebut(heureActuelle);

        // Charger les données sauvegardées si disponibles
        await loadSavedData();

      } catch (error) {
        console.error("Fetch initial data error:", error);
        Alert.alert("Erreur", "Impossible de charger les données initiales.", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clientId, zoneFromParams]);

  // ===== CHARGER LES PRODUITS SEULEMENT POUR L'ÉTAPE 2 =====
  useEffect(() => {
    if (currentStep === 2 && articlesForPicker.length === 0) {
      const loadProduits = async () => {
        try {
          const produitsRes = await axiosInstance.get('/produits/');
          setArticlesForPicker(
            Array.isArray(produitsRes.data)
              ? produitsRes.data
                  .filter(p => p && p.article && p.article.trim() !== '')
                  .map(p => ({ label: p.article, value: p.id }))
              : []
          );
          console.log('[MEMORY] Produits chargés pour étape 2');
        } catch (error) {
          console.error('Erreur chargement produits:', error);
        }
      };
      loadProduits();
    }
  }, [currentStep]);

  // ===== CHARGER LES CONCURRENTS SEULEMENT POUR L'ÉTAPE 3 =====
  useEffect(() => {
    if (currentStep === 3 && concurrentsForPicker.length === 0) {
      const loadConcurrents = async () => {
        try {
          const concurrentsRes = await axiosInstance.get('/concurrents/');
          setConcurrentsForPicker(
            Array.isArray(concurrentsRes.data)
              ? concurrentsRes.data.filter(c => c && c.nom).map(c => ({ label: c.nom, value: c.id }))
              : []
          );
          console.log('[MEMORY] Concurrents chargés pour étape 3');
        } catch (error) {
          console.error('Erreur chargement concurrents:', error);
        }
      };
      loadConcurrents();
    }
  }, [currentStep]);

  // ===== NETTOYAGE MÉMOIRE QUAND ON QUITTE LE FORMULAIRE =====
  useEffect(() => {
    return () => {
      // Cleanup: Libérer toutes les données en mémoire
      console.log('[MEMORY] Nettoyage mémoire du formulaire');
      setArticlesForPicker([]);
      setConcurrentsForPicker([]);
      setChefsZone([]);
      setCommerciaux([]);
      setEquipements([]);
      setRuptures([]);
      setIncidents([]);
      setVeillesData({});

      // Forcer le garbage collection si disponible
      if (global.gc) {
        try {
          global.gc();
          console.log('[MEMORY] Garbage collection forcé');
        } catch (e) {
          console.log('[MEMORY] GC non disponible');
        }
      }
    };
  }, []);

  // ===== LOAD VISIT DATA IN EDIT MODE =====
  useEffect(() => {
    if (isEditMode && visitId) {
      const loadVisitData = async () => {
        try {
          const response = await axiosInstance.get(`/visites/${visitId}`);
          const visitData = response.data;

          if (visitData.client) {
            setClientId(visitData.client.id);
            setClientName(visitData.client.nom_client);
            setZone(visitData.client.zone || '');
            setLieuDit(visitData.client.lieu_dit || '');

            if (visitData.client.commercial && visitData.client.commercial.chef_zone_id) {
              const chefZoneId = visitData.client.commercial.chef_zone_id;
              setSelectedChefZone(chefZoneId);

              try {
                const commerciauxRes = await axiosInstance.get(`/chef-zone/${chefZoneId}/commerciaux`);
                if (Array.isArray(commerciauxRes.data)) {
                  const commerciauxList = commerciauxRes.data.map(item => {
                    if (typeof item === 'string') {
                      return { label: item, value: item };
                    } else if (item && item.nom) {
                      return { label: item.nom, value: item.nom };
                    }
                    return null;
                  }).filter(Boolean);

                  setCommerciaux(commerciauxList);

                  const commercialNom = visitData.client.commercial?.nom || visitData.client.commercial_nom;
                  if (commercialNom) {
                    setSelectedCommercial(commercialNom);
                  }
                }
              } catch (error) {
                console.error("Erreur chargement commerciaux:", error);
              }
            }
          }

          // Pré-remplir tous les champs
          const now = new Date();
          const heureActuelle = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setHeureDebut(heureActuelle);
          setBase(visitData.base || 'DOUALA');

          // Charger équipements
          if (visitData.type_outil || visitData.marque_outil || visitData.etat_outil) {
            const types = (visitData.type_outil || '').split(';').map(t => t.trim()).filter(Boolean);
            const marques = (visitData.marque_outil || '').split(';').map(m => m.trim()).filter(Boolean);
            const etats = (visitData.etat_outil || '').split(';').map(e => e.trim()).filter(Boolean);

            const maxLen = Math.max(types.length, marques.length, etats.length, 1);
            const equipementsData = [];
            for (let i = 0; i < maxLen; i++) {
              equipementsData.push({
                key: `equip_${Date.now()}_${i}`,
                type: types[i] || null,
                marque: marques[i] || null,
                etat: etats[i] || null
              });
            }
            setEquipements(equipementsData);
          }

          setFifo(visitData.fifo_respecte !== false);
          setPlanogramme(visitData.planogramme_respecte !== false);
          setObservationPlanogramme(visitData.observation_planogramme || '');
          setObservations(visitData.observations_generales || '');
          setReseauDistribution(visitData.reseau_distribution || '');
          setTypeClient(visitData.type_client || 'DIRECT');
          setClientDirectNom(visitData.client_direct_nom || visitData.client.nom_client || '');
          setCommentaireRejet(visitData.commentaire_validateur || '');

          // Pré-remplir ruptures
          const rupturesData = [];
          if (visitData.ruptures) {
            const produits = visitData.ruptures.split(';');
            produits.forEach((p, idx) => {
              if (p.trim()) {
                rupturesData.push({
                  key: `rupture_${Date.now()}_${Math.random()}_${idx}`,
                  article: p.trim()
                });
              }
            });
          }
          if (rupturesData.length > 0) {
            setRuptures(rupturesData);
          }

          // Pré-remplir incidents
          const incidentsData = [];
          const incidentsFromDetails = visitData.details_produits?.filter(d => d.type_detail === 'incident') || [];

          if (incidentsFromDetails.length > 0) {
            incidentsFromDetails.forEach((detail, idx) => {
              if (detail.produit && detail.produit.article) {
                incidentsData.push({
                  key: `incident_${Date.now()}_${Math.random()}_${idx}`,
                  type: detail.observation || '',
                  article: detail.produit.article,
                  quantite: detail.quantite?.toString() || ''
                });
              }
            });
          }

          if (incidentsData.length > 0) {
            setIncidents(incidentsData);
          }

          // Pré-remplir veille concurrentielle
          if (visitData.veilles_concurrentielles && visitData.veilles_concurrentielles.length > 0) {
            const veillesObj = {};
            visitData.veilles_concurrentielles.forEach(veille => {
              if (veille.marque) {
                veillesObj[veille.marque] = {
                  packs: veille.nombre_packs?.toString() || '',
                  concurrent: veille.concurrent_id?.toString() || '',
                  activite: veille.activite_observee || '',
                  mecanisme: veille.mecanisme || ''
                };
              }
            });
            setVeillesData(veillesObj);
          }

          // Conserver stocks et commandes
          if (visitData.releves_stock && visitData.releves_stock.length > 0) {
            const stocks = visitData.releves_stock.map(stock => ({
              produit_id: stock.produit_id,
              quantite_en_stock: stock.quantite_en_stock || 0,
              est_en_rupture: stock.est_en_rupture || false,
              type_rupture: stock.type_rupture || ''
            }));
            setStocksExistants(stocks);
          }

          if (visitData.details_produits && visitData.details_produits.length > 0) {
            const commandes = visitData.details_produits
              .filter(detail => detail.type_detail === 'commande')
              .map(detail => ({
                produit_id: detail.produit_id,
                type_detail: detail.type_detail,
                quantite: detail.quantite || 0,
                observation: detail.observation || ''
              }));
            setCommandesExistantes(commandes);
          }

        } catch (error) {
          console.error("Erreur chargement visite:", error);
          Alert.alert("Erreur", "Impossible de charger les données de la visite.", [
            { text: "OK", onPress: () => navigation.goBack() }
          ]);
        }
      };
      loadVisitData();
    }
  }, [isEditMode, visitId]);

  // ===== AUTO-SAVE DATA TO ASYNC STORAGE =====
  const saveDataToStorage = async () => {
    try {
      const dataToSave = {
        currentStep,
        zone, reseauDistribution, selectedChefZone, selectedSuperviseur, selectedCommercial, lieuDit,
        heureDebut, heureFin, base,
        equipements, fifo, planogramme, observationPlanogramme, ruptures, incidents,
        veillesData, typeClient, clientDirectNom, observations
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('[AUTO-SAVE] Données sauvegardées');
    } catch (error) {
      console.error('[AUTO-SAVE] Erreur:', error);
    }
  };

  // ===== LOAD SAVED DATA FROM ASYNC STORAGE =====
  const loadSavedData = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const data = JSON.parse(savedData);
        setCurrentStep(data.currentStep || 1);
        setZone(data.zone || zone);
        setReseauDistribution(data.reseauDistribution || '');
        setSelectedChefZone(data.selectedChefZone || selectedChefZone);
        setSelectedSuperviseur(data.selectedSuperviseur || null);
        setSelectedCommercial(data.selectedCommercial || selectedCommercial);
        setLieuDit(data.lieuDit || lieuDit);
        setHeureDebut(data.heureDebut || heureDebut);
        setHeureFin(data.heureFin || '');
        setBase(data.base || base);
        setEquipements(data.equipements || []);
        setFifo(data.fifo !== undefined ? data.fifo : true);
        setPlanogramme(data.planogramme !== undefined ? data.planogramme : true);
        setObservationPlanogramme(data.observationPlanogramme || '');
        setRuptures(data.ruptures || []);
        setIncidents(data.incidents || []);
        setVeillesData(data.veillesData || {});
        setTypeClient(data.typeClient || 'DIRECT');
        setClientDirectNom(data.clientDirectNom || '');
        setObservations(data.observations || '');
        console.log('[LOAD] Données restaurées');
      }
    } catch (error) {
      console.error('[LOAD] Erreur:', error);
    }
  };

  // ===== CLEAR SAVED DATA =====
  const clearSavedData = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('[CLEAR] Données supprimées');
    } catch (error) {
      console.error('[CLEAR] Erreur:', error);
    }
  };

  // ===== NAVIGATION HANDLERS =====
  const handleNext = () => {
    saveDataToStorage();
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    saveDataToStorage();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ===== SUBMIT HANDLER =====
  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Transformer veillesData en liste pour l'API
    const veilles_list = Object.entries(veillesData)
      .filter(([marque, data]) => data.concurrent && data.concurrent !== null)
      .map(([marque, data]) => ({
        concurrent_id: parseInt(data.concurrent),
        nombre_packs: parseInt(data.packs) || 0,
        activite_observee: data.activite || '',
        mecanisme: data.mecanisme || '',
        marque: marque
      }));

    // Définir heureFin si non renseignée
    const heureFinale = heureFin || (() => {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    })();

    // Préparer équipements
    const equipementsValides = equipements.filter(e => e.type || e.marque || e.etat);
    const typeOutilString = equipementsValides.map(e => e.type || '').filter(Boolean).join('; ');
    const marqueOutilString = equipementsValides.map(e => e.marque || '').filter(Boolean).join('; ');
    const etatOutilString = equipementsValides.map(e => e.etat || '').filter(Boolean).join('; ');

    // Préparer ruptures
    const rupturesString = ruptures
      .filter(item => item.article)
      .map(item => {
        const articleInfo = articlesForPicker.find(a => a.value === item.article);
        return articleInfo ? articleInfo.label : '';
      })
      .filter(name => name && name.trim() !== '')
      .join('; ');

    // Préparer incidents
    const incidentsValides = incidents.filter(item => item.type && item.article);
    const premierIncident = incidentsValides[0] || {};

    const articlesIncidents = incidentsValides
      .map(item => {
        const articleInfo = articlesForPicker.find(a => a.value === item.article);
        return articleInfo ? articleInfo.label : '';
      })
      .filter(article => article && article.trim() !== '')
      .join('; ');

    const quantiteTotale = incidentsValides.reduce((sum, item) => {
      const qty = parseInt(item.quantite) || 0;
      return sum + qty;
    }, 0);

    const visiteData = {
      client_id: clientId,
      fifo_respecte: fifo,
      planogramme_respecte: planogramme,
      observations_generales: observations,
      heure_debut: heureDebut,
      heure_fin: heureFinale,
      base: base,
      type_outil: typeOutilString,
      marque_outil: marqueOutilString,
      etat_outil: etatOutilString,
      ruptures: rupturesString,
      type_rupture: '',
      type_incidents: premierIncident.type || '',
      articles_incidents: articlesIncidents,
      quantite_incidents: quantiteTotale > 0 ? quantiteTotale : null,
      observation_planogramme: observationPlanogramme,
      reseau_distribution: reseauDistribution,
      type_client: typeClient,
      client_direct_nom: clientDirectNom,
      releves_stock: isEditMode ? stocksExistants : [],
      details_produits: isEditMode ? commandesExistantes : [],
      veilles_concurrentielles: veilles_list,
    };

    // Ajouter incidents dans details_produits
    incidentsValides.forEach(incident => {
      if (incident.article && incident.type) {
        visiteData.details_produits.push({
          produit_id: incident.article,
          type_detail: 'incident',
          quantite: parseInt(incident.quantite) || 0,
          observation: `${incident.type}`
        });
      }
    });

    const clientUpdateData = {
      zone,
      commercial_nom: selectedCommercial || null,
      lieu_dit: lieuDit,
    };

    try {
      await axiosInstance.put(`/clients/${clientId}`, clientUpdateData);

      if (isEditMode && visitId) {
        await axiosInstance.put(`/visites/${visitId}`, visiteData);
        Alert.alert('Succès', 'Rapport corrigé et soumis à nouveau pour validation.');
      } else {
        await axiosInstance.post('/visites/', visiteData);
        Alert.alert('Succès', 'Rapport soumis et client mis à jour.');
      }

      await clearSavedData();
      navigation.goBack();
    } catch (error) {
      console.error("Erreur soumission", error.response?.data || error);
      Alert.alert('Erreur', 'Impossible de soumettre le rapport.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // ===== RENDER CURRENT STEP =====
  const renderStep = () => {
    // Charger seulement l'étape courante pour économiser la mémoire
    return (
      <Suspense fallback={<View style={styles.center}><ActivityIndicator size="large" color="#007bff" /></View>}>
        {currentStep === 1 && (
          <Step1BasicInfo
            zone={zone}
            setZone={setZone}
            reseauDistribution={reseauDistribution}
            setReseauDistribution={setReseauDistribution}
            selectedChefZone={selectedChefZone}
            setSelectedChefZone={setSelectedChefZone}
            selectedSuperviseur={selectedSuperviseur}
            setSelectedSuperviseur={setSelectedSuperviseur}
            selectedCommercial={selectedCommercial}
            setSelectedCommercial={setSelectedCommercial}
            lieuDit={lieuDit}
            setLieuDit={setLieuDit}
            heureDebut={heureDebut}
            setHeureDebut={setHeureDebut}
            heureFin={heureFin}
            setHeureFin={setHeureFin}
            base={base}
            setBase={setBase}
            chefsZone={chefsZone}
            commerciaux={commerciaux}
          />
        )}
        {currentStep === 2 && (
          <Step2EquipmentCompliance
            equipements={equipements}
            setEquipements={setEquipements}
            fifo={fifo}
            setFifo={setFifo}
            planogramme={planogramme}
            setPlanogramme={setPlanogramme}
            observationPlanogramme={observationPlanogramme}
            setObservationPlanogramme={setObservationPlanogramme}
            ruptures={ruptures}
            setRuptures={setRuptures}
            incidents={incidents}
            setIncidents={setIncidents}
            articlesForPicker={articlesForPicker}
          />
        )}
        {currentStep === 3 && (
          <Step3StocksVeille
            veillesData={veillesData}
            setVeillesData={setVeillesData}
            typeClient={typeClient}
            setTypeClient={setTypeClient}
            clientDirectNom={clientDirectNom}
            setClientDirectNom={setClientDirectNom}
            observations={observations}
            setObservations={setObservations}
            concurrentsForPicker={concurrentsForPicker}
          />
        )}
      </Suspense>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Bandeau de correction si mode édition */}
      {isEditMode && (
        <View style={styles.rejectBanner}>
          <Ionicons name="alert-circle" size={24} color="#fff" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.rejectBannerTitle}>Visite Rejetée - Correction Requise</Text>
            {commentaireRejet && (
              <Text style={styles.rejectBannerMessage}>Raison: {commentaireRejet}</Text>
            )}
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{isEditMode ? 'Corriger le Rapport pour :' : 'Nouveau Rapport pour :'}</Text>
        <Text style={styles.clientName}>{clientName}</Text>
      </View>

      {/* Progress Stepper */}
      <FormStepper currentStep={currentStep} totalSteps={totalSteps} steps={stepLabels} />

      {/* Current Step Content */}
      <View style={styles.stepContent}>
        {renderStep()}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
            <Ionicons name="arrow-back" size={20} color="#007bff" />
            <Text style={styles.previousButtonText}>Précédent</Text>
          </TouchableOpacity>
        )}

        {currentStep < totalSteps ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Suivant</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Soumettre</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: {
    fontSize: 16,
    color: '#6c757d',
  },
  clientName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  rejectBanner: {
    flexDirection: 'row',
    backgroundColor: '#dc3545',
    padding: 16,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  rejectBannerMessage: {
    fontSize: 14,
    color: '#fff',
    fontStyle: 'italic',
  },
  stepContent: {
    flex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#e7f3ff',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  previousButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#007bff',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#28a745',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
