main()

async function main() {
	const { encodeHttpOnly } = await extensionStorage.get('encodeHttpOnly')
	$('#encode-httponly-checkbox').prop('checked', encodeHttpOnly || false)

	const queryResult = await browser.tabs.query({
		currentWindow: true,
		active: true
	})

	const activeTabInfo = queryResult[0]

	if (activeTabInfo) {
		const urlAnchor = createAnchorElement(activeTabInfo.url)

		if (/^https?:$/.test(urlAnchor.protocol)) {
			const currentTabHostname = urlAnchor.hostname

			$('#save-for-current-hostname-button').html(currentTabHostname)

			$('#save-for-current-hostname-button').on('click', async () => {
				const cookies = await browser.cookies.getAll({ domain: currentTabHostname })
				saveCookiesToTextFile(cookies, `cookies-${currentTabHostname.replace(/\./g, '-')}.txt`, shouldEncodeHttpOnly())
			})

			const currentTabDomainMatch = currentTabHostname.match(/[a-zA-Z0-9\-]+\.(com?\.)?[a-zA-Z0-9]+$/)

			if (currentTabDomainMatch) {
				const currentTabDomain = currentTabDomainMatch[0]

				if (currentTabDomain === currentTabHostname) {
					$('#save-for-current-domain-button').css('display', 'none')
				} else {
					$('#save-for-current-domain-button').html(currentTabDomain)

					$('#save-for-current-domain-button').on('click', async () => {
						const cookies = await browser.cookies.getAll({ domain: currentTabDomain })
						saveCookiesToTextFile(cookies, `cookies-${currentTabDomain.replace(/\./g, '-')}.txt`, shouldEncodeHttpOnly())
					})
				}
			} else {
				$('#save-for-current-domain-button').prop('disabled', true)
			}
		} else {
			$('#save-for-current-hostname-button').prop('disabled', true)
			$('#save-for-current-domain-button').prop('disabled', true)
		}
	} else {
		$('#save-for-current-hostname-button').prop('disabled', true)
		$('#save-for-current-domain-button').prop('disabled', true)
	}


	$('#save-for-all-domains-button').on('click', async () => {
		const allCookies = await browser.cookies.getAll({})
		saveCookiesToTextFile(allCookies, `cookies.txt`, shouldEncodeHttpOnly())
	})

	$('#encode-httponly-checkbox').on('change input', async () => {
		await extensionStorage.set({ encodeHttpOnly: shouldEncodeHttpOnly()})
	})

	function shouldEncodeHttpOnly() {
		return $('#encode-httponly-checkbox').prop('checked')
	}
}

function saveCookiesToTextFile(cookieDescriptors, defaultFileName, encodeHttpOnly) {
	const formattedCookies = cookieDescriptors.map((c) => formatCookie(c, encodeHttpOnly))

	const fileContent = `# Netscape HTTP Cookie File\n\n${formattedCookies.join('\n')}\n`
	const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' })
	const objectURL = URL.createObjectURL(blob)

	browser.downloads.download({
		url: objectURL,
		filename: defaultFileName || 'cookies.txt',
		saveAs: true,
		conflictAction: 'overwrite'
	})
}

function formatCookie(c, encodeHttpOnly) {
	return [
		`${encodeHttpOnly && c.httpOnly ? '#HttpOnly_' : ''}${(!c.hostOnly && c.domain && !c.domain.startsWith('.')) ? '.' : ''}${c.domain}`,
		c.hostOnly ? 'FALSE' : 'TRUE',
		c.path,
		c.secure ? 'TRUE' : 'FALSE',
		c.session || !c.expirationDate ? 0 : c.expirationDate,
		c.name,
		c.value
	].join('\t')
}
