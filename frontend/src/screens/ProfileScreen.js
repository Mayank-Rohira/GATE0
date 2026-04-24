import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, ArrowLeft, Edit3, Check, X as CloseIcon } from 'lucide-react-native';
import { getUser, clearSession, saveSession } from '../hooks/useAuth';
import { API_BASE } from '../config/api';
import { getToken } from '../hooks/useAuth';
import { COLORS } from '../constants/colors';

export default function ProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editHouse, setEditHouse] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        getUser().then(u => {
            setUser(u);
            if (u) {
                setEditName(u.name);
                setEditHouse(u.house_number || '');
            }
        });
    }, []);

    const handleUpdateProfile = async () => {
        if (!editName.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }

        setIsSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: editName,
                    house_number: editHouse
                })
            });

            const data = await res.json();
            if (data.success) {
                const updatedUser = { ...user, name: editName, house_number: editHouse };
                await saveSession(token, updatedUser);
                setUser(updatedUser);
                setIsEditing(false);
                if (Platform.OS === 'web') alert("Profile updated successfully");
            } else {
                Alert.alert("Error", data.error || "Failed to update profile");
            }
        } catch (err) {
            Alert.alert("Error", "Network error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        const performLogout = async () => {
            await clearSession();
            
            // For Web, a hard redirect is often cleaner to ensure all states are cleared
            if (Platform.OS === 'web') {
                window.location.href = '/';
                return;
            }

            // For Mobile, use the reset logic targeting the root if possible
            const root = navigation.getParent() || navigation;
            root.reset({
                index: 0,
                routes: [{ name: 'RoleSelect' }],
            });
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to log out of GATE0?")) {
                await performLogout();
            }
        } else {
            Alert.alert(
                "Sign Out",
                "Are you sure you want to log out of GATE0?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Confirm",
                        style: "destructive",
                        onPress: performLogout
                    }
                ]
            );
        }
    };

    if (!user) return null;

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }} edges={['top']}>
            <View style={{ flex: 1, padding: 24 }}>
                
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                                <ArrowLeft color={COLORS.text.primary} size={28} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 34, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -1.5 }}>PROFILE</Text>
                        </View>
                        {!isEditing ? (
                            <TouchableOpacity 
                                onPress={() => setIsEditing(true)}
                                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Edit3 size={20} color={COLORS.accent.primary} />
                            </TouchableOpacity>
                        ) : (
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity 
                                    onPress={() => setIsEditing(false)}
                                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <CloseIcon size={20} color={COLORS.text.muted} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={handleUpdateProfile}
                                    disabled={isSaving}
                                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accent.primary, alignItems: 'center', justifyContent: 'center', opacity: isSaving ? 0.5 : 1 }}
                                >
                                    <Check size={20} color={COLORS.background.primary} />
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={{ backgroundColor: COLORS.status.successBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' }}>
                            <Text style={{ color: COLORS.status.success, fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>Authorized Entity</Text>
                        </View>
                    </View>
                </View>

                {/* Main Profile Card */}
                <View style={{ 
                    backgroundColor: COLORS.background.surface, 
                    borderRadius: 32, 
                    padding: 32, 
                    alignItems: 'center', 
                    width: '100%',
                    marginBottom: 32,
                    ...Platform.select({
                        ios: { shadowColor: COLORS.accent.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24 },
                        android: { elevation: 2 },
                        web: { boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }
                    })
                }}>
                    <View style={{ 
                        width: 128, height: 128, borderRadius: 64, 
                        backgroundColor: COLORS.background.primary, 
                        alignItems: 'center', justifyContent: 'center', 
                        marginBottom: 24,
                    }}>
                        <Text style={{ fontSize: 44, fontWeight: '800', color: COLORS.text.primary }}>
                            {getInitials(user.name)}
                        </Text>
                    </View>
 
                    {isEditing ? (
                        <TextInput 
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Full Name"
                            placeholderTextColor={COLORS.text.muted}
                            style={{ 
                                width: '100%', 
                                fontSize: 24, 
                                fontWeight: '800', 
                                color: COLORS.text.primary, 
                                textAlign: 'center', 
                                borderBottomWidth: 2, 
                                borderBottomColor: COLORS.accent.primary,
                                paddingVertical: 8,
                                marginBottom: 12
                            }}
                        />
                    ) : (
                        <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.text.primary, marginBottom: 8, letterSpacing: -0.5 }}>
                            {user.name}
                        </Text>
                    )}
 
                    <View style={{ 
                        backgroundColor: COLORS.background.primary, 
                        paddingHorizontal: 16, 
                        paddingVertical: 6, 
                        borderRadius: 20,
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: user.role === 'guard' ? COLORS.status.success : COLORS.accent.primary
                    }}>
                        <Text style={{ color: user.role === 'guard' ? COLORS.status.success : COLORS.accent.primary, fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>
                            {user.role}
                        </Text>
                    </View>
 
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                        {user.role === 'resident' && isEditing ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 11, color: COLORS.text.muted, fontWeight: '800', letterSpacing: 1 }}>UNIT </Text>
                                <TextInput 
                                    value={editHouse}
                                    onChangeText={setEditHouse}
                                    placeholder="Unit #"
                                    placeholderTextColor={COLORS.text.muted}
                                    style={{ fontSize: 13, color: COLORS.text.primary, fontWeight: '800', minWidth: 60 }}
                                />
                            </View>
                        ) : (
                            <>
                                <Text style={{ fontSize: 11, color: COLORS.text.muted, fontWeight: '800', letterSpacing: 1 }}>{user.role === 'resident' ? 'UNIT ' : 'CONNECTED '}</Text>
                                <Text style={{ fontSize: 13, color: COLORS.text.primary, fontWeight: '800' }}>
                                    {user.role === 'resident' ? (user.house_number || 'N/A') : user.mobile}
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                <View style={{ gap: 12 }}>
                    {!isEditing && (
                        <View style={{ padding: 24, backgroundColor: COLORS.background.surface, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.border.subtle, alignItems: 'center' }}>
                            <Text style={{ color: COLORS.text.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>TAP EDIT TO CHANGE DETAILS</Text>
                        </View>
                    )}
                </View>

                <View style={{ flex: 1 }} />

                {/* Logout Action */}
                <TouchableOpacity
                    onPress={handleLogout}
                    activeOpacity={0.7}
                    style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: 64, 
                        backgroundColor: '#2a1a1a', // Darker, more premium red background
                        borderRadius: 20, 
                        marginBottom: 32,
                        borderWidth: 1,
                        borderColor: 'rgba(238, 125, 119, 0.2)'
                    }}
                >
                    <LogOut size={22} color={COLORS.status.error} style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.status.error, letterSpacing: 2, textTransform: 'uppercase' }}>Terminate Session</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}
