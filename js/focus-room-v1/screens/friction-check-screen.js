import { escapeHtml, renderStage } from './shared.js';

function renderMicroPromptPanel(context) {
    var emotion = context.derived.selectedEmotion;
    var microPrompt = context.state.microPrompt || context.derived.microPrompt;

    if (!emotion) {
        return '' +
            '<div class="fr1-panel fr1-panel--ghost fr1-preflight-panel fr1-preflight-panel--empty">' +
                '<span class="fr1-kicker">Micro-prompt</span>' +
                '<h2 class="fr1-section-title">Choose the emotional state that is closest right now</h2>' +
                '<p class="fr1-copy">Once you choose one, Quieta will turn it into a tiny concrete starting move you can accept, edit, or regenerate.</p>' +
            '</div>';
    }

    return '' +
        '<div class="fr1-panel fr1-panel--ghost fr1-preflight-panel">' +
            '<span class="fr1-kicker">Micro-prompt</span>' +
            '<h2 class="fr1-section-title">Start with something smaller than pressure</h2>' +
            '<p class="fr1-copy">Accept it, lightly edit it, or regenerate a different edge. This is the line that should make starting easier, not harder.</p>' +
            '<label class="fr1-input-label" for="fr1MicroPromptInput">' +
                '<span>Smallest next action</span>' +
                '<textarea class="fr1-textarea fr1-textarea--compact" id="fr1MicroPromptInput" data-fr1-micro-prompt-input maxlength="260" placeholder="Open the draft and only identify the sentence you want to touch first.">' + escapeHtml(microPrompt) + '</textarea>' +
            '</label>' +
            '<div class="fr1-inline-note">' +
                '<span>Anchor: ' + escapeHtml(context.state.firstStep || 'Still empty') + '</span>' +
                '<span>' + escapeHtml(emotion.support) + '</span>' +
                '<span>Suggested mode: ' + escapeHtml(context.derived.scene.label) + '</span>' +
            '</div>' +
            '<div class="fr1-actions">' +
                '<button class="fr1-button fr1-button--ghost" data-fr1-regenerate type="button">Regenerate</button>' +
                '<button class="fr1-button fr1-button--primary" data-fr1-enter-room type="button"' + (microPrompt.trim() ? '' : ' disabled') + '>Enter support layer</button>' +
            '</div>' +
        '</div>';
}

export function renderFrictionCheckScreen(context) {
    var choices = context.state.emotionalStates.map(function (emotion) {
        var selected = emotion.id === context.state.emotionalState;

        return '' +
            '<button class="fr1-choice' + (selected ? ' is-selected' : '') + '" data-fr1-emotion-choice="' + escapeHtml(emotion.id) + '" type="button" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
                '<strong>' + escapeHtml(emotion.label) + '</strong>' +
                '<span>' + escapeHtml(emotion.support) + '</span>' +
            '</button>';
    }).join('');

    return '' +
        '<section class="fr1-screen fr1-screen--pre-flight">' +
            renderStage(context.derived.scene, { quiet: true }) +
            '<div class="fr1-screen__content fr1-flow-layout">' +
                '<div class="fr1-preflight-grid">' +
                    '<div class="fr1-panel fr1-panel--ghost fr1-preflight-panel">' +
                        '<span class="fr1-kicker">Emotional Pre-flight</span>' +
                        '<h1 class="fr1-title-lg">What is the kindest read on the resistance right now?</h1>' +
                        '<p class="fr1-copy">Choose the closest emotional state. Quieta will turn it into a concrete micro-prompt instead of another management task.</p>' +
                        '<div class="fr1-choices fr1-choices--stacked">' + choices + '</div>' +
                        '<div class="fr1-inline-note">' +
                            '<span>Current anchor: ' + escapeHtml(context.state.firstStep || 'Still empty') + '</span>' +
                        '</div>' +
                        '<div class="fr1-actions">' +
                            '<button class="fr1-button fr1-button--subtle" data-fr1-back type="button">Back</button>' +
                        '</div>' +
                    '</div>' +
                    renderMicroPromptPanel(context) +
                '</div>' +
            '</div>' +
        '</section>';
}

export function bindFrictionCheckScreen(root, context, actions) {
    var choiceButtons = Array.prototype.slice.call(root.querySelectorAll('[data-fr1-emotion-choice]'));
    var backButton = root.querySelector('[data-fr1-back]');
    var regenerateButton = root.querySelector('[data-fr1-regenerate]');
    var enterButton = root.querySelector('[data-fr1-enter-room]');
    var microPromptInput = root.querySelector('[data-fr1-micro-prompt-input]');

    function syncContinueState() {
        if (!enterButton || !microPromptInput) {
            return;
        }

        enterButton.disabled = !microPromptInput.value.trim();
    }

    function handleChoiceClick(event) {
        var emotionalStateId = event.currentTarget.getAttribute('data-fr1-emotion-choice');
        actions.selectEmotionalState(emotionalStateId);
    }

    function handleBack() {
        actions.backToFirstStep();
    }

    function handleRegenerate() {
        actions.regenerateMicroPrompt();
    }

    function handleMicroPromptInput(event) {
        actions.updateMicroPrompt(event.currentTarget.value);
        syncContinueState();
    }

    function handleEnterRoom() {
        if (!microPromptInput || !microPromptInput.value.trim()) {
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

    if (regenerateButton) {
        regenerateButton.addEventListener('click', handleRegenerate);
    }

    if (microPromptInput) {
        microPromptInput.addEventListener('input', handleMicroPromptInput);
        window.setTimeout(function () {
            microPromptInput.focus();
            microPromptInput.setSelectionRange(microPromptInput.value.length, microPromptInput.value.length);
        }, 0);
    }

    if (enterButton) {
        enterButton.addEventListener('click', handleEnterRoom);
    }

    syncContinueState();

    return function cleanupFrictionCheckScreen() {
        choiceButtons.forEach(function (button) {
            button.removeEventListener('click', handleChoiceClick);
        });

        if (backButton) {
            backButton.removeEventListener('click', handleBack);
        }

        if (regenerateButton) {
            regenerateButton.removeEventListener('click', handleRegenerate);
        }

        if (microPromptInput) {
            microPromptInput.removeEventListener('input', handleMicroPromptInput);
        }

        if (enterButton) {
            enterButton.removeEventListener('click', handleEnterRoom);
        }
    };
}
