const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const sgTransport = require("nodemailer-sendgrid-transport");
const fs = require("fs");

// Sendgrid configuration
const options = {
  auth: {
    api_user: process.env.SENDGRID_USER,
    api_key: process.env.SENDGRID_KEY
  }
};

const client = nodemailer.createTransport(sgTransport(options));

dotenv.config();

// Models
const newReleasesDb = require("../models/newReleases");
const GamesDb = require("../models/games");
const ComingSoonDb = require("../models/comingSoon");
const DlcDb = require("../models/dlc");
const SaleDb = require("../models/saleGames");
const User = require("../models/user");

// Utilities
const { getGames, getGameDetails, searchGame } = require("../util/scraper");

module.exports.fixDlc = async (req, res, next) => {
  const brokenGameList = [
    {
      title: "Ninja Striker!",
      url: "https://www.nintendo.com/games/detail/ninja-striker-switch/"
    },
    {
      title: "NORTH",
      url: "https://www.nintendo.com/games/detail/north-switch/"
    },
    {
      title: "NO THING",
      url: "https://www.nintendo.com/games/detail/no-thing-switch/"
    },
    {
      title: "Odallus: The Dark Call",
      url: "https://www.nintendo.com/games/detail/odallus-the-dark-call-switch/"
    },
    {
      title: "OF MICE AND SAND -REVISED-",
      url: ""
    },
    {
      title: "OK K.O.! Let's Play Heroes",
      url:
        "https://www.nintendo.com/games/detail/ok-k-o-lets-play-heroes-switch/"
    },
    {
      title: "One More Dungeon",
      url: "https://www.nintendo.com/games/detail/one-more-dungeon-switch/"
    },
    {
      title: "One Strike",
      url: "https://www.nintendo.com/games/detail/one-strike-switch/"
    },
    {
      title: "Oniken: Unstoppable Edition",
      url:
        "https://www.nintendo.com/games/detail/oniken-unstoppable-edition-odallus-the-dark-call-bundle-switch/"
    },
    {
      title: "Overland",
      url: "https://www.nintendo.com/games/detail/overland-switch/"
    },
    {
      title: "OUT OF THE BOX",
      url: "https://www.nintendo.com/games/detail/out-of-the-box-switch/"
    },
    {
      title: "Out There: Ω The Alliance",
      url:
        "https://www.nintendo.com/games/detail/out-there-omega-the-alliance-switch/"
    },
    {
      title: "Paladins",
      url: "https://www.nintendo.com/games/detail/paladins-switch/"
    },
    {
      title: "Phantom Doctrine",
      url: "https://www.nintendo.com/games/detail/phantom-doctrine-switch/"
    },
    {
      title: "PICROSS S",
      url: "https://www.nintendo.com/games/detail/picross-s-switch/"
    },
    {
      title: "Piczle Lines DX",
      url: "https://www.nintendo.com/games/detail/piczle-lines-dx-switch/"
    },
    {
      title: "Pillar",
      url: "https://www.nintendo.com/games/detail/pillar-switch/"
    },
    {
      title: "The Pinball Arcade",
      url: "https://www.nintendo.com/games/detail/the-pinball-arcade-switch/"
    },
    {
      title: "Please, Don't Touch Anything",
      url:
        "https://www.nintendo.com/games/detail/please-dont-touch-anything-switch/"
    },
    {
      title: "Pode",
      url: "https://www.nintendo.com/games/detail/pode-switch/"
    },
    {
      title: "Pool BILLIARD",
      url: "https://www.nintendo.com/games/detail/pool-billiard-switch/"
    },
    {
      title: "RAD",
      url: "https://www.nintendo.com/games/detail/rad-switch/"
    },
    {
      title: "Resident Evil",
      url: "https://www.nintendo.com/games/detail/resident-evil-switch/"
    },
    {
      title: "Risk of Rain",
      url: "https://www.nintendo.com/games/detail/risk-of-rain-switch/"
    },
    {
      title: "Rocket League",
      url: "https://www.nintendo.com/games/detail/rocket-league-switch/"
    },
    {
      title: "Rolling Sky",
      url: "https://www.nintendo.com/games/detail/rolling-sky-switch/"
    },
    {
      title: "The Room",
      url: "https://www.nintendo.com/games/detail/the-room-switch/"
    },
    {
      title: "Saboteur!",
      url: "https://www.nintendo.com/games/detail/saboteur-switch/"
    },
    {
      title: "SaGa SCARLET GRACE: AMBITIONS",
      url:
        "https://www.nintendo.com/games/detail/saga-scarlet-grace-ambitions-switch/"
    },
    {
      title: "Sea King",
      url: "https://www.nintendo.com/games/detail/sea-king-switch/"
    },
    {
      title: "Season Match",
      url: "https://www.nintendo.com/games/detail/season-match-switch/"
    },
    {
      title: "SEGA AGES Puyo Puyo",
      url: "https://www.nintendo.com/games/detail/sega-ages-puyo-puyo-switch/"
    },
    {
      title: "Shantae: Half-Genie Hero",
      url:
        "https://www.nintendo.com/games/detail/shantae-half-genie-hero-switch/"
    },
    {
      title: "Shio",
      url: "https://www.nintendo.com/games/detail/shio-switch/"
    },
    {
      title: "Shred! 2 - Freeride Mountainbiking",
      url:
        "https://www.nintendo.com/games/detail/shred-2-ft-sam-pilgrim-switch/"
    },
    {
      title: "Silk",
      url: "https://www.nintendo.com/games/detail/silk-switch/"
    },
    {
      title: "Sky Gamblers: Storm Raiders",
      url:
        "https://www.nintendo.com/games/detail/sky-gamblers-storm-raiders-switch/"
    },
    {
      title: "SOL DIVIDE -SWORD OF DARKNESS- for Nintendo Switch",
      url:
        "https://www.nintendo.com/games/detail/sol-divide-sword-of-darkness-for-nintendo-switch/"
    },
    {
      title: "Solitaire",
      url: "https://www.nintendo.com/games/detail/solitaire-switch/"
    },
    {
      title: "Son of a Witch",
      url: "https://www.nintendo.com/games/detail/son-of-a-witch-switch/"
    },
    {
      title: "Sparkle 2",
      url: "https://www.nintendo.com/games/detail/sparkle-2-switch/"
    },
    {
      title: "Spartan",
      url: "https://www.nintendo.com/games/detail/spartan-switch/"
    },
    {
      title: "Spectrum",
      url: "https://www.nintendo.com/games/detail/spectrum-switch/"
    },
    {
      title: "SpellKeeper",
      url: ""
    },
    {
      title: "Spot The Difference",
      url: "https://www.nintendo.com/games/detail/spot-the-difference-switch/"
    },
    {
      title: "Startide",
      url: "https://www.nintendo.com/games/detail/startide-switch/"
    },
    {
      title: "STAR WARS Jedi Knight II: Jedi Outcast",
      url:
        "https://www.nintendo.com/games/detail/star-wars-jedi-knight-ii-jedi-outcast-switch/"
    },
    {
      title: "STAY",
      url: "https://www.nintendo.com/games/detail/stay-switch/"
    },
    {
      title: "SteamWorld Dig",
      url: "https://www.nintendo.com/games/detail/steamworld-dig-switch/"
    },
    {
      title: "Steven Universe: Save the Light",
      url:
        "https://www.nintendo.com/games/detail/steven-universe-save-the-light-switch/"
    },
    {
      title: "Storm Boy",
      url: "https://www.nintendo.com/games/detail/storm-boy-switch/"
    },
    {
      title: "STRIKERS1945 for Nintendo Switch",
      url:
        "https://www.nintendo.com/games/detail/strikers1945-for-nintendo-switch/"
    },
    {
      title: "STUMP",
      url: ""
    },
    {
      title: "Sudoku Relax",
      url: "https://www.nintendo.com/games/detail/sudoku-relax-switch/"
    },
    {
      title: "Suicide Guy",
      url: "https://www.nintendo.com/games/detail/suicide-guy-switch/"
    },
    {
      title: "Super Kirby Clash",
      url: "https://www.nintendo.com/games/detail/super-kirby-clash-switch/"
    },
    {
      title: "Super Meat Boy",
      url: "https://www.nintendo.com/games/detail/super-meat-boy-switch/"
    },
    {
      title: "Super One More Jump",
      url: "https://www.nintendo.com/games/detail/super-one-more-jump-switch/"
    },
    {
      title: "Swap This!",
      url: "https://www.nintendo.com/games/detail/swap-this-switch/"
    },
    {
      title: "SYMMETRY",
      url: ""
    },
    {
      title: "Tactical Mind",
      url: "https://www.nintendo.com/games/detail/tactical-mind-switch/"
    },
    {
      title: "Tennis",
      url: "https://www.nintendo.com/games/detail/tennis-switch/"
    },
    {
      title: "Tennis in the Face",
      url: "https://www.nintendo.com/games/detail/tennis-in-the-face-switch/"
    },
    {
      title: "Tetris 99",
      url: "https://www.nintendo.com/games/detail/tetris-99-switch/"
    },
    {
      title: "Them Bombs!",
      url: "https://www.nintendo.com/games/detail/them-bombs-switch/"
    },
    {
      title: "TINY METAL",
      url: "https://www.nintendo.com/games/detail/tiny-metal-switch/"
    },
    {
      title: "Toki Tori",
      url: "https://www.nintendo.com/games/detail/toki-tori-switch/"
    },
    {
      title: "TorqueL -Physics Modified Edition-",
      url:
        "https://www.nintendo.com/games/detail/torquel-physics-modified-edition-switch/"
    },
    {
      title: "TOUHOU SKY ARENA -MATSURI-CLIMAX",
      url:
        "https://www.nintendo.com/games/detail/touhou-sky-arena-matsuri-climax-switch/"
    },
    {
      title: "Tower Of Babel",
      url: "https://www.nintendo.com/games/detail/tower-of-babel-switch/"
    },
    {
      title: "Thea: The Awakening",
      url: "https://www.nintendo.com/games/detail/thea-the-awakening-switch/"
    },
    {
      title: "Trials Rising Open Beta",
      url:
        "https://www.nintendo.com/games/detail/trials-rising-standard-edition-switch/"
    },
    {
      title: "Turok",
      url: "https://www.nintendo.com/games/detail/turok-switch/"
    },
    {
      title: "Ultrawings",
      url: "https://www.nintendo.com/games/detail/ultrawings-flat-switch/"
    },
    {
      title: "UNI",
      url: "https://www.nintendo.com/games/detail/uni-switch/"
    },
    {
      title: "UNO for Nintendo Switch",
      url: "https://www.nintendo.com/games/detail/uno-for-nintendo-switch/"
    },
    {
      title: "V.O.I.D.",
      url: "https://www.nintendo.com/games/detail/v-o-i-d-switch/"
    },
    {
      title: "Warframe",
      url: "https://www.nintendo.com/games/detail/warframe-switch/"
    },
    {
      title: "Warhammer Quest",
      url: "https://www.nintendo.com/games/detail/warhammer-quest-switch/"
    },
    {
      title: "Where Are My Friends?",
      url: "https://www.nintendo.com/games/detail/where-are-my-friends-switch/"
    },
    {
      title: "Witch & Hero",
      url: "https://www.nintendo.com/games/detail/witch-and-hero-2-switch/"
    },
    {
      title: "Word Mesh",
      url: "https://www.nintendo.com/games/detail/word-mesh-switch/"
    },
    {
      title: "World of Goo",
      url: "https://www.nintendo.com/games/detail/world-of-goo-switch/"
    },
    {
      title: "Yooka-Laylee",
      url: "https://www.nintendo.com/games/detail/yooka-laylee-switch/"
    },
    {
      title: "Your Toy",
      url: "https://www.nintendo.com/games/detail/your-toy-switch/"
    },
    {
      title: "YouTube",
      url: "https://www.nintendo.com/games/detail/youtube-switch/"
    },
    {
      title: "YUMENIKKI -DREAM DIARY-",
      url: "https://www.nintendo.com/games/detail/yumenikki-dream-diary-switch/"
    },
    {
      title: "ZOMB",
      url: "https://www.nintendo.com/games/detail/zomb-switch/"
    },
    {
      title: "Arcade Archives DONKEY KONG",
      url:
        "https://www.nintendo.com/games/detail/arcade-archives-donkey-kong-switch/"
    },
    {
      title: "Arcade Archives DOUBLE DRAGON",
      url:
        "https://www.nintendo.com/games/detail/arcade-archives-double-dragon-switch/"
    },
    {
      title: "Arcade Archives Mario Bros.",
      url:
        "https://www.nintendo.com/games/detail/arcade-archives-mario-bros-switch/"
    },
    {
      title: "Arcade Archives WILD WESTERN",
      url:
        "https://www.nintendo.com/games/detail/arcade-archives-wild-western-switch/"
    },
    {
      title: "ACA NEOGEO ART OF FIGHTING",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-art-of-fighting-switch/"
    },
    {
      title: "Arcade Archives ELEVATOR ACTION",
      url: ""
    },
    {
      title: "ACA NEOGEO FATAL FURY 2",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-fatal-fury-2-switch/"
    },
    {
      title: "ACA NEOGEO FATAL FURY SPECIAL",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-fatal-fury-special-switch/"
    },
    {
      title: "ACA NEOGEO KING OF THE MONSTERS",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-king-of-the-monsters-switch/"
    },
    {
      title: "ACA NEOGEO THE LAST BLADE",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-the-last-blade-switch/"
    },
    {
      title: "ACA NEOGEO MAGICAL DROP II",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-magical-drop-2-switch/"
    },
    {
      title: "ACA NEOGEO METAL SLUG",
      url: "https://www.nintendo.com/games/detail/aca-neogeo-metal-slug-switch/"
    },
    {
      title: "ACA NEOGEO OVER TOP",
      url: "https://www.nintendo.com/games/detail/aca-neogeo-over-top-switch/"
    },
    {
      title: "ACA NEOGEO PUZZLE BOBBLE",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-puzzle-bobble-switch/"
    },
    {
      title: "ACA NEOGEO REAL BOUT FATAL FURY",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-real-bout-fatal-fury-switch/"
    },
    {
      title: "ACA NEOGEO SAMURAI SHODOWN",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-samurai-showdown-switch/"
    },
    {
      title: "ACA NEOGEO SAMURAI SHODOWN II",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-samurai-shodown-2-switch/"
    },
    {
      title: "ACA NEOGEO SAMURAI SHODOWN V",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-samurai-shodown-v-switch/"
    },
    {
      title: "ACA NEOGEO SENGOKU",
      url: "https://www.nintendo.com/games/detail/aca-neogeo-sengoku-switch/"
    },
    {
      title: "ACA NEOGEO SHOCK TROOPERS",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-shock-troopers-switch/"
    },
    {
      title: "ACA NEOGEO STAKES WINNER",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-stakes-winner-switch/"
    },
    {
      title: "ACA NEOGEO SUPER SIDEKICKS",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-super-sidekicks-switch/"
    },
    {
      title: "ACA NEOGEO WORLD HEROES",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-world-heroes-switch/"
    },
    {
      title: "ACA NEOGEO WORLD HEROES 2",
      url:
        "https://www.nintendo.com/games/detail/aca-neogeo-world-heroes-2-switch/"
    },
    {
      title: "Trials of Mana",
      url: "https://www.nintendo.com/games/detail/trials-of-mana-switch/"
    },
    {
      title: "Railway Empire - Nintendo Switch Edition",
      url:
        "https://www.nintendo.com/games/detail/railway-empire-nintendo-switch-edition-switch/"
    },
    {
      title: "The Dark Crystal: Age of Resistance-Tactics",
      url:
        "https://www.nintendo.com/games/detail/the-dark-crystal-age-of-resistance-tactics-switch/"
    },
    {
      title: "Just Dance 2020",
      url: "https://www.nintendo.com/games/detail/just-dance-2020-switch/"
    },
    {
      title: "KILL la KILL -IF",
      url: "https://www.nintendo.com/games/detail/kill-la-kill-if-switch/"
    },
    {
      title: "Mega Man 11",
      url: "https://www.nintendo.com/games/detail/mega-man-11-switch/"
    },
    {
      title: "Mega Man 11 - amiibo Edition",
      url:
        "https://www.nintendo.com/games/detail/mega-man-11-amiibo-edition-switch/"
    },
    {
      title: "Octopath Traveler Wayfarer's Edition",
      url:
        "https://www.nintendo.com/games/detail/octopath-traveler-wayfarers-edition-switch/"
    },
    {
      title: "Octopath Traveler",
      url: "https://www.nintendo.com/games/detail/octopath-traveler-switch/"
    },
    {
      title: "Dragon Quest Builders",
      url: "https://www.nintendo.com/games/detail/dragon-quest-builders-switch/"
    },
    {
      title: "Rayman Legends Definitive Edition",
      url:
        "https://www.nintendo.com/games/detail/rayman-legends-definitive-edition-switch/"
    },
    {
      title: "I and Me",
      url: "https://www.nintendo.com/games/detail/i-and-me-switch/"
    },
    {
      title: "Snipperclips - Cut it out, together!",
      url: "https://www.nintendo.com/games/detail/snipperclips-plus-switch/"
    },
    {
      title: "PRINCESS MAKER -FAERY TALES COME TRUE-",
      url:
        "https://www.nintendo.com/games/detail/princess-maker-faery-tales-come-true-switch/"
    },
    {
      title: "Assassin’s Creed: The Rebel Collection",
      url:
        "https://www.nintendo.com/games/detail/assassins-creed-the-rebel-collection-switch/"
    },
    {
      title: "FoxyLand",
      url: "https://www.nintendo.com/games/detail/foxyland-switch/"
    },
    {
      title: "Five Nights at Freddy's",
      url:
        "https://www.nintendo.com/games/detail/five-nights-at-freddys-switch/"
    },
    {
      title: "Zumba Burn It Up!",
      url: "https://www.nintendo.com/games/detail/zumba-burn-it-up-switch/"
    },
    {
      title: "Pokémon Sword",
      url: "https://www.nintendo.com/games/detail/pokemon-sword-switch/"
    },
    {
      title: "Into the Dead 2",
      url: "https://www.nintendo.com/games/detail/into-the-dead-2-switch/"
    },
    {
      title: "Cat Quest II",
      url: "https://www.nintendo.com/games/detail/cat-quest-ii-switch/"
    },
    {
      title: "The Park",
      url: "https://www.nintendo.com/games/detail/the-park-switch/"
    },
    {
      title: "Overwatch: Legendary Edition",
      url:
        "https://www.nintendo.com/games/detail/overwatch-legendary-edition-switch/"
    },
    {
      title: "Reventure",
      url: "https://www.nintendo.com/games/detail/reventure-switch/"
    },
    {
      title: "EA SPORTS FIFA 20 Nintendo Switch Legacy Edition",
      url:
        "https://www.nintendo.com/games/detail/ea-sports-fifa-20-nintendo-switch-legacy-edition/"
    },
    {
      title: "LEGO Jurassic World",
      url: "https://www.nintendo.com/games/detail/lego-jurassic-world-switch/"
    },
    {
      title: "CHOP",
      url: "https://www.nintendo.com/games/detail/chop-switch/"
    },
    {
      title: "Munchkin: Quacked Quest",
      url: "https://www.nintendo.com/games/detail/munchkin-switch/"
    },
    {
      title: "Pokémon Sword and Pokémon Shield Double Pack",
      url:
        "https://www.nintendo.com/games/detail/pokemon-sword-and-pokemon-shield-double-pack-switch/"
    },
    {
      title: "Minefield",
      url: "https://www.nintendo.com/games/detail/minefield-switch/"
    },
    {
      title: "The Legend of Zelda: Link’s Awakening",
      url:
        "https://www.nintendo.com/games/detail/the-legend-of-zelda-links-awakening-switch/"
    },
    {
      title: "Super Nintendo Entertainment System - Nintendo Switch Online",
      url:
        "https://www.nintendo.com/games/detail/super-nintendo-entertainment-system-nintendo-switch-online/"
    },
    {
      title: "Star-Crossed Myth - The Department of Wishes -",
      url:
        "https://www.nintendo.com/games/detail/star-crossed-myth-the-department-of-wishes-switch/"
    },
    {
      title: "Grand Brix Shooter",
      url: "https://www.nintendo.com/games/detail/grand-brix-shooter-switch/"
    },
    {
      title: "Eight-Minute Empire: Complete Edition",
      url: "https://www.nintendo.com/games/detail/eight-minute-empire-switch/"
    },
    {
      title: "Wolfenstein: Youngblood",
      url:
        "https://www.nintendo.com/games/detail/wolfenstein-youngblood-switch/"
    },
    {
      title: "Penguin Wars",
      url: "https://www.nintendo.com/games/detail/penguin-wars-switch/"
    },
    {
      title: "For The King",
      url: "https://www.nintendo.com/games/detail/for-the-king-switch/"
    },
    {
      title: "Cytus α",
      url: "https://www.nintendo.com/games/detail/cytus-a-switch/"
    },
    {
      title: "DARK SOULS: REMASTERED",
      url: "https://www.nintendo.com/games/detail/dark-souls-remastered-switch/"
    },
    {
      title: "Super Mario Party",
      url: "https://www.nintendo.com/games/detail/super-mario-party-switch/"
    },
    {
      title: "Nintendo Entertainment System - Nintendo Switch Online",
      url:
        "https://www.nintendo.com/games/detail/nintendo-entertainment-system-nintendo-switch-online/"
    },
    {
      title: "Xenoblade Chronicles 2",
      url:
        "https://www.nintendo.com/games/detail/xenoblade-chronicles-2-switch/"
    },
    {
      title: "Rocket League: Collector's Edition",
      url:
        "https://www.nintendo.com/games/detail/rocket-league-collectors-edition-switch/"
    },
    {
      title: "DOOM",
      url: "https://www.nintendo.com/games/detail/doom-switch/"
    },
    {
      title: "Super Mario Odyssey",
      url: "https://www.nintendo.com/games/detail/super-mario-odyssey-switch/"
    },
    {
      title: "NBA 2K18",
      url: "https://www.nintendo.com/games/detail/nba-2k18-switch/"
    },
    {
      title: "LEGO Worlds",
      url: "https://www.nintendo.com/games/detail/lego-worlds-switch/"
    },
    {
      title: "Mario + Rabbids Kingdom Battle",
      url:
        "https://www.nintendo.com/games/detail/mario-rabbids-kingdom-battle-switch/"
    },
    {
      title: "Splatoon 2",
      url: "https://www.nintendo.com/games/detail/splatoon-2-switch/"
    },
    {
      title: "The Legend of Zelda: Breath of the Wild",
      url:
        "https://www.nintendo.com/games/detail/the-legend-of-zelda-breath-of-the-wild-switch/"
    },
    {
      title: "LEGO The Incredibles",
      url: "https://www.nintendo.com/games/detail/lego-the-incredibles-switch/"
    },
    {
      title: "Harvest Moon: Light of Hope Special Edition",
      url:
        "https://www.nintendo.com/games/detail/harvest-moon-light-of-hope-special-edition-switch/"
    },
    {
      title: "Gal*Gun 2",
      url: "https://www.nintendo.com/games/detail/gal-gun-2-switch/"
    },
    {
      title: "Gear.Club Unlimited",
      url: "https://www.nintendo.com/games/detail/gear-club-unlimited-switch/"
    },
    {
      title: "The Elder Scrolls V: Skyrim",
      url:
        "https://www.nintendo.com/games/detail/the-elder-scrolls-v-skyrim-switch/"
    },
    {
      title: "LEGO Marvel Super Heroes 2",
      url:
        "https://www.nintendo.com/games/detail/lego-marvel-super-heroes-2-switch/"
    },
    {
      title: "Swords & Soldiers",
      url: "https://www.nintendo.com/games/detail/swords-and-soldiers-switch/"
    },
    {
      title: "Toki",
      url: "https://www.nintendo.com/games/detail/toki-switch/"
    },
    {
      title: "FLASHBACK",
      url: "https://www.nintendo.com/games/detail/flashback-switch/"
    },
    {
      title: "Syberia 2",
      url: "https://www.nintendo.com/games/detail/syberia-2-switch/"
    },
    {
      title: "Syberia",
      url: "https://www.nintendo.com/games/detail/syberia-switch/"
    },
    {
      title: "Cat Quest",
      url: "https://www.nintendo.com/games/detail/cat-quest-switch/"
    },
    {
      title: "Zero Zero Zero Zero",
      url: "https://www.nintendo.com/games/detail/zero-zero-zero-zero-switch/"
    },
    {
      title: "Velocity2X",
      url: "https://www.nintendo.com/games/detail/velocity2x-switch/"
    },
    {
      title: "Saints Row IV: Re-Elected",
      url:
        "https://www.nintendo.com/games/detail/saints-row-4-re-elected-switch/"
    },
    {
      title: "Tennis Go",
      url: "https://www.nintendo.com/games/detail/tennis-go-switch/"
    },
    {
      title: "Spyro Reignited Trilogy",
      url:
        "https://www.nintendo.com/games/detail/spyro-reignited-trilogy-switch/"
    },
    {
      title: "Valiant Hearts: The Great War",
      url:
        "https://www.nintendo.com/games/detail/valiant-hearts-the-great-war-switch/"
    },
    {
      title: "Mega Man Legacy Collection",
      url:
        "https://www.nintendo.com/games/detail/mega-man-legacy-collection-switch/"
    },
    {
      title: "Mega Man Legacy Collection 2",
      url:
        "https://www.nintendo.com/games/detail/mega-man-legacy-collection-2-switch/"
    },
    {
      title: "Fe",
      url: "https://www.nintendo.com/games/detail/fe-switch/"
    },
    {
      title: "LEGO NINJAGO Movie Video Game",
      url:
        "https://www.nintendo.com/games/detail/lego-ninjago-movie-video-game-switch/"
    },
    {
      title: "LEGO CITY Undercover",
      url: "https://www.nintendo.com/games/detail/lego-city-undercover-switch/"
    }
  ];

  for (let i = 0; i < brokenGameList.length; i++) {
    const game = brokenGameList[i];
    // Check if game has a url
    if (!game.url) continue;
    else {
      const releaseDate = await getGameDetails(game.url);
      // Update game release date from mongodb
      await GamesDb.updateOne(
        { title: game.title },
        { releaseDate: releaseDate.releaseDate }
      );
    }
  }
  console.log("Updated Release Date");
  res.status(200).json("Updated Release Date");
};

