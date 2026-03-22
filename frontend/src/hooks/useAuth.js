import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'gate0_token';
const USER_KEY = 'gate0_user';

export async function saveSession(token, user) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getToken() {
    return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getUser() {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

export async function clearSession() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
