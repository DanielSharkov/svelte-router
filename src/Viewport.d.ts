import type {EasingFunction, TransitionConfig} from 'svelte/types/runtime/transition'
import {SvelteComponentTyped} from 'svelte'

declare module 'Viewport.svelte' {
	type CustomTransition =(node: Element, {isIntro, duration, easing, delay}: {
		isIntro?: boolean,
		duration?: number,
		easing?: EasingFunction,
		delay?: number
	}?)=> TransitionConfig

	interface ViewportProps {
		router:      SvelteRouter
		duration?:   number
		delay?:      number
		easing?:     EasingFunction
		transition?: CustomTransition
	}

	class ViewportComponent extends SvelteComponentTyped<ViewportProps, {change: CustomEvent<number>}, unknown> {}
	export default ViewportComponent
}
