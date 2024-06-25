/* eslint-disable no-undef */
const chromeLauncher = require('chrome-launcher')
const puppeteer = require('puppeteer')
const lighthouse = require('lighthouse')
const config = require('lighthouse/lighthouse-core/config/lr-desktop-config.js')
const reportGenerator = require('lighthouse/lighthouse-core/report/report-generator')
const request = require('request')
const util = require('util')
const fs = require('fs')
let scoresBelowBaseline = false
const assert = require('assert')
const environment = process.env.environment || 'tru-qa-app';

(async () => {
  const loginURL = 'https://' + environment + '.trurating.com'
  const logoutURL = 'https://www.google.com'

  const opts = {
    // chromeFlags: ['--headless'],
    logLevel: 'info',
    output: 'json',
    disableDeviceEmulation: true,
    defaultViewport: {
      width: 1200,
      height: 900
    },
    chromeFlags: ['--disable-mobile-emulation']
  }

  // Launch chrome using chrome-launcher
  const chrome = await chromeLauncher.launch(opts)
  opts.port = chrome.port

  // Connect to it using puppeteer.connect().
  const resp = await util.promisify(request)(`http://localhost:${opts.port}/json/version`)
  const { webSocketDebuggerUrl } = JSON.parse(resp.body)
  const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl })

  // Puppeteer
  page = (await browser.pages())[0]
  await page.setViewport({ width: 1200, height: 900 })
  await page.goto(loginURL, { waitUntil: 'networkidle0' })
  await page.type('#txtEmailAddress', 'bigretailerww@trurating.com')
  await page.type('#txtPassword', 'password')
  await page.evaluate(() => {
    document.querySelector('#loginForm > div:nth-child(5) > div > div:nth-child(1) > in-progress-button > button').click()
  })

  await page.waitForNavigation()

  console.log(page.url())

  await page.goto(logoutURL, { waitUntil: 'networkidle2' })

  // Run Lighthouse.
  await runLighthouseForURL(loginURL, opts, 'Scores').then(results => {
    return results
  })

  await browser.disconnect()
  await chrome.kill()

  try {
    assert.equal(scoresBelowBaseline, false, 'One of the scores was found below baseline. Failing test')
  } catch (error) {
    console.error('Failing Test: One of the scores was found below baseline. Failing test')
    process.exit(1)
  }
})().catch(e => {
  console.error(e)
  process.exit(1)
})

async function runLighthouseForURL (pageURL, opts, reportName) {
  const reportNameForFile = reportName.replace(/\s/g, '')

  const scores = { Performance: 0, Accessibility: 0, 'Best Practices': 0, SEO: 0 }

  const report = await lighthouse(pageURL, opts, config).then(results => {
    return results
  })
  const html = reportGenerator.generateReport(report.lhr, 'html')
  const json = reportGenerator.generateReport(report.lhr, 'json')
  scores.Performance = JSON.parse(json).categories.performance.score
  scores.Accessibility = JSON.parse(json).categories.accessibility.score
  scores['Best Practices'] = JSON.parse(json).categories['best-practices'].score
  scores.SEO = JSON.parse(json).categories.seo.score

  const baselineScores = {
    Performance: 0.70,
    Accessibility: 0.70,
    'Best Practices': 0.70,
    SEO: 0.60
  }

  fs.writeFile('report/' + reportNameForFile + '.html', html, (err) => {
    if (err) {
      console.error(err)
    }
  })

  fs.writeFile('report/' + reportNameForFile + '.json', json, (err) => {
    if (err) {
      console.error(err)
    }
  })

  try {
    Object.keys(baselineScores).forEach(key => {
      const baselineValue = baselineScores[key]
      if (scores[key] != null && baselineValue > scores[key]) {
        Object.keys(baselineScores).forEach(key => {
          scoresBelowBaseline = true
        })
        console.log(key + ' is below ' + baselineScores[key] * 100 + '%')
      }
    })
  } catch (e) {
  }
}
