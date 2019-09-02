# orgid-explorer-cache
Backend service for [orgid-explorer](https://github.com/windingtree/orgid-explorer).

Run with `node management/scrape.js`
Use `--reinit` flag to drop existing tables and recreate empty DB. Also useful for first-time usage.

## Example
```
nvm use
npm i
WT_CONFIG=dev node management/scrape.js --reinit
npm run dev
```

Then use
```
WT_CONFIG=dev node management/scrape.js
```
to update.

## Configuration

Configurable envvars:
- `WT_CONFIG` - Environment (dev/test/prod)
- `LOG_LEVEL` - Log level
- `BASE_URL` - Base URL where deployed

See `src/config/` for more options.