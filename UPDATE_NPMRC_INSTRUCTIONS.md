# Instructions for Updating .npmrc

1. Generate a new GitHub Personal Access Token with `write:packages` scope at:
   https://github.com/settings/tokens/new

2. After generating the token, run:
   ```bash
   echo "//npm.pkg.github.com/:_authToken=YOUR_NEW_TOKEN" > ~/.npmrc
   echo "@branchmanager69:registry=https://npm.pkg.github.com" >> ~/.npmrc
   ```

3. Then try publishing again:
   ```bash
   cd /home/branchmanager/websites/degenduel-shared
   npm publish
   ```

## Troubleshooting

If you still get a 401 error, ensure:

1. The token has the `write:packages` scope
2. You're logged into the correct GitHub account
3. The package name in package.json matches your GitHub username (@branchmanager69)
4. The package.json has the correct publishConfig and repository fields

## Workaround

If GitHub Packages isn't working, you can install the package locally instead:

```bash
cd /home/branchmanager/websites/degenduel-fe
npm install file:/home/branchmanager/websites/degenduel-shared
```

This will use the local built version without publishing to GitHub Packages.