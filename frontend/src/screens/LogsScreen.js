import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, FlatList, RefreshControl, TextInput, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ArrowRight, FileText, User, Phone, MapPin, Clock, Download } from 'lucide-react-native';
import { API_BASE } from '../config/api';
import { getToken, getUser } from '../hooks/useAuth';
import usePolling from '../hooks/usePolling';
import { COLORS } from '../constants/colors';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const FILTERS = ['All', 'Today', 'This Week'];

export default function LogsScreen() {
    const [logs, setLogs] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedLog, setSelectedLog] = useState(null);

    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['45%'], []);

    const fetchLogs = useCallback(async () => {
        try {
            const token = await getToken();
            const user = await getUser();
            if (!token || !user || user.role !== 'guard') return;

            const res = await fetch(`${API_BASE}/logs/${user.mobile}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.logs) setLogs(data.logs);
        } catch (err) { }
    }, []);

    usePolling(fetchLogs);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchLogs();
        setRefreshing(false);
    };

    const getStatusColor = (log) => {
        if (log.status === 'denied') return COLORS.status.error;
        if (log.status === 'pending') return COLORS.accent.secondary;
        return COLORS.status.success;
    };

    const getLogActionText = (log) => {
        if (log.status === 'denied') return `Denied ${log.visitor_name}`;
        return `Scanned ${log.service_name || log.visitor_name || 'Pass'}`;
    };

    const isToday = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr.replace(' ', 'T') + 'Z');
        if (isNaN(d.getTime())) return false; // Fallback
        return d.toDateString() === new Date().toDateString();
    };

    const isThisWeek = (dateStr) => {
        if (!dateStr) return true; // Fallback to all
        const d = new Date(dateStr.replace(' ', 'T') + 'Z');
        if (isNaN(d.getTime())) return true;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return d > weekAgo;
    };

    const filteredLogs = useMemo(() => {
        let result = logs;
        if (activeFilter === 'Today') {
            result = result.filter(l => isToday(l.timestamp));
        } else if (activeFilter === 'This Week') {
            result = result.filter(l => isThisWeek(l.timestamp));
        }
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(l => 
                (l.visitor_name && l.visitor_name.toLowerCase().includes(q)) || 
                (l.service_name && l.service_name.toLowerCase().includes(q)) ||
                (l.house_number && l.house_number.toLowerCase().includes(q))
            );
        }
        return result;
    }, [logs, activeFilter, searchQuery]);

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const handleLogPress = (log) => {
        setSelectedLog(log);
        bottomSheetRef.current?.expand();
    };

    const exportToCSV = async () => {
        if (filteredLogs.length === 0) return;
        
        try {
            const headers = ['Date', 'Time', 'Visitor Name', 'Visitor Mobile', 'Service', 'Resident', 'House', 'Status'];
            const rows = filteredLogs.map(log => [
                `"${log.date || ''}"`,
                `"${log.time || ''}"`,
                `"${log.visitor_name || ''}"`,
                `"${log.visitor_mobile || ''}"`,
                `"${log.service_name || ''}"`,
                `"${log.resident_name || ''}"`,
                `"${log.house_number || ''}"`,
                `"${log.society_name || ''}"`
            ].join(','));
            
            // Remove BOM (\uFEFF) as it can cause "UTF-8" errors on some mobile OS/Apps
            const csvContent = [headers.join(','), ...rows].join('\n');
            
            if (Platform.OS === 'web') {
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gate0_logs_export.csv`;
                a.click();
            } else {
                const fileName = `gate0_logs_${Date.now()}.csv`;
                const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
                
                // Writing as UTF8 without BOM
                await FileSystem.writeAsStringAsync(fileUri, csvContent, { 
                    encoding: FileSystem.EncodingType.UTF8 
                });
                
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri, { 
                        mimeType: 'text/comma-separated-values', 
                        dialogTitle: 'Export GATE0 Logs',
                        UTI: 'public.comma-separated-values-text' 
                    });
                } else {
                    alert('Sharing is not available on this device');
                }
            }
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert(`Export failed: ${error.message}`);
        }
    };

    const renderBackdrop = useCallback((props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ), []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }} edges={['top']}>
            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
                
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <View>
                        <Text style={{ fontSize: 38, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -2 }}>LOGS</Text>
                        <View style={{ backgroundColor: COLORS.background.cardHigh, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, marginTop: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border.tactile }}>
                            <Text selectable={true} style={{ color: COLORS.accent.primary, fontSize: 11, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase' }}>Security Intel</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        onPress={exportToCSV}
                        style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border.subtle }}
                    >
                        <Download size={22} color={COLORS.accent.primary} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.surface, borderRadius: 8, height: 56, paddingHorizontal: 18, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border.subtle }}>
                    <Search size={18} color={COLORS.text.muted} style={{ marginRight: 16 }} />
                    <TextInput
                        style={{ flex: 1, fontSize: 15, color: COLORS.text.primary, height: '100%', fontWeight: '700' }}
                        placeholderTextColor={COLORS.text.muted}
                        placeholder="Search Identity or House"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>


                {/* Filter Tabs */}
                <View style={{ marginBottom: 32 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 4 }}>
                        {FILTERS.map((filter) => {
                            const isActive = activeFilter === filter;
                            return (
                                <Pressable 
                                    key={filter}
                                    onPress={() => setActiveFilter(filter)}
                                    style={{
                                        paddingHorizontal: 18,
                                        paddingVertical: 10,
                                        borderRadius: 12,
                                        marginRight: 10,
                                        backgroundColor: isActive ? COLORS.accent.primary : COLORS.background.surface,
                                    }}
                                >
                                    <Text style={{ 
                                        color: isActive ? COLORS.background.primary : COLORS.text.secondary,
                                        fontSize: 11,
                                        fontWeight: '800',
                                        letterSpacing: 1.5,
                                        textTransform: 'uppercase'
                                    }}>
                                        {filter}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Logs List */}
                {filteredLogs.length === 0 ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -40 }}>
                        <View style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: COLORS.background.card, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.border.tactile }}>
                            <FileText size={36} color={COLORS.border.tactile} />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 12, letterSpacing: -1 }}>NO DATA COLLECTED</Text>
                        <Text style={{ fontSize: 13, color: COLORS.text.muted, textAlign: 'center', paddingHorizontal: 48, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1 }}>
                            {searchQuery ? 'Filter calibration required.' : 'Secure ledger standby.'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredLogs}
                        keyExtractor={(item, idx) => item.id ? String(item.id) : String(idx)}
                        renderItem={({ item }) => (
                            <Pressable 
                                onPress={() => handleLogPress(item)}
                                style={({ pressed }) => [
                                    { 
                                        backgroundColor: COLORS.background.card, 
                                        borderRadius: 12, 
                                        padding: 24, 
                                        marginBottom: 16, 
                                        borderWidth: 1,
                                        borderColor: COLORS.border.subtle,
                                        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }, android: { elevation: 2 } })
                                    },
                                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                                ]}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: COLORS.border.subtle }}>
                                            <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text.primary }}>{getInitials(item.visitor_name)}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -0.2 }}>{item.visitor_name}</Text>
                                            <Text style={{ fontSize: 11, color: getStatusColor(item), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>{getLogActionText(item)}</Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.text.primary, letterSpacing: 0.5 }}>{item.time}</Text>
                                        <Text style={{ fontSize: 10, color: COLORS.text.muted, fontWeight: '800', textTransform: 'uppercase' }}>{item.date}</Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border.subtle }}>
                                        <User size={12} color={COLORS.text.muted} style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 11, color: COLORS.text.secondary, fontWeight: '800', textTransform: 'uppercase' }}>AUTH: {item.resident_name || 'Resident'}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border.subtle }}>
                                        <MapPin size={12} color={COLORS.text.muted} style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 11, color: COLORS.text.secondary, fontWeight: '800', textTransform: 'uppercase' }}>{item.house_number}</Text>
                                    </View>
                                </View>
                            </Pressable>
                        )}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent.primary} />}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                )}

            </View>

            {/* Log Detail Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: COLORS.background.card }}
                handleIndicatorStyle={{ backgroundColor: COLORS.border.subtle }}
            >
                {selectedLog && (
                    <View style={{ padding: 24, flex: 1 }}>
                        <View style={{ width: 48, height: 6, backgroundColor: COLORS.border.subtle, borderRadius: 3, alignSelf: 'center', marginBottom: 28 }} />
                        
                        <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: COLORS.text.muted, marginBottom: 24 }}>Event Intelligence</Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
                            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text.primary }}>{getInitials(selectedLog.visitor_name)}</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -0.5 }}>{selectedLog.visitor_name}</Text>
                                <View style={{ backgroundColor: COLORS.background.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4, alignSelf: 'flex-start' }}>
                                    <Text style={{ fontSize: 13, color: COLORS.text.secondary, fontWeight: '700' }}>{selectedLog.service_name || 'General Visitor'}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ backgroundColor: COLORS.background.surface, borderRadius: 24, padding: 20 }}>
                            <LogDetailItem icon={<Phone size={18} color={COLORS.accent.primary} />} label="Mobile" value={selectedLog.visitor_mobile || 'N/A'} />
                            <LogDetailItem icon={<User size={18} color={COLORS.accent.primary} />} label="Auth By" value={selectedLog.resident_name || 'N/A'} />
                            <LogDetailItem icon={<MapPin size={18} color={COLORS.accent.secondary} />} label="Destination" value={`${selectedLog.house_number}, ${selectedLog.society_name}`} />
                            <LogDetailItem icon={<Clock size={18} color={COLORS.accent.secondary} />} label="Timestamp" value={`${selectedLog.date} @ ${selectedLog.time}`} isLast />
                        </View>
                    </View>
                )}
            </BottomSheet>

        </SafeAreaView>
    );
}

function LogDetailItem({ icon, label, value, isLast = false }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isLast ? 0 : 20 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.background.primary, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>{icon}</View>
            <View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text.primary }}>{value}</Text>
            </View>
        </View>
    );
}
