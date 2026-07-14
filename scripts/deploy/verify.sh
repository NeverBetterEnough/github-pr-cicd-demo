#!/usr/bin/env bash
# Deploy verification — health check after GitHub Pages deployment
# Usage: bash scripts/deploy/verify.sh <url>

set -euo pipefail

DEPLOY_URL="${1:-}"
MAX_RETRIES=10
RETRY_DELAY=6

if [ -z "$DEPLOY_URL" ]; then
  echo "Usage: verify.sh <deployment-url>"
  echo ""
  echo "If no URL is provided, attempts to read from GitHub deployment:"
  # Try to get the URL from the latest deployment
  DEPLOY_URL=$(gh api "repos/{owner}/{repo}/deployments?environment=github-pages&per_page=1" --jq '.[0].payload.web_url // empty' 2>/dev/null || echo "")
  if [ -z "$DEPLOY_URL" ]; then
    # Fallback: construct GitHub Pages URL from repo info
    REPO_INFO=$(gh api "repos/{owner}/{repo}" --jq '{owner: .owner.login, name: .name}' 2>/dev/null || echo "")
    if [ -n "$REPO_INFO" ]; then
      OWNER=$(echo "$REPO_INFO" | jq -r '.owner')
      REPO=$(echo "$REPO_INFO" | jq -r '.name')
      DEPLOY_URL="https://${OWNER}.github.io/${REPO}/"
    fi
  fi
fi

if [ -z "$DEPLOY_URL" ]; then
  echo "❌ Could not determine deployment URL"
  exit 1
fi

echo "🔍 Health checking: $DEPLOY_URL"
echo ""

for i in $(seq 1 $MAX_RETRIES); do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$DEPLOY_URL" || echo "000")

  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Attempt $i/$MAX_RETRIES: HTTP $HTTP_STATUS — Deployment healthy!"

    # Additional checks
    CONTENT_LENGTH=$(curl -s -L "$DEPLOY_URL" | wc -c)
    if [ "$CONTENT_LENGTH" -lt 100 ]; then
      echo "⚠️  Response body is suspiciously small ($CONTENT_LENGTH bytes)"
    else
      echo "   Response size: $CONTENT_LENGTH bytes"
    fi

    exit 0
  else
    echo "⏳ Attempt $i/$MAX_RETRIES: HTTP $HTTP_STATUS — retrying in ${RETRY_DELAY}s..."
    sleep $RETRY_DELAY
  fi
done

echo ""
echo "❌ Deployment health check FAILED after $MAX_RETRIES attempts"
echo "   Last status: HTTP $HTTP_STATUS"
echo "   URL: $DEPLOY_URL"
exit 1
