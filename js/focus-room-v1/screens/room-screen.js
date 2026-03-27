import { escapeHtml, renderStage } from './shared.js';

function syncStage(root, context) {
    var stage = root.querySelector('.fr1-stage');
    var video = root.querySelector('.fr1-stage__video');
    var playRequest = null;
    var source = video ? video.querySelector('source') : null;
    var classes = ['fr1-stage'];

    if (context.derived.scene && context.derived.scene.stageClass) {
        classes.push(context.derived.scene.stageClass);
    }

    if (context.state.presenceMode) {
        classes.push('fr1-stage--presence-on');
    }

    if (stage) {
        stage.className = classes.join(' ');
    }

    if (!video) {
        return;
    }

    if (source && source.getAttribute('src') !== context.derived.scene.videoSrc) {
        source.setAttribute('src', context.derived.scene.videoSrc);
        video.load();
    } else if (!source && video.getAttribute('src') !== context.derived.scene.videoSrc) {
        video.setAttribute('src', context.derived.scene.videoSrc);
        video.load();
    }

    if (typeof video.play === 'function') {
        playRequest = video.play();

        if (playRequest && typeof playRequest.catch === 'function') {
            playRequest.catch(function () {
                return null;
            });
        }
    }
}

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
            '<div class="fr1-screen__content fr1-room-shell" data-fr1-room-shell data-fr1-room-sheet="closed">' +
                '<div class="fr1-room-topbar">' +
                    '<span class="fr1-room-mode-label" data-fr1-room-mode-label>Mode: ' + escapeHtml(context.derived.scene.label) + '</span>' +
                    '<button class="fr1-button fr1-button--ghost fr1-button--quiet" data-fr1-toggle-room-sheet type="button" aria-expanded="false" aria-controls="fr1RoomSheet">Room</button>' +
                '</div>' +
                '<article class="fr1-panel fr1-panel--ghost fr1-room-focus-card">' +
                    '<span class="fr1-kicker">Next Visible Action</span>' +
                    '<h1 class="fr1-room-step" data-fr1-next-action>' + escapeHtml(context.derived.nextAction) + '</h1>' +
                    '<p class="fr1-room-support" data-fr1-support-line>' + escapeHtml(context.derived.supportLine) + '</p>' +
                    '<div class="fr1-room-primary">' +
                        '<button class="fr1-button fr1-button--primary" data-fr1-leave-plan type="button">Leave a return plan</button>' +
                    '</div>' +
                    '<button class="fr1-room-inline-action" data-fr1-toggle-rescue type="button" aria-expanded="false">I\'m stuck again</button>' +
                    '<div class="fr1-room-rescue" data-fr1-room-rescue hidden>' +
                        '<button class="fr1-scene-chip" data-fr1-rescue="smaller" type="button">Make it smaller</button>' +
                        '<button class="fr1-scene-chip" data-fr1-rescue="less-final" type="button">Make it less final</button>' +
                    '</div>' +
                '</article>' +
                '<div class="fr1-room-sheet-layer" data-fr1-room-sheet-layer>' +
                    '<button class="fr1-room-sheet-backdrop" data-fr1-close-room type="button" aria-label="Close room controls"></button>' +
                    '<aside class="fr1-panel fr1-panel--ghost fr1-room-sheet" id="fr1RoomSheet" data-fr1-room-sheet-panel aria-hidden="true">' +
                        '<div class="fr1-room-sheet-head">' +
                            '<h2 class="fr1-section-title">Room</h2>' +
                            '<button class="fr1-button fr1-button--ghost fr1-button--quiet" data-fr1-close-room type="button">Close</button>' +
                        '</div>' +
                        '<section class="fr1-room-setting">' +
                            '<div class="fr1-room-setting-copy">' +
                                '<span class="fr1-room-setting-label">Sound</span>' +
                                '<p class="fr1-muted" data-fr1-audio-name>' + escapeHtml(context.derived.audioName) + '</p>' +
                            '</div>' +
                            '<button class="fr1-button fr1-button--subtle" data-fr1-toggle-audio type="button" data-fr1-audio-label>' + escapeHtml(context.derived.audioLabel) + '</button>' +
                        '</section>' +
                        '<section class="fr1-room-setting">' +
                            '<div class="fr1-room-setting-copy">' +
                                '<span class="fr1-room-setting-label">Co-presence</span>' +
                                '<p class="fr1-muted" data-fr1-presence-detail>' + escapeHtml(context.derived.presence.detail) + '</p>' +
                            '</div>' +
                            '<button class="fr1-button fr1-button--subtle" data-fr1-toggle-presence type="button" data-fr1-presence-label>' + escapeHtml(context.derived.presence.label) + '</button>' +
                        '</section>' +
                        '<section class="fr1-room-setting fr1-room-setting--stacked">' +
                            '<div class="fr1-room-setting-copy">' +
                                '<span class="fr1-room-setting-label">Mode</span>' +
                                '<p class="fr1-muted">Set automatically. Change only if you need to.</p>' +
                            '</div>' +
                            '<div class="fr1-scene-list">' + roomModeButtons + '</div>' +
                        '</section>' +
                        '<div class="fr1-room-sheet-actions">' +
                            '<button class="fr1-button fr1-button--ghost" data-fr1-finish-softly type="button">Finish softly</button>' +
                        '</div>' +
                    '</aside>' +
                '</div>' +
            '</div>' +
        '</section>';
}

