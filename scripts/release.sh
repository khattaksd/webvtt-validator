#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 0.2.0"
  exit 1
fi

VERSION=$1

if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in semver format (e.g., 0.2.0)"
  exit 1
fi

echo "🔍 Checking git status..."
if [[ -n $(git status -s) ]]; then
  echo "Error: Working directory is not clean. Commit or stash changes first."
  exit 1
fi

echo "📝 Updating version to $VERSION..."

sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" deno.json

echo "✅ Version updated in package.json and deno.json"

echo "📦 Committing version bump..."
git add package.json deno.json
git commit -m "chore: bump version to $VERSION"

echo "🏷️  Creating tag v$VERSION..."
git tag -a "v$VERSION" -m "Release v$VERSION"

echo "🚀 Pushing to origin..."
git push origin main
git push origin "v$VERSION"

echo ""
echo "✨ Release process complete!"
echo "📍 Tag v$VERSION has been pushed"
echo "🔄 GitHub Actions will now publish to npm and JSR"
echo ""
echo "Monitor the workflows at:"
echo "  https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
