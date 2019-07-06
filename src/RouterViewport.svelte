{#if $router.route.component === current.component}
	<div
	transition:fade={{ duration: transitionDuration }}
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
			metadata={current.metadata}
		/>
	</div>
{/if}

<script>
	import { fade } from 'svelte/transition'

	export let router;
	export let transitionDuration = 150
	export let transitionFunc = fade
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
</script>
