import {writable, get as getStore, Readable, Writable} from 'svelte/store'
import {SvelteComponent, tick, getContext} from 'svelte'

export {default as Viewport} from './Viewport.svelte'
export {default as RouteLink} from './RouteLink.svelte'



// Type Definitionzs ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

enum Char {
	CapitalA = 'A',
	CapitalZ = 'Z',
	LowerA = 'a',
	LowerZ = 'z',
	ExclamationMark = '!',
	Dollar = '$',
	Ampersand = '&',
	Apostrophe = "'",
	LeftParenthesis = '(',
	RightParenthesis = ')',
	LeftBracket = '[',
	RightBracket = ']',
	Asterisk = '*',
	Plus = '+',
	Comma = ',',
	Hyphen = '-',
	Period = '.',
	Semicolon = ';',
	Colon = ':',
	Equals = '=',
	At = '@',
	Underscore = '_',
	Tilde = '~',
	Slash = '/',
	Backslash = '\\',
	Space = ' ',
	Hash = '#',
	QuestionMark = '?',
}

export type RouteParams = {[key: string]: string}

export type RouterLocation = {
	path:       string
	name:       string
	params?:    RouteParams
	urlQuery?:  RouteParams
	component?: typeof SvelteComponent
	props?:     any // eslint-disable-line
}

export type RouterActualRoute = {
	path:      string
	name:      string
	params?:   RouteParams
	urlQuery?: RouteParams
}

export type RouterRouteData = {
	name:      string
	params?:   RouteParams
	urlQuery?: RouteParams
}

export type RouterBeforePush = (args: {
	pendingRoute: RouterRouteData,
	location?:    RouterLocation,
	resolve:      ()=> void
	reject:       (newRoute?: RouterRouteData)=> void
})=> void

export type RouterFallback = {
	name:     string
	replace?: boolean
}

export interface RouterConfig {
	window:             Window
	basePath?:          string
	beforePush?:        RouterBeforePush
	fallback?:          RouterFallback
	restoreScroll?:     boolean
	routes:             {[routeName: string]: {
		path:      string
		component: typeof SvelteComponent
		props?:    any // eslint-disable-line
	}}
}

type PathTemplate = {
	tokens: Array<string>
	params: Array<string>
}

export type RouterRoute = {
	path:      PathTemplate
	component: typeof SvelteComponent
	props:     any // eslint-disable-line
}

type Router_Index = {
	name:       string
	token:      string
	param?:     Router_Index
	component?: typeof SvelteComponent
	routes:     {[token: string]: Router_Index}
}

type Router_Internal = {
	routes: {[token: string]: RouterRoute}
	index:  Router_Index
}

export type Router = {
	isLoading: boolean
	routes:    {[routeName: string]: RouterRoute}
	location:  RouterLocation
}



// Svelte Router implementation ::::::::::::::::::::::::::::::::::::::::::::::::