/****************
 GET GAME BY URL
 ****************/
// module.exports.getGameByUrl = async (req, res, next) => {
//   try {
// const gameDetails = await getGameDetails(
//   "https://www.nintendo.com/games/detail/the-binding-of-isaac-afterbirth-plus-switch/",
//   "fill in"
// );

// const game = new GamesDb(gameDetails);

// await game.save();

// current count = 850
//     const skip = 3;
//     const allGames = await GamesDb.find({}, "title releaseDate").skip(2398);

//     for (let i = 0; i < allGames.length; i++) {
//       const releaseDate = await searchGame(allGames[i].title);
//       const game = await GamesDb.findOne(
//         { title: allGames[i].title },
//         "title releaseDate"
//       );

//       if (releaseDate && game) {
//         // Titles matched
//         await game.updateOne({ $set: { releaseDate: releaseDate } });
//       } else {
//         // Titles did not match
//         let writeStream = fs.createWriteStream("gamesToBeFixed.txt", {
//           flags: "a"
//         });

//         writeStream.write(`${allGames[i].title}\r\n`);

//         writeStream.end();
//       }
//     }
//     console.log("updated");
//     res.status(200).json("updated");
//   } catch (err) {
//     next(err);
//   }
// };

/******************************
 CHECK FOR ANY DUPLICATE GAMES
 ******************************/
