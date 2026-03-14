const db = require('../database/db');

function getGuardLogs(req, res) {
    const guardMobile = req.params.guard_id; // Keeping param name as guard_id for route compatibility but using as mobile

    if (guardMobile !== req.user.mobile) {
        return res.status(403).json({ error: 'Cannot view other guard logs' });
    }

    const { date, limit } = req.query;
    const maxResults = parseInt(limit, 10) || 100;

    let query = 'SELECT * FROM guard_logs WHERE guard_id = ?';
    const params = [guardMobile];

    if (date) {
        query += " AND DATE(timestamp) = ?";
        params.push(date);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(maxResults);

    const logs = db.prepare(query).all(...params);

    const formatted = logs.map(log => ({
        ...log,
        date: log.timestamp ? log.timestamp.split(' ')[0] : null,
        time: log.timestamp ? formatTime(log.timestamp) : null
    }));

    res.json({ logs: formatted });
}

function formatTime(timestamp) {
    const d = new Date(timestamp.replace(' ', 'T') + 'Z');
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

module.exports = { getGuardLogs };
