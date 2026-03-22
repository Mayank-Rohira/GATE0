import React, { useState } from 'react';
import { API_BASE } from '../config/api';
import { PremiumAuth } from '../components/ui/premium-auth';

const ROLE_LABELS = { resident: 'Resident', visitor: 'Visitor', guard: 'Guard' };

export default function SignupScreen({ navigation, route }) {
    const { role } = route.params;
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [houseNumber, setHouseNumber] = useState('');
    const [societyName, setSocietyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async () => {
        if (!name || !mobile || !password) { setError('Please fill in all required fields'); return; }
        if (role === 'resident' && (!houseNumber || !societyName)) { setError('House number and society name are required'); return; }
        setLoading(true); setError('');

        try {
            const res = await fetch(`${API_BASE}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, mobile, password, role, house_number: houseNumber || '', society_name: societyName || '' }),
            });
            const data = await res.json();

            if (!res.ok) { setError(data.error || 'Signup failed'); setLoading(false); return; }
            navigation.replace('Login', { role });
        } catch (err) { setError('Cannot connect to server'); setLoading(false); }
    };

    const inputs = [
        { label: 'Full Name', props: { value: name, onChangeText: setName, placeholder: 'Your full name' } },
        { label: 'Mobile Number', props: { value: mobile, onChangeText: setMobile, keyboardType: 'numeric', maxLength: 10, placeholder: '10-digit number' } },
        { label: 'Password', props: { value: password, onChangeText: setPassword, secureTextEntry: true, placeholder: 'Create a secure password' } }
    ];

    if (role === 'resident') {
        inputs.push({ label: 'House Details', props: { value: houseNumber, onChangeText: setHouseNumber, placeholder: 'Door / Flat No. (e.g. A-201)' } });
        inputs.push({ label: 'Society', props: { value: societyName, onChangeText: setSocietyName, placeholder: 'Name of your Residency' } });
    }

    return (
        <PremiumAuth
            title="Join GateZero"
            subtitle={`${ROLE_LABELS[role]} Registration`}
            role={role.toUpperCase()}
            onBack={() => navigation.goBack()}
            inputs={inputs}
            onSubmit={handleSignup}
            submitLabel="Create Account"
            loading={loading}
            error={error}
            footerText="Already have an account?"
            footerActionText="Log In"
            onFooterAction={() => navigation.replace('Login', { role })}
        />
    );
}
