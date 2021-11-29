import {SvelteComponentTyped} from 'svelte'
import type {RouteParams} from '.'

declare module 'RouteLink.svelte' {
	class RouteLinkComponent extends SvelteComponentTyped<
		{to: string, params?: RouteParams},
		unknown,
		unknown,
	> {}
	export default RouteLinkComponent
}
