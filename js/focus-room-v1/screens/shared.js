export function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function renderStage(scene, options) {
    var config = options || {};
    var classes = ['fr1-stage'];

    if (scene && scene.stageClass) {
        classes.push(scene.stageClass);
    }

    if (config.presenceMode) {
        classes.push('fr1-stage--presence-on');
    }

    if (config.quiet) {
        classes.push('fr1-stage--quiet');
    }

    return '' +
        '<div class="' + classes.join(' ') + '">' +
            '<video class="fr1-stage__video" autoplay muted loop playsinline preload="metadata">' +
                '<source src="' + escapeHtml(scene ? scene.videoSrc : '') + '" type="video/mp4">' +
            '</video>' +
            '<div class="fr1-stage__scrim"></div>' +
            '<div class="fr1-stage__warmth"></div>' +
            '<div class="fr1-stage__fog"></div>' +
            '<div class="fr1-stage__glass"></div>' +
            '<div class="fr1-stage__companion" aria-hidden="true"></div>' +
            '<div class="fr1-stage__breath" aria-hidden="true"></div>' +
            '<div class="fr1-stage__presence" aria-hidden="true">' +
                '<span></span><span></span><span></span><span></span><span></span>' +
            '</div>' +
        '</div>';
}
