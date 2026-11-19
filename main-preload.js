const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shaktimanAPI', {
  getCredits: () => ipcRenderer.invoke('get-credits'),
  consumeCredit: () => ipcRenderer.invoke('consume-credit'),
  redeemCode: (code) => ipcRenderer.invoke('redeem-code', code),
  saveApiKey: (service, apiKey) => ipcRenderer.invoke('encrypt-api-key', { service, apiKey }),
  getApiKey: (service) => ipcRenderer.invoke('decrypt-api-key', { service }),
  getPreloadPath: () => ipcRenderer.invoke('get-preload-path'),
  toggleShield: (host, enabled) => ipcRenderer.invoke('toggle-shield', { host, enabled }),
  saveScreenshot: (dataUrl, filename) => ipcRenderer.invoke('save-screenshot', { dataUrl, filename }),
  clearAllData: () => ipcRenderer.invoke('clear-all-data'),
  executePageAction: (params) => ipcRenderer.invoke('execute-page-action', params),
  extractPageContext: (webContentsId) => ipcRenderer.invoke('extract-page-context', webContentsId),
  on: (channel, callback) => {
    const validChannels = ['tracker-blocked', 'open-new-tab'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  }
});
