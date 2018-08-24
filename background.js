browser.browserAction.onClicked.addListener(onBrowserActionClick)

async function onBrowserActionClick() {
	const allCookies = await browser.cookies.getAll({})
	saveCookiesToTextFile(allCookies)
}

function saveCookiesToTextFile(cookieDescriptors) {
	const formattedCookies = cookieDescriptors.map((c) => formatCookie(c))

	const fileContent = `# Netscape HTTP Cookie File\n\n${formattedCookies.join('\n')}\n`
	const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' })
	const objectURL = URL.createObjectURL(blob)

	browser.downloads.download({
		url: objectURL,
		filename: 'cookies.txt',
		saveAs: true,
		conflictAction: 'overwrite'
	})
}

function formatCookie(c) {
	return [
		`${(!c.hostOnly && c.domain && !c.domain.startsWith('.')) ? '.' : ''}${c.domain}`,
		c.hostOnly ? 'FALSE' : 'TRUE',
		c.path,
		c.secure ? 'TRUE' : 'FALSE',
		c.session || !c.expirationDate ? 0 : c.expirationDate,
		c.name,
		c.value
	].join('\t')
}
