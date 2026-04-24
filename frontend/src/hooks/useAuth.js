import Storage from '../utils/storage';

const TOKEN_KEY = 'gate0_token';
const USER_KEY = 'gate0_user';

export async function saveSession(token, user) {
    await Storage.setItem(TOKEN_KEY, token);
    await Storage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getToken() {
    return Storage.getItem(TOKEN_KEY);
}

export async function getUser() {
    const raw = await Storage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

export async function clearSession() {
    await Storage.multiRemove([TOKEN_KEY, USER_KEY]);
}
