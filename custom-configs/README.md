# Custom Configurations

This directory contains your personal/private load testing configurations.

**This directory is git-ignored** - configs here will not be committed to version control.

## Usage

Place your custom configuration files here and reference them in your npm scripts or run them directly:

```bash
npm run dev -- custom-configs/my-config.json
node dist/index.js custom-configs/my-config.json
```

## Examples

You can copy any configuration from the `examples/` directory as a starting point:

```bash
cp examples/config.post.json custom-configs/my-api-test.json
# Edit custom-configs/my-api-test.json with your specific settings
```

## Security Note

Since these configs may contain:
- Real API endpoints
- Authentication tokens
- Sensitive headers
- Internal URLs

They are excluded from git to prevent accidental exposure of sensitive information.
