document.addEventListener('DOMContentLoaded', () => {
    loadSettings()
    setupEventListeners()
})

async function loadSettings() {
    const data = await chrome.storage.local.get(['blockMessage', 'allowedSites'])

    document.getElementById('blockMessage').value =
        data.blockMessage || 'This site is blocked during your focus time.'

    updateSitesList(data.allowedSites || [])
    updateStats(data.allowedSites || [])
}

function setupEventListeners() {
    document.getElementById('saveMessageBtn').addEventListener('click', saveMessage)
    document.getElementById('bulkAddBtn').addEventListener('click', addSite)

    document.getElementById('bulkSiteInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addSite()
        }
    })

    document.getElementById('exportBtn').addEventListener('click', exportSites)

    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click()
    })

    document.getElementById('importFile').addEventListener('change', importSites)
    document.getElementById('copyExportBtn').addEventListener('click', copyExport)
}

async function saveMessage() {
    const message = document.getElementById('blockMessage').value.trim()

    await chrome.storage.local.set({ blockMessage: message })

    const btn = document.getElementById('saveMessageBtn')
    const originalText = btn.textContent
    btn.textContent = '✓ Saved!'
    btn.classList.add('success')

    setTimeout(() => {
        btn.textContent = originalText
        btn.classList.remove('success')
    }, 2000)
}

async function addSite() {
    const input = document.getElementById('bulkSiteInput')
    let site = input.value.trim()

    if (!site) {
        return
    }

    site = site.replace(/^https?:\/\//, '')
    site = site.replace(/\/$/, '')

    const response = await chrome.runtime.sendMessage({
        action: 'addAllowedSite',
        site: site
    })

    input.value = ''
    updateSitesList(response.allowedSites)
    updateStats(response.allowedSites)
}

async function removeSite(site) {
    const response = await chrome.runtime.sendMessage({
        action: 'removeAllowedSite',
        site: site
    })

    updateSitesList(response.allowedSites)
    updateStats(response.allowedSites)
}

function updateSitesList(sites) {
    const sitesList = document.getElementById('optionsSitesList')
    const noSites = document.getElementById('optionsNoSites')

    if (sites.length === 0) {
        sitesList.style.display = 'none'
        noSites.style.display = 'block'
        return
    }

    sitesList.style.display = 'grid'
    noSites.style.display = 'none'

    sitesList.innerHTML = sites.map(site => `
    <div class="site-item">
      <span class="site-name">${escapeHtml(site)}</span>
      <button class="remove-btn" data-site="${escapeHtml(site)}">Remove</button>
    </div>
  `).join('')

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => removeSite(btn.dataset.site))
    })
}

function updateStats(sites) {
    document.getElementById('totalSites').textContent = sites.length
}

async function exportSites() {
    const data = await chrome.storage.local.get(['allowedSites'])
    const sites = data.allowedSites || []

    const exportData = JSON.stringify({ allowedSites: sites }, null, 2)

    document.getElementById('exportData').value = exportData
    document.getElementById('exportResult').style.display = 'block'
}

async function importSites(event) {
    const file = event.target.files[0]

    if (!file) {
        return
    }

    const reader = new FileReader()

    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result)

            if (!data.allowedSites || !Array.isArray(data.allowedSites)) {
                alert('Invalid file format. Expected { "allowedSites": [...] }')
                return
            }

            await chrome.runtime.sendMessage({
                action: 'updateAllowedSites',
                sites: data.allowedSites
            })

            loadSettings()
            alert('Sites imported successfully!')
        } catch (error) {
            alert('Error parsing file: ' + error.message)
        }
    }

    reader.readAsText(file)
    event.target.value = ''
}

function copyExport() {
    const textarea = document.getElementById('exportData')
    textarea.select()
    document.execCommand('copy')

    const btn = document.getElementById('copyExportBtn')
    const originalText = btn.textContent
    btn.textContent = '✓ Copied!'

    setTimeout(() => {
        btn.textContent = originalText
    }, 2000)
}

function escapeHtml(text) {
    const map = {
        '&': '&amp',
        '<': '&lt',
        '>': '&gt',
        '"': '&quot',
        "'": '&#039'
    }
    return text.replace(/[&<>"']/g, m => map[m])
}
