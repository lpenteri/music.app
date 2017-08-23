var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// var fs = require('fs');
// var conf = require('./conf');
// var app_url = "http://" + conf.appip + ":" + conf.appport;

// var musicdir = "/home/leizer/Downloads/Music";
// var musicdir = './music';

var index = require('./routes/index');
// var musicapp = require('./musicapp.js');
// var backend = new musicapp(musicdir);
var app = express();
var mc = require('./routes/helpers/marvin_client');
var settings = require('./routes/helpers/user-settings').file('./conf/AppSettings.json');


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/semantic', express.static(__dirname + '/node_modules/semantic-ui-css/'));
app.use('/socket.io', express.static(__dirname + '/node_modles/socket.io/'));
app.use('/music', express.static(__dirname + '/music/'));

//TODO Copy this as it is
function sendget(path) {
    var http = require('http');
    http.get('http://' + settings.get('appip') + ":" + settings.get('appport') + path, (res) => {
        console.log(`Got response: ${res.statusCode}`);
        res.resume();
    }).on('error', (e) => {
        console.log(`Got error: ${e.message}`);
    });
}

//TODO copy this with changes suggested
function appMessagesCallback(topic, response) {
    var buffer = '';
    response.on('data', function (chunk) {
        var data = chunk.toString('utf8');

        if (response.statusCode != 200) {
            console.log("appMessagesCallback on data: Problem " + response.statusCode);

        } else {
            console.log("appMessagesCallback on data: Subscribed to topic");
            // if double return - end of message
            if (data.indexOf("\r\n\r\n")) {
                buffer += data
                console.log(data);
                var resObj = JSON.parse(buffer.trim().replace("data: ", ""));
                var body = JSON.parse(resObj.body);
                if (body.ability == "music") {
                    if (body.command == "start" || body.command == "stop") {
                        sendget("/?messageId=" + resObj.messageId + "&command=" + body.command);
                    }
                    if ((topic == "UIEvents") && (body.event == "subscribed")) {
                        sendconfigmessage();
                        //sendget("/");
                    }
                    if (body.event) {
                        if (body.event == "config") {
                            settings.set("locale", body.locale);
                            global.username = body.username;
                            console.log("user:" + global.username);
                            sendget("/");
                        }
                    }
                    if (body.action) {
                        if (body.action == "selectgenre") {
                            sendget("/selectgenre");
                        }
                        if (body.action == "home") {
                            sendget("/home");
                        }
                        if (body.action.indexOf("playmusic") > -1) {
                            sendget("/" + body.action);
                        }
                    }
                }
                buffer = "";
            }
            // else append and wait for next bit.
            else {
                buffer += chunk;
            }
        }

    });
    // connection ended
    response.on('end', function () {
        if (response.statusCode == 409) {
            console.log("appMessagesCallback on end: No connection possible");
            mc.unsubscribe(topic, 'music.app', function (response) {
                mc.subscribe(topic, 'music.app', function (response) {
                    appMessagesCallback("music", response);
                });
            });
        }
    });
}

function sendsubscribedmessage() {
    var submess = {
        "targets": ["task_manager"],
        "resources": ["UI"]
    };

    var mess = JSON.stringify(submess).replace(new RegExp('"', 'g'), '\\"');

    mc.messageWithCorrelationId('music', step3CorellationId, mess, function (r) {
        var buffer = '';
        // chunk received 
        r.on('data', function (chunk) {
            buffer += chunk;
        });
        // connection ended
        r.on('end', function () {
            console.log("Message send to topic: music");
            console.log("StatusCode: " + r.statusCode + ", StatusMessage: " + r.statusMessage);
            console.log(buffer);
        });
    });
}