// module.exports.checkForDuplicates = async (req, res, next) => {
//   try {
//     const duplicates = await GamesDb.aggregate([
//       {
//         $group: {
//           _id: { title: "$title" },
//           uniqueIds: { $addToSet: "$_id" },
//           count: { $sum: 1 }
//         }
//       },
//       {
//         $match: {
//           count: { $gte: 2 }
//         }
//       }
//     ]);

//     res.status(200).json(duplicates);
//   } catch (err) {
//     next(err);
//   }
// };

/***************************
 GET GAMES THAT ARE ON SALE
 ***************************/
const getSaleGames = async () => {
  const saleGames = await getGames("sale");
  const saleGamesDb = await SaleDb.find({});

  // Check for games that are not on sale anymore
  const games = await GamesDb.find({ salePrice: { $exists: true } });

  for (let i = 0; i < games.length; i++) {
    const onSale = saleGames.some(obj => obj.title === games[i].title);

    if (!onSale) {
      // Remove salePrice off of game title
      await GamesDb.updateOne(
        { title: games[i].title },
        { $unset: { salePrice: "" } }
      );

      // Get all users with that has the not on sale game on their watchList and update sent to false
      await User.update(
        { "saleWatch.title": games[i].title, "watchList.notified": true },
        {
          $set: { "saleWatch.$.notified": false }
        },
        {
          multi: true
        }
      );
    }
  }

  if (
    saleGames.length !== saleGamesDb.length ||
    saleGames[0].title !== saleGamesDb[0].title
  ) {
    // Initially set saleGamesDb if it's empty
    if (saleGamesDb.length === 0) {
      await SaleDb.insertMany(saleGames, (err, docs) => {
        if (err) console.log(err);
        else console.log("Updated sale games DB");
      });
    }

    // Hash table with all users that needs notifications sent
    const userHash = {};

    // Loop through all games that are on sale and update the price for each title on GamesDb
    for (let i = 0; i < saleGames.length; i++) {
      const found = await GamesDb.findOne({ title: saleGames[i].title });

      // Get all users to send sale notifications out with any saleGames title that are on their salewatch
      const users = await User.find(
        {
          "saleWatch.title": saleGames[i].title,
          "saleWatch.notified": false
        },
        "title saleWatch email allowEmail"
      );

      if (users.length >= 1) {
        users.forEach(user => {
          const userId = user._id.toString();

          if (!userHash[userId]) {
            userHash[userId] = {
              email: user.email,
              allowEmail: user.allowEmail,
              games: [
                { title: saleGames[i].title, salePrice: saleGames[i].salePrice }
              ]
            };
          } else {
            userHash[userId].games.push({
              title: saleGames[i].title,
              salePrice: saleGames[i].salePrice
            });
          }
        });
      }

      let newGameEntry;

      // If sale game isn't found on GamesDb, create a new document for that game
      if (!found) {
        const gameDetails = await getGameDetails(saleGames[i].url);

        // Continue the loop if page is not found
        if (!gameDetails) continue;

        gameDetails.salePrice = saleGames[i].salePrice;
        gameDetails.title = saleGames[i].title;
        gameDetails.image = saleGames[i].image;
        gameDetails.price = saleGames[i].price;

        newGameEntry = new GamesDb(gameDetails);

        await newGameEntry.save();
      } else {
        // If game exists on both salegames and GamesDb, update its sale price
        await GamesDb.updateOne(
          { title: saleGames[i].title },
          { $set: { salePrice: saleGames[i].salePrice } },
          (err, doc) => {
            if (err) console.log(err);
          }
        );
      }
    }

    const userHashArr = Object.values(userHash);

    /*************************************
    SEND OUT EMAIL NOTIFICATIONS TO USERS
   *************************************/
    for (let i = 0; i < userHashArr.length; i++) {
      const user = userHashArr[i];
      const email = user.email;
      const gameAmount = user.games.length;

      if (user.allowEmail) {
        client.sendMail({
          to: email,
          from: process.env.SENDGRID_SENDER,
          subject: "Your games are on sale!",
          html: `
        <h1>You have ${gameAmount} ${
            gameAmount > 1 ? "games" : "game"
          } that are currently on sale!</h1>
        <p>
        <ul>
         ${user.games.map(
           game =>
             `<li>
             ${game.title} -- <em>${game.salePrice}</em>
           </li>`
         )}
        </ul>
        `
        });
      }

      // Loop through user.games array to send notifications out to user
      for (let j = 0; j < user.games.length; j++) {
        const title = user.games[j].title;

        // Send notification out to user
        const notifyUser = await User.findOne(
          { email },
          "notifications saleWatch"
        );

        const gameId = await GamesDb.findOne({ title }, "title");

        const notificationDetails = {
          message: `${gameId.title} is on sale!`,
          gameId: gameId._id,
          notifyType: "SALE"
        };

        const notificationCount = (notifyUser.notifications.count += 1);

        if (notifyUser && gameId) {
          // Push notificationsDetails to user's notifications
          await notifyUser.updateOne({
            $set: { "notifications.count": notificationCount },
            $push: { "notifications.messages": notificationDetails }
          });

          // Update notified to true for game on user's watchlist
          await User.findOneAndUpdate(
            { email, "saleWatch.title": title },
            {
              $set: { "saleWatch.$.notified": true }
            },
            { new: true }
          );
        }
      }
    }

    /**************************
     RESET / UPDATE SALEGAMESDB
     **************************/
    if (saleGamesDb.length !== 0) {
      await SaleDb.deleteMany({});
      await SaleDb.insertMany(saleGames, (err, docs) => {
        if (err) console.log(err);
        else console.log("Updated Sale Games Db");
      });
    }
  }

  console.log("Sale games updated");
};

