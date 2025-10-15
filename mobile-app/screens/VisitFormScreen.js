import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, SafeAreaView, Switch } from 'react-native';
import axiosInstance from '../api/axiosConfig';
import RNPickerSelect from 'react-native-picker-select';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- COMPOSANT RÉUTILISABLE AVEC LA LOGIQUE DE FILTRAGE ---
const DynamicSection = ({ title, items, setItems, listForPicker, pickerPlaceholder, fields, extraFields = [] }) => {
  const handleAddItem = () => { setItems(prev => [...prev, { key: Date.now(), id_field: null }]); };
  const handleUpdateItem = (key, field, value) => { setItems(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item)); };
  const handleRemoveItem = (key) => { setItems(prev => prev.filter(item => item.key !== key)); };

  // On calcule l'ensemble des IDs déjà sélectionnés dans cette section
  const selectedIds = new Set(items.map(item => item.id_field));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => {
        // --- MODIFICATION N°1 : On calcule les options disponibles pour CETTE ligne ---
        const availableOptions = listForPicker.filter(
          option => !selectedIds.has(option.value) || option.value === item.id_field
        );
        // ------------------------------------------------------------------------

        return (
          <View key={item.key} style={styles.dynamicItemContainer}>
            <TouchableOpacity onPress={() => handleRemoveItem(item.key)} style={styles.deleteButton}>
              <Ionicons name="trash-bin-outline" size={20} color="#dc3545" />
            </TouchableOpacity>
            <RNPickerSelect
              onValueChange={(value) => handleUpdateItem(item.key, 'id_field', value)}
              // On utilise la nouvelle liste filtrée
              items={availableOptions}
              placeholder={{ label: pickerPlaceholder, value: null }}
              style={pickerSelectStyles}
              value={item.id_field}
            />
            {fields.map(field => (
              <TextInput
                key={field.name}
                style={styles.dynamicInput}
                placeholder={field.placeholder}
                keyboardType={field.type === 'numeric' ? 'numeric' : 'default'}
                value={item[field.name]?.toString() || ''}
                onChangeText={(text) => handleUpdateItem(item.key, field.name, text)}
              />
            ))}
            {extraFields.map(extraField => (
              <View key={extraField.name} style={styles.switchContainer}>
                <Text style={styles.label}>{extraField.label}</Text>
                <Switch
                  value={item[extraField.name] || false}
                  onValueChange={(value) => handleUpdateItem(item.key, extraField.name, value)}
                />
              </View>
            ))}
          </View>
        );
      })}

      {/* --- MODIFICATION N°2 : Le bouton "Ajouter" ne s'affiche que s'il reste des options --- */}
      {items.length < listForPicker.length && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>+ Ajouter une Ligne</Text>
        </TouchableOpacity>
      )}
      {/* ------------------------------------------------------------------------------------- */}
    </View>
  );
};