export class SvelteRouter implements Readable<Router> {
	#store: Writable<Router> = writable({
		isLoading: true,
		routes: {},
		location: {
			path: '',
			name: '',
			params: undefined,
			urlQuery: undefined,
			component: undefined,
			props: undefined,
		},
	})
	public readonly subscribe = this.#store.subscribe

	#internalStore: Writable<Router_Internal> = writable({
		routes: {},
		index: {
			name: '',
			token: '',
			param: undefined,
			component: undefined,
			routes: {},
		},
	})

	private _window: Window
	private _beforePush: {[id: string]: RouterBeforePush} = {}
	private _beforePushOrder: Array<string> = []
	private _fallback?: RouterFallback
	private _basePath?: PathTemplate
	private _routeUpdatedEventName = 'routeUpdated'
	private _restoreScroll = true
	private _globalBeforePushHookID

	constructor(conf: RouterConfig) {
		if (!conf.routes || Object.keys(conf.routes).length < 1) {
			throw new Error('[SvelteRouter] missing routes')
		}
		
		// Check if required window API points exist
		if (
			!conf.window?.location ||
			!conf.window?.history ||
			!conf.window?.addEventListener ||
			!conf.window.removeEventListener ||
			!conf.window?.dispatchEvent
		) {
			throw new Error(
				'[SvelteRouter] invalid window, not implementing required ' +
				'API points [location, history, addEventListener, ' +
				'removeEventListener dispatchEvent]'
			)
		}
		this._window = conf.window

		if (conf.beforePush) {
			this._globalBeforePushHookID = '__gloal_before_push_hook'
			this._beforePush[this._globalBeforePushHookID] = conf.beforePush
			this._beforePushOrder.push(this._globalBeforePushHookID)
		}
		if (conf.fallback) {
			this._fallback = conf.fallback
			if (typeof this._fallback.replace !== 'boolean') {
				this._fallback.replace = true
			}
		}
		if (conf.restoreScroll === false) {
			this._restoreScroll = false
		}

		if (conf.basePath && conf.basePath !== '/') {
			try {
				this._basePath = parsePathTemplate(conf.basePath)
			}
			catch(err) {
				throw new Error(
					`the base URL defines an invalid path template: ${err}`
				)
			}
		}

		let err = null
		this.#internalStore.update(($intStr)=> {
			for (const routeName in conf.routes) {
				const route = conf.routes[routeName]
				const pathTemplate = route.path

				// Ensure route name validity
				err = validateRouteName(routeName)
				if (err !== null) return $intStr
	
				// Ensure route name uniqueness
				if (routeName in $intStr.routes) {
					err = new Error(`redeclaration of route "${routeName}"`)
					return $intStr
				}

				// Parse path and ensure it's validity
				let path: PathTemplate
				try {
					path = parsePathTemplate(pathTemplate)
				}
				catch(tplErr) {
					err = new Error(
						`route "${routeName}" defines an invalid path ` +
						`template: ${tplErr}`
					)
					return $intStr
				}

				// Ensure path template uniqueness
				if (routeName in $intStr.routes) {
					err = new Error(`duplicate of route "${routeName}"`)
					return $intStr
				}
				$intStr.routes[routeName] = {
					path:      path,
					component: route.component,
					props:     route.props,
				}

				let currentNode = $intStr.index
				if (path.tokens.length <= 0) {
					currentNode.name = routeName
				}
				else for (let level = 0; level < path.tokens.length; level++) {
					const token = path.tokens[level]

					if (path.params.includes(token)) {
						// Follow node
						if (currentNode.param != null) {
							currentNode = currentNode.param
						}
						// Initialize parameterized branch
						else {
							const newNode = {
								name: routeName,
								token: token,
								param: undefined,
								routes: {},
								props: route.props,
								component: undefined,
							}
							currentNode.param = newNode
							currentNode = newNode
						}
					}
					else {
						const routeNode = currentNode.routes[token]
						// Declare static route node
						if (!routeNode) {
							const newNode = {
								name: routeName,
								token: token,
								param: undefined,
								routes: {},
								props: route.props,
								component: undefined,
							}
							currentNode.routes[token] = newNode
							currentNode = newNode
						}
						// Follow node
						else {
							currentNode = routeNode
						}
					}
				}
				currentNode.component = $intStr.routes[routeName].component
			}
			return $intStr
		})
		if (err !== null) throw err

		this.#store.update(($rtrStr)=> {
			const routes = getStore(this.#internalStore).routes
			for (const routeName in routes) {
				$rtrStr.routes[routeName] = routes[routeName]
			}
			return $rtrStr
		})

		this._window.addEventListener(
			'popstate', this._onPopState.bind(this), {passive: true},
		)

		this._initRoute()
	}

	private async _initRoute() {
		const currentPath = (
			this._window.location.pathname +
			this._window.location.search
		)

		// Initialize current route
		try {
			const state = this._window.history.state
			if (!state?.name) throw 0
			await this._setCurrentRoute(
				currentPath, state.name, state.params, state.urlQuery,
				false, true,
			)
		}
		catch(_) {
			try {
				const route = this.getRoute(currentPath)
				await this._setCurrentRoute(
					currentPath, route.name, route.params, route.urlQuery,
					true,
				)
			}
			catch(err) {
				if (!this._fallback) throw err
				await this._setRouteFallback()
			}
		}
	}

	private _dispatchRouteUpdated() {
		this._window.dispatchEvent(
			new CustomEvent(
				this._routeUpdatedEventName,
				{detail: getStore(this.#store).location},
			)
		)
	}

	private _setRouteFallback() {
		if (this._fallback) {
			return this._setCurrentRoute(
				this._window.location.pathname +
				this._window.location.search,
				this._fallback.name,
				undefined, undefined,
				this._fallback.replace, true,
			)
		}
		throw new Error('unexpected: fallback not set')
	}

	private async _onPopState(event: PopStateEvent) {
		if (event.state) {
			try {
				let route = await this._setCurrentRoute(
					event.state.path,
					event.state.name,
					event.state.params,
					event.state.urlQuery,
					true, true,
				)
				if (event.state.scroll) {
					await tick()
					this._window.scrollTo({
						left: event.state.scroll[0],
						top: event.state.scroll[1],
					})
				}
				return route
			}
			catch(err) {
				if (!this._fallback) throw err
			}
		}

		if (this._fallback) {
			return await this._setRouteFallback()
		}

		// panic, router can't handle history state
		throw new Error(
			`unexpected history state: ${JSON.stringify(event.state)}`
		)
	}

	/**
	 * addBeforePushHook removes the hook by the given ID from the router.
	 * Throws an error on not exsisting hook ID.
	 * 
	 * @param hookID string
	 * @param hook Function
	 * @returns Function: void
	 */
	private removeBeforePush(hookID: string): void {
		const hookIdx = this._beforePushOrder.indexOf(hookID)
		if (
			hookIdx < 0 ||
			(this._globalBeforePushHookID &&
			this._globalBeforePushHookID === hookID)
		) throw new Error(
			`[SvelteRouter] hook by ID "${hookID}" not subscribed`
		)
		delete this._beforePush[hookID]
		this._beforePushOrder.splice(hookIdx, 1)
	}

	/**
	 * addBeforePushHook appends a hook to the router
	 * 
	 * @param hookID string
	 * @param hook Function
	 * @returns Function: void
	 */
	public addBeforePushHook(
		hookID: string, hook: RouterBeforePush,
	): ()=> void {
		if (this._beforePushOrder.includes(hookID)) {
			throw new Error(
				`[SvelteRouter] before push hook by ID "${hookID}" ` +
				`is already existing`
			)
		}
		this._beforePushOrder.push(hookID)
		this._beforePush[hookID] = hook
		return ()=> this.removeBeforePush(hookID)
	}

	/**
	 * verifyNameAndParams verifies the route by either returning the route or
	 * throwing an error
	 * 
	 * @param routeName string
	 * @param params RouteParams
	 * @throws Error
	 * @returns RouterRoute
	 */
	public verifyNameAndParams(
		routeName: string, params?: RouteParams,
	): RouterRoute {
		if (!routeName) throw new Error(
			'missing parameter name'
		)

		const route = getStore(this.#internalStore).routes[routeName]
		if (!route) throw new Error(
			`route "${routeName}" not found`
		)

		const paramNames = route.path.params
		if (paramNames.length > 0) {
			if (!params) throw new Error(
				`missing parameters [${paramNames}] ` +
				`for route "${routeName}"`
			)

			// Parameters expected
			for (const paramName of route.path.params) {
				if (!(paramName in params)) throw new Error(
					`missing parameter "${paramName}" ` +
					`for route "${routeName}"`
				)
			}
		}

		return route
	}

	/**
	 * getRoute parses the given URL and returns the matching route.
	 * It throws an error if no matching route was found.
	 * 
	 * @param url string
	 * @returns RouterRouteData
	 * @throws Error
	 */
	public getRoute(url: string): RouterRouteData {
		const {pathTokens, urlQuery} = parseURLPath(url)

		let currentNode = getStore(this.#internalStore).index
		const params: {[token: string]: string} = {}

		if (pathTokens.length === 0 && !this._basePath) {
			if (!currentNode.name) {
				throw new Error(`URL "${url}" doesn't resolve any route`)
			}
			return {name: currentNode.name}
		}
		else for (let level=0; level < pathTokens.length; level++) {
			const token = pathTokens[level]

			// only non-base-path-tokens
			if (!(
				this._basePath && this._basePath.tokens.includes(token) &&
				level < this._basePath.tokens.length
			)) {
				// tokens is a static route
				if (token in currentNode.routes) {
					currentNode = currentNode.routes[token]
				}
				// parameter route
				else if (currentNode.param) {
					currentNode = currentNode.param
					params[currentNode.token] = token
				}
				else throw new Error(
					`URL "${url}" doesn't resolve any route`
				)
			}

			// is last token
			if (level+1 >= pathTokens.length) {
				if (currentNode.component) {
					return {
						name: currentNode.name,
						params: params || undefined,
						urlQuery: urlQuery || undefined,
					}
				}
				else throw new Error(
					`URL "${url}" doesn't resolve any route`
				)
			}
		}
		throw new Error('unexpected')
	}

	/**
	 * stringifyRouteToURL parses a route into a URL by its path template,
	 * its corresponding parameters and a optionally URL query.
	 * 
	 * @param path PathTemplate
	 * @param params RouteParams
	 * @param urlQuery RouteParams
	 * @returns string
	 * @throws Error
	 */
	public stringifyRouteToURL(
		pathTemp: PathTemplate, params?: RouteParams, urlQuery?: RouteParams,
	) {
		let path = ''

		if (this._basePath) {
			for (const token of this._basePath.tokens) {
				path += `/${token}`
			}
		}

		if (pathTemp.tokens.length < 1) {
			return path === '' ? '/' : path
		}

		for (const token of pathTemp.tokens) {
			const isParam = pathTemp.params.includes(token)
			if (isParam) {
				if (params !== undefined) {
					path += `/${params[token]}`
				}
				else throw new Error(
					`expected parameter '${token}' but got '${params}'`
				)
			}
			else {
				path += `/${token}`
			}
		}

		if (urlQuery) {
			const queryLen = Object.keys(urlQuery).length
			if (queryLen > 0) {
				path += '?'
				let itr = 0
				for (const param in urlQuery) {
					path += param +'='+ urlQuery[param]
					if (itr < queryLen-1) path += '&'
					itr++
				}
			}
		}
		return path
	}

	/**
	 * nameToPath parses a route into a URL by its name, its corresponding
	 * parameters and optionally a URL query.
	 * 
	 * @param name string
	 * @param params RouteParams
	 * @param urlQuery RouteParams
	 * @returns string
	 * @throws Error
	 */
	public nameToPath(
		routeName: string, params?: RouteParams, urlQuery?: RouteParams,
	): string {
		const routes = getStore(this.#internalStore).routes
		if (
			typeof routeName !== 'string' || routeName === '' ||
			!(routeName in routes)
		) {
			throw new Error(`invalid route name: '${routeName}'`)
		}
		return this.stringifyRouteToURL(
			getStore(this.#internalStore).routes[routeName].path,
			params,
			urlQuery,
		)
	}

	/**
	 * _setCurrentRoute executes the beforePush hooks (if any), updates the
	 * current route, pushing the path to the browser history, (if the current
	 * browser URL doesn't match) and returns the name and parameters of
	 * the route that was finally selected
	 * 
	 * @param path string
	 * @param name string
	 * @param params RouteParams
	 * @param urlQuery RouteParmas
	 * @param replace boolean
	 * @returns RouterActualRoute
	 * @throws Error
	 */
	private async _setCurrentRoute(
		path: string, name: string, params?: RouteParams,
		urlQuery?: RouteParams, replace = false, keepHistoryState = false,
	): Promise<RouterActualRoute> {
		let route = this.verifyNameAndParams(name, params)

		this.#store.update(($rtrStr)=> {
			$rtrStr.isLoading = true
			return $rtrStr
		})

		if (this._beforePushOrder.length > 0) {
			const location: RouterLocation = (
				getStore(this.#store).location
			)

			for (const hookID of this._beforePushOrder) {
				try {
					await new Promise<void>((resolve, reject)=> {
						this._beforePush[hookID]({
							pendingRoute: {name, params, urlQuery},
							location,
							resolve: ()=> resolve(),
							reject,
						})
					})
				}
				catch(newRoute) {
					if (newRoute === undefined) {
						return {
							name: location.name,
							path: this.nameToPath(
								location.name,
								location.params,
								location.urlQuery,
							),
							params: location.params,
							urlQuery: location.urlQuery,
						}
					}

					if (!(newRoute as RouterRouteData)?.name) {
						throw new Error(
							'before-push hook must reject with a return of a ' +
							`new route; returned: ${JSON.stringify(newRoute)}`,
						)
					}
					const nR = newRoute as RouterRouteData
					name = nR.name
					params = nR.params
					urlQuery = nR.urlQuery
					path = this.nameToPath(name, params, urlQuery)
					route = this.verifyNameAndParams(name, params)

					break
				}
			}
		}

		// Reconstruct path from route tokens and parameters if non is given
		if (!(this._fallback && name === this._fallback.name)) {
			path = this.stringifyRouteToURL(route.path, params, urlQuery)
		}

		// Update store
		this.#store.update(($rtrStr)=> {
			$rtrStr.isLoading = false
			$rtrStr.location = {
				name,
				path,
				params,
				urlQuery,
				component: route.component,
				props: route.props,
			}
			return $rtrStr
		})

		if (!keepHistoryState) {
			const historyState = this._window.history.state
			if (replace) {
				this._window.history.replaceState({
					name, params, urlQuery,
				}, '')
			}
			else if (
				!historyState || (
					historyState.name != name ||
					path != (
						this._window.location.pathname +
						this._window.location.search
					)
				)
			) {
				const prevState = this._window.history.state
				if (prevState && this._restoreScroll) {
					this._window.history.replaceState({
						name: prevState.name,
						params: prevState.params,
						urlQuery: prevState.urlQuery,
						scroll: [this._window.scrollX, this._window.scrollY],
					}, '')
				}
	
				this._window.history.pushState(
					{name, params, urlQuery}, '', path,
				)
				this._window.scrollTo({top: 0, left: 0})
			}
		}

		this._dispatchRouteUpdated()
		return {name, path, params, urlQuery}
	}

	public push(
		name: string, params?: RouteParams, rawUrlQuery?: RouteParams|string,
	) {
		let urlQuery: RouteParams|undefined
		if (typeof rawUrlQuery === 'string') {
			urlQuery = parseUrlQuery(rawUrlQuery)
		}
		return this._setCurrentRoute('', name, params, urlQuery)
	}

	public pushPath(path: string) {
		try {
			const route = this.getRoute(path)
			return this._setCurrentRoute(
				path, route.name, route.params, route.urlQuery,
			)
		}
		catch(err) {
			if (this._fallback) {
				return this._setCurrentRoute(
					path, this._fallback.name,
					undefined, undefined,
					this._fallback.replace,
				)
			}
			else throw err
		}
	}

	public back() {
		this._window.history.back()
	}

	public forward() {
		this._window.history.forward()
	}

	public destroy() {
		this._window.removeEventListener(
			'popstate', this._onPopState.bind(this),
		)
	}
}



// Svelte Use Actions ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

export function link(node: Element, router?: SvelteRouter) {
	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
		throw Error(
			'[SvelteRouter] <RouterLink> The action "link" can only be used ' +
			'on <a> tags with a href attribute'
		)
	}
	const instance = (
		router ?
			router : getContext('svelte_router') as SvelteRouter
	)
	if (!instance) {
		throw new Error(
			'[SvelteRouter] <RouterLink> invalid router instance. Either use ' +
			'this component inside a <RouterViewport/> or provide the router ' +
			'instance in the paramters.'
		)
	}

	const href = node.getAttribute('href')
	if (!href || href.length < 1) {
		throw Error(`invalid URL "${href}" as "href"`)
	}
	const route = instance.getRoute(href)
	function _onclick(event: Event): void {
		event.preventDefault()
		instance.push(route.name, route.params, route.urlQuery)
	}
	node.addEventListener('click', _onclick)

	return {
		destroy() {
			node.removeEventListener('click', _onclick)
		},
	}
}



// Utility functions :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

/**
 * isValidLetter checks whether the given char is a valid letter in A-Z or a-z.
 * 
 * @param char string
 * @returns boolean
 */
function isValidLetter(char: string): boolean {
	return (
		char >= Char.CapitalA && char <= Char.CapitalZ ||
		char >= Char.LowerA && char <= Char.LowerZ
	)
}

/**
 * isValidNumber checks whether the given char is a number in 0-9.
 * 
 * @param char string
 * @returns boolean
 */
function isValidNumber(char: string): boolean {
	return !Number.isNaN(parseInt(char))
}

/**
 * isValidTokenChar validates if character is either a valid letter,
 * valid number or a valid symbole.
 * 
 * Using a plain parser instead of RegEx because of sweet performance
 * @param char string
 * @returns boolean
 */
function isValidTokenChar(char: string): boolean {
	// 0-9
	if (isValidNumber(char)) return true
	// A-Z a-z
	if (isValidLetter(char)) return true

	switch (char) {
		case Char.ExclamationMark:
		case Char.Dollar:
		case Char.Ampersand:
		case Char.Apostrophe:
		case Char.LeftParenthesis:
		case Char.RightParenthesis:
		case Char.Asterisk:
		case Char.Plus:
		case Char.Comma:
		case Char.Hyphen:
		case Char.Period:
		case Char.Semicolon:
		case Char.Equals:
		case Char.At:
		case Char.Underscore:
		case Char.Tilde:
			return true
	}
	return false
}

/**
 * validateRouteName
 * @param routeName string
 * @returns Error|null
 */
function validateRouteName(routeName: string): Error|null {
	if (routeName.length < 1) {
		return new Error(`invalid route name (empty)`)
	}
	for (const char of routeName) {
		// 0-9
		if (isValidNumber(char)) continue
		// A-Z a-z
		if (isValidLetter(char)) continue

		switch (char) {
			case Char.Hyphen:
			case Char.Period:
			case Char.Underscore:
				continue
		}
		return new Error(
			`unexpected character ${char} in route name "${routeName}"`
		)
	}
	return null
}



/**
 * parsePathTemplate parses path templates.
 * Example path template: /some/random/path/:param1/:param2
 * 
 * @param template string
 * @returns PathTemplate
 * @throws Error
 */
function parsePathTemplate(template: string): PathTemplate {
	if (typeof template !== 'string') {
		throw new Error(
			`unexpected type of route path "${template}" (${typeof template})`
		)
	}
	if (template.length < 1) {
		throw new Error(`invalid path (empty)`)
	}

	const templObject: PathTemplate = {tokens: [], params: []}

	function addToken(isParam: boolean, begin: number, end: number): Error|null {
		const token = template.substring(begin, end)

		if (isParam) {
			if (token.length < 1) {
				return new Error(`missing parameter name at ${begin}`)
			}
			if (token in templObject.params) {
				return new Error(`redeclared parameter '${token}' at ${begin}`)
			}
			if (isParam) {
				templObject.params.push(token)
			}
		}

		templObject.tokens.push(token)
		return null
	}

	if (template.charAt(0) !== Char.Slash) {
		throw new Error('a path template must begin with a slash')
	}
	
	let isPreviousSlash = true
	// let isStatic = false
	let isParam = false
	let tokenStart = 1

	for (let itr = 0; itr < template.length; itr++) {
		const char = template[itr]

		if (isPreviousSlash) {
			// Ignore multiple slashes
			if (char == Char.Slash) {
				continue
			}
			isPreviousSlash = false

			// Start scanning parameter
			if (char == Char.Colon) {
				// isStatic = false
				isParam = true
				tokenStart = itr+1
			}
			// Start scanning static token
			else if (isValidTokenChar(char)) {
				// isStatic = true
				isParam = false
				tokenStart = itr
			}
			else {
				throw new Error(`unexpected '${char}' at ${itr}`)
			}
		}
		else if (char == Char.Slash) {
			// Terminating slash encountered
			isPreviousSlash = true

			const err = addToken(isParam, tokenStart, itr)
			if (err != null) throw err

			// isStatic = false
			isParam = false
		}
		else if (!isValidTokenChar(char)) {
			throw new Error(`unexpected '${char}' at ${itr}`)
		}

		if (itr+1 >= template.length) {
			// Last character reached
			if (isPreviousSlash) break

			if (char == Char.Colon) {
				throw new Error(`missing parameter name at ${itr}`)
			}

			const err = addToken(isParam, tokenStart, template.length)
			if (err != null) throw err
		}
	}

	return templObject
}



/**
 * parseURLPath
 * @param url string
 * @returns \{pathTokens: Array<string>, urlQuery: RouteParams|undefined}
 * @throws Error
 */
function parseURLPath(url: string): {
	pathTokens: Array<string>,
	urlQuery: RouteParams|undefined,
} {
	if (typeof url !== 'string') {
		throw new Error(`unexpected path type (${typeof url})`)
	}
	if (url.length < 1) {
		throw new Error(`invalid path (empty)`)
	}

	const pathTokens: Array<string> = []

	// Check if path begin with a slash
	if (url[0] !== Char.Slash) {
		throw new Error('a path path must begin with a slash')
	}

	let isPreviousSlash = true
	let tokenStart = 1

	for (let itr=1; itr < url.length; itr++) {
		const char = url[itr]

		if (isPreviousSlash) {
			// Ignore multiple slashes
			if (char === Char.Slash) continue

			isPreviousSlash = false

			// Start scanning token
			if (isValidTokenChar(char)) {
				tokenStart = itr
			}
			else throw new Error(
				`unexpected "${char}" at ${itr}`
			)
		}
		// Terminating slash encountered
		else if (char == Char.Slash) {
			isPreviousSlash = true
			pathTokens.push(
				url.substring(tokenStart, itr)
			)
		}
		// URL Query begins
		else if (char == Char.QuestionMark) {
			pathTokens.push(url.substring(tokenStart, itr))
			break
		}
		// Validate character
		else if (!isValidTokenChar(char)) {
			throw new Error(`unexpected "${char}" at ${itr}`)
		}


		// Last character reached
		if (itr+1 >= url.length) {
			if (isPreviousSlash) break

			pathTokens.push(url.substring(tokenStart, url.length))
		}
	}

	let urlQuery: RouteParams|undefined
	const qM = url.indexOf(Char.QuestionMark)
	if (qM > -1 && qM !== url.length-1) {
		const hash = url.indexOf(Char.Hash)
		if (qM > -1 && hash < 0 || hash >= url.length-1) {
			urlQuery = parseUrlQuery(url.substring(qM))
		}
	}
	return {pathTokens, urlQuery}
}

/**
 * parseUrlQuery parses the given URL query string into a key:value object
 * 
 * @param query string
 * @returns RouteParams|undefined
 */
function parseUrlQuery(query: string): RouteParams|undefined {
	if (query[0] !== Char.QuestionMark) {
		return undefined
	}

	// pQ parsed query
	const pQ: RouteParams = {}

	for (let chunk of query.substring(1, query.length).split(Char.Ampersand)) {
		if(!chunk) return undefined
		chunk = chunk.split(Char.Plus).join(Char.Space)
		
		const eq = chunk.indexOf(Char.Equals)
		const key = eq > -1 ? chunk.substring(0, eq) : chunk
		const val = eq > -1 ? decodeURIComponent(chunk.substring(eq + 1)) : ''

		pQ[decodeURIComponent(key)] = val
	}
	return pQ
}
