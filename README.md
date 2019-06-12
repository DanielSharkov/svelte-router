# [Svelte](https://svelte.dev) Router

## Getting Started

Define the router configuration in `src/router.js`.

```js
import Router from 'svelte-router'
import ViewHome from './views/Home'

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
    <RouterLink to="home">Home</RouterLink>
    <RouterLink to="users.user" params={ {uid: 'paul'} }>Paul</RouterLink>
    <RouterLink
        to="user.album"
        params={{userId: 'alex', albumId: 'summer-2016'}}
    >Bob</RouterLink>
</nav>

<RouterViewport router={router}/>

<script>
import router from './router'
import RouterViewport from 'router/RouterViewport'
import RouterLink from 'router/RouterLink'
</script>
```

### Fallback Route

```js
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
                title: 'Home',
                icon: 'fas fa-home',
            },
        },
        'about': {
            path: '/about',
            component: ViewAbout,
            metadata: {
                title: 'About me',
                icon: 'fas fa-address-card',
            },
        },
    },
})
```

Routes can be assigned arbitrary metadata which is then available in the view component:

**views/ViewHome.svelte:**

```html
<h1>{metadata.title}</h1>
<img src={metadata.icon} alt="Route icon">

<script>
export let metadata;
</script>
```

**App.svelte:**

```html
<nav>
    {#each $Routes as route}
        {#if route.metadata}
            <RouterLink to={route.name}>
                <i class="{route.metadata.icon}"/>
                <span>{route.metadata.title}</span>
            </RouterLink>
        {/if}
    {/each}
</nav>

<script>
import router from './router'
import RouterLink from 'router/RouterLink'

$:Routes = router.routes
</script>
```

### Before-Push Hook

The `beforePush` hook is executed before a route is pushed to the history. It receives the name and parameters of the route the router is about to navigate to and must return the name and parameters the router must redirect to (if changed) or `false` if the routing should be canceled. It can be used for specifying redirect behavior or anything else that should be done before a push.

```js
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
            path: '/',
            component: {},
        }
    },
    beforePush(name, params) {
        switch (name) {
        case 'root':
            name = 'home'
            break
        case 'user':
            if (params.uid === 'a') params.uid = 'b'
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
