import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * LightPicker - Composant de sélection ultra-léger
 * Remplace RNPickerSelect qui consomme trop de mémoire
 *
 * Props:
 * - items: [{label: string, value: any}]
 * - value: any (valeur sélectionnée)
 * - onValueChange: (value) => void
 * - placeholder: {label: string, value: any}
 * - disabled: boolean
 * - style: object (style du conteneur)
 */
export default function LightPicker({
  items = [],
  value,
  onValueChange,
  placeholder = { label: 'Sélectionner...', value: null },
  disabled = false,
  style = {},
}) {
  const [modalVisible, setModalVisible] = useState(false);

  // Trouver le label de la valeur sélectionnée
  const selectedItem = items.find(item => item.value === value);
  const displayLabel = selectedItem ? selectedItem.label : placeholder.label;
  const isPlaceholder = !selectedItem;

  const handleSelect = (item) => {
    onValueChange(item.value);
    setModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        item.value === value && styles.optionItemSelected
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={[
        styles.optionText,
        item.value === value && styles.optionTextSelected
      ]}>
        {item.label}
      </Text>
      {item.value === value && (
        <Ionicons name="checkmark" size={20} color="#007bff" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={style}>
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectorText,
          isPlaceholder && styles.selectorPlaceholder,
          disabled && styles.selectorTextDisabled
        ]}>
          {displayLabel}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? '#999' : '#666'}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item, index) => `${item.value}_${index}`}
              style={styles.optionsList}
              showsVerticalScrollIndicator={true}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 45,
  },
  selectorDisabled: {
    backgroundColor: '#e9ecef',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectorPlaceholder: {
    color: '#999',
  },
  selectorTextDisabled: {
    color: '#6c757d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsList: {
    paddingBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionItemSelected: {
    backgroundColor: '#e7f3ff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#007bff',
    fontWeight: 'bold',
  },
});
