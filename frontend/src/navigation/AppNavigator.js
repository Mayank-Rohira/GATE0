import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme } from '@react-navigation/native';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function GuardTabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => {
                const items = props.state.routes.map((route, index) => {
                    const label = route.name === 'ResidentHome' ? 'Scanner' : route.name === 'VisitorHome' ? 'Logs' : route.name;
                    // We use the actual route names from Tab.Screen to map to items
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
    return (
        <NavigationContainer theme={GATE0_THEME}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
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
