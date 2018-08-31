browser.runtime.onMessage.addListener(onMessage)

async function onMessage(message) {
	try {
		switch (message.type) {
			case 'parseDomain': {
				return psl.parse(message.data)
			}

			case 'saveFile': {
				const fileName = message.data.filename
				const fileContent = message.data.content

				const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' })
				const objectURL = URL.createObjectURL(blob)

				await browser.downloads.download({
					url: objectURL,
					filename: fileName,
					saveAs: true,
					conflictAction: 'overwrite'
				})

				return
			}
		}
	} catch (e) {
		log(e)
	}
}
