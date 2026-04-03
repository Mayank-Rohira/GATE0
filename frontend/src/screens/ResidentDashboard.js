import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView, Platform, Animated as RNAnimated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../config/api';
import { getToken, getUser } from '../hooks/useAuth';
import usePolling from '../hooks/usePolling';
import PassCard from '../components/PassCard';
import { Bell, Plus } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { NeonButton } from '../components/ui/neon-button';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StatCard({ label, count, color, isActive, onPress }) {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withSpring(0.98, { stiffness: 400, damping: 20 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { stiffness: 400, damping: 20 });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable 
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                {
                    width: 140,
                    backgroundColor: isActive ? COLORS.background.cardHigh : COLORS.background.card,
                    borderRadius: 12,
                    padding: 20,
                    marginRight: 16,
                    borderWidth: 1,
                    borderColor: isActive ? COLORS.border.tactile : COLORS.border.subtle,
                    ...Platform.select({
                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4 },
                        android: { elevation: 2 },
                        web: { boxShadow: '0 4px 12px rgba(0,0,0,0.3)', userSelect: 'text' }
                    })
                },
                animatedStyle
            ]}
        >
            <Text selectable={true} style={{ fontSize: 32, fontWeight: '800', color: COLORS.text.primary, marginBottom: 8, letterSpacing: -1.5 }}>{count}</Text>
            <Text selectable={true} style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: isActive ? COLORS.accent.tertiary : COLORS.text.muted, letterSpacing: 1.5 }}>{label}</Text>
        </AnimatedPressable>
    );
}


