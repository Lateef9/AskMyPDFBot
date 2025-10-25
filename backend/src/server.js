const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const { promisify } = require('util');
const cors = require('cors');
const { Readable } = require('stream');

const app = express();
const upload = multer({ dest: 'uploads/' });
const execAsync = promisify(exec);

app.use(cors());
app.use(express.json());

// PDF Upload Endpoint
app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const { stdout, stderr } = await execAsync(`python src/scripts/ingest.py ${filePath} 2>/dev/null`);
    if (stderr) throw new Error(stderr);
    res.json({ message: 'PDF processed and embeddings stored.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat Streaming Endpoint (POST with JSON body)
app.post('/chat', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = new Readable({ read() {} });

  try {
    const { stdout } = await execAsync(`python src/scripts/retrieve.py "${query}" 2>/dev/null`, { encoding: 'utf8' });
    const chunks = stdout.split('\n').filter(chunk => chunk.trim());
    for (const chunk of chunks) {
      stream.push(`data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`);
    }
    stream.push(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    stream.push(null);
  } catch (error) {
    stream.push(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    stream.push(null);
  }

  stream.pipe(res);
});

// Chat Simple Endpoint (POST with JSON response)
app.post('/chat-simple', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const { stdout } = await execAsync(`python src/scripts/retrieve.py "${query}" 2>/dev/null`, { encoding: 'utf8' });
    // Clean up the answer by replacing \n with actual spaces and removing extra whitespace
    const answer = stdout.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
    
    res.json({ 
      query: query,
      answer: answer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      query: query,
      timestamp: new Date().toISOString()
    });
  }
});

// Keep GET endpoint for backward compatibility
app.get('/chat', async (req, res) => {
  const query = req.query.query || '';
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = new Readable({ read() {} });

  try {
    const { stdout } = await execAsync(`python src/scripts/retrieve.py "${query}" 2>/dev/null`, { encoding: 'utf8' });
    const chunks = stdout.split('\n').filter(chunk => chunk.trim());
    for (const chunk of chunks) {
      stream.push(`data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`);
    }
    stream.push(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    stream.push(null);
  } catch (error) {
    stream.push(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    stream.push(null);
  }

  stream.pipe(res);
});

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Welcome to QA Bot');
});

app.listen(3001, () => console.log('Server running on port 3001'));