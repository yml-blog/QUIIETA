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

export function renderFrictionCheckScreen(context) {
    var choices = context.state.prompts.map(function (prompt) {
        var selected = prompt.id === context.state.selectedFrictionId;

        return '' +
            '<button class="fr1-choice' + (selected ? ' is-selected' : '') + '" data-fr1-friction-choice="' + escapeHtml(prompt.id) + '" type="button" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
                '<strong>' + escapeHtml(prompt.label) + '</strong>' +
                '<span>' + escapeHtml(prompt.support) + '</span>' +
            '</button>';
    }).join('');

    return '' +
        '<section class="fr1-screen fr1-screen--friction-check">' +
            renderStage(context.derived.scene) +
            '<div class="fr1-screen__content fr1-flow-layout">' +
                '<div class="fr1-panel fr1-panel--ghost fr1-flow-card">' +
                    '<span class="fr1-kicker">Friction Check</span>' +
                    '<h1 class="fr1-title-lg">What makes the return harder right now?</h1>' +
                    '<p class="fr1-copy">Choose the closest fit. This only shapes the room’s tone; it is not a diagnosis.</p>' +
                    '<div class="fr1-choices">' + choices + '</div>' +
                    '<div class="fr1-inline-note">' +
                        '<span>Current step: ' + escapeHtml(context.state.firstStep || 'Still empty') + '</span>' +
                    '</div>' +
                    '<div class="fr1-actions">' +
                        '<button class="fr1-button fr1-button--subtle" data-fr1-back type="button">Back</button>' +
                        '<button class="fr1-button fr1-button--primary" data-fr1-enter-room type="button"' + (context.state.selectedFrictionId ? '' : ' disabled') + '>Enter room</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</section>';
}

export function bindFrictionCheckScreen(root, context, actions) {
    var choiceButtons = Array.prototype.slice.call(root.querySelectorAll('[data-fr1-friction-choice]'));
    var backButton = root.querySelector('[data-fr1-back]');
    var enterButton = root.querySelector('[data-fr1-enter-room]');

    function handleChoiceClick(event) {
        var promptId = event.currentTarget.getAttribute('data-fr1-friction-choice');
        actions.selectFriction(promptId);
    }

    function handleBack() {
        actions.backToFirstStep();
    }

    function handleEnterRoom() {
        if (!context.state.selectedFrictionId) {
            return;
        }

        actions.enterRoom();
    }

    choiceButtons.forEach(function (button) {
        button.addEventListener('click', handleChoiceClick);
    });

    if (backButton) {
        backButton.addEventListener('click', handleBack);
    }

    if (enterButton) {
        enterButton.addEventListener('click', handleEnterRoom);
    }

    return function cleanupFrictionCheckScreen() {
        choiceButtons.forEach(function (button) {
            button.removeEventListener('click', handleChoiceClick);
        });

        if (backButton) {
            backButton.removeEventListener('click', handleBack);
        }

        if (enterButton) {
            enterButton.removeEventListener('click', handleEnterRoom);
        }
    };
}
