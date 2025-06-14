const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveInvoiceFile: (invoiceData) => ipcRenderer.invoke('save-invoice-file', invoiceData),
  loadInvoiceFile: () => ipcRenderer.invoke('load-invoice-file'),
  exportDataFile: (data) => ipcRenderer.invoke('export-data-file', data),
  importDataFile: () => ipcRenderer.invoke('import-data-file'),
  savePdfFile: (pdfBuffer, filename) => ipcRenderer.invoke('save-pdf-file', pdfBuffer, filename),

  // Menu event listeners
  onMenuNewInvoice: (callback) => ipcRenderer.on('menu-new-invoice', callback),
  onMenuSaveInvoice: (callback) => ipcRenderer.on('menu-save-invoice', callback),
  onMenuExportPdf: (callback) => ipcRenderer.on('menu-export-pdf', callback),
  onMenuExportData: (callback) => ipcRenderer.on('menu-export-data', callback),
  onMenuImportData: (callback) => ipcRenderer.on('menu-import-data', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Platform info
  platform: process.platform,
})