/******************
 GET DLC FOR GAMES
 ******************/
const getDlc = async () => {
  try {
    const dlcGames = await getGames("dlc");

    const dlcDb = await DlcDb.find({});

    // Only Run if the length of each array is different or the first title of the array is different
    if (
      dlcGames.length !== dlcDb.length ||
      dlcGames[0].title !== dlcDb[0].title
    ) {
      for (let i = 0; i < dlcGames.length; i++) {
        const found = await GamesDb.findOne({ title: dlcGames[i].title });

        if (found && found.dlc.length !== 0) {
          continue;
        } else if (!found) {
          const gameDetails = await getGameDetails(dlcGames[i].url);

          if (!gameDetails) continue;

          const gameDb = new GamesDb(gameDetails);

          gameDb.title = dlcGames[i].title;
          gameDb.salePrice = dlcGames[i].salePrice;
          gameDb.price = dlcGames[i].price;
          gameDb.image = dlcGames[i].image;

          await gameDb.save();
        } else {
          const gameDetails = await getGameDetails(dlcGames[i].url);

          found.dlc = gameDetails.dlc;

          await found.save();
        }
      }

      // Reset dlc games in DlcDb
      await DlcDb.deleteMany({});

      await DlcDb.insertMany(dlcGames, (err, docs) => {
        if (err) {
          return console.log(err);
        } else {
          console.log("Dlc games updated");
        }
      });
    }

    console.log("dlc games updated");
  } catch (err) {
    throw err;
  }
};

