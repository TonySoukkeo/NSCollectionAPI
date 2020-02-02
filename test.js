const { newReleases } = require("./util/scraper");

(async () => {
  const test = await newReleases();

  console.log(test);
})();
