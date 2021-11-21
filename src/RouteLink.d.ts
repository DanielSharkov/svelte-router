import {SvelteComponentTyped} from 'svelte'
import type {RouteParams} from './router'

declare module 'RouteLink.svelte' {
	interface RouteLinkProps {
		to:      string
		params?: RouteParams
	}
	class RouteLinkComponent extends SvelteComponentTyped<RouteLinkProps, {change: CustomEvent<number>}, unknown> {}
	export default RouteLinkComponent
}
