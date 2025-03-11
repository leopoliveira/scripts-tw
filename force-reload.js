window.addEventListener('load', function() {
    setInterval(() => {
        if (!document.getElementById("script-force-reload")) {
            window.location.reload();
        }
    }, 60000);
}, false);