// Function to open a popup and await user feedback
async function blockingPopup() {
	async function popupClosePromise(popupId, defaultPopupCloseMode) {
		try {
			await messenger.windows.get(popupId);
		} catch (e) {
			//window does not exist, assume closed
			return defaultPopupCloseMode;
		}
		return new Promise(resolve => {
			let popupCloseMode = defaultPopupCloseMode;
			function windowRemoveListener(closedId) {
				if (popupId == closedId) {
					messenger.windows.onRemoved.removeListener(windowRemoveListener);
					messenger.runtime.onMessage.removeListener(messageListener);
					resolve(popupCloseMode);
				}
			}
			function messageListener(request, sender, sendResponse) {
				if (sender.tab.windowId == popupId && request && request.popupCloseMode) {
					popupCloseMode = request.popupCloseMode;
				}
			}
			messenger.runtime.onMessage.addListener(messageListener);
			messenger.windows.onRemoved.addListener(windowRemoveListener);
		});
	}

	let window = await messenger.windows.create({
		 url: "birthdayreminder.html",
		 type: "popup",
		 allowScriptsToClose: true
		 //height: 480,
		 //width: 640
	});
	// await the created popup to be closed and define a default
	// return value if the window is closed without clicking a button
	let rv = await popupClosePromise(window.id, "cancel");
 }

browser.runtime.onStartup.addListener(blockingPopup);
//listener to trigger the popup
messenger.browserAction.onClicked.addListener(blockingPopup);



