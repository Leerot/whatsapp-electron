const { app, BrowserWindow, Notification, Tray, Menu, globalShortcut } = require("electron");
const path = require("path");

let win;
let tray;

function createWindow() {
  // Definimos el User Agent
  const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "icons/icon.png"),
    userAgent: userAgent, 
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });-
  
  // User Agent
  win.webContents.setUserAgent(userAgent);

  // Esto borrará cookies y Service Workers viejos, en caso de ser necesario
  // win.webContents.session.clearStorageData();

  // 3. Cargamos la URL pasando el User Agent también en la petición
  win.loadURL('https://web.whatsapp.com', { userAgent: userAgent });


  // 👉 Cargar WhatsApp Web 
  win.loadURL("https://web.whatsapp.com");

  // 👉 Bloquear zoom
  win.webContents.on("did-finish-load", () => {
    win.webContents.setZoomFactor(1);
    win.webContents.setVisualZoomLevelLimits(1, 1);
    win.webContents.setLayoutZoomLevelLimits(0, 0);
  });

  // 👉 Notificaciones (desde preload)
  const { ipcMain } = require("electron");
  ipcMain.on("notify", (_, { title, body }) => {
    new Notification({ title, body }).show();
  });


  // 👉 Cuando se cierre la ventana, esconderla y no cerrar la app
  win.on("close", (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      win.hide();
    }
  });

  createTray();
  setupMenu();
  setupShortcuts();
}

// 🚀 Bandeja del sistema
function createTray() {
  tray = new Tray(path.join(__dirname, "icons/icon.png"));

  const trayMenu = Menu.buildFromTemplate([
    {
      label: "Mostrar WhatsApp",
      click: () => win.show()
    },
    {
      label: "Recargar",
      click: () => win.reload()
    },
    {
      label: "Salir",
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip("WhatsApp Desktop");
  tray.setContextMenu(trayMenu);

  tray.on("click", () => {
    win.isVisible() ? win.hide() : win.show();
  });
}

// 🚀 Menú de la app (Linux)
function setupMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: "App",
      submenu: [
        { label: "Mostrar", click: () => win.show() },
        { label: "Recargar", click: () => win.reload() },
        { label: "Ver herramientas dev", click: () => win.webContents.openDevTools() },
        { type: "separator" },
        {
          label: "Salir",
          click: () => {
            app.isQuiting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: "Modo Oscuro",
      submenu: [
        {
          label: "Forzar modo oscuro",
          click: () => win.webContents.insertCSS(`
            :root { filter: invert(1) hue-rotate(180deg); }
            img, video { filter: invert(1) hue-rotate(180deg) }
          `)
        },
        {
          label: "Quitar modo oscuro",
          click: () => win.webContents.reload()
        }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

// 🚀 Shortcut global para abrir la app
function setupShortcuts() {
  globalShortcut.register("CommandOrControl+Shift+W", () => {
    win.show();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // En Linux no cerramos la app cuando se cierra la ventana
});
