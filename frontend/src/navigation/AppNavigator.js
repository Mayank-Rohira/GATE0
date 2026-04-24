import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ScanLine, FileText, UserCircle } from 'lucide-react-native';
import { Dock } from '../components/ui/dock';
import RoleSelectScreen from '../screens/RoleSelectScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ResidentDashboard from '../screens/ResidentDashboard';
import CreatePassScreen from '../screens/CreatePassScreen';
import VisitorDashboard from '../screens/VisitorDashboard';
import ScannerScreen from '../screens/ScannerScreen';
import ScanResultScreen from '../screens/ScanResultScreen';
import LogsScreen from '../screens/LogsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../constants/colors';
import { clearSession } from '../hooks/useAuth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function GuardTabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => {
                const items = props.state.routes.map((route) => {
                    let icon;
                    if (route.name === 'Scanner') icon = ScanLine;
                    else if (route.name === 'Logs') icon = FileText;
                    else icon = UserCircle;
                    
                    return { label: route.name, icon };
                });
                return <Dock items={items} activeIndex={props.state.index} onSelect={(idx) => props.navigation.navigate(props.state.routes[idx].name)} />;
            }}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Scanner" component={ScannerScreen} />
            <Tab.Screen name="Logs" component={LogsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

const GATE0_THEME = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: COLORS.background.primary,
        card: COLORS.background.card,
        text: COLORS.text.primary,
        border: COLORS.border.subtle,
        primary: COLORS.accent.primary,
    },
};

export default function AppNavigator() {
    const [initialRoute, setInitialRoute] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function resetSessionOnLaunch() {
            try {
                await clearSession();
                if (isMounted) {
                    setInitialRoute('RoleSelect');
                }
            } catch (error) {
                if (isMounted) {
                    setInitialRoute('RoleSelect');
                }
            }
        }

        resetSessionOnLaunch();
        return () => {
            isMounted = false;
        };
    }, []);

    if (!initialRoute) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background.primary }}>
                <ActivityIndicator color={COLORS.accent.primary} size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer theme={GATE0_THEME}>
            <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
                <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="ResidentHome" component={ResidentDashboard} />
                <Stack.Screen name="CreatePass" component={CreatePassScreen} />
                <Stack.Screen name="VisitorHome" component={VisitorDashboard} />
                <Stack.Screen name="GuardHome" component={GuardTabNavigator} />
                <Stack.Screen name="ScanResult" component={ScanResultScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