/*********************
 GET COMING SOON GAMES
 *********************/
const getComingSoon = async () => {
  try {
    const comingSoonGames = await getGames("coming soon");

    const currentComingSoonDb = await ComingSoonDb.find({});

    if (
      // currentComingSoonDb.length === 0 ||
      // currentComingSoonDb[0].title !== comingSoonGames[0].title ||
      // currentComingSoonDb.length !== comingSoonGames.length
      true
    ) {
      for (let i = 0; i < comingSoonGames.length; i++) {
        const title = comingSoonGames[i].title;
        // Check if game isn't already in main database
        const found = await GamesDb.findOne({
          title
        });

        if (!found) {
          const gameDetails = await getGameDetails(comingSoonGames[i].url);

          if (!gameDetails) continue;

          const gamesDb = new GamesDb(gameDetails);
          gamesDb.title = title;
          gamesDb.price = comingSoonGames[i].price;
          gamesDb.salePrice = comingSoonGames[i].salePrice;
          gamesDb.image = comingSoonGames[i].image;

          await gamesDb.save();
        }
      }

      // Reset coming soon db
      // Delete all documents from new games collection
      await ComingSoonDb.deleteMany({});

      // Insert new array of new games to collection
      await ComingSoonDb.insertMany(comingSoonGames, (err, docs) => {
        if (err) {
          return console.log(err);
        } else {
          console.log("Sucessfully updated");
        }
      });
    }
  } catch (err) {
    throw err;
  }
};

