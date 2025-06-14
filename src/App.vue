<script setup>
import { ref, onMounted, computed } from 'vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Invoice data
const invoice = ref({
  id: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  currency: 'EUR', // Default to Euro
  taxRate: 21, // Default to 21% (common EU VAT rate)
  language: 'en', // Default to English
  logo: null, // Store logo as base64 data URL
  from: {
    name: 'Your Company Name',
    address: '123 Business Street',
    city: 'Business City, BC 12345',
    email: 'hello@yourcompany.com',
    phone: '+1 (555) 123-4567',
  },
  to: {
    name: 'Client Name',
    address: '456 Client Avenue',
    city: 'Client City, CC 67890',
    email: 'client@email.com',
    phone: '+1 (555) 987-6543',
  },
  items: [
    {
      description: 'Web Development Services',
      quantity: 40,
      rate: 75,
      amount: 3000,
    },
    {
      description: 'UI/UX Design',
      quantity: 20,
      rate: 85,
      amount: 1700,
    },
  ],
  notes: 'Thank you for your business!',
  terms: 'Payment is due within 30 days of invoice date.',
})

const savedInvoices = ref([])

// Add computed property for Electron API detection
const isElectron = computed(() => {
  return typeof window !== 'undefined' && window.electronAPI
})

// Currency options
const currencyOptions = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
]

// Language options
const languageOptions = [
  { code: 'en', name: 'English' },
  { code: 'nl', name: 'Nederlands' },
]

// Translation object
const translations = {
  en: {
    invoice: 'INVOICE',
    invoiceNumber: 'Invoice #',
    date: 'Date',
    dueDate: 'Due Date',
    billTo: 'Bill To',
    description: 'Description',
    qty: 'Qty',
    rate: 'Rate',
    amount: 'Amount',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    notes: 'Notes',
    terms: 'Terms',
  },
  nl: {
    invoice: 'FACTUUR',
    invoiceNumber: 'Factuur #',
    date: 'Datum',
    dueDate: 'Vervaldatum',
    billTo: 'Factureren aan',
    description: 'Omschrijving',
    qty: 'Aantal',
    rate: 'Tarief',
    amount: 'Bedrag',
    subtotal: 'Subtotaal',
    tax: 'BTW',
    total: 'Totaal',
    notes: 'Opmerkingen',
    terms: 'Voorwaarden',
  },
}

// Get translation
const t = (key) => {
  return translations[invoice.value.language]?.[key] || translations.en[key] || key
}

// Get currency symbol
const getCurrencySymbol = () => {
  const currency = currencyOptions.find((c) => c.code === invoice.value.currency)
  return currency ? currency.symbol : '€'
}

// Format currency amount
const formatCurrency = (amount) => {
  const symbol = getCurrencySymbol()
  const formattedAmount = amount.toFixed(2)

  // Different formatting based on currency
  switch (invoice.value.currency) {
    case 'EUR':
      return `${formattedAmount} €`
    case 'USD':
    case 'CAD':
    case 'AUD':
      return `${symbol}${formattedAmount}`
    case 'GBP':
      return `£${formattedAmount}`
    case 'JPY':
      return `¥${Math.round(amount)}`
    case 'CHF':
      return `CHF ${formattedAmount}`
    case 'SEK':
    case 'NOK':
    case 'DKK':
      return `${formattedAmount} kr`
    default:
      return `${symbol}${formattedAmount}`
  }
}

// Generate invoice ID
const generateInvoiceId = () => {
  return 'INV-' + Date.now().toString().slice(-6)
}

// Calculate totals
const subtotal = ref(0)
const taxAmount = ref(0)
const total = ref(0)

const calculateTotals = () => {
  subtotal.value = invoice.value.items.reduce((sum, item) => sum + item.amount, 0)
  taxAmount.value = (subtotal.value * invoice.value.taxRate) / 100
  total.value = subtotal.value + taxAmount.value
}

// Add new item
const addItem = () => {
  invoice.value.items.push({
    description: '',
    quantity: 1,
    rate: 0,
    amount: 0,
  })
}

// Remove item
const removeItem = (index) => {
  invoice.value.items.splice(index, 1)
  calculateTotals()
}

// Update item amount when quantity or rate changes
const updateItemAmount = (index) => {
  const item = invoice.value.items[index]
  item.amount = item.quantity * item.rate
  calculateTotals()
}