export default function VisitFormScreen({ route, navigation }) {
  const { clientId, clientName } = route.params;
  const [stocks, setStocks] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [veilles, setVeilles] = useState([]);
  const [fifo, setFifo] = useState(true);
  const [planogramme, setPlanogramme] = useState(true);
  const [observations, setObservations] = useState('');

  // --- Nouveaux champs pour le rapport étendu ---
  const [typeOutil, setTypeOutil] = useState('');
  const [marqueSupport, setMarqueSupport] = useState('');
  const [etatSupport, setEtatSupport] = useState('');
  const [obPlanogramme, setObPlanogramme] = useState('');

  // --- Nouveaux champs pour les quantités par catégorie ---
  const [sp, setSp] = useState('');
  const [op, setOp] = useState('');
  const [vital, setVital] = useState('');
  const [tangui, setTangui] = useState('');
  const [madiba, setMadiba] = useState('');
  const [ceilo, setCeilo] = useState('');
  const [sano, setSano] = useState('');
  const [aquabelle, setAquabelle] = useState('');
  const [ultimeLight, setUltimeLight] = useState('');
  const [valclair, setValclair] = useState('');
  const [autres, setAutres] = useState('');
  const [bgSp, setBgSp] = useState('');
  const [bgBc, setBgBc] = useState('');
  const [bgElim, setBgElim] = useState('');
  const [bgGracedom, setBgGracedom] = useState('');
  const [bgUcb, setBgUcb] = useState('');
  const [brasaf, setBrasaf] = useState('');
  const [autresBg, setAutresBg] = useState('');
  const [edSp, setEdSp] = useState('');
  const [edBc, setEdBc] = useState('');
  const [edElim, setEdElim] = useState('');
  const [autresEd, setAutresEd] = useState('');
  // -------------------------------------------

  const [produitsForPicker, setProduitsForPicker] = useState([]);
  const [concurrentsForPicker, setConcurrentsForPicker] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [heureDebut, setHeureDebut] = useState(null);

  useEffect(() => {
    setHeureDebut(new Date()); // On enregistre l'heure de début dès l'ouverture

    const fetchData = async () => {
      try {
        const [produitsRes, concurrentsRes] = await Promise.all([
          axiosInstance.get('/produits/'),
          axiosInstance.get('/concurrents/')
        ]);
        setProduitsForPicker(produitsRes.data.map(p => ({ label: p.nom_produit, value: p.id })));
        setConcurrentsForPicker(concurrentsRes.data.map(c => ({ label: c.nom, value: c.id })));
      } catch (error) { Alert.alert("Erreur", "Impossible de charger les données initiales."); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const releves_stock_list = stocks.filter(i => i.id_field).map(i => ({ produit_id: i.id_field, quantite_en_stock: parseInt(i.quantite) || 0, est_en_rupture: i.en_rupture || false }));
    const incidents_list = incidents.filter(i => i.id_field).map(i => ({ produit_id: i.id_field, quantite: parseInt(i.quantite) || 0, observation: i.observation || '', type_detail: 'incident' }));
    const commandes_list = commandes.filter(i => i.id_field).map(i => ({ produit_id: i.id_field, quantite: parseInt(i.quantite) || 0, observation: i.observation || '', type_detail: 'commande' }));
    const veilles_list = veilles.filter(i => i.id_field).map(i => ({ concurrent_id: i.id_field, nombre_packs: parseInt(i.packs) || 0, activite_observee: i.activite || '', mecanisme: i.mecanisme || '', marque: '' }));

    const visiteData = {
      client_id: clientId,
      fifo_respecte: fifo,
      planogramme_respecte: planogramme,
      observations_generales: observations,
      releves_stock: releves_stock_list,
      details_produits: [...incidents_list, ...commandes_list],
      veilles_concurrentielles: veilles_list,

      // --- Ajout des heures de début et de fin ---
      heure_debut: heureDebut ? heureDebut.toISOString() : null,
      heure_fin: new Date().toISOString(),

      // --- Ajout des nouveaux champs ---
      type_outil: typeOutil,
      marque_support: marqueSupport,
      etat_support: etatSupport,
      ob_planogramme: obPlanogramme,

      sp: parseInt(sp, 10) || 0,
      op: parseInt(op, 10) || 0,
      autres: parseInt(autres, 10) || 0,

      // Les marques spécifiques ne sont pas dans le modèle Visite,
      // elles sont calculées côté backend ou liées au produit.
      // On envoie les catégories.
      bg_sp: parseInt(bgSp, 10) || 0,
      bg_bc: parseInt(bgBc, 10) || 0,
      bg_elim: parseInt(bgElim, 10) || 0,
      bg_gracedom: parseInt(bgGracedom, 10) || 0,
      bg_ucb: parseInt(bgUcb, 10) || 0,
      brasaf: parseInt(brasaf, 10) || 0,
      autres_bg: parseInt(autresBg, 10) || 0,

      ed_sp: parseInt(edSp, 10) || 0,
      ed_bc: parseInt(edBc, 10) || 0,
      ed_elim: parseInt(edElim, 10) || 0,
      autres_ed: parseInt(autresEd, 10) || 0,
    };

    try {
      await axiosInstance.post('/visites/', visiteData);
      Alert.alert('Succès', 'Rapport soumis.');
      navigation.goBack();
    } catch (error) {
      console.error("Erreur soumission", error.response?.data || error);
      Alert.alert('Erreur', 'Impossible de soumettre le rapport.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large"/></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Nouveau Rapport pour :</Text>
          <Text style={styles.clientName}>{clientName}</Text>
        </View>
        
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Résumé de la Visite</Text>
            <View style={styles.staticSwitchContainer}>
                <Text style={styles.label}>FIFO respecté</Text>
                <Switch value={fifo} onValueChange={setFifo} />
            </View>
            <View style={styles.staticSwitchContainer}>
                <Text style={styles.label}>Planogramme respecté</Text>
                <Switch value={planogramme} onValueChange={setPlanogramme} />
            </View>
            <TextInput
                style={styles.input}
                placeholder="Observations sur le planogramme"
                value={obPlanogramme}
                onChangeText={setObPlanogramme}
            />
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails du Support/PLV</Text>
            <TextInput style={styles.input} placeholder="Type d'outil (ex: Frigo, Étagère...)" value={typeOutil} onChangeText={setTypeOutil} />
            <TextInput style={styles.input} placeholder="Marque du support" value={marqueSupport} onChangeText={setMarqueSupport} />
            <TextInput style={styles.input} placeholder="État du support (ex: Bon, Défaillant...)" value={etatSupport} onChangeText={setEtatSupport} />
        </View>

        <DynamicSection title="Relevé de Stock & Ruptures" items={stocks} setItems={setStocks} listForPicker={produitsForPicker} pickerPlaceholder="Sélectionner produit..." fields={[{ name: 'quantite', placeholder: 'Qté en Stock', type: 'numeric' }]} extraFields={[{ name: 'en_rupture', label: 'En Rupture' }]} />

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relevé par Catégorie</Text>
            <View style={styles.grid}>
                <TextInput style={styles.gridInput} placeholder="SP" value={sp} onChangeText={setSp} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="OP" value={op} onChangeText={setOp} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="Autres" value={autres} onChangeText={setAutres} keyboardType="numeric" />

                <TextInput style={styles.gridInput} placeholder="VITAL" value={vital} onChangeText={setVital} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="TANGUI" value={tangui} onChangeText={setTangui} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="MADIBA" value={madiba} onChangeText={setMadiba} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="CEILO" value={ceilo} onChangeText={setCeilo} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="SANO" value={sano} onChangeText={setSano} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="AQUABELLE" value={aquabelle} onChangeText={setAquabelle} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="ULTIME LIGHT" value={ultimeLight} onChangeText={setUltimeLight} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="VALCLAIR" value={valclair} onChangeText={setValclair} keyboardType="numeric" />

                <TextInput style={styles.gridInput} placeholder="BG SP" value={bgSp} onChangeText={setBgSp} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="BG BC" value={bgBc} onChangeText={setBgBc} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="BG ELIM" value={bgElim} onChangeText={setBgElim} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="BG GRACEDOM" value={bgGracedom} onChangeText={setBgGracedom} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="BG UCB" value={bgUcb} onChangeText={setBgUcb} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="BRASAF" value={brasaf} onChangeText={setBrasaf} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="Autres BG" value={autresBg} onChangeText={setAutresBg} keyboardType="numeric" />

                <TextInput style={styles.gridInput} placeholder="ED SP" value={edSp} onChangeText={setEdSp} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="ED BC" value={edBc} onChangeText={setEdBc} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="ED ELIM" value={edElim} onChangeText={setEdElim} keyboardType="numeric" />
                <TextInput style={styles.gridInput} placeholder="Autres ED" value={autresEd} onChangeText={setAutresEd} keyboardType="numeric" />
            </View>
        </View>
        <DynamicSection title="Incidents" items={incidents} setItems={setIncidents} listForPicker={produitsForPicker} pickerPlaceholder="Sélectionner produit..." fields={[{ name: 'quantite', placeholder: 'Qté', type: 'numeric' }, { name: 'observation', placeholder: 'Observation (ex: abîmé)', type: 'text' }]} />
        <DynamicSection title="Prise de Commande" items={commandes} setItems={setCommandes} listForPicker={produitsForPicker} pickerPlaceholder="Sélectionner produit..." fields={[{ name: 'quantite', placeholder: 'Qté Commandée', type: 'numeric' }, { name: 'observation', placeholder: 'Observation', type: 'text' }]} />
        <DynamicSection title="Veille Concurrentielle" items={veilles} setItems={setVeilles} listForPicker={concurrentsForPicker} pickerPlaceholder="Sélectionner un concurrent..." fields={[{ name: 'packs', placeholder: 'Nombre de packs', type: 'numeric' }, { name: 'activite', placeholder: 'Activité observée', type: 'text' }, { name: 'mecanisme', placeholder: 'Mécanisme', type: 'text' }]} />

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observations Générales</Text>
            <TextInput style={styles.textArea} value={observations} onChangeText={setObservations} multiline/>
        </View>
        
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Soumettre le Rapport Complet</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
    title: { fontSize: 16, color: '#6c757d' },
    clientName: { fontSize: 22, fontWeight: 'bold' },
    section: { backgroundColor: '#fff', marginTop: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', padding: 15 },
    dynamicItemContainer: { padding: 15, borderTopWidth: 1, borderColor: '#f0f0f0', position: 'relative' },
    dynamicInput: { height: 45, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginTop: 10, fontSize: 16 },
    addButton: { backgroundColor: '#e7f3ff', padding: 12, borderRadius: 8, margin: 15, alignItems: 'center' },
    addButtonText: { color: '#007bff', fontSize: 16, fontWeight: 'bold' },
    deleteButton: { position: 'absolute', top: 10, right: 10, padding: 5, zIndex: 1 },
    submitButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', margin: 15 },
    buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
    staticSwitchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, borderTopWidth: 1, borderColor: '#f0f0f0' },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
    label: { fontSize: 16, color: '#444' },
    textArea: { height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, margin: 15, fontSize: 16 },
    input: { height: 45, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginHorizontal: 15, marginTop: 10, fontSize: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 15 },
    gridInput: { width: '48%', height: 45, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginTop: 10, fontSize: 16 },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 16, paddingVertical: 12, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, color: 'black', paddingRight: 30, marginBottom: 10 },
  inputAndroid: { fontSize: 16, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, color: 'black', paddingRight: 30, marginBottom: 10 },
});