<script>
	import { getContext } from 'svelte'

	export let to;
	export let params;

	if (typeof to !== 'string' && to.length < 1) {
		throw new Error(
			'[SvelteRouter] <RouterLink> is missing the prop \"to\"'
		)
	}

	const router = getContext('router')
	if (!router) {
		throw new Error(
			'[SvelteRouter] <RouterLink> used outside a router instance <RouterViewport>'
		)
	}
	const attrs = Object.assign({}, $$props)

	let href = null
	// Catch missing parameters, throw error here to identify error
	try {
		href = router.nameToPath(to, params)
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

	function navigate(e) {
		e.stopPropagation()
		e.preventDefault()

		if (!router) {
			throw new Error(
				'[SvelteRouter] <RouterLink> missing Router instance'
			)
		}

		try {
			router.push(to, params)
		} catch(err) {
			throw new Error(`[SvelteRouter] <RouterLink> (to: "${to}"): ` + err)
		}
	}
</script>

<a {href} on:click|preventDefault={ navigate } {...attrs}>
	<slot></slot>
</a>
