const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("app", {
    notify: (title, body) => ipcRenderer.send("notify", { title, body })
});
