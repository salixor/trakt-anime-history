let fs = require('fs');
let request = require('request');
let levenshtein = require('js-levenshtein');

let TRAKT_API_KEY = ''; // Found at https://trakt.tv/oauth/applications
let TRAKT_API_SECRET = ''; // Found at https://trakt.tv/oauth/applications
let TRAKT_TOKEN = ''; // Call getTraktToken() once and write down the token

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
};

// Format history to a more schematized format
let formatHistory = (str) => {
    let lines = str.split(/\r?\n/);
    let title = lines[0].match(/(.+) Episode Details/i)[1];
    let episodes_with_time = lines.slice(1, -1).map(line => {
        let [s, ep, month, day, year, hour, minute, ...r] = line.match(/Ep ([0-9]+), watched on ([0-9]+)\/([0-9]+)\/([0-9]+) at ([0-9]+):([0-9]+) Remove/i);
        let date = new Date(year, month - 1, day, hour, minute);
        return { episode: parseInt(ep), timestamp: date };
    });
    return { title: title, timestamps: episodes_with_time };
};

// Call to get a trakt token ; save it after the call
let getTraktToken = () => {
    return new Promise(resolve => {
        request.post('https://api.trakt.tv/oauth/device/code', {
            headers: { 'Content-Type': 'application/json' },
            body: `{ "client_id": "${TRAKT_API_KEY}" }`
        }, (error, response, body) => {
            let infos = JSON.parse(body);
            console.log(`Open this link in the next 10s : ${infos.verification_url}`);
            console.log(`Type this code : ${infos.user_code}`);
            resolve(JSON.parse(body));
        });
    }).then(device_infos =>
        new Promise(resolve => { setTimeout(() => resolve(device_infos), device_infos.interval * 2 * 1000) })
    ).then(device_infos => {
        request.post('https://api.trakt.tv/oauth/device/token', {
            headers: { 'Content-Type': 'application/json' },
            body: `{
                "code": "${device_infos.device_code}",
                "client_id": "${TRAKT_API_KEY}",
                "client_secret": "${TRAKT_API_SECRET}"
            }`
        }, (error, response, body) => {
            let infos = JSON.parse(body);
            console.log(`Write down this token : ${infos.access_token}`);
        });
    });
};

// Generic AniList API call
let callAniListAPI = (query, variables) => {
    return new Promise(resolve => {
        request.post('https://graphql.anilist.co', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        }, function (error, response, body) {
            if (response.statusCode == 200 && !error)
                resolve(JSON.parse(body));
        });
    });
};

// Get english title of an anime via AniList
let getEnglishTitle = (jp_title) => {
    let query = `
    query ($title: String, $type: MediaType) {
        Media(search: $title, type: $type) {
            id
            title {
                romaji
                english
                native
            }
        }
    }`;
    let variables = {
        "title": jp_title,
        "type": "ANIME"
    };

    return callAniListAPI(query, variables).then(infos => infos.data.Media.title.english || jp_title);
};

// Generic Trakt API call
let callTraktAPI = (url) => {
    return new Promise(resolve => {
        request.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'trakt-api-version': '2',
                'trakt-api-key': TRAKT_API_KEY
            }
        }, function (error, response, body) {
            if (response.statusCode == 200 && !error)
                resolve(JSON.parse(body));
        });
    });
};

// Retrieve show or movie informations
let getTraktShowOrMovie = (title, type) =>
    callTraktAPI(`https://api.trakt.tv/search/${type}?query=${title}`).then(infos => {
        switch (type) {
            case 'show':
                return infos
                    .filter(info => info.show.year !== null)
                    .sort((a, b) => a.show.year > b.show.year)
                    .sort((a, b) => levenshtein(a.show.title.toLowerCase(), b.show.title.toLowerCase()))
                    .filter((info, idx, arr) => arr.length == 1 || levenshtein(title.toLowerCase(), info.show.title.toLowerCase()) <= 2)
                    .sort((a, b) => a.score > b.score)[0]
            case 'movie':
                return infos
                    .filter(info => info.movie.year !== null)
                    .sort((a, b) => a.movie.year > b.movie.year)
                    .sort((a, b) => levenshtein(a.movie.title.toLowerCase(), b.movie.title.toLowerCase()))
                    .filter((info, idx, arr) => arr.length == 1 || levenshtein(title.toLowerCase(), info.movie.title.toLowerCase()) <= 2)
                    .sort((a, b) => a.score > b.score)[0]
        }
    });

// Retrieve season information
let getTraktSeason = (trakt_id, show_title, full_title) =>
    callTraktAPI(`https://api.trakt.tv/shows/${trakt_id}/seasons?extended=full`).then(infos =>
        infos.filter(info => info.number != 0)
    );

// Retrieve episode information
let getTraktEpisode = (trakt_id, season, episode) => callTraktAPI(`https://api.trakt.tv/shows/${trakt_id}/seasons/${season}/episodes/${episode}`);

// Update on trakt based on multiple episodes of a serie / a movie
let updateOnTrakt = async (mal_infos, override_season = -1, ANIME_TYPE = 'show') => {
    let mal_title = mal_infos.title;
    console.log(`Anime : ${mal_title}`);

    let english_title = await getEnglishTitle(mal_title);
    console.log(`English Title : ${english_title}`);

    let anime = await getTraktShowOrMovie(english_title, ANIME_TYPE);
    let title = (ANIME_TYPE == 'show') ? anime.show.title : anime.movie.title;
    let trakt_slug = (ANIME_TYPE == 'show') ? anime.show.ids.slug : anime.movie.ids.slug;
    console.log(`${ANIME_TYPE.capitalize()} : ${title}`);
    console.log(`Link : https://trakt.tv/shows/${trakt_slug}`);

    let season_infos = await getTraktSeason(trakt_slug, title, mal_title);
    let season = (override_season != -1) ? override_season : season_infos[0].number;
    console.log(`Season : ${season}`);

    let ep = await Promise.all(mal_infos.timestamps.map(mal_timestamp_infos => {
        let episode = mal_timestamp_infos.episode;
        let timestamp = mal_timestamp_infos.timestamp;
        return getTraktEpisode(trakt_slug, season, episode).then(episode_infos => {
            return {
                "watched_at": timestamp,
                "ids": { "trakt": episode_infos.ids.trakt }
            };
        });
    }));
    let body = { episodes: ep };

    request.post('https://api.trakt.tv/sync/history', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TRAKT_TOKEN}`,
            'trakt-api-version': '2',
            'trakt-api-key': TRAKT_API_KEY
        },
        body: JSON.stringify(body)
    }, (error, response, body) => {
        let r = JSON.parse(body);
        console.log(`Added episodes : ${r.added.episodes}`);
        console.log(`Missing episodes : ${"None" || r.not_found.episodes}`);
    });
};

// getTraktToken();
let history = fs.readFileSync('anime_history.txt', 'utf-8');
let infos = formatHistory(history);
updateOnTrakt(infos);
