<svelte:component
	this={$router.route.component}
	params={$router.route.params}
	metadata={$router.route.metadata}
/>

<script>
	export let router;
</script>
