# orgid-explorer-cache
Backend service for orgid-explorer

Run with `node management/scrape.js`
Use `--reinit` flag to drop existing tables and recreate empty DB. Also useful for first-time usage.


Configurable envvars:
- `WT_CONFIG` - Environment (dev/test)
- `LOG_LEVEL` - Log level
- `BASE_URL` - Base URL where deployed
