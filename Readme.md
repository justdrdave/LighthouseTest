# docs-core-javascript-dash2LighthouseTests

TruRating test app for running Lighthouse Performance analysis against Dash 2.0 UI

## Development

### Getting started

1. Install node - <https://nodejs.org/en/>
2. Open a command window
3. Install dependancies ```sh $ npm install```
4. Run tests ```sh $ npm run test```
5. By default tests run against qa. This can be overridden by passing environment="subdomain" in the run command (currently options are tru-qa02-app, tru-qa03-app, app or app-preprod). E.g. ```sh $ environment="app-preprod" npm run test```

### Known Issues

#### Only works for the scores page for now, other pages either redirect to the scores page on reload or return error on reload

## CICD

We are now able to run tests against QA in an Azure pipeline. Currently this runs everytime there is a commit to this projects master branch (excluding updating the ReadMe). The pipeline is configured in the file azure-pipelines.yml so can be modified without the need for build access in Azure.

The current baseline for builds to meet to pass is 70 for most metrics (SEO is 60 as not critical as page is behind a login so can not be acessed by google anyway), we will be reviewing these and raising the minimum score to pass regularly

## TODO

- Use bigger and smaller retailers to measure outlet count on page load, currently using bigretailerww

- Add tests for other pages
