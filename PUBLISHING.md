# Publishing Guide

This library is dual-published to both npm and JSR (JavaScript Registry) for Node.js and Deno users.

## Prerequisites

### For npm Publishing
1. Create an npm account at https://www.npmjs.com/
2. Generate an npm access token (Automation token recommended)
3. Add the token as `NPM_TOKEN` secret in GitHub repository settings

### For JSR Publishing
1. No account needed - JSR uses GitHub authentication
2. Ensure repository has `id-token: write` permission in workflows
3. JSR will automatically link to your GitHub account on first publish

## Publishing Process

### Automated Publishing (Recommended)

Both npm and JSR publishing are automated via GitHub Actions.

#### Using the Release Script

The easiest way to publish is using the provided release script:

```bash
./scripts/release.sh <version>
```

Example:
```bash
./scripts/release.sh 0.2.0
```

This script will:
1. Validate the version format (semver)
2. Check that your working directory is clean
3. Update version in both `package.json` and `deno.json`
4. Commit the version bump
5. Create and push a git tag
6. Trigger GitHub Actions to publish to both npm and JSR

#### Manual Process

If you prefer to do it manually:

1. **Update version** in both `package.json` and `deno.json`
2. **Commit changes**: `git commit -am "chore: bump version to x.y.z"`
3. **Create and push tag**: 
   ```bash
   git tag v0.1.0
   git push origin main
   git push origin v0.1.0
   ```
4. GitHub Actions will automatically:
   - Build the package for npm
   - Publish to npm registry
   - Publish to JSR registry

### Manual Publishing

#### Publishing to npm

```bash
# Build the package
pnpm run build

# Publish to npm
pnpm publish
```

#### Publishing to JSR

```bash
# Ensure Deno is installed
deno --version

# Publish to JSR
deno publish
```

## Version Management

**Important**: Keep versions synchronized between `package.json` and `deno.json`.

```json
// package.json
{
  "version": "0.1.0"
}

// deno.json
{
  "version": "0.1.0"
}
```

## GitHub Secrets Setup

Add the following secret to your GitHub repository:

- `NPM_TOKEN`: Your npm automation token

Go to: Repository Settings → Secrets and variables → Actions → New repository secret

## Verification

After publishing, verify the packages:

### npm
```bash
npm view @serendevity/webvtt-validator
```

### JSR
Visit: https://jsr.io/@serendevity/webvtt-validator

## Troubleshooting

### npm publish fails
- Verify `NPM_TOKEN` secret is set correctly
- Check if version already exists on npm
- Ensure you have publishing rights to the package

### JSR publish fails
- Verify `deno.json` is valid: `deno task check`
- Check that all exported files exist
- Ensure repository is public (JSR requires public repos)

## Package URLs

- **npm**: https://www.npmjs.com/package/@serendevity/webvtt-validator
- **JSR**: https://jsr.io/@serendevity/webvtt-validator

## Organization Setup

This package is published under the `@serendevity` organization on both npm and JSR.

### npm Organization
- Ensure you have access to the `@serendevity` organization on npm
- The `NPM_TOKEN` secret must be from an account with publish permissions to `@serendevity`
- Scoped packages require `publishConfig.access: "public"` in `package.json`

### JSR Organization
- JSR uses GitHub authentication
- The repository owner/organization on GitHub should match or have access to publish under `@serendevity`
