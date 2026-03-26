function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderStage(scene) {
    return '' +
        '<div class="fr1-stage">' +
            '<video class="fr1-stage__video" autoplay muted loop playsinline preload="metadata">' +
                '<source src="' + scene.videoSrc + '" type="video/mp4">' +
            '</video>' +
            '<div class="fr1-stage__scrim"></div>' +
            '<div class="fr1-stage__warmth"></div>' +
            '<div class="fr1-stage__fog"></div>' +
            '<div class="fr1-stage__glass"></div>' +
        '</div>';
}

export function renderResumeScreen(context) {
    return '' +
        '<section class="fr1-screen fr1-screen--resume">' +
            renderStage(context.derived.scene) +
            '<div class="fr1-screen__content fr1-resume-layout">' +
                '<div class="fr1-panel fr1-panel--ghost fr1-resume-card">' +
                    '<span class="fr1-kicker">Resume</span>' +
                    '<h1 class="fr1-title-lg">Pick up softly</h1>' +
                    '<p class="fr1-copy">You do not need to restart the whole effort. Just re-enter the part that was already alive.</p>' +
                    '<div class="fr1-resume-grid">' +
                        '<div class="fr1-resume-block">' +
                            '<strong>First step</strong>' +
                            '<span>' + escapeHtml(context.derived.resume.firstStep) + '</span>' +
                        '</div>' +
                        '<div class="fr1-resume-block">' +
                            '<strong>Friction note</strong>' +
                            '<span>' + escapeHtml(context.derived.resume.frictionLabel) + '</span>' +
                        '</div>' +
                        '<div class="fr1-resume-block">' +
                            '<strong>Room</strong>' +
                            '<span>' + escapeHtml(context.derived.resume.sceneLabel) + '</span>' +
                        '</div>' +
                        '<div class="fr1-resume-block">' +
                            '<strong>Last active</strong>' +
                            '<span>' + escapeHtml(context.derived.resume.updatedText) + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<p class="fr1-support-copy">' + escapeHtml(context.derived.resume.frictionSupport) + '</p>' +
                    '<div class="fr1-actions">' +
                        '<button class="fr1-button fr1-button--primary" data-fr1-return type="button">Return to room</button>' +
                        '<button class="fr1-button fr1-button--subtle" data-fr1-finish type="button">Finish softly</button>' +
                        '<button class="fr1-button fr1-button--ghost" data-fr1-start-over type="button">Start over</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</section>';
}

export function bindResumeScreen(root, context, actions) {
    var returnButton = root.querySelector('[data-fr1-return]');
    var finishButton = root.querySelector('[data-fr1-finish]');
    var startOverButton = root.querySelector('[data-fr1-start-over]');

    function handleReturn() {
        actions.returnToRoom();
    }

    function handleFinish() {
        actions.finishSoftly();
    }

    function handleStartOver() {
        actions.startOver();
    }

    if (returnButton) {
        returnButton.addEventListener('click', handleReturn);
    }

    if (finishButton) {
        finishButton.addEventListener('click', handleFinish);
    }

    if (startOverButton) {
        startOverButton.addEventListener('click', handleStartOver);
    }

    return function cleanupResumeScreen() {
        if (returnButton) {
            returnButton.removeEventListener('click', handleReturn);
        }

        if (finishButton) {
            finishButton.removeEventListener('click', handleFinish);
        }

        if (startOverButton) {
            startOverButton.removeEventListener('click', handleStartOver);
        }
    };
}
