const SECRET_KEY = "GATE0_SECURE_TOKEN_2026";

/**
 * Manual Base64 Implementation for React Native compatibility
 */
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const Base64 = {
    btoa: (input = '') => {
        let str = String(input);
        let output = '';
        for (let block = 0, charCode, i = 0, map = chars;
            str.charAt(i | 0) || (map = '=', i % 1);
            output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
            charCode = str.charCodeAt(i += 3 / 4);
            if (charCode > 0xFF) {
                throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
            }
            block = block << 8 | charCode;
        }
        return output;
    },
    atob: (input = '') => {
        let str = String(input).replace(/[=]+$/, '');
        let output = '';
        if (str.length % 4 === 1) {
            throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
        }
        for (let bc = 0, bs, buffer, i = 0;
            buffer = str.charAt(i++);
            ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
                bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
            buffer = chars.indexOf(buffer);
        }
        return output;
    }
};

/**
 * Simple XOR-based "encryption" for QR codes.
 */
export const encryptPassData = (data, useLegacy = false) => {
    try {
        if (useLegacy) {
            const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
            let result = '';
            for (let i = 0; i < jsonString.length; i++) {
                result += String.fromCharCode(jsonString.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
            }
            const b64 = Base64.btoa(result);
            return `GATE0 SECURITY SYSTEM: UNAUTHORIZED TERMINAL DETECTED. LOGGING UNIT COORDINATES... \n\nDECRYPTION_ID: G0_V1_${b64}`;
        }

        let payload = '';
        if (typeof data === 'object') {
            const id = String(data.id || data.pass_code || '').replace(/^PASS_/, '');
            const vn = String(data.vn || data.visitor_name || '');
            const vm = String(data.vm || data.visitor_mobile || '');
            const sn = String(data.sn || data.service_name || '');
            const rn = String(data.rn || data.resident_name || '');
            const hn = String(data.hn || data.house_number || '');
            const soc = String(data.soc || data.society_name || '');
            payload = `${id}|${vn}|${vm}|${sn}|${rn}|${hn}|${soc}`;
        } else {
            payload = String(data).replace(/^PASS_/, '');
        }

        let result = '';
        for (let i = 0; i < payload.length; i++) {
            result += String.fromCharCode(payload.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        }
        
        const b64 = Base64.btoa(result);
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
        if (!encryptedString) return { id: '' };
        
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
            // Raw JSON fallback
            try { return JSON.parse(encryptedString); } catch(e) { 
                const raw = String(encryptedString).trim();
                const normalized = raw.startsWith('PASS_') ? raw : `PASS_${raw}`;
                return { id: normalized, pass_code: normalized };
            }
        }
        
        const decoded = Base64.atob(payload);
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        }
        
        if (version === 'V3') {
            const parts = result.split('|');
            const [id, vn, vm, sn, rn, hn, soc] = parts;
            const normalizedId = String(id).startsWith('PASS_') ? id : `PASS_${id}`;
            return {
                id: normalizedId,
                pass_code: normalizedId,
                visitor_name: vn || '',
                visitor_mobile: vm || '',
                service_name: sn || '',
                resident_name: rn || '',
                house_number: hn || '',
                society_name: soc || '',
                status: 'pending' 
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
            
            if (mapped.id) {
                const idStr = String(mapped.id);
                if (!idStr.startsWith('PASS_')) {
                    mapped.id = `PASS_${idStr}`;
                    mapped.pass_code = mapped.id;
                }
            }
            return mapped;
        } catch (e) {
            const raw = result.trim();
            const finalId = raw.startsWith('PASS_') ? raw : `PASS_${raw}`;
            return { id: finalId, pass_code: finalId };
        }
    } catch (e) {
        try {
            return JSON.parse(encryptedString);
        } catch (ee) {
            const raw = String(encryptedString).trim();
            const finalId = raw.startsWith('PASS_') ? raw : `PASS_${raw}`;
            return { id: finalId, pass_code: finalId };
        }
    }
};

