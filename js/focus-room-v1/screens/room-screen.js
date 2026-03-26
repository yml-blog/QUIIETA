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
            '<div class="fr1-stage__presence" aria-hidden="true">' +
                '<span></span><span></span><span></span><span></span><span></span>' +
            '</div>' +
        '</div>';
}

export function renderRoomScreen(context) {
    var firstStep = context.state.firstStep || 'Return to one visible next step.';
    var prompt = context.derived.selectedPrompt;
    var sceneButtons = context.derived.scenes.map(function (scene) {
        var isActive = scene.key === context.state.sceneKey;

        return '' +
            '<button class="fr1-scene-chip' + (isActive ? ' is-active' : '') + '" data-fr1-scene="' + escapeHtml(scene.key) + '" type="button" aria-pressed="' + (isActive ? 'true' : 'false') + '">' +
                escapeHtml(scene.label) +
            '</button>';
    }).join('');

    return '' +
        '<section class="fr1-screen fr1-screen--room">' +
            renderStage(context.derived.scene) +
            '<div class="fr1-screen__content fr1-room-shell">' +
                '<div class="fr1-room-topbar">' +
                    '<div class="fr1-panel fr1-panel--ghost fr1-room-pill">' +
                        '<span class="fr1-kicker">Quieta</span>' +
                    '</div>' +
                    '<button class="fr1-button fr1-button--ghost" data-fr1-toggle-audio type="button" data-fr1-audio-label>' + escapeHtml(context.derived.audioLabel) + '</button>' +
                '</div>' +
                '<div class="fr1-room-grid">' +
                    '<article class="fr1-panel fr1-panel--ghost fr1-room-intent">' +
                        '<span class="fr1-kicker">First Step</span>' +
                        '<h1 class="fr1-room-step">' + escapeHtml(firstStep) + '</h1>' +
                        '<p class="fr1-room-support">' + escapeHtml(prompt ? prompt.support : 'Keep the return smaller than the resistance.') + '</p>' +
                        '<div class="fr1-room-meta">' +
                            '<span>' + escapeHtml(context.derived.scene.label) + '</span>' +
                            '<span>' + escapeHtml(context.derived.scene.sub) + '</span>' +
                        '</div>' +
                    '</article>' +
                    '<aside class="fr1-room-sidebar">' +
                        '<section class="fr1-panel fr1-panel--ghost fr1-room-card">' +
                            '<span class="fr1-kicker">Soft Start</span>' +
                            '<h2 data-fr1-soft-title>' + escapeHtml(context.derived.softStart.title) + '</h2>' +
                            '<p data-fr1-soft-body>' + escapeHtml(context.derived.softStart.body) + '</p>' +
                            '<div class="fr1-soft-track" aria-hidden="true">' +
                                '<span data-fr1-soft-fill></span>' +
                            '</div>' +
                            '<p class="fr1-muted" data-fr1-soft-detail>' + escapeHtml(context.derived.softStart.detail) + '</p>' +
                        '</section>' +
                        '<section class="fr1-panel fr1-panel--ghost fr1-room-card">' +
                            '<span class="fr1-kicker">Scene</span>' +
                            '<div class="fr1-scene-list">' + sceneButtons + '</div>' +
                        '</section>' +
                        '<section class="fr1-panel fr1-panel--ghost fr1-room-card">' +
                            '<span class="fr1-kicker">If attention slips</span>' +
                            '<h2>' + escapeHtml(prompt ? prompt.label : 'Return gently') + '</h2>' +
                            '<p>' + escapeHtml(prompt ? prompt.support : 'The room is allowed to hold a slower restart.') + '</p>' +
                        '</section>' +
                    '</aside>' +
                '</div>' +
                '<div class="fr1-room-actions">' +
                    '<button class="fr1-button fr1-button--subtle" data-fr1-pulled-away type="button">I got pulled away</button>' +
                    '<button class="fr1-button fr1-button--ghost" data-fr1-finish-softly type="button">Finish softly</button>' +
                '</div>' +
            '</div>' +
        '</section>';
}

export function updateRoomScreen(root, context) {
    var softFill = root.querySelector('[data-fr1-soft-fill]');
    var softTitle = root.querySelector('[data-fr1-soft-title]');
    var softBody = root.querySelector('[data-fr1-soft-body]');
    var softDetail = root.querySelector('[data-fr1-soft-detail]');
    var audioLabel = root.querySelector('[data-fr1-audio-label]');

    if (softFill) {
        softFill.style.width = (context.derived.softStart.progress * 100).toFixed(1) + '%';
    }

    if (softTitle) {
        softTitle.textContent = context.derived.softStart.title;
    }

    if (softBody) {
        softBody.textContent = context.derived.softStart.body;
    }

    if (softDetail) {
        softDetail.textContent = context.derived.softStart.detail;
    }

    if (audioLabel) {
        audioLabel.textContent = context.derived.audioLabel;
    }
}

export function bindRoomScreen(root, context, actions) {
    var sceneButtons = Array.prototype.slice.call(root.querySelectorAll('[data-fr1-scene]'));
    var audioButton = root.querySelector('[data-fr1-toggle-audio]');
    var interruptedButton = root.querySelector('[data-fr1-pulled-away]');
    var finishButton = root.querySelector('[data-fr1-finish-softly]');

    function handleSceneClick(event) {
        actions.changeScene(event.currentTarget.getAttribute('data-fr1-scene'));
    }

    function handleAudioToggle() {
        actions.toggleAudio();
    }

    function handleInterrupted() {
        actions.markInterrupted();
    }

    function handleFinish() {
        actions.finishSoftly();
    }

    sceneButtons.forEach(function (button) {
        button.addEventListener('click', handleSceneClick);
    });

    if (audioButton) {
        audioButton.addEventListener('click', handleAudioToggle);
    }

    if (interruptedButton) {
        interruptedButton.addEventListener('click', handleInterrupted);
    }

    if (finishButton) {
        finishButton.addEventListener('click', handleFinish);
    }

    updateRoomScreen(root, context);

    return function cleanupRoomScreen() {
        sceneButtons.forEach(function (button) {
            button.removeEventListener('click', handleSceneClick);
        });

        if (audioButton) {
            audioButton.removeEventListener('click', handleAudioToggle);
        }

        if (interruptedButton) {
            interruptedButton.removeEventListener('click', handleInterrupted);
        }

        if (finishButton) {
            finishButton.removeEventListener('click', handleFinish);
        }
    };
}
