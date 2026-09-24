/**
 * A log of how long each step of the launch of a Duik panel takes, to find what makes After Effects slow to start.<br />
 * Every panel appends its steps to <i>Duik startup times.txt</i>, in the Duik folder of the user's documents:
 * the time of day, the time the step took, the time since the panel's script started running, and the step.<br />
 * After Effects reads and compiles the whole script before running its first line, so the gap before the first step of a
 * panel is mostly that reading, and whatever After Effects does between two panels.
 */
var startupLogFile = new File(Folder.myDocuments.absoluteURI + '/Duik/Duik startup times.txt');
var startupLogStart = new Date().getTime();
var startupLogPrevious = startupLogStart;

/**
 * Appends a step of the launch to the log, with the time it took since the previous step.
 * @param {string} step - What has just been done.
 */
function logStartupStep(step) {
    var now = new Date();
    var time = now.getTime();

    function pad(num, length) {
        var str = '' + num;
        while (str.length < length) str = '0' + str;
        return str;
    }

    var line = pad(now.getHours(), 2) + ':' + pad(now.getMinutes(), 2) + ':' + pad(now.getSeconds(), 2) + '.' + pad(now.getMilliseconds(), 3) +
        '\t+' + ((time - startupLogPrevious) / 1000).toFixed(2) + 's' +
        '\t' + ((time - startupLogStart) / 1000).toFixed(2) + 's' +
        '\t' + step;
    startupLogPrevious = time;

    // The log must never keep Duik from starting.
    try {
        if (!startupLogFile.parent.exists) startupLogFile.parent.create();
        startupLogFile.encoding = 'UTF-8';
        startupLogFile.lineFeed = 'Unix';
        if (!startupLogFile.open('a')) return;
        startupLogFile.writeln(line);
        startupLogFile.close();
    }
    catch (e) {}
}

logStartupStep('==== ' + File($.fileName).displayName + ' started, ' + new Date().toString());
