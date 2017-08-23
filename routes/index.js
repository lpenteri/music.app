var express = require('express');
var router = express.Router();
var mc = require('./helpers/marvin_client');
var musicdir = './music/';
var musicapp = require('../musicapp.js');
var backend = new musicapp(musicdir);
var settings = require('./helpers/user-settings').file('./conf/AppSettings.json');
var gt = require('./helpers/gtconfig');
var previous_action = "";
// index
router.route('/')
    .get(function (req, res) {
        musicdir = './music/' + global.username;
        backend = new musicapp(musicdir);

        previous_action = "";
        if (req.query.messageId) {
            var newState;
            if (req.query.command == "start") {
                newState = "running";
            } else {
                newState = "ready";
            }
            var message = {
                "ability": "music",
                "state": newState
            };
            mc.messageWithCorrelationId("abilitystate", req.query.messageId, JSON.stringify(message).replace(new RegExp('"', 'g'), '\\"'), function (response) {
                console.log("Message with corellation ID: " + response.statusCode);
            });
            if (req.query.command == "start") {
                if (settings.get("default_action") == "play") {
                    var songs = [];
                    if (req.query.genre) {
                        backend.scanfolder(req.query.genre);
                        songs = backend.get_songs();
                    } else {
                        backend.scanfolders();
                        songs = backend.get_songs();
                    }
                    mc.message("music", createMessageForUIplaysong(songs, req.query.genre), function (response) {
                        console.log(response.statusCode);
                    });
                } else if (settings.get("default_action") == "home") {
                    mc.message("music", createMessageForUIhomescreen(), function (response) {
                        console.log(response.statusCode);
                    });
                }
                previous_action = "home";
            }
        } else {
            if (settings.get("default_action") == "play") {
                var songs = [];
                if (req.query.genre) {
                    backend.scanfolder(req.query.genre);
                    songs = backend.get_songs();
                } else {
                    backend.scanfolders();
                    songs = backend.get_songs();
                }
                mc.message("music", createMessageForUIplaysong(songs, req.query.genre), function (response) {
                    console.log(response.statusCode);
                });
            } else if (settings.get("default_action") == "home") {
                mc.message("music", createMessageForUIhomescreen(), function (response) {
                    console.log(response.statusCode);
                });
            }
            previous_action = "home";
        }
        res.sendStatus(200);
    });

// select genre
router.route('/selectgenre')
    .get(function (req, res) { //Get All
        musicdir = './music/' + global.username;
        backend = new musicapp(musicdir);
        backend.scanfolders();
        var genres = backend.get_genres();

        mc.message("music", createMessageForUI(genres), function (response) {
            console.log(response.statusCode);
        });
        previous_action = "selectgenre";
    });

// music play (random song) (UI front-end)
router.route('/home')
    .get(function (req, res) {
        mc.message("music", createMessageForUIhomescreen(), function (response) {
            console.log(response.statusCode);
        });
        previous_action = "home";
        res.sendStatus(200);
    });

// music play (random song) (UI front-end)
router.route('/playmusic')
    .get(function (req, res) {
        musicdir = './music/' + global.username;
        backend = new musicapp(musicdir);
        var songs = [];
        if (req.query.genre) {
            backend.scanfolder(req.query.genre);
            songs = backend.get_songs();
        } else {
            backend.scanfolders();
            songs = backend.get_songs();
        }
        mc.message("music", createMessageForUIplaysong(songs, req.query.genre), function (response) {
            console.log(response.statusCode);
        });
        // previous_action = "playmusic";
        res.sendStatus(200);
    });


function createMessageForUIplaysong(songslist, genre) {

    var message = {
        "action": "playmedia",
        "type": "audio",
        "play": gt.gettext("Play"),
        "pause": gt.gettext("Pause"),
        "stop": gt.gettext("Stop"),
        "louder": gt.gettext("Louder"),
        "quieter": gt.gettext("Quieter"),
        "previous": gt.gettext("Previous song"),
        "next": gt.gettext("Next song"),
        "warning": gt.gettext("warning")
    };
    if (previous_action !== "") {
        message.back_action = previous_action;
    }
    var songs = [];
    songslist.forEach(function (item) {
        var song;
        if (genre) {
            song = {
                "name": item.name.replace(".mp3", ""),
                "src": "http://" + settings.get('appip') + ":" + settings.get('appport') + "/music/" + global.username + "/" + genre + "/" + item.name
            };
        } else {
            song = {
                "name": item.name.replace(".mp3", ""),
                "src": "http://" + settings.get('appip') + ":" + settings.get('appport') + "/music/" + global.username + "/" + item.genre + "/" + item.name
            };
        }
        songs.push(song);
    });
    message.media = songs;
    message.onend = "homescreen";
    return JSON.stringify(message).replace(new RegExp('"', 'g'), '\\"');
}

function createMessageForUIhomescreen() {
    var play_keywords = gt.gettext("play_keywords").split(",");
    var select_keywords = gt.gettext("select_keywords").split(",");
    var message = {
        "action": "showoptions",
        "heading": gt.gettext("What would you like to do?"),
        "options": [{
            "name": gt.gettext("Play music?"),
            "img": "/_img/mario/play.png",
            "action": "playmusic",
            "keywords": play_keywords
        }, {
            "name": gt.gettext("Select music?"),
            "img": "/_img/mario/music-icon.png",
            "action": "selectgenre",
            "keywords": select_keywords
        }]
    };
    // if (previous_action !== "") {
    //     message.back_action = previous_action;
    // }

    return JSON.stringify(message).replace(new RegExp('"', 'g'), '\\"');
}

function createMessageForUI(genres) {
    var message = {
        "action": "showoptions",
        "heading": gt.gettext("What would you like to listen to?"),
        "back_action": "home"
    };
    var options = [];
    genres.forEach(function (item) {
        var option = {
            "name": item + "?",
            "img": "/_img/mario/music-icon.png",
            "action": "playmusic?genre=" + item,
            "keywords": [item]
        };
        options.push(option);
    });

    message.options = options;
    return JSON.stringify(message).replace(new RegExp('"', 'g'), '\\"')
}

module.exports = router;