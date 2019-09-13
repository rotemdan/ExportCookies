main()

async function main() {
	const { prefixHttpOnly } = await extensionStorage.get('prefixHttpOnly')
	$('#prefix-httponly-checkbox').prop('checked', prefixHttpOnly || false)

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
				const cookies = await browser.cookies.getAll({ domain: currentTabHostname, firstPartyDomain: null })
				await saveCookiesToTextFile(cookies, `cookies-${currentTabHostname.replace(/\./g, '-')}.txt`, shouldPrefixHttpOnly())
			})

			const parsedDomain = await browser.runtime.sendMessage({ type: 'parseDomain', data: currentTabHostname })

			if (parsedDomain && parsedDomain.subdomain) {
				const currentTabDomain = parsedDomain.domain
				$('#save-for-current-domain-button').html(currentTabDomain)

				$('#save-for-current-domain-button').on('click', async () => {
					const cookies = await browser.cookies.getAll({ domain: currentTabDomain, firstPartyDomain: null })
					await saveCookiesToTextFile(cookies, `cookies-${currentTabDomain.replace(/\./g, '-')}.txt`, shouldPrefixHttpOnly())
				})
			} else {
				$('#save-for-current-domain-button').css('display', 'none')
			}
		} else {
			$('#save-for-current-hostname-button').css('display', 'none')
			$('#save-for-current-domain-button').css('display', 'none')
		}
	} else {
		$('#save-for-current-hostname-button').css('display', 'none')
		$('#save-for-current-domain-button').css('display', 'none')
	}


	$('#save-for-all-domains-button').on('click', async () => {
		const allCookies = await browser.cookies.getAll({ firstPartyDomain: null })
		await saveCookiesToTextFile(allCookies, `cookies.txt`, shouldPrefixHttpOnly())
	})

	$('#prefix-httponly-checkbox').on('change input', async () => {
		await extensionStorage.set({ prefixHttpOnly: shouldPrefixHttpOnly()})
	})

	function shouldPrefixHttpOnly() {
		return $('#prefix-httponly-checkbox').prop('checked')
	}
}

async function saveCookiesToTextFile(cookieDescriptors, filename, prefixHttpOnly) {
	const formattedCookies = cookieDescriptors.map((c) => formatCookie(c, prefixHttpOnly))
	const fileContent = `# Netscape HTTP Cookie File\n\n${formattedCookies.join('\n')}\n`
	await browser.runtime.sendMessage({ type: 'saveFile', data: { filename: filename, content: fileContent } })
}

function formatCookie(c, prefixHttpOnly) {
	return [
		`${prefixHttpOnly && c.httpOnly ? '#HttpOnly_' : ''}${(!c.hostOnly && c.domain && !c.domain.startsWith('.')) ? '.' : ''}${c.domain}`,
		c.hostOnly ? 'FALSE' : 'TRUE',
		c.path,
		c.secure ? 'TRUE' : 'FALSE',
		c.session || !c.expirationDate ? 0 : c.expirationDate,
		c.name,
		c.value
	].join('\t')
}