// Update totals when amount is directly edited
const updateItemDirectAmount = () => {
  calculateTotals()
}

// Handle logo upload
const handleLogoUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PNG, JPG, WebP, or SVG file.')
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      invoice.value.logo = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Remove logo
const removeLogo = () => {
  invoice.value.logo = null
}

// Save invoice to localStorage
const saveInvoice = () => {
  if (!invoice.value.id) {
    invoice.value.id = generateInvoiceId()
  }

  const invoices = JSON.parse(localStorage.getItem('invoices') || '[]')
  const existingIndex = invoices.findIndex((inv) => inv.id === invoice.value.id)

  if (existingIndex >= 0) {
    invoices[existingIndex] = { ...invoice.value }
  } else {
    invoices.push({ ...invoice.value })
  }

  localStorage.setItem('invoices', JSON.stringify(invoices))
  loadSavedInvoices()
  alert('Invoice saved successfully!')
}

// Load saved invoices
const loadSavedInvoices = () => {
  savedInvoices.value = JSON.parse(localStorage.getItem('invoices') || '[]')
}

// Load invoice
const loadInvoice = (savedInvoice) => {
  invoice.value = { ...savedInvoice }
  calculateTotals()
}

// New invoice
const newInvoice = () => {
  invoice.value = {
    id: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    currency: 'EUR',
    taxRate: 21,
    language: 'en',
    logo: null,
    from: {
      name: 'Your Company Name',
      address: '123 Business Street',
      city: 'Business City, BC 12345',
      email: 'hello@yourcompany.com',
      phone: '+1 (555) 123-4567',
    },
    to: {
      name: 'Client Name',
      address: '456 Client Avenue',
      city: 'Client City, CC 67890',
      email: 'client@email.com',
      phone: '+1 (555) 987-6543',
    },
    items: [
      {
        description: 'Service Description',
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ],
    notes: 'Thank you for your business!',
    terms: 'Payment is due within 30 days of invoice date.',
  }
  calculateTotals()
}

// Export to PDF
const exportToPDF = async () => {
  try {
    const element = document.getElementById('invoice-preview')

    // Temporarily show the element for capture
    element.classList.remove('hidden')

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      ignoreElements: (element) => {
        // Skip elements that might cause issues
        return element.classList.contains('no-pdf')
      },
    })

    // Hide the element again
    element.classList.add('hidden')

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    const filename = `invoice-${invoice.value.id || 'draft'}.pdf`

    if (isElectron.value) {
      // Use Electron's save dialog
      const pdfBuffer = pdf.output('arraybuffer')
      const result = await window.electronAPI.savePdfFile(pdfBuffer, filename)
      if (result.success) {
        alert(`PDF saved to: ${result.filePath}`)
      } else if (!result.cancelled) {
        alert(`Error saving PDF: ${result.error}`)
      }
    } else {
      // Fallback to browser download
      pdf.save(filename)
    }
  } catch (error) {
    console.error('PDF export error:', error)
    alert('Error generating PDF. Please try again or check the console for details.')
  }
}

