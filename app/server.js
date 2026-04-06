const express = require('express');
const mysql = require('mysql2/promise');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// MySQL 연결 풀
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql.blog.svc.cluster.local',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'bloguser',
  password: process.env.DB_PASSWORD || 'BlogUser2026!',
  database: process.env.DB_NAME || 'blog',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

// DB 연결 상태
let dbConnected = false;

async function checkDB() {
  try {
    await pool.query('SELECT 1');
    dbConnected = true;
  } catch (err) {
    dbConnected = false;
    console.error('DB connection failed:', err.message);
  }
}

// 주기적 DB 상태 확인
setInterval(checkDB, 30000);
checkDB();

// Health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    hostname: os.hostname(),
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
  };
  const statusCode = dbConnected ? 200 : 503;
  res.status(statusCode).json(health);
});

// 블로그 목록
app.get('/api/posts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/posts error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// 블로그 상세
app.get('/api/posts/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/posts/:id error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// 블로그 작성
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const [result] = await pool.query(
      'INSERT INTO posts (title, content, author) VALUES (?, ?, ?)',
      [title, content, author]
    );
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/posts error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// 메인 페이지
app.get('/', (req, res) => {
  res.json({
    app: 'EKS Blog Platform',
    version: process.env.APP_VERSION || '2.0.0',
    hostname: os.hostname(),
    database: dbConnected ? 'connected' : 'disconnected',
    endpoints: ['GET /health', 'GET /api/posts', 'GET /api/posts/:id', 'POST /api/posts'],
  });
});

app.listen(PORT, () => {
  console.log(`Blog app running on port ${PORT}`);
});

