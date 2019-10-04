# The Wandering Wraith

A 2d platformer for [js13kGames](https://js13kgames.com/) 2019 edition challenge.

You can play it [here](https://tulustul.github.io/The-Wandering-Wraith/) or on the [contest page](https://js13kgames.com/entries/the-wandering-wraith)

[Post mortem](https://medium.com/@mateusz.tomczyk/a-story-of-making-a-13-kb-game-in-30-days-the-wandering-wraith-post-mortem-9847c8992f49)

![Game screenshot](/screens/screen1.png)

## Controls

- left and rigth arrows for movement
- space for jumping

## Editor

The game comes with a built-in editor available in development build only.
![Game screenshot](/screens/editor.png)

Some non-obvious things about editor:

- press "e" to enable it
- you can delete objects with "delete" key
- when path point is selected you can:
  - cut it using "c"
  - toggle between straight lines and bezier curves using "v"

## Getting started

- `npm install`

## For development

- `npm run start`

A dev server is started at `http://localhost:8080`

## For production

- `npm run build`

Ready to use bundle is located in `/dist` directory.

Thanks for Frank Force for his awesome [ZzFX](https://zzfx.3d2k.com/).
