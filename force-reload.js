window.addEventListener('load', function() {
    setTimeout(() => {
        if (!document.getElementById("script-force-reload")) {
            window.location.reload();
        }
    }, 10000);
}, false);