/*********************
 GET GAMES WITH DEMOS
 *********************/
const getGamesWithDemos = async () => {
  try {
    const gameDemos = await getGames("demo");

    const demoDb = await GamesDb.find({ demo: true });

    if (gameDemos.length !== demoDb.length) {
      for (let i = 0; i < gameDemos.length; i++) {
        const found = await GamesDb.findOne({
          title: gameDemos[i].title
        });

        if (!found) {
          const gameDetails = await getGameDetails(gameDemos[i].url, "demo");

          if (!gameDetails) continue;

          gameDetails.title = gameDemos[i].title;
          gameDetails.price = gameDemos[i].price;
          gameDetails.salePrice = gameDemos[i].salePrice;
          gameDetails.image = gameDemos[i].image;

          const game = new GamesDb(gameDetails);

          await game.save();
        } else {
          found.demo = true;
          await found.save();
        }
      }
    }

    console.log("Updated Games with Demos");
  } catch (err) {
    throw err;
  }
};

/******************************
 GET / UPDATE NEW GAME RELEASES
 ******************************/
const getNewReleases = async () => {
  try {
    // New releases from NS website
    const newRelease = await getGames("new release");

    // New releases from current database
    const currentDb = await newReleasesDb.find({});

    /*******************************************************************
    Loop through newRelease gameId and  check against games collection to see if there is a document with the current ID, if not create new collection.
  ********************************************************************/
    if (currentDb.length === 0 || currentDb[0].title !== newRelease[0].title) {
      for (let i = 0; i < newRelease.length; i++) {
        const found = await GamesDb.findOne({
          title: newRelease[i].title
        });

        if (!found) {
          // Scrape for specific game detail
          const gameDetails = await getGameDetails(newRelease[i].url);

          if (!gameDetails) continue;

          gameDetails.price = newRelease[i].price;
          gameDetails.title = newRelease[i].title;
          gameDetails.salePrice = newRelease[i].salePrice;
          gameDetails.image = newRelease[i].image;

          const gamesDb = new GamesDb(gameDetails);
          await gamesDb.save();
        } else {
          // if game is found, update the prices of the game for the existing game
          await found.updateOne({
            price: newRelease[i].price,
            salePrice: newRelease[i].salePrice
          });
        }
      }

      /******************************************************************
     RESET NEW RELEASE COLLECTION ONLY IF NEW GAMES ARRAY IS NOT EMPTY OR IF THE FIRST INDEX FROM NEW RELEASE IS DIFFERENT FROM THE FIRST INDEX OF THE CURRENT DATABASE.
    ******************************************************************/

      // Delete all documents from new games collection
      await newReleasesDb.deleteMany({});

      // Insert new array of new games to collection
      await newReleasesDb.insertMany(newRelease, (err, docs) => {
        if (err) {
          return console.log(err);
        } else {
          console.log("Sucessfully updated");
        }
      });
    }

    console.log("Sucesfullly updated new game releases");
  } catch (err) {
    throw err;
  }
};

const runAll = async (req, res, next) => {
  try {
    // await getSaleGames();
    // await getDlc();
    await getComingSoon();
    // await getGamesWithDemos();
    // await getNewReleases();

    console.log("Data base updated");
    res.status(200).json("DB Updated");
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// module.exports.runAll = runAll;
