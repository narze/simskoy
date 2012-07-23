//======================================================================
//http://stackoverflow.com/questions/187098/cross-platform-cross-browser-way-to-play-sound-from-javascript
//======================================================================
(function(){
    var soundEmbed = null;

    function soundPlay(src) {
        if (!soundEmbed) {
            soundEmbed = document.createElement("iframe");
            soundEmbed.setAttribute("src", src);
            soundEmbed.setAttribute("style", "display:none");
            soundEmbed.setAttribute("autostart", true);
            soundEmbed.setAttribute("height", 0);
            soundEmbed.setAttribute("width", 0);
        } else {
            document.body.removeChild(soundEmbed);
            soundEmbed.removed = true;
            soundEmbed = null;
            soundEmbed = document.createElement("iframe");
            soundEmbed.setAttribute("src", src);
            soundEmbed.setAttribute("style", "display:none");
            soundEmbed.setAttribute("autostart", true);
            soundEmbed.setAttribute("height", 0);
            soundEmbed.setAttribute("width", 0);
        }
        soundEmbed.removed = false;
        document.body.appendChild(soundEmbed);
    }

    String.prototype.speakThai = function() {
        var src = 'http://translate.google.com/translate_tts?tl=th&q=' + this;
        soundPlay(src);
        return this;
    }
})()