<a href={url} on:click|preventDefault={() => router.push(to, params)}>
	<slot/>
</a>

<script>
	import router from './router'
	export let to = ''
	export let params;
	$:url = router.nameToPath(to, params)
</script>
