<script>
	import {getContext} from 'svelte'

	export let to
	export let params = undefined
	export let router = undefined

	if (typeof to !== 'string' || to.length < 1) {
		throw new Error(
			'[SvelteRouter] <RouterLink> is missing the \"to\" prop'
		)
	}

	const routerInstance = router || getContext('svelte_router')
	if (!routerInstance) {
		throw new Error(
			'[SvelteRouter] <RouterLink> used outside a router instance <RouterViewport>'
		)
	}
	const attrs = Object.assign({}, $$props)

	let href
	// Catch missing parameters, throw error here to identify error
	try {
		href = routerInstance.nameToPath(to, params)
	} catch(err) {
		throw new Error(`[SvelteRouter] <RouterLink> (to: "${to}"): ` + err)
	}

	function removeAttrs() {
		delete attrs.to
		delete attrs.params
		delete attrs.$$slots
		delete attrs.$$scope
	}
	removeAttrs()

	function navigate() {
		if (!routerInstance) throw new Error(
			'[SvelteRouter] <RouterLink> missing Router instance'
		)

		try {
			routerInstance.push(to, params)
		} catch(err) {
			throw new Error(`[SvelteRouter] <RouterLink> (to: "${to}"): ` + err)
		}
	}
</script>

<a {href} on:click|preventDefault|stopPropagation={navigate} {...attrs}>
	<slot></slot>
</a>
