import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

export default {
	input: pkg.source,
	output: [{
		name: pkg.name, file: pkg.module, format: 'es'
	},{
		name: pkg.name, file: pkg.main, format: 'umd'
	}],
	plugins: [
		svelte(),
		resolve({dedupe: ['svelte']}),
		typescript({tsconfig: './tsconfig.json'}),
		terser()
	]
};
