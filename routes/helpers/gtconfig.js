var gettext = require('node-gettext');
var fs = require('fs');
var settings = require('./user-settings').file('./conf/AppSettings.json');

var gt = new gettext();

var fileContents = fs.readFileSync("./locales/it-IT/app.po");
gt.addTextdomain("it-IT", fileContents);
var fileContents = fs.readFileSync("./locales/en-GB/app.po");
gt.addTextdomain("en-GB", fileContents);

gt.textdomain(settings.get('locale'));
console.log("Locale selected: " + gt.textdomain());

module.exports = gt;
