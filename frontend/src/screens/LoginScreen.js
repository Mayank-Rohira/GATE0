import React, { useState } from 'react';
import { API_BASE } from '../config/api';
import { saveSession } from '../hooks/useAuth';
import { PremiumAuth } from '../components/ui/premium-auth';

const ROLE_LABELS = { resident: 'Resident', visitor: 'Visitor', guard: 'Guard' };
const DASHBOARD_ROUTES = { resident: 'ResidentHome', visitor: 'VisitorHome', guard: 'GuardHome' };

export default function LoginScreen({ navigation, route }) {
    const { role } = route.params;
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!mobile || !password) { setError('Please fill in all fields'); return; }
        setLoading(true); setError('');

        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, password }),
            });
            const data = await res.json();

            if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
            if (data.user.role !== role) { setError(`This account is registered as ${ROLE_LABELS[data.user.role]}`); setLoading(false); return; }

            await saveSession(data.token, data.user);
            navigation.reset({ index: 0, routes: [{ name: DASHBOARD_ROUTES[role] }] });
        } catch (err) { setError('Cannot connect to server'); setLoading(false); }
    };

    const inputs = [
        { label: 'Mobile Number', props: { value: mobile, onChangeText: setMobile, keyboardType: 'numeric', maxLength: 10, placeholder: '10-digit number' } },
        { label: 'Password', props: { value: password, onChangeText: setPassword, secureTextEntry: true, placeholder: 'Enter your password' } }
    ];

    return (
        <PremiumAuth
            title="GateZero"
            subtitle={`${ROLE_LABELS[role]} Access`}
            role={role.toUpperCase()}
            onBack={() => navigation.goBack()}
            inputs={inputs}
            onSubmit={handleLogin}
            submitLabel="Log In"
            loading={loading}
            error={error}
            footerText="Don't have an account?"
            footerActionText="Sign Up"
            onFooterAction={() => navigation.navigate('Signup', { role })}
        />
    );
}
