{#if componentNotChanged}
	<div
	in:transition={{ duration, easing, delay }}
	out:transition={{ duration, easing, delay }}
	on:introstart={event => {
		introstart(event)
	}}
	on:introend={event => {
		introend(event)
	}}
	on:outrostart={event => {
		outrostart(event)
	}}
	on:outroend={event => {
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
	import { fade } from 'svelte/transition'

	export let router;
	export let duration = 150
	export let delay = 0
	export let easing;
	export let easeIn;
	export let easeOut;
	export let transition = fade

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
