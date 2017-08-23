#!/usr/bin/node
var fs = require('fs');

/**
 * \class musicapp
 * \brief scans a directory for genres and songs.
 * \version 0.1.1
 * \date may 2016
 * \author alex giokas <a.gkiokas@ortelio.co.uk>
 */
function musicapp(dir)
{
    try {
        stats = fs.lstatSync(dir);
        if (stats.isDirectory()) {
            this.rootdir= dir;
        }
    }
    catch (e) {
        console.log(e);
    }
    this.genres = [];
    this.songlist = [];
}

/// \brief scan for genres and songs in folders
musicapp.prototype.scanfolders = function()
{
    var self = this;
    self.songlist = [];
    self.genres = [];

    var files = fs.readdirSync(this.rootdir);
    for (var i in files) {
        // not a file
        var pathname = this.rootdir + '/' + files[i];
        if (fs.statSync(pathname).isDirectory()) {
            this.genres.push(files[i]);
            this.scansongs(pathname, files[i]);
        }
    }
}

/// \brief scan for songs of a genre
musicapp.prototype.scanfolder = function(genre)
{
    this.songlist = [];

    var dirname = this.rootdir + '/' + genre;
    var files = fs.readdirSync(dirname);
    for (var i in files) {
        var pathname = dirname + '/' + files[i];
        // is file
        if (fs.statSync(pathname).isFile()) {
            // is extension is (mp3, mp4, wav, etc)
            this.songlist.push({name : files[i]});
        }
    }
}

/// \brief scan for songs in a directory, adding it to a genre/group
musicapp.prototype.scansongs = function(dir, group)
{
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var pathname = dir + '/' + files[i];
        // is file
        if (fs.statSync(pathname).isFile()) {
            // is extension is (mp3, mp4, wav, etc)
            this.songlist.push({genre : group, name : files[i]});
        }
    }
}

/// \brief get all genres
musicapp.prototype.get_genres = function()
{
    return this.genres;
}

/// \brief get all songs
musicapp.prototype.get_songs = function()
{
    return this.songlist;
}

/// \brief get a random playlist
musicapp.prototype.random_songlist = function()
{
    // TODO
}

/// \brief get a random playlist from a genre
musicapp.prototype.random_grouplist = function(group)
{
    // TODO
}

/// exports
module.exports = musicapp;
