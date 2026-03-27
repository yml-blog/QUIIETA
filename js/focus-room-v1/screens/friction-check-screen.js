import { escapeHtml, renderStage } from './shared.js';

function renderEmotionStep(context) {
    var choices = context.state.emotionalStates.map(function (emotion) {
        var selected = emotion.id === context.state.emotionalState;

        return '' +
            '<button class="fr1-choice' + (selected ? ' is-selected' : '') + '" data-fr1-emotion-choice="' + escapeHtml(emotion.id) + '" type="button" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
                '<strong>' + escapeHtml(emotion.label) + '</strong>' +
                '<span>' + escapeHtml(emotion.support) + '</span>' +
            '</button>';
    }).join('');

    return '' +
        '<div class="fr1-panel fr1-panel--ghost fr1-flow-card fr1-flow-card--compact">' +
            '<span class="fr1-kicker">Emotional State</span>' +
            '<h1 class="fr1-title-lg">What is making this hard right now?</h1>' +
            '<p class="fr1-copy">Choose one. We will make the next move smaller.</p>' +
            '<div class="fr1-choices fr1-choices--stacked">' + choices + '</div>' +
            '<div class="fr1-actions">' +
                '<button class="fr1-button fr1-button--subtle" data-fr1-back type="button">Back</button>' +
            '</div>' +
        '</div>';
}

function renderMicroPromptStep(context) {
    var emotion = context.derived.selectedEmotion;
    var microPrompt = context.state.microPrompt || context.derived.microPrompt;

    return '' +
        '<div class="fr1-panel fr1-panel--ghost fr1-flow-card fr1-flow-card--compact">' +
            '<span class="fr1-kicker">Micro-prompt</span>' +
            '<h1 class="fr1-title-lg">Try this next</h1>' +
            '<p class="fr1-copy">' + escapeHtml(emotion ? emotion.support : 'Keep it light enough to touch.') + '</p>' +
            '<label class="fr1-input-label" for="fr1MicroPromptInput">' +
                '<span>Next move</span>' +
                '<textarea class="fr1-textarea fr1-textarea--compact" id="fr1MicroPromptInput" data-fr1-micro-prompt-input maxlength="260" placeholder="Open the draft and only rewrite the title.">' + escapeHtml(microPrompt) + '</textarea>' +
            '</label>' +
            '<div class="fr1-actions">' +
                '<button class="fr1-button fr1-button--ghost" data-fr1-regenerate type="button">Regenerate</button>' +
                '<button class="fr1-button fr1-button--primary" data-fr1-enter-room type="button"' + (microPrompt.trim() ? '' : ' disabled') + '>Continue</button>' +
            '</div>' +
        '</div>';
}

export function renderFrictionCheckScreen(context) {
    var view = context.state.preFlightStep === 'micro-prompt' && context.state.emotionalState
        ? 'micro-prompt'
        : 'emotion';

    return '' +
        '<section class="fr1-screen fr1-screen--pre-flight">' +
            renderStage(context.derived.scene, { quiet: true }) +
            '<div class="fr1-screen__content fr1-flow-layout">' +
                (view === 'micro-prompt' ? renderMicroPromptStep(context) : renderEmotionStep(context)) +
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