export default function ResidentDashboard({ navigation }) {
    const [passes, setPasses] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUserData] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [filterPeriod, setFilterPeriod] = useState('All');
    const notificationsSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['50%'], []);
    const prevApprovedCount = useRef(0);

    const initUser = async () => {
        const u = await getUser();
        setUserData(u);
    };

    useEffect(() => { initUser(); }, []);

    const fetchPasses = useCallback(async () => {
        try {
            const token = await getToken();
            const u = await getUser();
            if (!token || !u) return;

            const res = await fetch(`${API_BASE}/passes/resident/${u.mobile}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.passes) {
                const currentPasses = data.passes;
                setPasses(currentPasses);

                // Notification Logic
                const approved = currentPasses.filter(p => p.status === 'approved');
                if (approved.length > prevApprovedCount.current) {
                    const newApproved = approved[approved.length - 1];
                    const newNote = {
                        id: Date.now(),
                        title: 'Pass Approved',
                        body: `Your pass for ${newApproved.visitor_name} has been approved.`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    setNotifications(prev => [newNote, ...prev]);
                    setHasUnread(true);
                }
                prevApprovedCount.current = approved.length;
            }
        } catch (err) {
            // silent fail on poll
        }
    }, []);

    usePolling(fetchPasses);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPasses();
        setRefreshing(false);
    };

    // Filter logic based on prompt
    const filteredPasses = passes.filter(p => {
        if (filterPeriod === 'Active') return p.status === 'pending';
        if (filterPeriod === 'Approved') return p.status === 'approved';
        return true; // All
    });

    const sorted = [...filteredPasses].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0;
    });

    const activeCount = passes.filter(p => p.status === 'pending').length;
    const approvedCount = passes.filter(p => p.status === 'approved').length;
    const thisWeekCount = passes.length;

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    // FAB Animation
    const fabScale = useRef(new RNAnimated.Value(1)).current;

    const handleFabPressIn = () => {
        RNAnimated.sequence([
            RNAnimated.timing(fabScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
            RNAnimated.timing(fabScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
    };

    const renderBackdrop = useCallback((props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ), []);

    // Explicitly manage the index in state for better reliability
    const [sheetIndex, setSheetIndex] = useState(-1);

    const handleBellPress = () => {
        setHasUnread(false);
        setSheetIndex(0);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }} edges={['top']}>
            
            {/* Header Bar */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, ...Platform.select({ web: { userSelect: 'text' } }) }}>
                <View>
                    <Text selectable={true} style={{ fontSize: 34, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -1.5 }}>GATE0</Text>
                    <Text selectable={true} style={{ fontSize: 13, fontWeight: '800', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 2 }}>
                        {user ? 'RESIDENT TERMINAL' : 'AUTH SECURE'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleBellPress} style={{ width: 48, height: 48, backgroundColor: COLORS.background.surface, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Bell size={22} color={COLORS.text.primary} />
                        {hasUnread && (
                            <View style={{ position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent.primary, borderWidth: 2, borderColor: COLORS.background.surface }} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <View style={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 24, 
                            backgroundColor: 'rgba(200, 150, 60, 0.1)', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderWidth: 1.5,
                            borderColor: 'rgba(200, 150, 60, 0.4)',
                            ...Platform.select({
                                web: { boxShadow: '0 0 15px rgba(200, 150, 60, 0.25)' },
                                ios: { shadowColor: COLORS.accent.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8 }
                            })
                        }}>
                            <Text selectable={true} style={{ color: COLORS.accent.primary, fontSize: 14, fontWeight: '800' }}>{getInitials(user?.name)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Row */}
            <View style={{ marginBottom: 24 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}>
                    <StatCard label="Active" count={activeCount} color={COLORS.accent.primary} isActive={filterPeriod === 'Active'} onPress={() => setFilterPeriod('Active')} />
                    <StatCard label="Approved" count={approvedCount} color={COLORS.status.success} isActive={filterPeriod === 'Approved'} onPress={() => setFilterPeriod('Approved')} />
                    <StatCard label="This Week" count={thisWeekCount} color={COLORS.accent.secondary} isActive={filterPeriod === 'All'} onPress={() => setFilterPeriod('All')} />
                </ScrollView>
            </View>

            {/* Section Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2.5, color: COLORS.text.muted }}>
                    {filterPeriod === 'All' ? 'Recent Activity' : `${filterPeriod} History`}
                </Text>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('CreatePass')}
                    style={{ backgroundColor: COLORS.background.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.accent.primary }}>+ GENERATE QR</Text>
                </TouchableOpacity>
            </View>

            {/* Pass List */}
            {sorted.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingHorizontal: 40 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 12, textAlign: 'center' }}>No Passes Found</Text>
                    <Text style={{ fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22 }}>You don't have any active passes. Generate a new QR code to invite visitors.</Text>
                </View>
            ) : (
                <FlatList
                    data={sorted}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => <PassCard pass={item} variant="resident" onPress={() => {}} />}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent.primary} />
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
                />
            )}

            {/* Floating Action Button */}
            <RNAnimated.View style={{
                position: 'absolute',
                bottom: 40,
                right: 24,
                transform: [{ scale: fabScale }]
            }}>
                <Pressable
                    onPressIn={handleFabPressIn}
                    onPress={() => setTimeout(() => navigation.navigate('CreatePass'), 150)}
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: COLORS.accent.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...Platform.select({
                            ios: { shadowColor: COLORS.accent.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
                            android: { elevation: 8 },
                        })
                    }}
                >
                    <Plus size={32} color={COLORS.background.primary} />
                </Pressable>
            </RNAnimated.View>

            <BottomSheet
                ref={notificationsSheetRef}
                index={sheetIndex}
                onChange={setSheetIndex}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: COLORS.background.card }}
                handleIndicatorStyle={{ backgroundColor: COLORS.border.subtle }}
            >
                <View style={{ padding: 24, flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text.muted, letterSpacing: 2, textTransform: 'uppercase' }}>Security Notifications</Text>
                        <TouchableOpacity onPress={() => setSheetIndex(-1)}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.accent.primary, textTransform: 'uppercase', letterSpacing: 1 }}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                    {notifications.length === 0 ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -40 }}>
                            <Bell size={40} color={COLORS.border.subtle} style={{ marginBottom: 16 }} />
                            <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.text.secondary }}>No new notifications</Text>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {notifications.map(note => (
                                <View key={note.id} style={{ backgroundColor: COLORS.background.surface, padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border.subtle }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text.primary }}>{note.title}</Text>
                                        <Text style={{ fontSize: 11, color: COLORS.text.muted }}>{note.time}</Text>
                                    </View>
                                    <Text style={{ fontSize: 14, color: COLORS.text.secondary, lineHeight: 20 }}>{note.body}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </BottomSheet>

        </SafeAreaView>
    );
}
