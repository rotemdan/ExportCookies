const debugModeEnabled = true
const extensionManifest = browser.runtime.getManifest()

function log(...args) {
	if (debugModeEnabled) {
		console.log(`[${extensionManifest.name}]`, ...args)
	}
}

const extensionSyncStorage = browser.storage.sync
const extensionLocalStorage = browser.storage.local
const extensionStorage = extensionSyncStorage

function createAnchorElement(url) {
	const l = document.createElement("a")
	l.href = url
	return l
}
