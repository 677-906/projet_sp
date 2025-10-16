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
  const [produitsForPicker, setProduitsForPicker] = useState([]);
  const [concurrentsForPicker, setConcurrentsForPicker] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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
      client_id: clientId, fifo, planogramme, observations_generales: observations,
      releves_stock: releves_stock_list,
      details_produits: [...incidents_list, ...commandes_list],
      veilles_concurrentielles: veilles_list,
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
            <Text style={styles.sectionTitle}>Résumé</Text>
            <View style={styles.staticSwitchContainer}><Text style={styles.label}>FIFO respecté</Text><Switch value={fifo} onValueChange={setFifo} /></View>
            <View style={styles.staticSwitchContainer}><Text style={styles.label}>Planogramme respecté</Text><Switch value={planogramme} onValueChange={setPlanogramme} /></View>
        </View>

        <DynamicSection title="Relevé de Stock & Ruptures" items={stocks} setItems={setStocks} listForPicker={produitsForPicker} pickerPlaceholder="Sélectionner produit..." fields={[{ name: 'quantite', placeholder: 'Qté en Stock', type: 'numeric' }]} extraFields={[{ name: 'en_rupture', label: 'En Rupture' }]} />
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
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 16, paddingVertical: 12, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, color: 'black', paddingRight: 30, marginBottom: 10 },
  inputAndroid: { fontSize: 16, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, color: 'black', paddingRight: 30, marginBottom: 10 },
});