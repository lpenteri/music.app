#!/usr/bin/node

var http = require('http');
var settings = require('./user-settings').file('./conf/AppSettings.json');

/// \brief class marvin_client communicates with marvin
/// \version 0.1.0
/// \date april 2016
///
function marvin_client(ip, port) {
    this.ip = ip;
    this.port = port;
}

/// \brief create new topic
/// \param name the name of the topic
marvin_client.prototype.new_topic = function(name) {
    console.log("test sucess");
    // new topic options
    var options = {
        host: this.ip,
        port: this.port,
        path: '/marvin/eventbus/topics/' + name,
        method: 'PUT',
    };
    // connection callback
    callback = function(response) {
            var buffer = '';
            response.on('data', function(chunk) {
                buffer += chunk;
            });
            response.on('end', function() {
                // check headers for status
                // 200 = ok
                // 409 = conflict
                console.log(response.headers);
            });
        }
        // do PUT
    var req = http.request(options, callback);
    // error handling   
    req.on('error', function(err) {
        // Handle error
        console.log(err);
    });
    req.end();
}

/// \brief subscribe to a topic
/// \param topic is the subscription
/// \param name is the subscribers name
marvin_client.prototype.subscribe = function(topic, name, callback) {
    // set options
    var options = {
        host: this.ip,
        port: this.port,
        path: '/marvin/eventbus/topics/' + topic + '?subscribername=' + name,
        method: 'GET',
        keepAlive: true
    };
    console.log("marvin_client: Subscribing to " + topic);

    if (!callback) {
        callback = function(response) {
            var buffer = '';
            response.on('data', function(chunk) {
                var data = chunk.toString('utf8');

                if (response.statusCode != 200) {
                    console.log("appMessagesCallback on data: Problem " + response.statusCode);

                } else {
                    console.log("appMessagesCallback on data: Subscribed to topic");
                    // if double return - end of message
                    if (data.indexOf("\r\n\r\n")) {
                        buffer += data
                        console.log(data);
                    }
                    // else append and wait for next bit.
                    else {
                        buffer += chunk;
                    }
                }

            });
            // connection ended
            response.on('end', function() {
                if (response.statusCode == 409) {
                    console.log("Conflict on subscribe to topic: "+topic);
                    this.unsubscribe(topic, name, function(response) {
                        this.subscribe(topic, name, null);
                    });
                }
            });
        }
    }

    // do GET
    var req = http.request(options, callback);
    // error handling   
    req.on('error', function(err) {
        // Handle error
        console.log(err);
    });
    req.end();
}


/// \brief unsubscribe to a topic
/// \param topic is the subscription
/// \param name is the subscribers name
marvin_client.prototype.unsubscribe = function(topic, name, callback) {
    // set options
    var options = {
        host: this.ip,
        port: this.port,
        path: '/marvin/eventbus/topics/' + topic + '?subscribername=' + name,
        method: 'DELETE',
        keepAlive: true
    };

    if (!callback) {
        callback = function(response) {
            var buffer = '';
            response.on('data', function(chunk) {
                buffer += chunk;
            });
            response.on('end', function() {
                // check headers for status
                // 204 = ok
                // 409 = conflict
                if (response.statusCode != 204) {
                    console.log(response.statusCode);
                } else {
                    console.log("Unsubscribed from topic");
                }
            });
        }

    }
    // do DELETE
    var req = http.request(options, callback);
    // error handling   
    req.on('error', function(err) {
        // Handle error
        console.log(err);
    });
    req.end();
}

/// \brief delete a topic
/// \param topic is the subscription
/// \param name is the subscribers name
marvin_client.prototype.delete_topic = function(topic, callback) {
    // set options
    var options = {
        host: this.ip,
        port: this.port,
        path: '/marvin/eventbus/topics/' + topic,
        method: 'DELETE',
        keepAlive: true
    };

    if (!callback) {
        callback = function(response) {
            var buffer = '';
            response.on('data', function(chunk) {
                buffer += chunk;
            });
            response.on('end', function() {
                // check headers for status
                // 204 = ok
                // 409 = conflict
                if (response.statusCode != 204) {
                    console.log(response.statusCode);
                } else {
                    console.log("Deteted topic: " + topic);
                }
            });
        }

    }
    // do DELETE
    var req = http.request(options, callback);
    // error handling   
    req.on('error', function(err) {
        // Handle error
        console.log(err);
    });
    req.end();
}

/// \brief send a message
/// \param topic to which we will post
/// \param text which will be posted
marvin_client.prototype.message = function(topic, json, callback) {
    var data = '{"body":"' + json + '"}';

    // set options
    var options = {
        host: this.ip,
        port: this.port,
        path: '/marvin/eventbus/topics/' + topic,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (!callback) {
        callback = function(response) {
            var buffer = '';
            // chunk received 
            response.on('data', function(chunk) {
                buffer += chunk;
            });
            // connection ended
            response.on('end', function() {
                console.log("Message send to topic: " + topic);
                console.log("StatusCode: " + response.statusCode + ", StatusMessage: " + response.statusMessage);
                console.log(buffer);
            });
        };
    }


    // set up request
    var req = http.request(options, callback);

    // error handling   
    req.on('error', function(err) {
        // Handle error
        console.log(err);
    });
    // send request
    req.write(data);
    req.end();
}

/// \brief send a message
/// \param topic to which we will post
/// \param text which will be posted
marvin_client.prototype.messageWithCorrelationId = function(topic, id, json, callback) {
    var data = '{"correlationId":"' + id + '", "body":"' + json + '"}';

    // set options
    var options = {
        host: this.ip,
        port: this.port,
        path: '/marvin/eventbus/topics/' + topic,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (!callback) {
        callback = function(response) {
            var buffer = '';
            // chunk received 
            response.on('data', function(chunk) {
                buffer += chunk;
            });
            // connection ended
            response.on('end', function() {
                console.log("Message send to topic: " + topic);
                console.log("StatusCode: " + response.statusCode + ", StatusMessage: " + response.statusMessage);
                console.log(buffer);
            });
        };
    }

    // set up request
    var req = http.request(options, callback);

    // error handling   
    req.on('error', function(err) {
        // Handle error
        console.log(err);
    });
    // send request
    console.log(data);
    req.write(data);
    req.end();
}

// TODO: verify this works.
var mc = new marvin_client(settings.get('marvinip'), settings.get('marvinport'));
//test.new_topic('rapp');
//test.subscribe('rapp', 'monitor');
//test.message('rapp', { blah: true });
module.exports = mc;