// Export data
const exportData = () => {
  const data = JSON.stringify(savedInvoices.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'invoices-backup.json'
  a.click()
  URL.revokeObjectURL(url)
}

// Import data
const importData = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result)
        localStorage.setItem('invoices', JSON.stringify(importedData))
        loadSavedInvoices()
        alert('Data imported successfully!')
      } catch (error) {
        console.error('Import error:', error)
        alert('Error importing data. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }
}

// Initialize
onMounted(() => {
  invoice.value.id = generateInvoiceId()
  calculateTotals()
  loadSavedInvoices()

  // Electron integration
  if (isElectron.value) {
    // Set up menu event listeners
    window.electronAPI.onMenuNewInvoice(() => {
      newInvoice()
    })

    window.electronAPI.onMenuSaveInvoice(() => {
      saveInvoiceToFile()
    })

    window.electronAPI.onMenuExportPdf(() => {
      exportToPDF()
    })

    window.electronAPI.onMenuExportData(() => {
      exportDataToFile()
    })

    window.electronAPI.onMenuImportData(() => {
      importDataFromFile()
    })
  }
})

// Enhanced file operations for Electron
const saveInvoiceToFile = async () => {
  if (isElectron.value) {
    try {
      const result = await window.electronAPI.saveInvoiceFile(invoice.value)
      if (result.success) {
        alert(`Invoice saved to: ${result.filePath}`)
      } else if (!result.cancelled) {
        alert(`Error saving invoice: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert('Error saving invoice file')
    }
  } else {
    // Fallback to regular save for web version
    saveInvoice()
  }
}

const loadInvoiceFromFile = async () => {
  if (isElectron.value) {
    try {
      const result = await window.electronAPI.loadInvoiceFile()
      if (result.success) {
        invoice.value = { ...result.data }
        calculateTotals()
        alert('Invoice loaded successfully!')
      } else if (!result.cancelled) {
        alert(`Error loading invoice: ${result.error}`)
      }
    } catch (error) {
      console.error('Error loading invoice:', error)
      alert('Error loading invoice file')
    }
  }
}

const exportDataToFile = async () => {
  if (isElectron.value) {
    try {
      const result = await window.electronAPI.exportDataFile(savedInvoices.value)
      if (result.success) {
        alert(`Data exported to: ${result.filePath}`)
      } else if (!result.cancelled) {
        alert(`Error exporting data: ${result.error}`)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error exporting data file')
    }
  } else {
    // Fallback to regular export for web version
    exportData()
  }
}

const importDataFromFile = async () => {
  if (isElectron.value) {
    try {
      const result = await window.electronAPI.importDataFile()
      if (result.success) {
        localStorage.setItem('invoices', JSON.stringify(result.data))
        loadSavedInvoices()
        alert('Data imported successfully!')
      } else if (!result.cancelled) {
        alert(`Error importing data: ${result.error}`)
      }
    } catch (error) {
      console.error('Error importing data:', error)
      alert('Error importing data file')
    }
  } else {
    // Fallback for web version
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = importData
    input.click()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <!-- Header -->
    <header
      class="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50"
    >
      <div class="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"
            >
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
            </div>
            <h1
              class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Invoice Creator
            </h1>
          </div>
          <div class="flex space-x-3">
            <button
              @click="newInvoice"
              class="cursor-pointer group relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl active:scale-95"
            >
              <span class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                <span>New Invoice</span>
              </span>
            </button>
            <button
              v-if="isElectron"
              @click="loadInvoiceFromFile"
              class="cursor-pointer group relative bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl active:scale-95"
            >
              <span class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  ></path>
                </svg>
                <span>Load Invoice</span>
              </span>
            </button>
            <button
              @click="saveInvoice"
              class="cursor-pointer group relative bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl active:scale-95"
            >
              <span class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <span>Save Invoice</span>
              </span>
            </button>
            <button
              @click="exportToPDF"
              class="cursor-pointer group relative bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl active:scale-95"
            >
              <span class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <span>Export PDF</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-8">
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <!-- Invoice Form -->
        <div class="xl:col-span-3 space-y-8">
          <!-- Invoice Details -->
          <div
            class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300"
          >
            <div class="flex items-center space-x-3 mb-6">
              <div
                class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-800">Invoice Details</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Invoice ID</label>
                <input
                  v-model="invoice.id"
                  type="text"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200 cursor-not-allowed"
                  readonly
                />
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Date</label>
                <input
                  v-model="invoice.date"
                  type="date"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Due Date</label>
                <input
                  v-model="invoice.dueDate"
                  type="date"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Currency</label>
                <select
                  v-model="invoice.currency"
                  @change="calculateTotals"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <option
                    v-for="currency in currencyOptions"
                    :key="currency.code"
                    :value="currency.code"
                  >
                    {{ currency.code }} - {{ currency.name }}
                  </option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Tax Rate (%)</label>
                <input
                  v-model.number="invoice.taxRate"
                  @input="calculateTotals"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
              </div>
            </div>

            <!-- Language Selection -->
            <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">PDF Language</label>
                <select
                  v-model="invoice.language"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <option
                    v-for="language in languageOptions"
                    :key="language.code"
                    :value="language.code"
                  >
                    {{ language.name }}
                  </option>
                </select>
              </div>

              <!-- Logo Upload Section -->
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Company Logo</label>
                <div class="flex items-center space-x-3">
                  <label
                    class="cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2 rounded-lg text-sm hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      ></path>
                    </svg>
                    <span>Upload Logo</span>
                    <input
                      type="file"
                      @change="handleLogoUpload"
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      class="hidden"
                    />
                  </label>
                  <button
                    v-if="invoice.logo"
                    @click="removeLogo"
                    class="cursor-pointer bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    Remove
                  </button>
                </div>
                <div v-if="invoice.logo" class="mt-2">
                  <img :src="invoice.logo" alt="Company Logo" class="h-12 w-auto rounded border" />
                </div>
                <p class="text-xs text-gray-500">PNG, JPG, WebP, or SVG (max 5MB)</p>
              </div>
            </div>
          </div>

          <!-- From/To Information -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- From -->
            <div
              class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300"
            >
              <div class="flex items-center space-x-3 mb-6">
                <div
                  class="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    ></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-800">From</h3>
              </div>
              <div class="space-y-4">
                <input
                  v-model="invoice.from.name"
                  placeholder="Company Name"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
                <input
                  v-model="invoice.from.address"
                  placeholder="Address"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
                <input
                  v-model="invoice.from.city"
                  placeholder="City, State ZIP"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
                <input
                  v-model="invoice.from.email"
                  placeholder="Email"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
                <input
                  v-model="invoice.from.phone"
                  placeholder="Phone"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
              </div>
            </div>

            <!-- To -->
            <div
              class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300"
            >
              <div class="flex items-center space-x-3 mb-6">
                <div
                  class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-800">To</h3>
              </div>
              <div class="space-y-4">
                <input
                  v-model="invoice.to.name"
                  placeholder="Client Name"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
                <input
                  v-model="invoice.to.address"
                  placeholder="Address"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
                <input
                  v-model="invoice.to.city"
                  placeholder="City, State ZIP"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
                <input
                  v-model="invoice.to.email"
                  placeholder="Email"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
                <input
                  v-model="invoice.to.phone"
                  placeholder="Phone"
                  class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200"
                />
              </div>
            </div>
          </div>

          <!-- Items -->
          <div
            class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300"
          >
            <div class="flex justify-between items-start mb-6">
              <div>
                <div class="flex items-center space-x-3 mb-2">
                  <div
                    class="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center"
                  >
                    <svg
                      class="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      ></path>
                    </svg>
                  </div>
                  <h3 class="text-xl font-bold text-gray-800">Items</h3>
                </div>
                <p class="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg inline-block">
                  Amount is calculated automatically (Qty × Rate) but can be edited manually
                </p>
              </div>
              <button
                @click="addItem"
                class="cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl text-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 shadow-lg active:scale-95 flex items-center space-x-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                <span>Add Item</span>
              </button>
            </div>

            <div class="overflow-x-auto rounded-xl border-2 border-gray-200">
              <table class="w-full">
                <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th class="text-left py-4 px-4 font-semibold text-gray-700">Description</th>
                    <th class="text-left py-4 px-4 w-24 font-semibold text-gray-700">Qty</th>
                    <th class="text-left py-4 px-4 w-32 font-semibold text-gray-700">Rate</th>
                    <th class="text-left py-4 px-4 w-32 font-semibold text-gray-700">Amount</th>
                    <th class="w-16 py-4 px-4"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr
                    v-for="(item, index) in invoice.items"
                    :key="item.description"
                    class="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td class="py-4 px-4">
                      <input
                        v-model="item.description"
                        placeholder="Item description"
                        class="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 transition-all duration-200"
                      />
                    </td>
                    <td class="py-4 px-4">
                      <input
                        v-model.number="item.quantity"
                        @input="updateItemAmount(index)"
                        type="number"
                        class="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 transition-all duration-200"
                      />
                    </td>
                    <td class="py-4 px-4">
                      <input
                        v-model.number="item.rate"
                        @input="updateItemAmount(index)"
                        type="number"
                        step="0.01"
                        class="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 transition-all duration-200"
                      />
                    </td>
                    <td class="py-4 px-4">
                      <input
                        v-model.number="item.amount"
                        @input="updateItemDirectAmount()"
                        type="number"
                        step="0.01"
                        class="w-full border-2 border-gray-200 rounded-lg px-3 py-2 font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 transition-all duration-200"
                      />
                    </td>
                    <td class="py-4 px-4">
                      <button
                        @click="removeItem(index)"
                        class="cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Notes and Terms -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div
              class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300"
            >
              <div class="flex items-center space-x-3 mb-6">
                <div
                  class="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    ></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-800">Notes</h3>
              </div>
              <textarea
                v-model="invoice.notes"
                rows="4"
                class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200 resize-none"
              ></textarea>
            </div>
            <div
              class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300"
            >
              <div class="flex items-center space-x-3 mb-6">
                <div
                  class="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-800">Terms</h3>
              </div>
              <textarea
                v-model="invoice.terms"
                rows="4"
                class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none hover:border-gray-400 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:shadow-lg transition-all duration-200 resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="xl:col-span-1 space-y-8">
          <!-- Invoice Preview -->
          <div
            class="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 p-8 hover:shadow-3xl transition-all duration-300"
          >
            <div class="flex items-center space-x-3 mb-6">
              <div
                class="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-800">Totals ({{ invoice.currency }})</h3>
            </div>
            <div class="space-y-4">
              <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span class="text-gray-700 font-medium">Subtotal:</span>
                <span class="font-bold text-gray-900">{{ formatCurrency(subtotal) }}</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span class="text-blue-700 font-medium">Tax ({{ invoice.taxRate }}%):</span>
                <span class="font-bold text-blue-900">{{ formatCurrency(taxAmount) }}</span>
              </div>
              <div
                class="flex justify-between items-center p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white shadow-lg"
              >
                <span class="text-lg font-bold">Total:</span>
                <span class="text-2xl font-bold">{{ formatCurrency(total) }}</span>
              </div>
            </div>
          </div>

          <!-- Saved Invoices -->
          <div
            class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300"
          >
            <div class="flex items-center space-x-3 mb-6">
              <div
                class="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-800">Saved Invoices</h3>
            </div>
            <div
              class="space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200"
            >
              <div
                v-for="savedInvoice in savedInvoices"
                :key="savedInvoice.id"
                class="cursor-pointer flex justify-between items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 transform hover:scale-102 hover:-translate-y-1 hover:shadow-lg"
                @click="loadInvoice(savedInvoice)"
              >
                <div>
                  <div class="font-bold text-gray-800">{{ savedInvoice.id }}</div>
                  <div class="text-sm text-gray-500">{{ savedInvoice.date }}</div>
                </div>
                <div class="text-sm font-bold text-green-600 bg-green-100 px-3 py-1 rounded-lg">
                  {{
                    formatCurrency(savedInvoice.items.reduce((sum, item) => sum + item.amount, 0))
                  }}
                </div>
              </div>
            </div>
          </div>

          <!-- Data Management -->
          <div
            class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300"
          >
            <div class="flex items-center space-x-3 mb-6">
              <div
                class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  ></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-800">Data Management</h3>
            </div>
            <div class="space-y-4">
              <button
                @click="exportData"
                class="cursor-pointer w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-102 hover:-translate-y-0.5 shadow-lg active:scale-95 flex items-center justify-center space-x-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <span>Export Data</span>
              </button>
              <label
                class="cursor-pointer w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 block text-center transition-all duration-300 transform hover:scale-102 hover:-translate-y-0.5 shadow-lg active:scale-95"
              >
                <span class="flex items-center justify-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    ></path>
                  </svg>
                  <span>Import Data</span>
                </span>
                <input type="file" @change="importData" accept=".json" class="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invoice Preview (Hidden, for PDF generation) -->
    <div
      id="invoice-preview"
      class="hidden print:block bg-white p-12 max-w-4xl mx-auto"
      style="background-color: #ffffff; color: #000000; font-family: Arial, sans-serif"
    >
      <!-- Modern Header -->
      <div class="flex justify-between items-start mb-12">
        <div>
          <!-- Logo Section -->
          <div class="mb-6">
            <div v-if="invoice.logo" class="w-16 h-16 flex items-center justify-center">
              <img
                :src="invoice.logo"
                alt="Company Logo"
                class="max-w-16 max-h-16 object-contain"
              />
            </div>
            <div
              v-else
              class="w-16 h-16 rounded-lg flex items-center justify-center"
              style="background-color: #111827"
            >
              <span class="font-bold text-lg" style="color: #ffffff">L</span>
            </div>
          </div>
          <div class="space-y-1">
            <div class="text-xl font-semibold" style="color: #111827">{{ invoice.from.name }}</div>
            <div class="text-sm" style="color: #4b5563">{{ invoice.from.address }}</div>
            <div class="text-sm" style="color: #4b5563">{{ invoice.from.city }}</div>
            <div class="text-sm" style="color: #4b5563">{{ invoice.from.email }}</div>
            <div class="text-sm" style="color: #4b5563">{{ invoice.from.phone }}</div>
          </div>
        </div>
        <div class="text-right">
          <h1 class="text-4xl font-light mb-6" style="color: #111827">{{ t('invoice') }}</h1>
          <div class="space-y-2 text-sm">
            <div style="color: #4b5563">{{ t('invoiceNumber') }}</div>
            <div class="font-semibold" style="color: #111827">{{ invoice.id }}</div>
            <div style="color: #4b5563; margin-top: 16px">{{ t('date') }}</div>
            <div class="font-semibold" style="color: #111827">{{ invoice.date }}</div>
            <div style="color: #4b5563; margin-top: 16px">{{ t('dueDate') }}</div>
            <div class="font-semibold" style="color: #111827">{{ invoice.dueDate }}</div>
          </div>
        </div>
      </div>

      <!-- Bill To Section -->
      <div class="mb-12">
        <div class="text-sm mb-2" style="color: #4b5563">{{ t('billTo') }}</div>
        <div class="space-y-1">
          <div class="text-lg font-semibold" style="color: #111827">{{ invoice.to.name }}</div>
          <div class="text-sm" style="color: #4b5563">{{ invoice.to.address }}</div>
          <div class="text-sm" style="color: #4b5563">{{ invoice.to.city }}</div>
          <div class="text-sm" style="color: #4b5563">{{ invoice.to.email }}</div>
          <div class="text-sm" style="color: #4b5563">{{ invoice.to.phone }}</div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="mb-12">
        <table class="w-full" style="color: #000000">
          <thead>
            <tr>
              <th
                class="text-left py-4 text-sm font-medium uppercase"
                style="color: #4b5563; letter-spacing: 0.05em"
              >
                {{ t('description') }}
              </th>
              <th
                class="text-right py-4 text-sm font-medium uppercase"
                style="color: #4b5563; letter-spacing: 0.05em"
              >
                {{ t('qty') }}
              </th>
              <th
                class="text-right py-4 text-sm font-medium uppercase"
                style="color: #4b5563; letter-spacing: 0.05em"
              >
                {{ t('rate') }}
              </th>
              <th
                class="text-right py-4 text-sm font-medium uppercase"
                style="color: #4b5563; letter-spacing: 0.05em"
              >
                {{ t('amount') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in invoice.items"
              :key="item.description"
              style="border-top: 1px solid #f3f4f6"
            >
              <td class="py-4" style="color: #111827">{{ item.description }}</td>
              <td class="text-right py-4" style="color: #374151">{{ item.quantity }}</td>
              <td class="text-right py-4" style="color: #374151">
                {{ formatCurrency(item.rate) }}
              </td>
              <td class="text-right py-4 font-semibold" style="color: #111827">
                {{ formatCurrency(item.amount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals Section -->
      <div class="flex justify-end mb-12">
        <div style="width: 320px">
          <div class="flex justify-between py-2" style="color: #374151">
            <span>{{ t('subtotal') }}</span>
            <span class="font-medium">{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="flex justify-between py-2" style="color: #374151">
            <span>{{ t('tax') }} ({{ invoice.taxRate }}%)</span>
            <span class="font-medium">{{ formatCurrency(taxAmount) }}</span>
          </div>
          <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px">
            <div class="flex justify-between py-2">
              <span class="text-lg font-semibold" style="color: #111827">{{ t('total') }}</span>
              <span class="text-lg font-semibold" style="color: #111827">{{
                formatCurrency(total)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes and Terms -->
      <div class="grid grid-cols-2 gap-12 mb-12" style="color: #000000">
        <div v-if="invoice.notes">
          <div
            class="text-sm font-medium uppercase mb-3"
            style="color: #4b5563; letter-spacing: 0.05em"
          >
            {{ t('notes') }}
          </div>
          <p class="text-sm" style="color: #374151; line-height: 1.6">{{ invoice.notes }}</p>
        </div>
        <div v-if="invoice.terms">
          <div
            class="text-sm font-medium uppercase mb-3"
            style="color: #4b5563; letter-spacing: 0.05em"
          >
            {{ t('terms') }}
          </div>
          <p class="text-sm" style="color: #374151; line-height: 1.6">{{ invoice.terms }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center pt-8" style="border-top: 1px solid #f3f4f6">
        <p class="text-sm" style="color: #6b7280">
          {{
            invoice.language === 'nl'
              ? 'Bedankt voor uw vertrouwen!'
              : 'Thank you for your business!'
          }}
        </p>
      </div>
    </div>
  </div>
</template>
