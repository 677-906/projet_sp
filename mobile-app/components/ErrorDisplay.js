import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// Capturer toutes les erreurs globales (VERSION CORRIGÉE pour React Native)
const ErrorDisplay = () => {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    // Capturer les erreurs JavaScript
    const originalErrorHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.log('🔴 ERREUR CAPTURÉE:', error);

      setErrors(prev => [...prev, {
        message: error.message || 'Erreur inconnue',
        stack: error.stack || 'Pas de stack trace',
        isFatal,
        time: new Date().toLocaleTimeString()
      }]);

      // Appeler le handler original
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });

    // Cleanup
    return () => {
      ErrorUtils.setGlobalHandler(originalErrorHandler);
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>⚠️ ERREURS DÉTECTÉES ({errors.length})</Text>
        <TouchableOpacity onPress={() => setErrors([])} style={styles.clearButton}>
          <Text style={styles.clearText}>Effacer</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        {errors.map((error, index) => (
          <View key={index} style={styles.errorBox}>
            <Text style={styles.errorTime}>{error.time} - {error.isFatal ? 'FATAL' : 'NON-FATAL'}</Text>
            <Text style={styles.errorMessage}>{error.message}</Text>
            <Text style={styles.errorStack} numberOfLines={5}>{error.stack}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ff4444',
    maxHeight: 300,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#cc0000',
  },
  headerText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  clearText: {
    color: '#cc0000',
    fontWeight: 'bold',
  },
  scrollView: {
    padding: 10,
  },
  errorBox: {
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  errorTime: {
    fontSize: 10,
    color: '#666',
    marginBottom: 5,
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#cc0000',
    marginBottom: 5,
  },
  errorStack: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'monospace',
  },
});

export default ErrorDisplay;
