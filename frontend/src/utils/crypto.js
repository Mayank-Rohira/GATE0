const SECRET_KEY = "GATE0_SECURE_TOKEN_2026";

/**
 * Simple XOR-based "encryption" for QR codes.
 * Not military grade, but sufficient to prevent human reading and basic camera scanners.
 * Generic scanners will see the prefix text, our app will decode the payload.
 */
export const encryptPassData = (data, useLegacy = false) => {
    try {
        if (useLegacy) {
            const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
            let result = '';
            for (let i = 0; i < jsonString.length; i++) {
                result += String.fromCharCode(jsonString.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
            }
            const b64 = btoa(result);
            return `GATE0 SECURITY SYSTEM: UNAUTHORIZED TERMINAL DETECTED. LOGGING UNIT COORDINATES... \n\nDECRYPTION_ID: G0_V1_${b64}`;
        }

        // V3 Optimization: Delimited string for maximum density reduction
        // Payload: id|vn|vm|sn|rn|hn
        let payload = '';
        if (typeof data === 'object') {
            const id = (data.id || data.pass_code || '').replace('PASS_', '');
            const vn = data.vn || data.visitor_name || '';
            const vm = data.vm || data.visitor_mobile || '';
            const sn = data.sn || data.service_name || '';
            const rn = data.rn || data.resident_name || '';
            const hn = data.hn || data.house_number || '';
            const soc = data.soc || data.society_name || '';
            payload = `${id}|${vn}|${vm}|${sn}|${rn}|${hn}|${soc}`;
        } else {
            payload = data.replace('PASS_', '');
        }

        let result = '';
        for (let i = 0; i < payload.length; i++) {
            result += String.fromCharCode(payload.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        }
        
        const b64 = btoa(result);
        return `G0:V3:${b64}`;
    } catch (e) {
        return typeof data === 'string' ? data : JSON.stringify(data);
    }
};

const QR_KEY_MAP = {
    id: 'id',
    vn: 'visitor_name',
    vm: 'visitor_mobile',
    sn: 'service_name',
    rn: 'resident_name',
    hn: 'house_number',
    soc: 'society_name'
};

export const decryptPassData = (encryptedString) => {
    try {
        let payload = '';
        let version = '';

        if (encryptedString.startsWith('G0:V3:')) {
            payload = encryptedString.replace('G0:V3:', '');
            version = 'V3';
        } else if (encryptedString.startsWith('G0:V2:')) {
            payload = encryptedString.replace('G0:V2:', '');
            version = 'V2';
        } else if (encryptedString.includes('DECRYPTION_ID: G0_V1_')) {
            payload = encryptedString.split('DECRYPTION_ID: G0_V1_')[1];
            version = 'V1';
        } else {
            return JSON.parse(encryptedString);
        }
        
        const decoded = atob(payload);
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        }
        
        if (version === 'V3') {
            const [id, vn, vm, sn, rn, hn, soc] = result.split('|');
            return {
                id: `PASS_${id}`,
                pass_code: `PASS_${id}`,
                visitor_name: vn,
                visitor_mobile: vm,
                service_name: sn,
                resident_name: rn,
                house_number: hn,
                society_name: soc,
                status: 'pending' // Default for offline
            };
        }

        try {
            const parsed = JSON.parse(result);
            const mapped = {};
            Object.keys(parsed).forEach(k => {
                const fullKey = QR_KEY_MAP[k] || k;
                mapped[fullKey] = parsed[k];
            });
            if (mapped.id && !mapped.pass_code) mapped.pass_code = mapped.id;
            if (mapped.pass_code && !mapped.id) mapped.id = mapped.pass_code;
            if (typeof mapped.id === 'string' && !mapped.id.startsWith('PASS_')) {
                mapped.id = `PASS_${mapped.id}`;
                mapped.pass_code = mapped.id;
            }
            return mapped;
        } catch (e) {
            const finalId = result.startsWith('PASS_') ? result : `PASS_${result}`;
            return { id: finalId, pass_code: finalId };
        }
    } catch (e) {
        try {
            return JSON.parse(encryptedString);
        } catch (ee) {
            return { id: encryptedString };
        }
    }
};
