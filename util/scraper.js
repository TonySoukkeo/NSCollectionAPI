const puppeteer = require("puppeteer");

/**********************************
 GET RELEASES FOR NS BASED ON TYPE
 **********************************/
module.exports.getGames = async type => {
  const browser = await puppeteer.launch({ headless: true });

  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on("request", req => {
    if (
      req.resourceType() == "stylesheet" ||
      req.resourceType() == "font" ||
      req.resourceType() === "image"
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });

  if (type === "new release") {
    await page.goto(
      "https://www.nintendo.com/games/game-guide/#filter/:q=&dFR[availability][0]=New%20releases&dFR[platform][0]=Nintendo%20Switch&indexName=noa_aem_game_en_us_release_des",
      {
        waitUntil: "load",
        timeout: 0
      }
    );
  } else if (type === "coming soon") {
    await page.goto(
      "https://www.nintendo.com/games/game-guide/#filter/:q=&dFR[availability][0]=Coming%20soon&dFR[platform][0]=Nintendo%20Switch&indexName=noa_aem_game_en_us_release_des",
      {
        waitUntil: "load",
        timeout: 0
      }
    );
  } else if (type === "demo") {
    await page.goto(
      "https://www.nintendo.com/games/game-guide/#filter/:q=&dFR[generalFilters][0]=Demo%20available&dFR[platform][0]=Nintendo%20Switch&indexName=noa_aem_game_en_us_release_des",
      {
        timeout: 0,
        waitUntil: "load"
      }
    );
  } else if (type === "dlc") {
    await page.goto(
      "https://www.nintendo.com/games/game-guide/#filter/:q=&dFR[generalFilters][0]=DLC%20available&dFR[platform][0]=Nintendo%20Switch&indexName=noa_aem_game_en_us_release_des",
      {
        timeout: 0,
        waitUntil: "load"
      }
    );
  } else if (type === "sale") {
    await page.goto(
      "https://www.nintendo.com/games/game-guide/#filter/:q=&dFR[generalFilters][0]=Deals&dFR[platform][0]=Nintendo%20Switch&indexName=noa_aem_game_en_us_release_des",
      {
        timeout: 0,
        waitUntil: "load"
      }
    );
  }

  const TOTAL_GAMES_ON_PAGE = 42;
  const totalGames = await page.$eval("#result-count", el =>
    parseInt(el.textContent.split(" ")[0])
  );

  let total = TOTAL_GAMES_ON_PAGE;

  while (true) {
    await page.waitFor(5000);

    await page.$eval(".pager #btn-load-more", btn => btn.click());
    total += 42;

    if (total >= totalGames) break;
  }

  await page.waitFor(2000);

  const game = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll(".game-list-results-container li a")
    ).map(games => {
      let price = null,
        salePrice = null;

      if (games.querySelector(".row-price").textContent.trim() === "free") {
        // Games that are free
        price = 0;
      } else if (
        games.querySelector(".sale-price") &&
        games.querySelector(".strike")
      ) {
        // Games that are on sale
        price = +games.querySelector(".strike").textContent.split("$")[1];
        salePrice = +games
          .querySelector(".sale-price")
          .textContent.split("$")[1];
      } else {
        // Games that aren't on sale, regulsr msrp
        price = +games
          .querySelector(".row-price")
          .textContent.trim()
          .split("$")[1];
      }

      return {
        image: games.querySelector(".boxart-container img").src,
        title: games
          .querySelector("h3")
          .textContent.replace(
            /(™|®|©|&trade;|&reg;|&copy;|&#8482;|&#174;|&#169;)/g,
            ""
          ),
        price,
        salePrice,
        url: games.href
      };
    });
  });

  await browser.close();

  return game;
};

/***********************
 GET GAME DETAILS BY URL
 ***********************/
