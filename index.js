'use strict';
const through = require('through2');
const gutil = require('gulp-util');
const path = require('path');
const Vinyl = require('vinyl');
const dateFormat = require('dateformat');

var filenamePattern = new RegExp(/^([a-z]+)_([0-9]{6})_(.*)\.txt$/);
var joinedBuffer = new Buffer('');

function compile(options) {
    options = options || {};

function quote(val) {
    if (typeof val === 'string') {
        return "'" + val + "'";
    }
    else if (val === undefined) {
        return null;
    }

    return val;
}

    function bufferContents(file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }
        else if (file.isStream()) {
            cb(new gutil.PluginError('Streaming not supported'));
            return;
        }

        try {
            var tMessage = null;
            var tClassName = null;
            var osSdk = null;
            var osRelease = null;
            var crMid = null;
            var content = JSON.parse(file.contents.toString());
            var crdate = content.date;
            var filename = path.basename(file.path);
            var fnmatches = filenamePattern.exec(filename);
            crMid = fnmatches[2]
            var t = content.throwable;
            var os = content.os;
            var applicationInfo = content.applicationInfo;
            var versionName = null;

            if (t) {
                tMessage = t.message;
                tClassName = t.className;
            }

            if (os) {
                osSdk = os.SDK_INT,
                osRelease = os.RELEASE
            }

            if (applicationInfo) {
                versionName = applicationInfo.versionName;
            }

            var insertStmt =
                'insert into '
                + (options.table || 'crashreport')
                + ' (mid, ts, ex, msg, midversion, os_sdk, os_release) values ('
                + quote(crMid) + ', '
                + quote(crdate) + ', '
                + quote(tClassName) + ', '
                + quote(tMessage) + ', '
                + quote(versionName) + ', '
                + osSdk + ', '
                + quote(osRelease)
                + ');'

            joinedBuffer = Buffer.concat([joinedBuffer, new Buffer(insertStmt + '\n')]);

            //console.log(insertStmt);
        }
        catch (err) {
            this.emit('error', new gutil.PluginError('crashreports', err, { fileName: file.path }));
        }

        cb();
    }

    function endStream(cb) {
        var path = (options.filename || 'crashreport_' + dateFormat(new Date(), 'yyyy-mm-dd_HH-MM-ss') + ".sql");

        var joinedFile = new Vinyl({
            cwd: __dirname,
            path: path,
            contents: new Buffer(joinedBuffer)
        });

        this.push(joinedFile);
        cb();
    }

    return through.obj(bufferContents, endStream);
}

module.exports = function (options) {
    return compile(options);
};