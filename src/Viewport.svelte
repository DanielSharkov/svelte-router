{#if isActualView}
	<svelte:component
		{router}
		on:hasOutro={hasOutro}
		on:outroDone={outroDone}
		this={current.component}
		params={current.params}
		urlQuery={current.urlQuery}
		props={current.props}
	/>
{/if}

<script>
	import {setContext, tick} from 'svelte'
	export let router

	if (!router || !router.subscribe) {
		throw new Error(
			'[SvelteRouter] <RouterViewport> is missing a router instance'
		)
	}

	setContext('svelte_router', router)

	let viewHasOutro = false
	function hasOutro() {
		viewHasOutro = true
	}
	function outroDone() {
		if (!isActualView) {
			viewHasOutro = false
		}
	}

	let current = {
		name: '',
		path: '',
		component: undefined,
		params: undefined,
		urlQuery: undefined,
		props: undefined,
	}

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
	$:if (!isActualView && !viewHasOutro) {
		updateView()
	}

	async function updateView() {
		await tick()
		current = {...$router.location}
	}
</script>
