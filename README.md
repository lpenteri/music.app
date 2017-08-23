# Music App
### Version 0.1.0

This is the Pilot 1 Trial 1 music app.
It runs on Node.JS/Express.JS.

### Execute

You run it by executing from the app root dir:

`npm start`

### Dependencies

See `package.json` for dependencies.
You may install them from the  app root dir using:

`npm install`

### Audio Playback

It streams audio files to the client's browser using HTML5.
The audio files must exist and be present on the computer (Linux).
Currently the path is hardcoded in the `app.js` script.

### Directory Tree

The music app expects a directory parameter.
Inside that directory the following tree **must be used**:

```
/
    genre_1/
            /song_a.mp3
            /song_b.mp3
            /...

    genre_2/
            /song_a.mp3
            /song_b.mp3
            /...
```

### Marvin

**Right now, there is NO MARVIN communication.**
Interfacing with Marvin has the following format:

```json
{
    command : { "option" : "param" }
}
```

The possible options are:

1. `genres` (*without param*) will redirect to `genres` view
2. `play` with a *required* param used as the `song name`
3. `menu` (*without param*) will redirect user interface back to main menu

### WARNING

The app requires that we hardcode the Windows IP/URL of the UI in order to navigate
back to it when user presses `Menu`.

### Browserify

We use the `browserify` npm package to convert Node.JS scripts into `script.dist.js`
for the browser sandbox.

### Minify

Browserified scripts (`script.dist.js`) can be further minified using npm `node-minifier`.

### CORS for Chrome

Chrome and Chromium (and maybe other broswers) using CORS do not allow browser scripts
to communicate with different destinations (ip:port) other than the one from which they
originated.

Because Marvin runs on a different port (and/or ip) the browser requires a plugin
which disables CORS: `Allow-Control-Allow-Origin`
