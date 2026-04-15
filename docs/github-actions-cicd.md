# GitHub Actions CI/CD

This repository includes a GitHub Actions workflow at `.github/workflows/ci-cd.yml`.

## What it does

- Installs dependencies for the client, gateway, and each backend service
- Runs `npm run lint` and `npm run build` for the Vite client
- Builds Docker images for the client, gateway, and all services
- Pushes Docker images to GitHub Container Registry (GHCR) on pushes to `main` or `master`

## Published image names

Images are published with this pattern:

`ghcr.io/<github-owner>/smartmedicare-<service-name>`

Examples:

- `ghcr.io/<github-owner>/smartmedicare-client`
- `ghcr.io/<github-owner>/smartmedicare-gateway`
- `ghcr.io/<github-owner>/smartmedicare-auth-service`

## Requirements

- GitHub Actions must be enabled for the repository
- The repository must allow GitHub Actions to write packages
- The default `GITHUB_TOKEN` is used for publishing to GHCR

## Current scope

This workflow currently handles CI plus container image publishing.

It does not deploy to a live VM, Kubernetes cluster, or cloud platform yet. If you want, that can be added next once the target deployment environment is decided.
