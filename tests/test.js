const webdriver = require("selenium-webdriver");
const By = webdriver.By;
const moment = require("moment");

const waitTime = 2; // 2 seconds

// username: Username can be found at automation dashboard
// const USERNAME = process.env.LT_USERNAME || "haiderk";

// AccessKey: AccessKey can be generated from automation dashboard or profile section
// const KEY = process.env.LT_ACCESS_KEY || "i7vF5r66IYgsgE9Hp5t6hZqd5PkQX021FgpWRC70mp0ShbFh1R";

// gridUrl: gridUrl can be found at automation dashboard
// const GRID_HOST = process.env.GRID_HOST || "@hub.lambdatest.com/wd/hub"; //connect to lambdatest hub

// const GRID_URL = process.env.GRID_URL || "GRID_URL";
// const GRID_URL = "https://haiderk:V2mDZgIXHVEFxPfVu3cODSDpe9cZ4MT2Z1ZkDbp5uMJ8XL0nxh@stage-hub.lambdatestinternal.com/wd/hub";
const GRID_URL = "https://haiderk:i7vF5r66IYgsgE9Hp5t6hZqd5PkQX021FgpWRC70mp0ShbFh1R@hub.lambdatest.com/wd/hub";

async function searchTextOnGoogle() {
  const keys = process.argv;
  console.log(keys);
  const parallelCount = keys[2] || 1;
  const tunnel = keys[3] || false;
  const platform = keys[4] || "Windows 11";
  const browserName = keys[5] || "chrome";
  const version = keys[6] || "latest";

  // Setup Input capabilities
  const capabilities = {
    platform: platform,
    browserName: browserName,
    version: version,
    queueTimeout: 300,
    visual: true,
    user: process.env.LT_USERNAME,
    accessKey: process.env.LT_ACCESS_KEY,
    name: "test session", // name of the test
    build: `${platform}${browserName}${version}`, // name of the build
    "smartUI.build": "Github-build-3",
    "smartUI.project": "Egifter-integration-testing",
    github: {
      url: process.env.GITHUB_URL,
    },
  };

  if (tunnel === "true") {
    capabilities.tunnel = true;
  }

  console.log("gridUrl: ", GRID_URL);
  console.log("GITHUB_REPOSITORY: ", process.env.GITHUB_REPOSITORY);

  console.log(capabilities);
  console.log(`Running ${parallelCount} parallel tests`);

  for (let i = 1; i <= parallelCount; i++) {
    startTest(GRID_URL, capabilities, `Test ${i}`);
  }
}

async function startTest(gridUrl, capabilities, name) {
  const caps = { ...capabilities, name };

  try {
    const start_date = moment();

    const driver = await new webdriver.Builder()
      .usingServer(gridUrl)
      .withCapabilities(caps)
      .build();

    const end_date = moment();
    const duration = moment.duration(end_date.diff(start_date));
    console.log(`${caps.name} : Setup Time: ${duration.asSeconds()} seconds`);

    const url = "https://www.lambdatest.com/enterprise";
    console.log(url);
    await driver.get(url);

    console.log("taking screenshot ...");
    setTimeout(() => {
      driver.executeScript(`smartui.takeScreenshot=S-1`).then(() => {
        sleep(4000);
        driver.executeScript(`smartui.fetchScreenshotStatus=S-1`).then(out => {
          console.log("response:", out);
        }).catch(err => {
          console.error("Error fetching screenshot status:", err);
        });
      }).catch(err => {
        console.error("Error taking screenshot:", err);
      });
    }, waitTime * 1000);

    driver.getTitle().then(function (title) {
      console.log("Title:", title);
      setTimeout(function () {
        driver.executeScript("lambda-status=passed").then(() => {
          driver.quit();
        }).catch(err => {
          console.error("Error setting lambda status to passed:", err);
          driver.quit();
        });
      }, 15000);
    }).catch(err => {
      console.error("Error getting title:", err);
      driver.executeScript("lambda-status=failed").then(() => {
        driver.quit();
      }).catch(scriptError => {
        console.error("Failed to set lambda status:", scriptError);
        driver.quit();
      });
    });
  } catch (err) {
    console.error("Test failed with reason:", err);
    try {
      await driver.executeScript("lambda-status=failed");
    } catch (scriptError) {
      console.error("Failed to set lambda status:", scriptError);
    }
    await driver.quit();
  }
}

searchTextOnGoogle();
