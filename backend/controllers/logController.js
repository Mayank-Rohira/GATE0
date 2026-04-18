const db = require('../database/db');

async function getGuardLogs(req, res) {
    const guardMobile = req.params.guard_id;

    if (guardMobile !== req.user.mobile) {
        return res.status(403).json({ error: 'Cannot view other guard logs' });
    }

    const { date, limit } = req.query;
    const maxResults = parseInt(limit, 10) || 100;

    try {
        let queryStr = 'SELECT * FROM guard_logs WHERE guard_mobile = $1';
        const params = [guardMobile];

        if (date) {
            // PostgreSQL DATE() or ::date works
            queryStr += " AND timestamp::date = $2";
            params.push(date);
        }

        queryStr += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1);
        params.push(maxResults);

        const result = await db.query(queryStr, params);
        const logs = result.rows;

        const formatted = logs.map(log => ({
            ...log,
            date: log.timestamp ? log.timestamp.toISOString().split('T')[0] : null,
            time: log.timestamp ? formatTime(log.timestamp) : null
        }));

        res.json({ logs: formatted });
    } catch (err) {
        console.error('Get guard logs error:', err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
}

function formatTime(timestamp) {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

module.exports = { getGuardLogs };
