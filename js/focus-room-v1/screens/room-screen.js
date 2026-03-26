import { escapeHtml, renderStage } from './shared.js';

export function renderRoomScreen(context) {
    var roomModeButtons = context.derived.roomModes.map(function (mode) {
        var isActive = mode.key === context.state.roomMode;

        return '' +
            '<button class="fr1-scene-chip' + (isActive ? ' is-active' : '') + '" data-fr1-room-mode="' + escapeHtml(mode.key) + '" type="button" aria-pressed="' + (isActive ? 'true' : 'false') + '">' +
                escapeHtml(mode.label) +
            '</button>';
    }).join('');

    return '' +
        '<section class="fr1-screen fr1-screen--room">' +
            renderStage(context.derived.scene, { presenceMode: context.state.presenceMode }) +
            '<div class="fr1-screen__content fr1-room-shell" data-fr1-room-shell data-fr1-room-ui="active">' +
                '<div class="fr1-room-topbar fr1-room-ambient" data-fr1-room-ambient>' +
                    '<div class="fr1-room-brand">' +
                        '<span class="fr1-kicker">Quieta</span>' +
                        '<p class="fr1-muted">Start gently. Return softly.</p>' +
                    '</div>' +
                    '<div class="fr1-room-toggle-row">' +
                        '<button class="fr1-button fr1-button--ghost fr1-button--quiet" data-fr1-toggle-presence type="button">' + escapeHtml(context.derived.presence.label) + '</button>' +
                        '<button class="fr1-button fr1-button--ghost fr1-button--quiet" data-fr1-toggle-audio type="button" data-fr1-audio-label>' + escapeHtml(context.derived.audioLabel) + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="fr1-room-grid">' +
                    '<article class="fr1-panel fr1-panel--ghost fr1-room-intent">' +
                        '<span class="fr1-kicker">Visible Next Action</span>' +
                        '<h1 class="fr1-room-step">' + escapeHtml(context.derived.nextAction) + '</h1>' +
                        '<p class="fr1-room-support">' + escapeHtml(context.derived.supportLine) + '</p>' +
                        '<div class="fr1-room-anchor">' +
                            '<div class="fr1-room-anchor-row">' +
                                '<strong>Anchor</strong>' +
                                '<span>' + escapeHtml(context.state.firstStep || 'Keep the next move visible.') + '</span>' +
                            '</div>' +
                            '<div class="fr1-room-anchor-row">' +
                                '<strong>Micro-prompt</strong>' +
                                '<span>' + escapeHtml(context.derived.microPrompt) + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="fr1-room-meta">' +
                            '<span>' + escapeHtml(context.derived.scene.label) + '</span>' +
                            '<span>' + escapeHtml(context.derived.scene.sub) + '</span>' +
                        '</div>' +
                    '</article>' +
                    '<aside class="fr1-room-sidebar fr1-room-ambient" data-fr1-room-ambient>' +
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
                            '<span class="fr1-kicker">Regulation Mode</span>' +
                            '<p class="fr1-muted">' + escapeHtml(context.derived.scene.roomLine) + '</p>' +
                            '<div class="fr1-scene-list">' + roomModeButtons + '</div>' +
                        '</section>' +
                        '<section class="fr1-panel fr1-panel--ghost fr1-room-card">' +
                            '<span class="fr1-kicker">Ready To Resume</span>' +
                            '<div class="fr1-room-plan">' +
                                '<div class="fr1-room-plan-row">' +
                                    '<strong>Where</strong>' +
                                    '<span>' + escapeHtml(context.derived.resume.whereIStopped || 'When you step away, leave the edge you reached.') + '</span>' +
                                '</div>' +
                                '<div class="fr1-room-plan-row">' +
                                    '<strong>Next</strong>' +
                                    '<span>' + escapeHtml(context.derived.resume.nextVisibleAction) + '</span>' +
                                '</div>' +
                                '<div class="fr1-room-plan-row">' +
                                    '<strong>Remember</strong>' +
                                    '<span>' + escapeHtml(context.derived.resume.dontForget) + '</span>' +
                                '</div>' +
                            '</div>' +
                            '<p class="fr1-muted">' + escapeHtml(context.derived.presence.detail) + '</p>' +
                        '</section>' +
                    '</aside>' +
                '</div>' +
                '<div class="fr1-room-actions fr1-room-ambient" data-fr1-room-ambient>' +
                    '<span class="fr1-muted fr1-room-fade-note">Controls fade after a few quiet seconds so the next action can stay in front.</span>' +
                    '<div class="fr1-room-toggle-row">' +
                        '<button class="fr1-button fr1-button--subtle" data-fr1-pulled-away type="button">Leave a return plan</button>' +
                        '<button class="fr1-button fr1-button--ghost" data-fr1-finish-softly type="button">Finish softly</button>' +
                    '</div>' +
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
    var roomModeButtons = Array.prototype.slice.call(root.querySelectorAll('[data-fr1-room-mode]'));
    var audioButton = root.querySelector('[data-fr1-toggle-audio]');
    var presenceButton = root.querySelector('[data-fr1-toggle-presence]');
    var interruptedButton = root.querySelector('[data-fr1-pulled-away]');
    var finishButton = root.querySelector('[data-fr1-finish-softly]');
    var shell = root.querySelector('[data-fr1-room-shell]');
    var quietTimer = 0;
    var idleEvents = ['pointermove', 'pointerdown', 'keydown', 'focusin'];
    var autoQuietEnabled = typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: fine)').matches
        : false;

    function setUiState(state) {
        if (!shell) {
            return;
        }

        shell.setAttribute('data-fr1-room-ui', state);
    }

    function armQuietTimer() {
        window.clearTimeout(quietTimer);
        setUiState('active');

        if (!autoQuietEnabled) {
            return;
        }

        quietTimer = window.setTimeout(function () {
            setUiState('quiet');
        }, 5200);
    }

    function handleRoomModeClick(event) {
        actions.changeRoomMode(event.currentTarget.getAttribute('data-fr1-room-mode'));
    }

    function handleAudioToggle() {
        actions.toggleAudio();
    }

    function handlePresenceToggle() {
        actions.togglePresenceMode();
    }

    function handleInterrupted() {
        actions.markInterrupted();
    }

    function handleFinish() {
        actions.finishSoftly();
    }

    roomModeButtons.forEach(function (button) {
        button.addEventListener('click', handleRoomModeClick);
    });

    if (audioButton) {
        audioButton.addEventListener('click', handleAudioToggle);
    }

    if (presenceButton) {
        presenceButton.addEventListener('click', handlePresenceToggle);
    }

    if (interruptedButton) {
        interruptedButton.addEventListener('click', handleInterrupted);
    }

    if (finishButton) {
        finishButton.addEventListener('click', handleFinish);
    }

    idleEvents.forEach(function (eventName) {
        root.addEventListener(eventName, armQuietTimer, true);
    });

    updateRoomScreen(root, context);
    armQuietTimer();

    return function cleanupRoomScreen() {
        window.clearTimeout(quietTimer);

        roomModeButtons.forEach(function (button) {
            button.removeEventListener('click', handleRoomModeClick);
        });

        if (audioButton) {
            audioButton.removeEventListener('click', handleAudioToggle);
        }

        if (presenceButton) {
            presenceButton.removeEventListener('click', handlePresenceToggle);
        }

        if (interruptedButton) {
            interruptedButton.removeEventListener('click', handleInterrupted);
        }

        if (finishButton) {
            finishButton.removeEventListener('click', handleFinish);
        }

        idleEvents.forEach(function (eventName) {
            root.removeEventListener(eventName, armQuietTimer, true);
        });
    };
}
