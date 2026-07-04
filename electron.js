import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const isDev =
  process.env.ELECTRON_DEV === '1' ||
  (!app.isPackaged && process.env.NODE_ENV !== 'production');

if (isDev) {
  dotenv.config({ path: path.join(__dirname, '.env') });
}

function loadPackagedEnv() {
  const userEnv = path.join(app.getPath('userData'), '.env');
  if (!fs.existsSync(userEnv)) {
    const example = path.join(__dirname, '.env.example');
    if (fs.existsSync(example)) {
      fs.copyFileSync(example, userEnv);
    }
  }
  if (fs.existsSync(userEnv)) {
    dotenv.config({ path: userEnv, override: true });
  }
}

app.whenReady().then(async () => {
  if (!isDev) {
    loadPackagedEnv();
  }

  const { createMainWindow } = await import('./src/main/main.js');
  createMainWindow(isDev);

  app.on('activate', () => {
    if (createMainWindow.getWindowCount?.() === 0) {
      createMainWindow(isDev);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
