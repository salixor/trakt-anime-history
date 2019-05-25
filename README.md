# trakt-anime-history

Let's move back MyAnimeList and AniList history to trakt.tv to centralize it !

*This is a very basic script that I wrote for a personal usage. It **may break**, it's **far from perfect** and you'll sometimes have to edit stuff because many things are not properly checked when running the code. This simply makes it faster than doing all of this manually for each episode.*

These scripts allow to **copy your anime history** over to trakt.tv by synchronizing the exact time you watched each episode. This will work only if you are **scroblling your anime** with a third party program, or manually add them to your anime list **each time you finish an anime**.

## Setup

You'll have to create a trakt.tv application at https://trakt.tv/oauth/applications. Then, copy your user key and secret, and paste them where appropriate. You should also get a trakt.tv access token by making the appropriate call. It will be valid for a year so calling it once should be enough :)

## From MyAnimeList

You'll have to retrieve each anime's history **by hand**, since MAL doesn't have an API for that.

Navigate to https://myanimelist.net/ajaxtb.php?detailedaid=ANIME_ID for each anime in your anime list in order to retrieve the history for that specific anime. You'll get something that looks like this :

```Amanchu! Episode Details
Ep 3, watched on 05/25/2019 at 18:42 Remove
Ep 2, watched on 05/25/2019 at 18:20 Remove
Ep 1, watched on 05/25/2019 at 18:00 Remove
```

Then, save this in a file and simply run the node application. Check the console to verify if all episodes were added or not. If there are issues, most of the time, the problem rises from trakt.tv having trouble with some titles. Try to juggle a bit and you should manage to correct the issue.

*If the anime happens to be a sequel, you'll have to manually input the season number as trakt.tv keeps everything under the same show (which makes more sens in my opinion).*

## From AniList

As with MyAnimeList, no API is provided to retrieve you history. However, it will be way less tedious than MAL to retrieve your history.

This time around, you'll have to go to your AniList profile and load every activity by clicking on the "Show more" button until you loaded everything. Then, in the console, simply use the AniList JS script.

You'll get a long string formatted the same way as the MAL history. You can then reuse the MAL script by iterating over each anime. This should be way faster than importing from MAL.

## Endnotes

This was a small project that I started because I had a period where I mostly watched anime. Now that I'm starting to juggle a bit between various medias, I wanted to have a place where every shows I watch rest, for instance to have a centralized calendar of releases. I already used trakt.tv, so this is where I chose to scrobble my anime (as well as on AniList, it's still nice to have a distinct service just for that).

Since I used [Taiga](https://taiga.moe/) in the past (an awesome application to automatically scrobble anime to MAL/AniList/Kitsu), my MAL and AniList history were almost complete. I wanted to keep that history with me whichever service I use, and this motivated me to export this information to trakt.tv and their awesome API.

I'm not sure if it will ever be useful to anyone else, but if it is, don't hesitate to tell me, I'd be happy to know :)

I don't plan to work on this ever again since it already helped me a lot to move my history and saved me a lot of time. Feel free to use it, change it, eat it as you please !