export function updateRoomScreen(root, context) {
    var nextAction = root.querySelector('[data-fr1-next-action]');
    var supportLine = root.querySelector('[data-fr1-support-line]');
    var modeLabel = root.querySelector('[data-fr1-room-mode-label]');
    var audioLabel = root.querySelector('[data-fr1-audio-label]');
    var audioName = root.querySelector('[data-fr1-audio-name]');
    var presenceLabel = root.querySelector('[data-fr1-presence-label]');
    var presenceDetail = root.querySelector('[data-fr1-presence-detail]');
    var roomModeButtons = Array.prototype.slice.call(root.querySelectorAll('[data-fr1-room-mode]'));

    syncStage(root, context);

    if (nextAction) {
        nextAction.textContent = context.derived.nextAction;
    }

    if (supportLine) {
        supportLine.textContent = context.derived.supportLine;
    }

    if (modeLabel) {
        modeLabel.textContent = 'Mode: ' + context.derived.scene.label;
    }

    if (audioLabel) {
        audioLabel.textContent = context.derived.audioLabel;
    }

    if (audioName) {
        audioName.textContent = context.derived.audioName;
    }

    if (presenceLabel) {
        presenceLabel.textContent = context.derived.presence.label;
    }

    if (presenceDetail) {
        presenceDetail.textContent = context.derived.presence.detail;
    }

    roomModeButtons.forEach(function (button) {
        var isActive = button.getAttribute('data-fr1-room-mode') === context.state.roomMode;

        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        button.classList.toggle('is-active', isActive);
    });
}

