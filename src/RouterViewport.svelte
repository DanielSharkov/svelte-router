{#if componentNotChanged}
	<div
	in:transition={{ duration, easing, delay }}
	out:transition={{ duration, easing, delay }}
	{...attrs}
	on:introstart={(event)=> {
		introstart(event)
	}}
	on:introend={(event)=> {
		introend(event)
	}}
	on:outrostart={(event)=> {
		outrostart(event)
	}}
	on:outroend={(event)=> {
		updateComponent()
		outroend(event)
	}}>
		<svelte:component
			this={current.component}
			params={current.params}
			urlParams={current.urlParams}
			metadata={current.metadata}
		/>
	</div>
{/if}

<script>
	import { setContext } from 'svelte'
	import { fade } from 'svelte/transition'

	export let router;
	export let duration = 150
	export let delay = 0
	export let easing = undefined
	export let easeIn = undefined
	export let easeOut = undefined
	export let transition = fade

	const attrs = Object.assign({}, $$props)

	function removeAttrs() {
		delete attrs.router
		delete attrs.duration
		delete attrs.delay
		delete attrs.easing
		delete attrs.easeIn
		delete attrs.easeOut
		delete attrs.transition
		delete attrs.$$scope
	}
	removeAttrs()

	if (!router || !router.subscribe) {
		throw new Error(
			'[SvelteRouter] <RouterViewport> is missing a router instance'
		)
	}
	setContext('router', router)

	if (easing) {
		easeIn = easing
		easeOut = easing
	}

	let current = {
		component: null,
		params: null,
		metadata: null,
	}

	export let outrostart = function(){}
	export let outroend = function(){}
	export let introstart = function(){}
	export let introend = function(){}

	function updateComponent() {
		setTimeout(() => current = $router.route)
	}
	updateComponent()

	$:componentNotChanged = (
		$router.route.name === current.name &&
		$router.route.component === current.component &&
		$router.route.params === current.params &&
		$router.route.urlParams === current.urlParams
	)
</script>
