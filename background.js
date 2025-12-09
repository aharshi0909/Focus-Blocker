const RULE_ID = 1
const BLOCKED_PAGE_URL = chrome.runtime.getURL('blocked.html')

chrome.runtime.onInstalled.addListener(async () => {
    console.log('Focus Blocker installed')
    await initializeStorage()
    await updateBlockingRules()
})

async function initializeStorage() {
    const data = await chrome.storage.local.get(['allowedSites', 'isActive', 'blockMessage'])

    if (!data.allowedSites) {
        await chrome.storage.local.set({ allowedSites: [] })
    }

    if (data.isActive === undefined) {
        await chrome.storage.local.set({ isActive: false })
    }

    if (!data.blockMessage) {
        await chrome.storage.local.set({
            blockMessage: 'This site is blocked during your focus time.'
        })
    }
}

async function startTimer(hours) {
    const now = Date.now()
    const durationMs = hours * 60 * 60 * 1000
    const endTime = now + durationMs

    await chrome.storage.local.set({
        timerEndTime: endTime,
        timerDuration: durationMs,
        isActive: true
    })

    console.log(`Timer started for ${hours} hours, ends at ${new Date(endTime)}`)

    await updateBlockingRules()
}

async function stopTimer() {
    await chrome.storage.local.set({
        timerEndTime: null,
        timerDuration: null,
        isActive: false
    })

    console.log('Timer stopped')

    await updateBlockingRules()
}

async function checkTimerExpiration() {
    const data = await chrome.storage.local.get(['timerEndTime', 'isActive'])

    if (!data.isActive || !data.timerEndTime) {
        return false
    }

    const now = Date.now()

    if (now >= data.timerEndTime) {
        console.log('Timer expired')
        await stopTimer()
        return true
    }

    return false
}

async function updateBlockingRules() {
    const data = await chrome.storage.local.get(['isActive', 'allowedSites'])

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
    const ruleIds = existingRules.map(rule => rule.id)

    if (ruleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIds
        })
    }

    if (!data.isActive) {
        console.log('Blocking disabled')
        return
    }

    const allowedSites = data.allowedSites || []
    const newRules = []

    if (allowedSites.length > 0) {
        const excludedDomains = allowedSites.map(site => {
            let domain = site.replace(/^https?:\/\//, '')
            domain = domain.replace(/\/$/, '')
            domain = domain.split('/')[0]
            return domain
        })

        newRules.push({
            id: RULE_ID,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: { url: BLOCKED_PAGE_URL }
            },
            condition: {
                urlFilter: '*',
                resourceTypes: ['main_frame'],
                excludedInitiatorDomains: excludedDomains,
                excludedRequestDomains: excludedDomains
            }
        })
    } else {
        newRules.push({
            id: RULE_ID,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: { url: BLOCKED_PAGE_URL }
            },
            condition: {
                urlFilter: '*',
                resourceTypes: ['main_frame']
            }
        })
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: newRules
    })

    console.log('Blocking rules updated', newRules)
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    checkTimerExpiration().then(async () => {
        if (message.action === 'startTimer') {
            await startTimer(message.hours)
            sendResponse({ success: true })
        }

        else if (message.action === 'stopTimer') {
            await stopTimer()
            sendResponse({ success: true })
        }

        else if (message.action === 'getStatus') {
            const data = await chrome.storage.local.get(['timerEndTime', 'timerDuration', 'isActive', 'allowedSites'])
            sendResponse(data)
        }

        else if (message.action === 'addAllowedSite') {
            const data = await chrome.storage.local.get(['allowedSites'])
            const allowedSites = data.allowedSites || []

            if (!allowedSites.includes(message.site)) {
                allowedSites.push(message.site)
                await chrome.storage.local.set({ allowedSites })
                await updateBlockingRules()
            }

            sendResponse({ success: true, allowedSites })
        }

        else if (message.action === 'removeAllowedSite') {
            const data = await chrome.storage.local.get(['allowedSites'])
            let allowedSites = data.allowedSites || []
            allowedSites = allowedSites.filter(site => site !== message.site)

            await chrome.storage.local.set({ allowedSites })
            await updateBlockingRules()

            sendResponse({ success: true, allowedSites })
        }

        else if (message.action === 'updateAllowedSites') {
            await chrome.storage.local.set({ allowedSites: message.sites })
            await updateBlockingRules()
            sendResponse({ success: true })
        }
    })

    return true
})

chrome.runtime.onStartup.addListener(async () => {
    console.log('Extension starting up')
    await checkTimerExpiration()
    await updateBlockingRules()
})

checkTimerExpiration()
updateBlockingRules()