export function bindRoomScreen(root, context, actions) {
    var roomModeButtons = Array.prototype.slice.call(root.querySelectorAll('[data-fr1-room-mode]'));
    var audioButton = root.querySelector('[data-fr1-toggle-audio]');
    var presenceButton = root.querySelector('[data-fr1-toggle-presence]');
    var leavePlanButton = root.querySelector('[data-fr1-leave-plan]');
    var finishButton = root.querySelector('[data-fr1-finish-softly]');
    var shell = root.querySelector('[data-fr1-room-shell]');
    var roomSheet = root.querySelector('[data-fr1-room-sheet-panel]');
    var roomToggleButton = root.querySelector('[data-fr1-toggle-room-sheet]');
    var closeRoomButtons = Array.prototype.slice.call(root.querySelectorAll('[data-fr1-close-room]'));
    var rescueToggleButton = root.querySelector('[data-fr1-toggle-rescue]');
    var rescuePanel = root.querySelector('[data-fr1-room-rescue]');
    var rescueButtons = Array.prototype.slice.call(root.querySelectorAll('[data-fr1-rescue]'));

    function setRoomSheetOpen(isOpen) {
        if (!shell || !roomSheet || !roomToggleButton) {
            return;
        }

        shell.setAttribute('data-fr1-room-sheet', isOpen ? 'open' : 'closed');
        roomSheet.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        roomToggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    function setRescueOpen(isOpen) {
        if (!rescuePanel || !rescueToggleButton) {
            return;
        }

        rescuePanel.hidden = !isOpen;
        rescueToggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
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

    function handleLeavePlan() {
        actions.leaveReturnPlan();
    }

    function handleFinish() {
        actions.openSoftFinish();
    }

    function handleOpenRoomSheet() {
        var isOpen = roomToggleButton && roomToggleButton.getAttribute('aria-expanded') === 'true';

        setRoomSheetOpen(!isOpen);
    }

    function handleCloseRoomSheet() {
        setRoomSheetOpen(false);
    }

    function handleRescueToggle() {
        var isOpen = rescueToggleButton && rescueToggleButton.getAttribute('aria-expanded') === 'true';

        setRescueOpen(!isOpen);
    }

    function handleRescueChoice(event) {
        setRescueOpen(false);
        actions.rewriteMicroPrompt(event.currentTarget.getAttribute('data-fr1-rescue'));
    }

    function handleKeyDown(event) {
        if (event.key !== 'Escape') {
            return;
        }

        if (roomSheet && roomSheet.getAttribute('aria-hidden') === 'false') {
            setRoomSheetOpen(false);
            return;
        }

        if (rescueToggleButton && rescueToggleButton.getAttribute('aria-expanded') === 'true') {
            setRescueOpen(false);
        }
    }

    roomModeButtons.forEach(function (button) {
        button.addEventListener('click', handleRoomModeClick);
    });

    rescueButtons.forEach(function (button) {
        button.addEventListener('click', handleRescueChoice);
    });

    if (audioButton) {
        audioButton.addEventListener('click', handleAudioToggle);
    }

    if (presenceButton) {
        presenceButton.addEventListener('click', handlePresenceToggle);
    }

    if (leavePlanButton) {
        leavePlanButton.addEventListener('click', handleLeavePlan);
    }

    if (finishButton) {
        finishButton.addEventListener('click', handleFinish);
    }

    if (roomToggleButton) {
        roomToggleButton.addEventListener('click', handleOpenRoomSheet);
    }

    closeRoomButtons.forEach(function (button) {
        button.addEventListener('click', handleCloseRoomSheet);
    });

    if (rescueToggleButton) {
        rescueToggleButton.addEventListener('click', handleRescueToggle);
    }

    root.addEventListener('keydown', handleKeyDown);

    updateRoomScreen(root, context);
    setRoomSheetOpen(false);
    setRescueOpen(false);

    return function cleanupRoomScreen() {
        roomModeButtons.forEach(function (button) {
            button.removeEventListener('click', handleRoomModeClick);
        });

        rescueButtons.forEach(function (button) {
            button.removeEventListener('click', handleRescueChoice);
        });

        if (audioButton) {
            audioButton.removeEventListener('click', handleAudioToggle);
        }

        if (presenceButton) {
            presenceButton.removeEventListener('click', handlePresenceToggle);
        }

        if (leavePlanButton) {
            leavePlanButton.removeEventListener('click', handleLeavePlan);
        }

        if (finishButton) {
            finishButton.removeEventListener('click', handleFinish);
        }

        if (roomToggleButton) {
            roomToggleButton.removeEventListener('click', handleOpenRoomSheet);
        }

        closeRoomButtons.forEach(function (button) {
            button.removeEventListener('click', handleCloseRoomSheet);
        });

        if (rescueToggleButton) {
            rescueToggleButton.removeEventListener('click', handleRescueToggle);
        }

        root.removeEventListener('keydown', handleKeyDown);
    };
}
