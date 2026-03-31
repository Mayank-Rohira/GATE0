import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, RefreshCcw, HelpCircle, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { getUser, clearSession } from '../hooks/useAuth';
import { COLORS } from '../constants/colors';

export default function ProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        getUser().then(setUser);
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to log out of GATE0?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    style: "destructive",
                    onPress: async () => {
                        await clearSession();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'RoleSelect' }],
                        });
                    }
                }
            ]
        );
    };

    if (!user) return null;

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const ROLE_COLORS = {
        resident: COLORS.accent.primary,
        visitor: COLORS.accent.secondary,
        guard: COLORS.status.success
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
 
                    <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.text.primary, marginBottom: 8, letterSpacing: -0.5 }}>
                        {user.name}
                    </Text>
 
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
                        <Text style={{ fontSize: 11, color: COLORS.text.muted, fontWeight: '800', letterSpacing: 1 }}>CONNECTED </Text>
                        <Text style={{ fontSize: 13, color: COLORS.text.primary, fontWeight: '800' }}>
                            {user.mobile}
                        </Text>
                    </View>
                </View>

                <View style={{ gap: 12 }}>
                    <ProfileMenuItem icon={<RefreshCcw size={20} color={COLORS.accent.primary} />} label="Update Credentials" />
                    <ProfileMenuItem icon={<HelpCircle size={20} color={COLORS.accent.primary} />} label="Security Support" />
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
                        backgroundColor: COLORS.status.errorBg, 
                        borderRadius: 20, 
                        marginBottom: 32
                    }}
                >
                    <LogOut size={22} color={COLORS.status.error} style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.status.error, letterSpacing: 1, textTransform: 'uppercase' }}>Terminate Session</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

function ProfileMenuItem({ icon, label }) {
    return (
        <TouchableOpacity 
            style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: 20, 
                backgroundColor: COLORS.background.surface, 
                borderRadius: 20 
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.background.primary, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                    {icon}
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text.primary }}>{label}</Text>
            </View>
            <ChevronRight size={20} color={COLORS.text.muted} />
        </TouchableOpacity>
    );
}