module.exports.getGameDetails = async url => {
  const browser = await puppeteer.launch({ headless: true });

  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on("request", req => {
    if (
      req.resourceType() == "stylesheet" ||
      req.resourceType() == "font" ||
      req.resourceType() == "image"
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto(url, {
    timeout: 0,
    waitUntil: "load"
  });

  // Check if there is an age verification form
  try {
    await page.$eval("#age-verification-form", form => {
      // Fill out date inputs
      form.querySelector(".month").value = 10;
      form.querySelector(".day").value = 10;
      form.querySelector(".year").value = 1992;

      // Submit form
      form.querySelector(".btn.continue").click();
    });
  } catch (err) {
    // Continue to the rest of the code if there is no verification form
  }

  await page.waitFor(10000);

  try {
    await page.waitForSelector(
      ".game-info-item.release-date dd",
      date => date.textContent
    );
  } catch (err) {
    console.log(url);
  }

  try {
    // Evaluate html page
    const gameDetails = await page.evaluate(async () => {
      // Values from webpage
      let demo = false;

      if (document.querySelector("#demo-download")) demo = true;

      const description =
        (document.querySelectorAll(".bullet-list p") &&
          Array.from(document.querySelectorAll(".bullet-list p"))
            .map(desc => desc.textContent)
            .join("\n\n")) ||
        "NA";

      const rating =
        (document.querySelector(
          ".game-info-item.esrb-rating dd .esrb-content img"
        ) &&
          document.querySelector(
            ".game-info-item.esrb-rating dd .esrb-content img"
          ).src) ||
        "NA";

      const publisher =
        (document.querySelector(".game-info-item.publisher dd") &&
          document
            .querySelector(".game-info-item.publisher dd")
            .textContent.trim()) ||
        "NA";

      const numOfPlayers =
        (document.querySelector(".game-info-item.players dd") &&
          document
            .querySelector(".game-info-item.players dd")
            .textContent.trim()) ||
        "NA";

      const releaseDate =
        document.querySelector(".game-info-item.release-date dd") &&
        document.querySelector(".game-info-item.release-date dd").textContent;

      let fileSize =
        (document.querySelector(".game-info-item.file-size") &&
          document
            .querySelector(".game-info-item.file-size dd")
            .textContent.trim()) ||
        "NA";

      const category =
        (document.querySelector(".game-info-item + .genre") &&
          document
            .querySelector(".game-info-item + .genre dd")
            .textContent.replace(/(\r\n|\n|\r)/gm, "")
            .replace(/ +/g, " ")
            .trim()) ||
        "NA";

      const gallery =
        (document.querySelector("product-gallery") &&
          Array.from(document.querySelectorAll("product-gallery"))
            .map(item => {
              const image = item.shadowRoot;

              return Array.from(
                image.querySelectorAll("product-gallery-item[type=image]")
              ).map(img => `https://nintendo.com${img.src}`);
            })
            .flat()) ||
        [];

      const dlc =
        (document.querySelectorAll(".dlc-area.dlc-purchase") &&
          Array.from(document.querySelectorAll(".dlc-area.dlc-purchase")).map(
            item => ({
              header: item.querySelector(".dlc-tile-wrapper h2").textContent,
              content: Array.from(item.querySelectorAll("product-tile")).map(
                item => ({
                  title: item.querySelector(".title").textContent,
                  image: item.querySelector("img").src,
                  salePrice:
                    +item
                      .querySelector(".sale-price")
                      .textContent.split("$")[1] || null,
                  price: +item.querySelector(".msrp").textContent.split("$")[1],
                  description: item.querySelector(".description").textContent
                })
              )
            })
          )) ||
        [];

      let onlinePlay = false;
      let cloudSave = false;

      if (document.querySelector(".services-supported a")) {
        Array.from(document.querySelectorAll(".services-supported a")).map(
          features => {
            if (features.getAttribute("aria-label") === "online-play")
              onlinePlay = true;
            else if (features.getAttribute("aria-label") === "save-data-cloud")
              cloudSave = true;
          }
        );
      }

      return {
        category,
        demo,
        gallery,
        description,
        rating,
        publisher,
        numOfPlayers,
        fileSize,
        onlinePlay,
        dlc,
        releaseDate,
        cloudSave
      };
    });

    await browser.close();

    return gameDetails;
  } catch (err) {
    await browser.close();
    console.log(err);
    return;
  }
};

/**************************************
 GET GAME DETAILS BY SEARCH FROM TITLE
 **************************************/
module.exports.searchGame = async title => {
  try {
    const browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on("request", req => {
      if (
        req.resourceType() == "stylesheet" ||
        req.resourceType() == "font" ||
        req.resourceType() === "image"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto("https://www.nintendo.com/", {
      timeout: 0,
      waitUntil: "load"
    });

    await page.$eval(".btn-search-nintendo", btn => btn.click());
    await page.type(".input-flex input", title);

    await page.waitForSelector(".details");

    const resultTitle =
      (await page.$eval(".details", el => el)) &&
      (await page.$eval(".details .title", el => el.textContent));

    if (title.toLowerCase().trim() !== resultTitle.toLowerCase()) {
      await browser.close();
      console.log({ message: "No Match", title: title.trim() });
      return;
    }

    await page.$eval(".game-results li:first-child a", link => link.click());

    await page.waitForSelector(".game-information .release-date dd");

    const releaseDate = await page.$eval(
      ".game-information .release-date dd",
      date => date.textContent
    );

    await browser.close();

    return releaseDate;
  } catch (err) {
    if (err instanceof puppeteer.errors.TimeoutError) {
      console.log({ message: "No Match", title: title.trim() });
      return;
    }
  }

  // await page.waitFor(4000);

  // const gameDetails = await page.evaluate(() => {
  //   // Check to see if game is released yet
  //   const release = document
  //     .querySelector(".details .release-tab")
  //     .textContent.trim();

  //   try {
  //     // Values from webpage
  //     const image =
  //       (document.querySelector(".boxart img") &&
  //         document.querySelector(".boxart img").src) ||
  //       "NA";

  //     const description =
  //       (document.querySelectorAll(".bullet-list p") &&
  //         Array.from(document.querySelectorAll(".bullet-list p"))
  //           .map(desc => desc.textContent)
  //           .join("\n\n")) ||
  //       "NA";

  //     const rating =
  //       (document.querySelector(".title .esrb-rating .esrb-icon") &&
  //         document.querySelector(".title .esrb-rating .esrb-icon").src) ||
  //       "NA";

  //     const publisher =
  //       (document.querySelector(".column2 .publisher dd") &&
  //         document
  //           .querySelector(".column2 .publisher dd")
  //           .textContent.trim()) ||
  //       "NA";

  //     let releaseDate;

  //     if (release !== "Available Now") {
  //       releaseDate = document.querySelector(".release-date dd").textContent;
  //     } else {
  //       releaseDate =
  //         (document.querySelector(".game-information .release-date dd") &&
  //           new Date(
  //             document.querySelector(
  //               ".game-information .release-date dd"
  //             ).textContent
  //           )) ||
  //         "NA";
  //     }

  //     const numOfPlayers =
  //       (document.querySelector(".game-information .players dd") &&
  //         document
  //           .querySelector(".game-information .players dd")
  //           .textContent.trim()) ||
  //       "NA";

  //     let fileSize =
  //       (document.querySelector(".game-information .file-size dd") &&
  //         document
  //           .querySelector(".game-information .file-size dd")
  //           .textContent.trim()) ||
  //       "NA";

  //     const category =
  //       (document.querySelector(".game-information .category dd") &&
  //         document
  //           .querySelector(".game-information .category dd")
  //           .textContent.replace(/(\r\n|\n|\r)/gm, "")
  //           .replace(/ +/g, " ")
  //           .trim()) ||
  //       "NA";

  //     let price;

  //     price =
  //       (document.querySelector(".price .msrp").textContent.trim().length !==
  //         0 &&
  //         parseFloat(
  //           document.querySelector(".price .msrp").textContent.split("$")[1]
  //         )) ||
  //       null;

  //     const gallery =
  //       (document.querySelectorAll(
  //         ".media .carousel-viewport .items .item:not(.video) img"
  //       ) &&
  //         Array.from(
  //           document.querySelectorAll(
  //             ".media .carousel-viewport .items .item:not(.video) img"
  //           )
  //         ).map(img => `https://www.nintendo.com${img.dataset.src}`)) ||
  //       [];

  //     return {
  //       price,
  //       category,
  //       gallery,
  //       image,
  //       description,
  //       rating,
  //       publisher,
  //       releaseDate,
  //       numOfPlayers,
  //       fileSize
  //     };
  //   } catch (err) {
  //     console.log(err);
  //   }
  // });

  // return gameDetails;
};
