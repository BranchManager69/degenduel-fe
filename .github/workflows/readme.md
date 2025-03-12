# GitHub Workflows for DegenDuel Frontend

This directory contains GitHub Actions workflows that automate the testing, building, and deployment of the DegenDuel frontend application.

## Main Workflow (`test.yml`)

The `test.yml` workflow handles:

1. **Testing**: Runs TypeScript type checking, linting, and Jest tests
2. **Development Build**: Creates and verifies the development build
3. **Production Build**: Creates and verifies the production build
4. **Performance Analysis**: Analyzes bundle size and performance metrics
5. **Visual Regression Testing**: Compares screenshots to detect visual changes
6. **Storybook**: Builds the component documentation

### Unique Features

- **Bundle Size Analysis**: Tracks JavaScript and CSS file sizes
- **Visual Regression Testing**: Automatically captures and compares UI screenshots
- **Performance Monitoring**: Uses Lighthouse to measure performance metrics
- **Specialized Builds**: Supports experimental builds via commit message tags
- **Smart Caching**: Efficiently caches dependencies to speed up builds

### Usage

To trigger specialized builds, use commit message tags:

- `[preview]` - Triggers a preview build
- `[config:option1,option2]` - Passes configuration options to the build

### Deployment Process

The workflow automatically:
1. Creates GitHub deployments for both development and production environments
2. Uploads build artifacts for review
3. Marks deployments as successful when builds complete

## Branch Protection Integration

This workflow is designed to work with GitHub's branch protection rules:

- Requires successful builds before merging
- Automatically enables auto-merge when checks pass
- Checks if branches need updating before merging
- Supports automatic branch deletion after merging

## Troubleshooting

If you encounter deployment issues with the GitHub workflow:

1. Check that the GitHub token has sufficient permissions (write:packages, deployments)
2. Verify environment names match exactly in GitHub repository settings
3. Ensure branch protection rules are properly configured for deployments

Last updated: March 12, 2025