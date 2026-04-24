import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Custom storage wrapper to handle session isolation on Web.
 * On Web, we use sessionStorage to allow multiple tabs (Resident, Visitor, Guard) 
 * to have independent sessions. On Native, we use AsyncStorage for persistence.
 */
const Storage = {
    setItem: async (key, value) => {
        if (Platform.OS === 'web') {
            sessionStorage.setItem(key, value);
            return;
        }
        await AsyncStorage.setItem(key, value);
    },
    getItem: async (key) => {
        if (Platform.OS === 'web') {
            return sessionStorage.getItem(key);
        }
        return await AsyncStorage.getItem(key);
    },
    removeItem: async (key) => {
        if (Platform.OS === 'web') {
            sessionStorage.removeItem(key);
            return;
        }
        await AsyncStorage.removeItem(key);
    },
    multiRemove: async (keys) => {
        if (Platform.OS === 'web') {
            keys.forEach(key => sessionStorage.removeItem(key));
            return;
        }
        await AsyncStorage.multiRemove(keys);
    }
};

export default Storage;
