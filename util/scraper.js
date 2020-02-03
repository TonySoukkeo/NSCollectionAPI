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

  let game;

  // Get gameId for newly released title
  if (type === "new release" || type === "dlc") {
    game = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(".game-list-results-container li a")
      ).map(games => {
        let price;

        const free =
          games.querySelector(".row-price strong") &&
          games.querySelector(".row-price strong").textContent === "Free";

        if (free) {
          price = 0;
        } else {
          price =
            (games.querySelector(".row-price .strike") &&
              parseFloat(
                games
                  .querySelector(".row-price .strike")
                  .textContent.split("$")[1]
              )) ||
            parseFloat(
              games.querySelector(".row-price strong").textContent.split("$")[1]
            );
        }

        return {
          title: games
            .querySelector("h3")
            .textContent.replace(
              /(™|®|©|&trade;|&reg;|&copy;|&#8482;|&#174;|&#169;)/g,
              ""
            ),
          price,
          url: games.href
        };
      });
    });
  } else if (type === "coming soon") {
    game = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(".game-list-results-container li a")
      ).map(games => ({
        title: games
          .querySelector("h3")
          .textContent.replace(
            /(™|®|©|&trade;|&reg;|&copy;|&#8482;|&#174;|&#169;)/g,
            ""
          ),
        url: games.href
      }));
    });
  } else if (type === "demo") {
    game = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(".game-list-results-container li a")
      ).map(games => {
        let price;

        const free =
          games.querySelector(".row-price strong") &&
          games.querySelector(".row-price strong").textContent === "Free";

        if (free) {
          price = 0;
        } else {
          price =
            (games.querySelector(".row-price .strike") &&
              parseFloat(
                games
                  .querySelector(".row-price .strike")
                  .textContent.split("$")[1]
              )) ||
            parseFloat(
              games.querySelector(".row-price strong").textContent.split("$")[1]
            );
        }

        return {
          title: games
            .querySelector("h3")
            .textContent.replace(
              /(™|®|©|&trade;|&reg;|&copy;|&#8482;|&#174;|&#169;)/g,
              ""
            ),
          price,
          url: games.href
        };
      });
    });
  } else if (type === "sale") {
    game = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(".game-list-results-container li a")
      ).map(games => ({
        title: games
          .querySelector("h3")
          .textContent.replace(
            /(™|®|©|&trade;|&reg;|&copy;|&#8482;|&#174;|&#169;)/g,
            ""
          ),
        url: games.href,
        salePrice: parseFloat(
          games
            .querySelector(".row-price .sale-price")
            .textContent.split("$")[1]
        )
      }));
    });
  }

  await browser.close();

  return game;
};

/***********************
 GET GAME DETAILS BY URL
 ***********************/
