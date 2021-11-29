import {SvelteComponentTyped} from 'svelte'

declare module 'Viewport.svelte' {
	class ViewportComponent extends SvelteComponentTyped<
		{router: SvelteRouter},
		unknown,
		unknown,
	> {}
	export default ViewportComponent
}
