import esbuild from 'esbuild';

// Only exclude native modules and typescript (resolved at runtime)
const external = ['typescript', 'tree-sitter', 'tree-sitter-*'];

async function build() {
    /**
     * @type {import('esbuild').BuildOptions}
     */
    const config = {
        entryPoints: {
            'dist/server': './src/server.ts'
        },
        outdir: '.',
        bundle: true,
        sourcemap: true,
        external: external,
        format: 'cjs',
        platform: 'node',
        tsconfig: './tsconfig.json',
        define: { 'process.env.NODE_ENV': '"production"' },
        minify: process.argv.includes('--minify'),
        legalComments: 'none'
    };
    if (process.argv.includes('--watch')) {
        const ctx = await esbuild.context(config);
        console.log('watch rsx-language-server success');
        await ctx.watch();
    } else {
        await esbuild.build(config);
        console.log('build rsx-language-server success');
    }
}

await build();