module.exports.getGameDetails = async (url, type) => {
  const browser = await puppeteer.launch({ headless: true });

  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on("request", req => {
    if (
      req.resourceType() == "stylesheet" ||
      req.resourceType() == "font" ||
      req.resourceType() === "image" ||
      req.resourceType() === "script"
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

  await page.waitFor(5000);

  // Evaluate html page
  const gameDetails = await page.evaluate(async () => {
    // Values from webpage
    const image =
      (document.querySelector(".boxart img") &&
        document.querySelector(".boxart img").src) ||
      "NA";

    let demo = false;

    if (document.querySelector("#purchase-options #demo-download")) demo = true;

    const description =
      (document.querySelectorAll(".bullet-list p") &&
        Array.from(document.querySelectorAll(".bullet-list p"))
          .map(desc => desc.textContent)
          .join("\n\n")) ||
      "NA";

    const rating =
      (document.querySelector(".title .esrb-rating .esrb-icon") &&
        document.querySelector(".title .esrb-rating .esrb-icon").src) ||
      "NA";

    const publisher =
      (document.querySelector(".column2 .publisher dd") &&
        document.querySelector(".column2 .publisher dd").textContent.trim()) ||
      "NA";

    const numOfPlayers =
      (document.querySelector(".game-information .players dd") &&
        document
          .querySelector(".game-information .players dd")
          .textContent.trim()) ||
      "NA";

    let fileSize =
      (document.querySelector(".game-information .file-size dd") &&
        document
          .querySelector(".game-information .file-size dd")
          .textContent.trim()) ||
      "NA";

    const category =
      (document.querySelector(".game-information .category dd") &&
        document
          .querySelector(".game-information .category dd")
          .textContent.replace(/(\r\n|\n|\r)/gm, "")
          .replace(/ +/g, " ")
          .trim()) ||
      "NA";

    const gallery =
      (document.querySelectorAll(
        ".media .carousel-viewport .items .item:not(.video) img"
      ) &&
        Array.from(
          document.querySelectorAll(
            ".media .carousel-viewport .items .item:not(.video) img"
          )
        ).map(img => `https://www.nintendo.com${img.dataset.src}`)) ||
      [];

    const dlc = Array.from(
      document.querySelectorAll(".dlc-purchase.wrapper")
    ).map(dlc => ({
      header: dlc.querySelector("h2").textContent,
      content: Array.from(dlc.querySelectorAll(".item")).map(item => ({
        image: item.querySelector("img").src,
        title: item.querySelector(".dlc-info .title").textContent,
        releaseDate: item.querySelector(".dlc-info .release-date").textContent,
        price: parseFloat(
          item.querySelector(".price .msrp").textContent.split("$")[1]
        ),
        salePrice:
          (item
            .querySelector(".price .sale-price price")
            .textContent.split("$")[1] &&
            parseFloat(
              item
                .querySelector("price .sale-price price")
                .textContent.split("$")[1].textContent
            )) ||
          "NA",
        description: Array.from(item.querySelectorAll(".description"))
          .map(desc => desc.textContent)
          .join("\n\n")
      }))
    }));

    let onlinePlay = false;
    let cloudSave = false;

    if (document.querySelector(".nso-support .feature img")) {
      Array.from(document.querySelectorAll(".nso-support .feature img")).map(
        features => {
          if (features.alt === "Online Play") onlinePlay = true;
          else if (features.alt === "Save Data Cloud") cloudSave = true;
        }
      );
    }

    return {
      category,
      demo,
      gallery,
      image,
      description,
      rating,
      publisher,
      numOfPlayers,
      fileSize,
      onlinePlay,
      dlc,
      cloudSave
    };
  });

  // Get release date for game
  let releaseDate;
  let price;

  if (type === "coming soon") {
    releaseDate = await page.$eval(
      ".game-information .release-date dd",
      date => date.textContent
    );
  } else {
    releaseDate = await page.$eval(".game-information .release-date dd", date =>
      Date(date.textContent)
    );
  }

  if (type) {
    const gameRelease = await page.$eval(".release-tab", text =>
      text.textContent.trim()
    );

    if (gameRelease !== "Available Now" || type === "sale") {
      price = await page.evaluate(() => {
        const msrp = document.querySelector(".price .msrp");

        if (!msrp) return;
        else if (msrp.textContent === "Free") return 0;
        else if (msrp.textContent.trim().length !== 0) {
          return parseFloat(msrp.textContent.split("$")[1]);
        }
      });
    } else {
      price = await page.evaluate(() => {
        const msrp = document.querySelector(".price .msrp");

        if (msrp) {
          return parseFloat(msrp.textContent.split("$")[1]);
        } else if (isNaN(msrp)) {
          return 0;
        }
        return;
      });
    }

    gameDetails.price = price;

    // Set sale price if one exists
    if (type !== "sale") {
      const salePrice = await page.evaluate(() => {
        const onSale = document.querySelector(".price .sale-price");

        if (onSale) {
          parseFloat(onSale.textContent.split("$")[1]);
        }
      });

      if (salePrice) gameDetails.salePrice = salePrice;
    }

    if (type == "fill in") {
      const title = await page.evaluate(() => {
        const title = document
          .querySelector(".title h1")
          .textContent.replace(
            /(™|®|©|&trade;|&reg;|&copy;|&#8482;|&#174;|&#169;)/g,
            ""
          );

        return title;
      });
      gameDetails.title = title;
    }
  }

  // Assign release date to gameDetails
  gameDetails.releaseDate = releaseDate;

  await browser.close();

  return gameDetails;
};

/**************************************
 GET GAME DETAILS BY SEARCH FROM TITLE
 **************************************/
// module.exports.searchGame = async title => {
//   const browser = await puppeteer.launch({ headless: true });

//   const page = await browser.newPage();

//   await page.setRequestInterception(true);

//   page.on("request", req => {
//     if (
//       req.resourceType() == "stylesheet" ||
//       req.resourceType() == "font" ||
//       req.resourceType() === "image"
//     ) {
//       req.abort();
//     } else {
//       req.continue();
//     }
//   });

//   await page.goto("https://www.nintendo.com/", {
//     timeout: 0,
//     waitUntil: "load"
//   });

//   await page.$eval(".btn-search-nintendo", btn => btn.click());
//   await page.type(".input-flex input", title);
//   await page.waitFor(5000);

//   const resultTitle =
//     (await page.$eval(".details", el => el)) &&
//     (await page.$eval(".details .title", el => el.textContent));

//   if (title.toLowerCase().trim() !== resultTitle.toLowerCase()) {
//     await browser.close();
//     console.log({ message: "No Match", title: title.trim() });
//     return;
//   }

//   await page.$eval(".game-results li:first-child a", link => link.click());

//   await page.waitFor(10000);

//   const gameDetails = await page.evaluate(() => {
//     // Check to see if game is released yet
//     const release = document
//       .querySelector(".details .release-tab")
//       .textContent.trim();

//     try {
//       // Values from webpage
//       const image =
//         (document.querySelector(".boxart img") &&
//           document.querySelector(".boxart img").src) ||
//         "NA";

//       const description =
//         (document.querySelectorAll(".bullet-list p") &&
//           Array.from(document.querySelectorAll(".bullet-list p"))
//             .map(desc => desc.textContent)
//             .join("\n\n")) ||
//         "NA";

//       const rating =
//         (document.querySelector(".title .esrb-rating .esrb-icon") &&
//           document.querySelector(".title .esrb-rating .esrb-icon").src) ||
//         "NA";

//       const publisher =
//         (document.querySelector(".column2 .publisher dd") &&
//           document
//             .querySelector(".column2 .publisher dd")
//             .textContent.trim()) ||
//         "NA";

//       let releaseDate;

//       if (release !== "Available Now") {
//         releaseDate = document.querySelector(".release-date dd").textContent;
//       } else {
//         releaseDate =
//           (document.querySelector(".game-information .release-date dd") &&
//             new Date(
//               document.querySelector(
//                 ".game-information .release-date dd"
//               ).textContent
//             )) ||
//           "NA";
//       }

//       const numOfPlayers =
//         (document.querySelector(".game-information .players dd") &&
//           document
//             .querySelector(".game-information .players dd")
//             .textContent.trim()) ||
//         "NA";

//       let fileSize =
//         (document.querySelector(".game-information .file-size dd") &&
//           document
//             .querySelector(".game-information .file-size dd")
//             .textContent.trim()) ||
//         "NA";

//       const category =
//         (document.querySelector(".game-information .category dd") &&
//           document
//             .querySelector(".game-information .category dd")
//             .textContent.replace(/(\r\n|\n|\r)/gm, "")
//             .replace(/ +/g, " ")
//             .trim()) ||
//         "NA";

//       let price;

//       price =
//         (document.querySelector(".price .msrp").textContent.trim().length !==
//           0 &&
//           parseFloat(
//             document.querySelector(".price .msrp").textContent.split("$")[1]
//           )) ||
//         null;

//       const gallery =
//         (document.querySelectorAll(
//           ".media .carousel-viewport .items .item:not(.video) img"
//         ) &&
//           Array.from(
//             document.querySelectorAll(
//               ".media .carousel-viewport .items .item:not(.video) img"
//             )
//           ).map(img => `https://www.nintendo.com${img.dataset.src}`)) ||
//         [];

//       return {
//         price,
//         category,
//         gallery,
//         image,
//         description,
//         rating,
//         publisher,
//         releaseDate,
//         numOfPlayers,
//         fileSize
//       };
//     } catch (err) {
//       console.log(err);
//     }
//   });

//   await browser.close();

//   return gameDetails;
// };
