# [Svelte](https://svelte.dev) Router

## Getting Started

Define the router configuration in `src/router.js`.

```js
import { Router } from '@danielsharkov/svelte-router'
import ViewHome from './views/Home'
import ViewUser from './views/User'

export default new Router({
    window: window,
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

* `window` should usually be assigned the [browser object model](https://www.w3schools.com/js/js_window.asp) but can also be used for testing and debugging purposes.
* a route name is required to be unique and is allowed to contain `a-z`, `A-Z`, `0-9`, `-`, `_` and `.`
* static routes will always be preferred to their parameterized counterparts. This means `user/a/albums` will be preferred to `/user/:id/albums` if the URL matches the static route.

Then use the `RouterViewport` in your `App.svelte` passing it your router instance:

```html
<nav>
    <button on:click={router.push('home')}>
        Home
    </button>
    <button on:click={router.push('home', { uid: 'paul' })}>
        Paul
    </button>
    <button on:click={router.push('home', {
        userId: 'alex', albumId: 'sumer-2016',
    })}>
        Bob
    </button>
</nav>

<RouterViewport router={router}/>

<script>
import router from './router'
import { RouterViewport } from '@danielsharkov/svelte-router'
</script>
```



### Fallback Route

```js
import { Router } from '@danielsharkov/svelte-router'
import ViewHome from './views/Home'
import ViewNotFound from './views/NotFound'

export default new Router({
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
        redirect: true, // false by default
    },
})
```

`fallback` is optional and defines the route the router should fall back to in case the user navigates to an inexistent URL.
If `redirect` is `true` then fallback will push the route into the browser history and change the URL, otherwise it'll just display the fallback route in the router viewport without affecting the browser history. `redirect` is `false` by default.



### Metadata

**router.js**
```js
import ViewHome from './views/Home'
import ViewAbout from './views/About'

export default new Router({
    window,
    routes: {
        'root': {
            path: '/',
        },
        'home': {
            path: '/home',
            component: ViewHome,
            metadata: {
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
            metadata: {
                nav: {
                    title: 'About me',
                    icon: 'fas fa-address-card',
                },
            },
        },
    },
})
```

Routes can be assigned arbitrary metadata which is then available in the view component:

**views/ViewHome.svelte:**

```html
<h1>{metadata.nav.title}</h1>
<img src={metadata.picture} alt="Route picture">

<script>
export let metadata;
</script>
```

**App.svelte:**

```html
<nav>
    {#each $router.routes as route}
        {#if route.metadata && route.metadata.nav}
            <button on:click={router.push(route.name)}>
                <i class="{route.metadata.nav.icon}"/>
                <span>{route.metadata.nav.title}</span>
            </button>
        {/if}
    {/each}
</nav>

<script>
import router from './router'
</script>
```



### Before-Push Hook

The `beforePush` hook is executed before a route is pushed to the history. It receives the name and parameters of the route the router is about to navigate to and must return the name and parameters the router must redirect to (if changed) or `false` if the routing should be canceled. It can be used for specifying redirect behavior or anything else that should be done before a push.

```js
import { Router } from '@danielsharkov/svelte-router'
import HomeView from './views/Home'
import UserView from './views/User'

export default new Router({
    window,
    routes: {
        'root': {
            path: '/',
        },
        'home': {
            path: '/home',
            component: HomeView,
        },
        'user': {
            path: '/user/:uid',
            component: UserView,
        },
        'noroute': {
            path: '/noroute',
        }
    },
    beforePush(name, params, previousRoute) {
        switch (name) {
        case 'root':
            name = 'home'
            break
        case 'user':
            if (params.uid === 'a') {
                params.uid = 'b'
            }
            break
        case 'noroute':
            return false
        }

        return { name, params }
    },
})
```



### Programmatic History Navigation

To programmatically go back or forward in history just use the [browser history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) or the built-in aliases:

```html
<button on:click={router.back}>Back</button>
<button on:click={router.forward}>Forward</button>

<script>
import router from './router'
</script>
```



### Route updated event listener

The `routeUpdated` event listener allows for reactive changes in case of parameter changes

```html
<script>
export let params;

function routeUpdated() {
    console.log('Route params changed!', params)
}
</script>

<svelte:window on:routeUpdated={routeUpdated}/>
```



### Router Links
A router Link can only be used inside `<RouterViewport>`.

**router.js**
```js
import ViewHome from './views/Home'
import ViewAbout from './views/About'
import ViewUser from './views/User'

export default new Router({
    window,
    routes: {
        'root': {
            path: '/',
        },
        'home': {
            path: '/home',
            component: ViewHome,
            metadata: {
                nav: {
                    title: 'Home',
                    icon: 'fas fa-home',
                },
            },
        },
        'about': {
            path: '/about',
            component: ViewAbout,
            metadata: {
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

**components/Nav.svelte**
```html
<nav>
    {#each $router.routes as route}
        {#if route.metadata && route.metadata.nav}
            <RouterLink to={route.name}>
                <i class="{route.metadata.nav.icon}"/>
                <span>{route.metadata.nav.title}</span>
            </RouterLink>
        {/if}
    {/each}
</nav>

<script>
import { RouterLink } from '@danielsharkov/svelte-router'
import router from './router'
</script>
```

#### Router link with parameters
```html
<RouterLink to='user' params={{ userName: 'john_doe', userNumber: 0397 }}>
    I'm a router link
</RouterLink>
```