function sendstoppedmessage() {
    var submess = {
        "ability": "music",
        "state": "stopped"
    };

    var mess = JSON.stringify(submess).replace(new RegExp('"', 'g'), '\\"');

    // mc.message('music', mess, null);

    mc.message('music', mess, function (r) {
        var buffer = '';
        // chunk received 
        r.on('data', function (chunk) {
            buffer += chunk;
        });
        // connection ended
        r.on('end', function () {
            console.log("Message send to topic: music");
            console.log("StatusCode: " + r.statusCode + ", StatusMessage: " + r.statusMessage);
            console.log(buffer);
            mc.delete_topic("music", null);
        });
    });
}

function sendconfigmessage() {
    var configmess = {
        "action": "sendconfig",
        "targets": ["UI"],
        "configs": ["username", "locale"]
    };
    var mess = JSON.stringify(configmess).replace(new RegExp('"', 'g'), '\\"');

    // mc.message('music', mess, null);

    mc.message('music', mess, function (r) {
        var buffer = '';
        // chunk received 
        r.on('data', function (chunk) {
            buffer += chunk;
        });
        // connection ended
        r.on('end', function () {
            console.log("Message send to topic: music");
            console.log("StatusCode: " + r.statusCode + ", StatusMessage: " + r.statusMessage);
            console.log(buffer);
            // sendget("/");
        });
    });
}

var step3CorellationId = "";

function taskmanagerCallback(topic, response) {
    var buffer = '';
    response.on('data', function (chunk) {
        var data = chunk.toString('utf8');

        if (response.statusCode != 200) {
            console.log("taskmanagerCallback on data: Problem " + response.statusCode);
        } else {
            console.log("taskmanagerCallback on data: Subscribed to topic");
            // if double return - end of message
            if (data.indexOf("\r\n\r\n")) {
                buffer += data
                console.log(data);
                var resObj = JSON.parse(buffer.trim().replace("data: ", ""));
                var body = JSON.parse(resObj.body);
                if (body.ability == "music") {
                    //step 1
                    if (body.command == "start") {
                        step3CorellationId = resObj.messageId;
                        mc.new_topic("music");
                    }
                    //step 2
                    if (body.state == "subscribed") {
                        mc.subscribe('UIEvents', 'music.app', function (response) {
                            appMessagesCallback("UIEvents", response);
                        });
                        mc.subscribe('UCEvents', 'music.app', function (response) {
                            appMessagesCallback("UCEvents", response);
                        });

                        sendsubscribedmessage();
                    }
                    if (body.command == "stop") {
                        mc.unsubscribe("UIEvents", "music.app", function (response) {
                            var buffer = '';
                            response.on('data', function (chunk) {
                                buffer += chunk;
                            });
                            response.on('end', function () {
                                // check headers for status
                                // 204 = ok
                                // 409 = conflict
                                if (response.statusCode != 204) {
                                    console.log(response.statusCode);
                                } else {
                                    console.log("Unsubscribed from topic UIEvents");
                                    mc.unsubscribe("UCEvents", "music.app", function (response) {
                                        var buffer = '';
                                        response.on('data', function (chunk) {
                                            buffer += chunk;
                                        });
                                        response.on('end', function () {
                                            // check headers for status
                                            // 204 = ok
                                            // 409 = conflict
                                            if (response.statusCode != 204) {
                                                console.log(response.statusCode);
                                            } else {
                                                console.log("Unsubscribed from topic UCEvents");
                                                sendstoppedmessage();
                                            };
                                        });
                                    });
                                };
                            });
                        });

                    }

                }
                buffer = "";
            }
            // else append and wait for next bit.
            else {
                buffer += chunk;
            }
        }
    });
    // connection ended
    response.on('end', function () {
        if (response.statusCode == 409) {
            console.log("appMessagesCallback on end: No connection possible");
            mc.unsubscribe('taskmanager', 'music.app', function (response) {
                mc.subscribe('taskmanager', 'music.app', function (response) {
                    taskmanagerCallback('taskmanager', response);
                });
            });
        }
    });
}

mc.subscribe('taskmanager', 'musicapp', function (response) {
    taskmanagerCallback("taskmanager", response);
});


// show genres (UI front-end)
app.use('/', index);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;