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
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 48 }}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={{ width: 44, height: 44, backgroundColor: COLORS.background.card, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border.subtle, marginRight: 16 }}
                    >
                        <ArrowLeft size={24} color={COLORS.accent.primary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={{ fontSize: 32, fontWeight: '800', color: COLORS.text.primary, fontFamily: 'Montserrat' }}>Profile Portal</Text>
                        <Text style={{ fontSize: 13, color: COLORS.text.muted, fontFamily: 'Montserrat', marginTop: 4 }}>GateZero Security Network</Text>
                    </View>
                </View>

                {/* Main Profile Card */}
                <View style={{ 
                    backgroundColor: COLORS.background.card, 
                    borderRadius: 24, 
                    padding: 32, 
                    alignItems: 'center', 
                    borderWidth: 1, 
                    borderColor: COLORS.border.subtle,
                    width: '100%',
                    ...Platform.select({
                        web: { boxShadow: `0 8px 32px rgba(0,0,0,0.4)` },
                        default: { elevation: 4 }
                    })
                }}>
                    <View style={{ 
                        width: 100, height: 100, borderRadius: 50, 
                        backgroundColor: COLORS.background.surface, 
                        alignItems: 'center', justifyContent: 'center', 
                        marginBottom: 20,
                        borderWidth: 2,
                        borderColor: ROLE_COLORS[user.role] || COLORS.accent.primary,
                        ...Platform.select({
                            web: { boxShadow: `0 0 20px ${ROLE_COLORS[user.role]}40` },
                            default: {}
                        })
                    }}>
                        <Text style={{ fontSize: 36, fontWeight: '800', color: COLORS.text.primary, fontFamily: 'Montserrat' }}>
                            {getInitials(user.name)}
                        </Text>
                    </View>

                    <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text.primary, fontFamily: 'Montserrat', marginBottom: 8 }}>
                        {user.name}
                    </Text>

                    <View style={{ 
                        backgroundColor: `${ROLE_COLORS[user.role]}15`, 
                        paddingHorizontal: 16, 
                        paddingVertical: 6, 
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: `${ROLE_COLORS[user.role]}40`,
                        marginBottom: 16
                    }}>
                        <Text style={{ color: ROLE_COLORS[user.role], fontSize: 12, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>
                            {user.role}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, color: COLORS.text.muted, fontFamily: 'Montserrat', letterSpacing: 1 }}>CONNECTED AS </Text>
                        <Text style={{ fontSize: 15, color: COLORS.text.secondary, fontFamily: 'Courier', fontWeight: '700' }}>
                            {user.mobile}
                        </Text>
                    </View>
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
                        backgroundColor: 'rgba(243,139,168,0.1)', 
                        borderRadius: 18, 
                        borderWidth: 1, 
                        borderColor: 'rgba(243,139,168,0.3)',
                        marginBottom: 24
                    }}
                >
                    <LogOut size={22} color={COLORS.status.error} style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.status.error, fontFamily: 'Montserrat', letterSpacing: 1, textTransform: 'uppercase' }}>Terminate Session</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}
