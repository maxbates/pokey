pesudocode:

````
pokey.sandbox()
	sandbox.promisePorts()
	sandbox.adapter.initializeSandbox()
		<create iFrame + verify>
		sandbox.waitForLoadDeferred().resolve(... <promise is just a hook>
			<register> adapter.initializationHandler
				<on trigger>
				sandbox.waitForLoadDeferred.resolve() <resolve load promise>
		<register> adapter.pokeyLoadHandler
			<on trigger>
			verifyCurrentSandboxOrigin()
			sandbox.createAndTransferCapabilties()
				sandbox.createChannels()
					<resolve ports + capabilities>
				sandbox.connectPorts()
					adapter.connectPorts()
						postMessage(contentWindow, <initializationMessage>, rawPorts)
							<trigger> adapterBase.initializePokeySandbox()


autoInitializeSandbox()
	<iFrame and Worker only>
	adapter.connectSandbox()
		addEventListener('message', adapterBase.initializePokeySandbox)
			<async, on <initializationMessage> which sends ports>
			pokey.connectCapabilities()
				[waiting handlers for capabilities -> ports]
			adapter.didConnect()
				postMessage(sandboxInitializedMessage, '*')
					<trigger> iframe.initializationHandler
		adapter.pokeyLoaded()
			postMessage(<pokeyLoadedMessage>, '*')
				<trigger> iframe.pokeyLoadHandler
````