let updateInterval

document.addEventListener('DOMContentLoaded', () => {
    loadStatus()
    setupEventListeners()
    updateInterval = setInterval(updateRemainingTime, 1000)
})

async function loadStatus() {
    const response = await chrome.runtime.sendMessage({ action: 'getStatus' })
    updateUI(response)
}

function updateUI(data) {
    const activeStatus = document.getElementById('activeStatus')
    const inactiveStatus = document.getElementById('inactiveStatus')
    const stopBtn = document.getElementById('stopBtn')
    const timerButtons = document.querySelectorAll('.timer-btn')

    if (data.isActive && data.timerEndTime) {
        activeStatus.style.display = 'block'
        inactiveStatus.style.display = 'none'
        stopBtn.style.display = 'block'
        timerButtons.forEach(btn => btn.disabled = true)
        updateRemainingTime(data.timerEndTime)
    } else {
        activeStatus.style.display = 'none'
        inactiveStatus.style.display = 'block'
        stopBtn.style.display = 'none'
        timerButtons.forEach(btn => btn.disabled = false)
    }

    updateSitesList(data.allowedSites || [])
}

async function updateRemainingTime(endTime = null) {
    if (!endTime) {
        const response = await chrome.runtime.sendMessage({ action: 'getStatus' })
        endTime = response.timerEndTime

        if (!response.isActive || !endTime) {
            return
        }
    }

    const now = Date.now()
    const remaining = endTime - now

    if (remaining <= 0) {
        document.getElementById('remainingTime').textContent = 'Expired'
        loadStatus()
        return
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    document.getElementById('remainingTime').textContent = timeStr
}

function updateSitesList(sites) {
    const sitesList = document.getElementById('sitesList')
    const noSites = document.getElementById('noSites')

    if (sites.length === 0) {
        sitesList.style.display = 'none'
        noSites.style.display = 'block'
        return
    }

    sitesList.style.display = 'block'
    noSites.style.display = 'none'

    sitesList.innerHTML = sites.map(site => `
    <div class="site-item">
      <span class="site-name">${escapeHtml(site)}</span>
      <button class="remove-btn" data-site="${escapeHtml(site)}">×</button>
    </div>
  `).join('')

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => removeSite(btn.dataset.site))
    })
}

function setupEventListeners() {
    document.querySelectorAll('.timer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const hours = parseInt(btn.dataset.hours)
            startTimer(hours)
        })
    })

    document.getElementById('stopBtn').addEventListener('click', stopTimer)
    document.getElementById('addSiteBtn').addEventListener('click', addSite)

    document.getElementById('siteInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addSite()
        }
    })

    document.getElementById('optionsLink').addEventListener('click', (e) => {
        e.preventDefault()
        chrome.runtime.openOptionsPage()
    })
}

async function startTimer(hours) {
    await chrome.runtime.sendMessage({
        action: 'startTimer',
        hours: hours
    })

    loadStatus()
}

async function stopTimer() {
    await chrome.runtime.sendMessage({ action: 'stopTimer' })
    loadStatus()
}

async function addSite() {
    const input = document.getElementById('siteInput')
    let site = input.value.trim()

    if (!site) {
        return
    }

    site = site.replace(/^https?:\/\//, '')
    site = site.replace(/\/$/, '')

    await chrome.runtime.sendMessage({
        action: 'addAllowedSite',
        site: site
    })

    input.value = ''
    loadStatus()
}

async function removeSite(site) {
    await chrome.runtime.sendMessage({
        action: 'removeAllowedSite',
        site: site
    })

    loadStatus()
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

window.addEventListener('unload', () => {
    if (updateInterval) {
        clearInterval(updateInterval)
    }
})
