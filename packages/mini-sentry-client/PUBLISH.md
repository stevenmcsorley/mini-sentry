# Publishing mini-sentry-client to npm

## Prerequisites

1. **npm Account**: Create account at https://npmjs.com if you don't have one
2. **Login**: Run `npm login` and enter your credentials
3. **Verify**: Run `npm whoami` to confirm you're logged in

## Publishing Steps

1. **Verify Package**:
   ```bash
   cd packages/mini-sentry-client
   npm run build
   npm pack --dry-run  # Check what will be published
   ```

2. **Test Locally** (Optional):
   ```bash
   npm pack
   # In another project: npm install ./path/to/mini-sentry-client-1.0.0.tgz
   ```

3. **Publish to npm**:
   ```bash
   npm publish
   ```
   
   Or for pre-release versions:
   ```bash
   npm publish --tag beta
   ```

## Package Status ✅

- ✅ **Build System**: tsup with ESM/CJS/IIFE outputs
- ✅ **TypeScript Definitions**: Generated `.d.ts` files  
- ✅ **Package.json**: Proper exports, files, and metadata
- ✅ **README**: Complete usage documentation
- ✅ **Repository**: GitHub URLs updated
- ✅ **Version**: Set to 1.0.0 for initial release
- ✅ **License**: MIT
- ✅ **Public Access**: Configured in publishConfig

## What Gets Published

```
dist/
├── index.js         # ESM build
├── index.cjs        # CommonJS build  
├── index.global.js  # UMD/IIFE build
├── index.d.ts       # TypeScript definitions (ESM)
└── index.d.cts      # TypeScript definitions (CJS)
package.json         # Package metadata
README.md           # Documentation
```

## Usage After Publishing

### Install
```bash
npm install mini-sentry-client
```

### Use
```js
import { initMiniSentry } from 'mini-sentry-client'

const client = initMiniSentry({
  token: 'your-project-token',
  baseUrl: 'https://your-mini-sentry-instance.com'
})

client.captureMessage('Hello from npm!')
```

### CDN
```html
<script src="https://unpkg.com/mini-sentry-client/dist/index.global.js"></script>
<script>
  const client = window.MiniSentry.init({
    token: 'your-token',
    baseUrl: 'https://your-instance.com'
  })
</script>
```

## Next Steps After Publishing

1. **Create GitHub Release**: Tag the version and add release notes
2. **Update Documentation**: Link to npm package in main README
3. **Example Projects**: Update examples to use published package
4. **CI/CD**: Set up automated publishing for future versions