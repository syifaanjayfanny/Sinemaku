import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { geminiProjectRouter } from './server/gemini_project_router';
import { providerService } from './server/ai_infrastructure/provider_service';
import { modelRegistryService } from './server/ai_infrastructure/model_registry_service';
import { createApp } from './server/app';

dotenv.config();

async function startServer() {
  const app = createApp();
  const PORT = 3000;

  // Vite middleware for development or static assets for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Run initial baseline infrastructure seeding and router discovery async without blocking server startup
  Promise.all([
    providerService.initializeDefaults(),
    modelRegistryService.initializeDefaults(),
    geminiProjectRouter.discoverAndValidateAll(),
  ]).catch(console.error);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Cinematic Production Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { createApp };
