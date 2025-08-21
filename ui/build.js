import { context } from 'esbuild';
import dotenv from 'dotenv';

dotenv.config()


const buildEnvDefine = keys => {
  const envVars = keys.reduce((acc, key) => {
    if (key in process.env) {
      acc[key] = process.env[key]
    }

    return acc
  }, {})

  return { 'process.env': JSON.stringify(envVars) }
}

async function run() {
  const isWatch = process.argv.includes('--watch')
  const ctx = await context({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    sourcemap: false,
    platform: 'browser',
    outfile: '../data/static/app.js',
    define: {
      ...buildEnvDefine([
        'cf__api__path',
        'cf__api__request_timeout_ms',
        'cf__state_update_interval_ms',
        'cf__system_time_units'
      ])
    }
  })

  if (isWatch) {
    await ctx.watch()
    console.log('Watching for changes...')
    return
  }

  await ctx.rebuild()
  await ctx.dispose()
  console.log('Build complete.')
}

run().catch(() => process.exit(1))
