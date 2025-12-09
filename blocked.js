let updateInterval

document.addEventListener('DOMContentLoaded', () => {
    loadBlockedPageData()
    updateInterval = setInterval(updateRemainingTime, 1000)
    setupEventListeners()
})

async function loadBlockedPageData() {
    const urlParams = new URLSearchParams(window.location.search)
    const blockedUrl = urlParams.get('url') || document.referrer || 'Unknown'

    try {
        const url = new URL(blockedUrl)
        document.getElementById('blockedUrl').textContent = url.hostname
    } catch {
        document.getElementById('blockedUrl').textContent = blockedUrl
    }

    const data = await chrome.storage.local.get(['blockMessage'])
    if (data.blockMessage) {
        document.getElementById('blockedMessage').textContent = data.blockMessage
    }

    updateRemainingTime()
}

async function updateRemainingTime() {
    const data = await chrome.storage.local.get(['timerEndTime', 'isActive'])

    if (!data.isActive || !data.timerEndTime) {
        document.getElementById('blockedTimeRemaining').textContent = 'No active timer'
        return
    }

    const now = Date.now()
    const remaining = data.timerEndTime - now

    if (remaining <= 0) {
        document.getElementById('blockedTimeRemaining').textContent = 'Expired'
        return
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    document.getElementById('blockedTimeRemaining').textContent = timeStr
}

function setupEventListeners() {
    document.getElementById('allowThisSiteBtn').addEventListener('click', allowThisSite)

    document.getElementById('openOptionsBtn').addEventListener('click', () => {
        chrome.runtime.openOptionsPage()
    })
}

async function allowThisSite() {
    const urlText = document.getElementById('blockedUrl').textContent

    if (urlText === '-' || urlText === 'Unknown') {
        alert('Cannot determine the site to allow.')
        return
    }

    await chrome.runtime.sendMessage({
        action: 'addAllowedSite',
        site: urlText
    })

    const btn = document.getElementById('allowThisSiteBtn')
    btn.textContent = '✓ Site Allowed!'
    btn.disabled = true

    setTimeout(() => {
        window.location.href = 'https://' + urlText
    }, 1500)
}

window.addEventListener('unload', () => {
    if (updateInterval) {
        clearInterval(updateInterval)
    }
})
