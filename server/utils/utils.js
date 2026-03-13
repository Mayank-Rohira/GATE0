function normalizeMobile(mobile) {
    if (!mobile) return '';
    // Strip all non-numeric characters
    const numeric = mobile.replace(/\D/g, '');
    // Take the last 10 digits
    return numeric.slice(-10);
}

module.exports = { normalizeMobile };
