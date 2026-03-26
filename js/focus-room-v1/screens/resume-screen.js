import { escapeHtml, renderStage } from './shared.js';

export function renderResumeScreen(context) {
    var title = context.derived.resume.needsCapture
        ? 'Leave a soft edge to return to'
        : 'Your return path is already waiting';
    var body = context.derived.resume.needsCapture
        ? 'Write just enough that future-you can re-enter without rebuilding the whole context.'
        : 'Everything here is saved locally. Future-you should only need to pick up one visible thread.';

    return '' +
        '<section class="fr1-screen fr1-screen--resume">' +
            renderStage(context.derived.scene, { presenceMode: context.state.presenceMode, quiet: true }) +
            '<div class="fr1-screen__content fr1-resume-layout">' +
                '<div class="fr1-panel fr1-panel--ghost fr1-resume-card">' +
                    '<span class="fr1-kicker">Ready To Resume</span>' +
                    '<h1 class="fr1-title-lg">' + escapeHtml(title) + '</h1>' +
                    '<p class="fr1-copy">' + escapeHtml(body) + '</p>' +
                    '<div class="fr1-resume-grid fr1-resume-grid--summary">' +
                        '<div class="fr1-resume-block">' +
                            '<strong>Emotional state</strong>' +
                            '<span>' + escapeHtml(context.derived.resume.emotionalLabel) + '</span>' +
                        '</div>' +
                        '<div class="fr1-resume-block">' +
                            '<strong>Regulation mode</strong>' +
                            '<span>' + escapeHtml(context.derived.resume.roomModeLabel) + '</span>' +
                        '</div>' +
                        '<div class="fr1-resume-block">' +
                            '<strong>Micro-prompt</strong>' +
                            '<span>' + escapeHtml(context.derived.resume.microPrompt) + '</span>' +
                        '</div>' +
                        '<div class="fr1-resume-block">' +
                            '<strong>Last active</strong>' +
                            '<span>' + escapeHtml(context.derived.resume.updatedText) + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="fr1-resume-form">' +
                        '<label class="fr1-input-label" for="fr1ResumeWhere">' +
                            '<span>Where I stopped</span>' +
                            '<textarea class="fr1-textarea fr1-textarea--compact" id="fr1ResumeWhere" data-fr1-resume-field="whereIStopped" maxlength="220" placeholder="I had the draft open and had just outlined the middle section.">' + escapeHtml(context.derived.resume.whereIStopped) + '</textarea>' +
                        '</label>' +
                        '<label class="fr1-input-label" for="fr1ResumeNext">' +
                            '<span>Next visible action</span>' +
                            '<textarea class="fr1-textarea fr1-textarea--compact" id="fr1ResumeNext" data-fr1-resume-field="nextVisibleAction" maxlength="220" placeholder="Read the last paragraph and only rewrite the opening sentence.">' + escapeHtml(context.derived.resume.nextVisibleAction) + '</textarea>' +
                        '</label>' +
                        '<label class="fr1-input-label" for="fr1ResumeRemember">' +
                            '<span>Do not forget</span>' +
                            '<textarea class="fr1-textarea fr1-textarea--compact" id="fr1ResumeRemember" data-fr1-resume-field="dontForget" maxlength="220" placeholder="The structure is already good enough. I only need to reduce friction when I return.">' + escapeHtml(context.derived.resume.dontForget) + '</textarea>' +
                        '</label>' +
                    '</div>' +
                    '<div class="fr1-inline-note">' +
                        '<span>Saved locally as you type.</span>' +
                        '<span>' + escapeHtml(context.derived.resume.presenceLabel) + '</span>' +
                        '<span>' + escapeHtml(context.derived.scene.returnLine) + '</span>' +
                    '</div>' +
                    '<div class="fr1-actions">' +
                        '<button class="fr1-button fr1-button--primary" data-fr1-return type="button">Return softly</button>' +
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
    var fields = Array.prototype.slice.call(root.querySelectorAll('[data-fr1-resume-field]'));

    function handleReturn() {
        actions.returnToRoom();
    }

    function handleFinish() {
        actions.finishSoftly();
    }

    function handleStartOver() {
        actions.startOver();
    }

    function handleFieldInput(event) {
        actions.updateResumeField(
            event.currentTarget.getAttribute('data-fr1-resume-field'),
            event.currentTarget.value
        );
    }

    fields.forEach(function (field) {
        field.addEventListener('input', handleFieldInput);
    });

    if (returnButton) {
        returnButton.addEventListener('click', handleReturn);
    }

    if (finishButton) {
        finishButton.addEventListener('click', handleFinish);
    }

    if (startOverButton) {
        startOverButton.addEventListener('click', handleStartOver);
    }

    window.setTimeout(function () {
        var firstEmptyField = null;

        fields.some(function (field) {
            if (!field.value.trim()) {
                firstEmptyField = field;
                return true;
            }

            return false;
        });

        if (firstEmptyField) {
            firstEmptyField.focus();
            firstEmptyField.setSelectionRange(firstEmptyField.value.length, firstEmptyField.value.length);
        }
    }, 0);

    return function cleanupResumeScreen() {
        fields.forEach(function (field) {
            field.removeEventListener('input', handleFieldInput);
        });

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
