const repository = require('../database/repository');

async function getGuardLogs(req, res) {
    const guardMobile = req.params.guard_id;

    if (guardMobile !== req.user.mobile) {
        return res.status(403).json({ error: 'Cannot view other guard logs' });
    }

    const { date, limit } = req.query;
    const maxResults = parseInt(limit, 10) || 100;

    try {
        const logs = await repository.getGuardLogs(guardMobile, date, maxResults);

        const formatted = logs.map(log => {
            const timestamp = log.timestamp ? new Date(log.timestamp) : null;
            const isValid = timestamp && !isNaN(timestamp.getTime());
            return {
                ...log,
                date: isValid ? timestamp.toISOString().split('T')[0] : null,
                time: isValid ? formatTime(timestamp) : null
            };
        });

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

async function getResidentLogs(req, res) {
    const residentMobile = req.params.resident_mobile;

    if (residentMobile !== req.user.mobile) {
        return res.status(403).json({ error: 'Cannot view other resident activity' });
    }

    const { limit } = req.query;
    const maxResults = parseInt(limit, 10) || 50;

    try {
        const logs = await repository.getResidentLogs(residentMobile, maxResults);

        const formatted = logs.map(log => {
            const timestamp = log.timestamp ? new Date(log.timestamp) : null;
            const isValid = timestamp && !isNaN(timestamp.getTime());
            return {
                ...log,
                date: isValid ? timestamp.toISOString().split('T')[0] : null,
                time: isValid ? formatTime(timestamp) : null
            };
        });

        res.json({ logs: formatted });
    } catch (err) {
        console.error('Get resident logs error:', err);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
}

module.exports = { getGuardLogs, getResidentLogs };
