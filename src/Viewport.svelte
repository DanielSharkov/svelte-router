{#if isActualView}
	<div
	in:transition={{isIntro: true, duration, easing, delay}}
	out:transition={{isIntro: false, duration, easing, delay}}
	{...attrs}
	on:outroend={()=> {
		updateComponent()
	}}>
		<svelte:component
			{router}
			this={current.component}
			params={current.params}
			urlQuery={current.urlQuery}
			props={current.props}
		/>
	</div>
{/if}

<script>
	import {setContext} from 'svelte'
	import {fade} from 'svelte/transition'
	import {linear} from 'svelte/easing'

	export let router
	export let duration = 150 // 300ms in whole, intro + outro
	export let delay = 0
	export let easing = linear
	export let transition = defaultTransition

	function defaultTransition(
		node, {isIntro, duration, easing, delay} = {},
	) {
		return fade(node, {
			duration: duration,
			easing: easing,
			delay: delay,
		})
	}

	setContext('svelte_router', router) 
	const attrs = Object.assign({}, $$props)

	if (!router || !router.subscribe) {
		throw new Error(
			'[SvelteRouter] <RouterViewport> is missing a router instance'
		)
	}

	let current = {
		name: '',
		path: '',
		component: undefined,
		params: undefined,
		urlQuery: undefined,
		props: undefined,
	}

	function updateComponent() {
		current = $router.location
	}
	updateComponent()

	const compareParams =()=> (
		JSON.stringify($router.location.params || {}) ===
		JSON.stringify(current.params || {})
	)

	$:isActualView = (
		$router.location.name === current.name &&
		$router.location.component === current.component &&
		compareParams() &&
		$router.location.urlQuery === current.urlQuery
	)

	function removeAttrs() {
		delete attrs.router
		delete attrs.duration
		delete attrs.delay
		delete attrs.easing
		delete attrs.transition
		delete attrs.$$scope
	}
	removeAttrs()
</script>
