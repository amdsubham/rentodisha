import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Text, TextInput, FlatList, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import API_BASE_URL from '../services/config';
import { useUser } from '../context/UserContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase/firebase';
const CustomHeader = ({ navigation, onSettingPress, showBack = false }) => {
  const { setUserInfoToStore, useToken } = useUser()
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [allLocations, setLocations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedLocations, setSuggestedLocations] = useState([]);
  const [topLocations, setTopLocations] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/user/getAllLocations`); // Replace with your API endpoint
        const { locations = [] } = response.data;
        const fetchedLocations = locations.map(location => ({
          label: location,
          value: location
        }));
        setLocations(fetchedLocations);
        setTopLocations(fetchedLocations.slice(0, 30));
      } catch (error) {
        console.error('Error fetching locations in component:', error);
      }
    };

    fetchLocations();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filteredLocations = allLocations.filter((location) =>
      location.label.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestedLocations(filteredLocations);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestedLocations([]);
  };

  const selectLocation = (location) => {
    logEvent(analytics, "location changed", location);
    setSelectedLocation(location);
    setModalVisible(false);
    setSearchQuery('');
    setSuggestedLocations([]);
    setUserInfoToStore(location)
  };

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity style={styles.locationItem} onPress={() => selectLocation(item)}>
      <Text style={styles.locationText}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderTag = (item) => (
    <TouchableOpacity style={styles.tag} onPress={() => selectLocation(item)}>
      <Text style={styles.tagText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 0, backgroundColor: 'transparent' }}>
      <LinearGradient colors={['#007DBC', '#005AAA']} style={styles.header}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.selectedLocationContainer} onPress={() => setModalVisible(true)}>
            <Text style={styles.selectedLocationText}>
              {selectedLocation ? selectedLocation.label : 'Select Location'}
            </Text>
            <Icon name="chevron-down" size={20} color="#fff" style={styles.downIcon} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onSettingPress} style={styles.iconButton}>
          <Icon name="settings" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>


      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <LinearGradient colors={['#007DBC', '#dddddd']} style={styles.modalGradient}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Select Location</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search Location"
                placeholderTextColor="#fff"

                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity style={styles.clearIcon} onPress={clearSearch}>
                  <Icon name="close-circle" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsContainer}>
              {searchQuery.length > 0
                ? suggestedLocations.map((location, index) => (
                  <React.Fragment key={index}>
                    {renderTag(location)}
                  </React.Fragment>
                ))
                : topLocations.map((location, index) => (
                  <React.Fragment key={index}>
                    {renderTag(location)}
                  </React.Fragment>
                ))}
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const tagSize = 90;

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    marginLeft: 10,
    alignItems: 'center',
  },
  downIcon: {
    marginLeft: 5,
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: 10,
  },
  selectedLocationText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'open-sans-regular',
  },
  modalView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalGradient: {
    width: '100%',
    height: '60%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'open-sans-regular',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginTop: 20,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'open-sans-light',
  },
  clearIcon: {
    marginLeft: 10,
  },
  locationList: {
    marginTop: 20,
  },
  locationItem: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 10,
  },
  locationText: {
    color: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 170,
    height: tagSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'open-sans-regular',
  },
});

export default CustomHeader;
