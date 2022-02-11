[![Simple, fast & easy to use Svelte Router](https://github.com/DanielSharkov/svelte-router/blob/master/readme-banner.svg)](#)

[![Live Demo](https://img.shields.io/badge/▶-Live%20Demo-2962ff)](https://danielsharkov.github.io/svelte-router-examples)
[![Examples](https://img.shields.io/badge/🧩-Examples-ff9100)](https://github.com/DanielSharkov/svelte-router-examples)
[![npm version](https://badge.fury.io/js/@danielsharkov%2Fsvelte-router.svg)](https://badge.fury.io/js/@danielsharkov%2Fsvelte-router)
![GitHub](https://img.shields.io/github/license/danielsharkov/svelte-router)

# 🗂 Index

- [Installation](#-installation)
- [Initializing a Router Instance](#initializing-a-router-instance)
- [Fallback Route](#fallback-route)
- [Route View Component Props](#route-view-component-props)
- [Route Props](#route-props)
- [Before-Push Hooks](#before-push-hooks)
- [Global Before-Push Hook](#global-before-push-hook)
- [Programmatic History Navigation](#programmatic-history-navigation)
- [Route Updated Event Listener](#route-updated-event-listener)
- [RouteLink Component](#routelink-component)
	- [RouteLink with Parameters](#routelink-with-parameters)
- [Svelte Action use:link](#svelte-action-uselink)
- [Route Transitions](#route-transitions)
- [Router Examples](#-router-examples)

<br>

# 🧗‍♀️ Getting Started

## 💿 Installation

Just `npm i --save-dev @danielsharkov/svelte-router` and done 😁 🎉

<br>

## Initializing a Router Instance

Initialize a new router with the configuration in `src/router.ts` or where
ever you like, maybe even inside `App.svelte` as a module - it's up to you.

```ts
import {SvelteRouter} from '@danielsharkov/svelte-router'
import ViewHome from './views/Home'
import ViewUser from './views/User'

export default new SvelteRouter({
	window: window,
	scrollingElement: window.document.scrollingElement,
	baseUrl: '/persistent/path',
	routes: {
		'home': {
			path: '/',
			component: ViewHome,
		},
		'users.user': {
			// paths must always begin with a slash
			// and may take parameters prefixed by a colon
			path: '/users/:uid',
			component: ViewUser,
		},
		'user.album': {
			// paths may take multiple parameters
			path: '/users/:uid/albums/:aid',
			component: ViewUser,
		},
	},
})
```

* `window` should usually be assigned the [browser object model](https://www.w3schools.com/js/js_window.asp)
but can also be used for testing and debugging purposes.

* `scrollingElement` should usually be assigned the [Document.scrollingElement](https://developer.mozilla.org/en-US/docs/Web/API/document/scrollingElement),
which is the usual scrollable viewport. But if your viewport differs you may
then provid it your needed `Element`. When no `scrollableElement` is provided
then the router won't save and restore scroll state by the history.

* `basePath` is an optional field which has the same principle as the HTML
`<Base>` tag. It acts like a prefix to the paths. It's useful in cases like
hosting on GitHub Pages, where the base URL is always `https://<username>.github.io/<repo-name>`
and the base path therefor always is `/<repo-name>`.

* a route name is required to be unique and is allowed to contain
`a-z`, `A-Z`, `0-9`, `-`, `_` and `.`

* static routes will always be preferred to their parameterized counterparts.
This means `user/a/albums` will be preferred to `/user/:id/albums` if the URL
matches the static route.

Then use the `Viewport` as the actual visual router in your `App.svelte`
passing it your created router instance:

```svelte
<script lang='ts'>
	import {Viewport} from '@danielsharkov/svelte-router'
	import router from './router'
</script>

<nav>
	<button on:click={router.push('home')}>
		Home
	</button>
	<button on:click={router.push('home', {uid: 'paul'})}>
		Paul
	</button>
	<button on:click={router.push('home', {
		userId: 'alex', albumId: 'sumer-2016',
	})}>
		Bob
	</button>
</nav>

<Viewport {router}/>
```


<br>

--------------------------------------------------------------------------------
<br>


# Fallback Route

```ts
import {SvelteRouter} from '@danielsharkov/svelte-router'
import ViewHome from './views/Home'
import ViewNotFound from './views/NotFound'

export default new SvelteRouter({
	window,
	routes: {
		'home': {
			path: '/',
			component: ViewHome,
		},
		'404': {
			path: '/404',
			component: ViewNotFound,
		},
	},
	fallback: {
		name: '404',
		replace: false, // true by default
	},
})
```

`fallback` is optional and defines the route the router should fallback to in
case the user navigates to an inexistent URL. If `replace` is `false` then the
fallback will push the route into the browser history and change the URL,
otherwise it'll just display the fallback route in the router viewport without
affecting the browser history. `replace` is `true` by default.


<br>

--------------------------------------------------------------------------------
<br>


# Route View Component Props

The route view components always get the props `router`, `params`, `urlQuery`
and `props`.

```svelte
<script lang='ts'>
	export let router
	// router: is the SvelteRouter instance you have provided to <Viewport>
	export let params
	// params: is either undefined or the parameters you have defined
	// in the path template for this route in the router config.
	export let urlQuery
	// urlQuery: is either undefined or a key:value object depending whether
	// the URL has any query parameters.
	export let props
	// props: is either undefined or the defined props for this route
	// in the router config.

	// We assume that the route parameters always exist, because we defined
	// them parameters in the path template for this route in the router config -
	// and they do always exist, because the router won't route on a route
	// missing its parameters.
	// You can may access these values without worry of trying to access an
	// undefined property.
	console.log(params.someParam)

	// Same follows for props, they are hard-coded and therefore always defined.
	console.log(props.nav.title)

	// Only the urlQuery keys must be checked first, because there's is no
	// definition for the URL query.
	if (urlQuery.search) console.log(search)
</script>

<!-- Here your Layout & Styles ... -->
```


<br>

--------------------------------------------------------------------------------
<br>


# Route Props

Routes can be assigned arbitrary props which are then available in the view
component:

<sub>**router.ts**</sub>
```ts
import {SvelteRouter} from '@danielsharkov/svelte-router'
import ViewHome from './views/Home'
import ViewAbout from './views/About'

export default new SvelteRouter({
	window,
	routes: {
		'root': {
			path: '/',
		},
		'home': {
			path: '/home',
			component: ViewHome,
			props: {
				nav: {
					title: 'Home',
					icon: 'fas fa-home',
				},
				picture: 'https://sample.url/picture.jpg',
			},
		},
		'about': {
			path: '/about',
			component: ViewAbout,
			props: {
				nav: {
					title: 'About me',
					icon: 'fas fa-address-card',
				},
			},
		},
	},
})
```

<sub>**views/Home.svelte**</sub>

```svelte
<script lang='ts'>
	export let props
</script>

<!-- We assume that these props always exist,
because we hard-code them into the router -->
<h1>{props.nav.title}</h1>
<img src={props.picture} alt='Some beautiful picture'>
```

<sub>**App.svelte**</sub>

```svelte
<script lang='ts'>
	import router from './router'
</script>

<nav>
	{#each $router.routes as route}
		{#if route.props?.nav}
			<button on:click={router.push(route.name)}>
				<i class='{route.props.nav.icon}'/>
				<span>{route.props.nav.title}</span>
			</button>
		{/if}
	{/each}
</nav>
```


<br>

--------------------------------------------------------------------------------
<br>


# Before-Push Hooks

The `beforePush` hooks are promises which are executed before a route is pushed
to the history. The passed function receives an object containing the current
`location`, the `pendingRoute` (which the router is about to navigate to) and both
the `resolver` and `rejector`. A hook must either resolve (approve) the pending
route otherwise to reject it by passing an another route, or even
nothing (`undefined`) to cancel routing. It can be used for specifying redirect behavior or
anything else that should be done before a push.

You may use the `$router.isLoading` property to determine whether the router is
loading a new route and resolving before push hooks, which may be asynchronous.

| ⚠ Warning ⚠ |
|:--|
Be sure to always either resolve or reject a hook, otherwise it will **dead-lock** your router.

Simple example of using a hook:

```svelte
<script>
	import {onDestroy} from 'svelte'
	import router from './router'

	const testHookID = 'test-hook'
	const removeBeforePushHook = router.addBeforePushHook(
		testHookID,
		({location, pendingRoute, resolve, reject})=> {
			if (pendingRoute.name === '/very/secret/path') {
				reject()
			}
			resolve()
		}
	)

	onDestroy(()=> {
		removeBeforePushHook()
		// or
		// router.removeBeforePush(testHookID)
	})
</script>
```


<br>

--------------------------------------------------------------------------------
<br>


# Global Before-Push Hook

The global before push hook is a persistent hook, which can't be removed.
It's defined right in the router config.
Here's a simple example:

```ts
import {SvelteRouter} from '@danielsharkov/svelte-router'
import {get as getStore} from 'svelte/store'
import {isValidUserSession} from 'user_session'
// isValidSession could be any of your implementations - in this example it is
// just a derived store returning false or true

import ViewLogin from './views/Login'
import ViewHome from './views/Home'
import ViewUser from './views/User'

export default new SvelteRouter({
	window,
	routes: {
		'root': {
			path: '/',
		},
		'login': {
			path: '/login',
			component: ViewLogin,
		},
		'home': {
			path: '/home',
			component: ViewHome,
		},
		'user': {
			path: '/user/:uid',
			component: ViewUser,
		},
		'very-secret': {
			path: '/treasure',
		}
	},
	beforePush({pendingRoute, location, resolve, reject}) {
		if (!getStore(isValidUserSession)) {
			reject({name: 'login'})
		} else if (pendingRoute.name === 'login') {
			reject()
		}

		switch (pendingRoute) {
		case 'root':
			reject({name: 'home'})
			break
		case 'user':
			if (params.uid === 'a') {
				reject({
					name: pendingRoute.name,
					params: {uid: 'b'},
				})
			}
			break
		case 'very-secret':
			reject()
		}
		resolve()
	},
})
```


<br>

--------------------------------------------------------------------------------
<br>


# Programmatic History Navigation

To programmatically go back or forward in history just use the [browser history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) or the built-in aliases:


```svelte
<script lang='ts'>
	export let router
</script>

<button on:click={router.back}>Back</button>
<button on:click={router.forward}>Forward</button>
```

To navigate to a new route use the built-in `push` API of the router, which
requires the route name as the first parameter and if needed a `key:value` object
with the parameter values:

```svelte
<script lang='ts'>
	export let router
</script>

<button on:click={()=> router.push('home')}>
	Home
</button>
<button on:click={()=> router.push('user', {uid: 'ndkh2oj2'})}>
	Dennis
</button>
<button on:click={()=> router.push('user', {uid: 'sz92fnkk'})}>
	Erik
</button>
```


<br>

--------------------------------------------------------------------------------
<br>


# Route Updated Event Listener

The `routeUpdated` event listener if fired right after the route has been updated.
The payload in the event is the current location.

```svelte
<script lang='ts'>
export let params;

function routeUpdated(event) {
	console.log('Route params changed!', event.detail.params)
	console.log(parms, 'is equal to the event payload')
}
</script>

<svelte:window on:routeUpdated={routeUpdated}/>
```


<br>

--------------------------------------------------------------------------------
<br>


# RouteLink Component
A `<RouteLink>` can only be used inside a `<Viewport>` instance or by
passing it the router instance. You may pass HTML tag attributes like `class`,
`id` and etc. directly to the component - as you'll see in the example below.

<sub>**router.ts**</sub>
```ts
import {SvelteRouter} from '@danielsharkov/svelte-router'
import ViewHome from './views/Home'
import ViewAbout from './views/About'
import ViewUser from './views/User'

export default new SvelteRouter({
	window,
	routes: {
		'root': {
			path: '/',
		},
		'home': {
			path: '/home',
			component: ViewHome,
			props: {
				nav: {
					title: 'Home',
					icon: 'fas fa-home',
				},
			},
		},
		'about': {
			path: '/about',
			component: ViewAbout,
			props: {
				nav: {
					title: 'About me',
					icon: 'fas fa-address-card',
				},
			},
		},
		'user': {
			path: '/about/:userName/:userNumber',
			component: ViewUser,
		},
	},
})
```

<sub>**components/Nav.svelte**</sub>
```svelte
<script>
	import {RouteLink} from '@danielsharkov/svelte-router'
	import router from '../router'
</script>

<nav>
	{#each $router.routes as route}
		{#if route.props?.nav}
			<RouteLink to={route.name} class='nav-btn'>
				<i class="{route.props.nav.icon}"/>
				<span>{route.props.nav.title}</span>
			</RouteLink>
		{/if}
	{/each}
</nav>

<!-- The only disadvantage is that you have to define the styles globally -->
<style>
	:global(.nav-btn) {
		color: #ff3e00;
	}
</style>
```

#### RouteLink with parameters

```svelte
<RouteLink to='user' params={{userName: 'john_doe', userNumber: 0397}}>
	I'm a router link
</RouteLink>
```


<br>

--------------------------------------------------------------------------------
<br>


# Svelte Action `use:link`
The use action can only be used inside a `<Viewport>` instance or by
passing it the router instance. When you're using it inside a `<Viewport>`,
then leave the parameter `router` blank.

##### Inside a `<Viewport>`
```svelte
<script>
	import {link} from '@danielsharkov/svelte-router'
</script>

<a href='/home' use:link class:active={$router.location === 'home'}>
	Home
</a>
<a href='/about' use:link class:active={$router.location === 'about'}>
	About
</a>
<a href='/user/lauren/8953' use:link class:active={$router.location === 'home'}>
	Lauren#8953 <!-- matches /user/:userName/:userNumber -->
</a>

<style>
	a.active {
		color: #ff3e00;
	}
</style>
```

##### Outside a `<Viewport>`
```svelte
<script>
	import {Viewport, link} from '@danielsharkov/svelte-router'
	import router from './router'
</script>

<a href='/home' use:link={router}>Home</a>
<a href='/about' use:link={router}>About</a>
<a href='/user/lauren/8953' use:link={router}>Lauren</a>

<Viewport {router}/>
```


<br>

--------------------------------------------------------------------------------
<br>


# Route Transitions
Route transitions can't be just applied and used on a route easily. If you
would just add some transitions into the route component and navigate through
the routes, it will show unexpected behavior (
	see Svelte Issues:
	[#6779](https://github.com/sveltejs/svelte/issues/6779),
	[#6763](https://github.com/sveltejs/svelte/issues/6763),
	[and even including my simple REPL](https://svelte.dev/repl/a5122281148c4c458f40e317fc4be11e?version=3.44.2)
).

**But! Dirty hacks to the rescue:** 😎💡

To tell the viewport that a route has a transition you must dispatch the event
`hasOutro` inside the `onMount` handler. Now that the viewport is aware of the
outro transition, it's going to await the route to finish its transition,
before switching to the next route.
Now that the router is awaiting the outro, at the end of the transition we have
to tell the viewport that it may switch further to the next route.
This is done by dispatching the another event called `outroDone`.
That's the trick!

| ℹ Info |
|:--|
Any mistaken dispatched event `outroDone` will be ignored by the viewport, as it only listens for the event after the routers location has changed. Meaning you may just dispatch this event on every outro transition without worring.

| ℹ Info |
|:--|
Inside the route component be sure to call the `outroDone` event on the longest outro transition on any element inside the component, as they have to finish as well. For better understanding see the second example below 👇

| ⚠ Warning ⚠ |
|:--|
Be sure to fire the event `outroDone` after telling the viewport to await the outro transition, otherwise the viewport will wait a indefinitely.

```svelte
<script lang='ts'>
	import {onMount, createEventDispatcher} from 'svelte'
	import {fade} from 'svelte/transition'
	const dispatch = createEventDispatcher()

	onMount(()=> {
		dispatch('hasOutro')
	})
</script>

<div class='page'
transition:fade={{duration: 400}}
on:outroend={()=> dispatch('outroDone')}>
	<h1>Some content</h1>

	<p>Lorem Impsum...</p>
</div>
```

##### A route containing a child transition
```svelte
<script lang='ts'>
	import {onMount, createEventDispatcher} from 'svelte'
	import {fade, fly} from 'svelte/transition'
	const dispatch = createEventDispatcher()

	onMount(()=> {
		dispatch('hasOutro')
	})
	
	const custom =()=> ({
		duration: 1000,
		css: (t)=> (
			`opacity: ${t};` +
			`transform: rotate(${360 - 360 * t}deg);`
		)
	})
</script>

<!-- You may delay the actual route transition, otherwise it will already
fade out and the user will see a blank screen, where it's actually is still
processing a child outro. I set it to 600ms, because 1000ms of the longest
child transition (the heading) minus the 400ms route transition is a delay of 600ms. -->

<div class='page'
transition:fade={{duration: 400, delay: 600}}
on:outroend={()=> dispatch('outroDone')}>
	<h1 transition:custom>
		Some content
	</h1>

	<p style='display: inline-block;' transition:fly={{duration: 700}}>
		Lorem Impsum...
	</p>
</div>
```


<br>

--------------------------------------------------------------------------------
<br>


# 🧩 Router Examples
You can find full router examples in [danielsharkov/svelte-router-examples](https://github.com/DanielSharkov/svelte-router-examples)
<br><br><br><br>



# ✨ Thanks for contribution goes to:
[@romshark](https://github.com/romshark)
[@madebyfabian](https://github.com/madebyfabian)
<br><br><br><br>



# ⚖️ License
Svelte Router is a open source software [licensed as MIT](LICENSE).
<br><br><br><br>



# ⚖️ Additional notices
You may feel free to use the [Logo](https://github.com/DanielSharkov/svelte-router/blob/master/logo.svg), [Animated Logo](https://github.com/DanielSharkov/svelte-router/blob/master/logo-animated.svg) and [Banner](https://github.com/DanielSharkov/svelte-router/blob/master/readme-banner.svg) for non-commercial usage only, but first please ask me kindly. Contact me by email on `scharktv[at]gmail.com`.
