const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 인메모리 블로그 저장소
const posts = [
  { id: 1, title: 'EKS 플랫폼 구축기', content: 'Terraform으로 AWS EKS 인프라를 자동화한 이야기', author: 'woody', createdAt: new Date().toISOString() },
  { id: 2, title: 'Canary 배포 전략', content: 'Argo Rollouts를 활용한 무중단 배포', author: 'woody', createdAt: new Date().toISOString() },
];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', hostname: os.hostname(), timestamp: new Date().toISOString() });
});

// 블로그 목록
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

// 블로그 상세
app.get('/api/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// 블로그 작성
app.post('/api/posts', (req, res) => {
  const { title, content, author } = req.body;
  const post = { id: posts.length + 1, title, content, author, createdAt: new Date().toISOString() };
  posts.push(post);
  res.status(201).json(post);
});

// 메인 페이지
app.get('/', (req, res) => {
  res.json({
    app: 'EKS Blog Platform',
    version: process.env.APP_VERSION || '1.0.0',
    hostname: os.hostname(),
    endpoints: ['GET /health', 'GET /api/posts', 'GET /api/posts/:id', 'POST /api/posts'],
  });
});

app.listen(PORT, () => {
  console.log(`Blog app running on port ${PORT}`);
});
