const router = require("express").Router();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Backup configuration
const BACKUP_CONFIG = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "5432",
    database: process.env.DB_NAME || "spraycenter",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    pgPath: process.env.PG_PATH || "C:\\Program Files\\PostgreSQL\\17\\bin"
};

// Create backup folder if not exists
const backupDir = path.join(__dirname, "..", "backups");
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// GET /api/backup - Trigger database backup
router.get("/", async (req, res) => {
    try {
        // Generate filename with timestamp
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const filename = `spraycenter_backup_${timestamp}.sql`;
        const filepath = path.join(backupDir, filename);

        // Build pg_dump command
        const pgDump = path.join(BACKUP_CONFIG.pgPath, "pg_dump.exe");
        const command = `"${pgDump}" -U ${BACKUP_CONFIG.user} -h ${BACKUP_CONFIG.host} -p ${BACKUP_CONFIG.port} -d ${BACKUP_CONFIG.database} -F p -f "${filepath}"`;

        // Set password in environment
        const env = { ...process.env, PGPASSWORD: BACKUP_CONFIG.password };

        console.log("Starting database backup...");
        console.log("Backup file:", filepath);

        // Execute backup
        exec(command, { env }, (error, stdout, stderr) => {
            if (error) {
                console.error("Backup failed:", error.message);
                return res.status(500).json({
                    success: false,
                    message: "Backup failed",
                    error: error.message
                });
            }

            // Verify file was created
            if (fs.existsSync(filepath)) {
                const stats = fs.statSync(filepath);
                console.log("Backup successful! Size:", stats.size, "bytes");

                // Cleanup old backups (keep last 10)
                cleanupOldBackups();

                return res.json({
                    success: true,
                    message: "Backup created successfully",
                    filename: filename,
                    size: stats.size,
                    path: filepath
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Backup file was not created"
                });
            }
        });

    } catch (err) {
        console.error("Backup error:", err);
        res.status(500).json({
            success: false,
            message: "Backup failed",
            error: err.message
        });
    }
});

// GET /api/backup/list - List all backups
router.get("/list", async (req, res) => {
    try {
        if (!fs.existsSync(backupDir)) {
            return res.json({ backups: [] });
        }

        const files = fs.readdirSync(backupDir)
            .filter(f => f.endsWith(".sql"))
            .map(f => {
                const filepath = path.join(backupDir, f);
                const stats = fs.statSync(filepath);
                return {
                    filename: f,
                    size: stats.size,
                    created: stats.mtime
                };
            })
            .sort((a, b) => new Date(b.created) - new Date(a.created));

        res.json({ backups: files });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cleanup old backups (keep last 10)
function cleanupOldBackups() {
    try {
        const files = fs.readdirSync(backupDir)
            .filter(f => f.endsWith(".sql"))
            .map(f => ({
                name: f,
                time: fs.statSync(path.join(backupDir, f)).mtime
            }))
            .sort((a, b) => b.time - a.time);

        // Delete files beyond the 10th
        if (files.length > 10) {
            files.slice(10).forEach(f => {
                fs.unlinkSync(path.join(backupDir, f.name));
                console.log("Deleted old backup:", f.name);
            });
        }
    } catch (err) {
        console.error("Cleanup error:", err);
    }
}

module.exports = router;
