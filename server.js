const express = require('express');
const cors = require('cors');
const { loadStore, saveStore, createEmptyStore } = require('./src/storage/fileStore');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper to normalize data (ensure arrays exist)
const normalizeStore = (store) => {
  const base = createEmptyStore();
  const merged = { ...base, ...store };
  
  // Ensure all array fields from base exist in merged
  Object.keys(base).forEach(key => {
    if (Array.isArray(base[key]) && !Array.isArray(merged[key])) {
      merged[key] = [];
    }
  });
  
  // Preserve meta if not present
  if (!merged.meta) merged.meta = base.meta;
  
  return merged;
};

app.get('/api/config', async (req, res) => {
  try {
    console.log('GET /api/config');
    const store = await loadStore();
    const normalized = normalizeStore(store);
    res.json(normalized);
  } catch (error) {
    console.error('Error loading config:', error);
    res.status(500).json({ error: 'Failed to load configuration' });
  }
});

app.put('/api/config', async (req, res) => {
  try {
    console.log('PUT /api/config');
    const newConfig = req.body;
    const currentStore = await loadStore();
    
    // Merge logic
    const merged = { ...currentStore, ...newConfig };
    const normalized = normalizeStore(merged);
    
    await saveStore(normalized);
    res.sendStatus(204);
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
