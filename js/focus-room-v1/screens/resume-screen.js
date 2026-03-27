import { escapeHtml, renderStage } from './shared.js';

function getResumeCopy(reason) {
    if (reason === 'soft-finish') {
        return {
            title: 'Leave one clear edge before you close',
            body: 'One short line in each field is enough.'
        };
    }

    if (reason === 'return-after-interruption') {
        return {
            title: 'Welcome back',
            body: 'Pick up one visible thread.'
        };
    }

    return {
        title: 'Leave a return plan',
        body: 'Just enough to make re-entry easy.'
    };
}

export function renderResumeScreen(context) {
    var copy = getResumeCopy(context.derived.resume.reason);

    return '' +
        '<section class="fr1-screen fr1-screen--resume">' +
            renderStage(context.derived.scene, { presenceMode: context.state.presenceMode, quiet: true }) +
            '<div class="fr1-screen__content fr1-resume-layout">' +
                '<div class="fr1-panel fr1-panel--ghost fr1-resume-card">' +
                    '<span class="fr1-kicker">Return Plan</span>' +
                    '<h1 class="fr1-title-lg">' + escapeHtml(copy.title) + '</h1>' +
                    '<p class="fr1-copy">' + escapeHtml(copy.body) + '</p>' +
                    '<div class="fr1-resume-form">' +
                        '<label class="fr1-input-label" for="fr1ResumeWhere">' +
                            '<span>Where</span>' +
                            '<textarea class="fr1-textarea fr1-textarea--compact" id="fr1ResumeWhere" data-fr1-resume-field="whereIStopped" maxlength="220" placeholder="Draft open. Mid-paragraph.">' + escapeHtml(context.derived.resume.whereIStopped) + '</textarea>' +
                        '</label>' +
                        '<label class="fr1-input-label" for="fr1ResumeNext">' +
                            '<span>Next</span>' +
                            '<textarea class="fr1-textarea fr1-textarea--compact" id="fr1ResumeNext" data-fr1-resume-field="nextVisibleAction" maxlength="220" placeholder="Rewrite the first sentence only.">' + escapeHtml(context.derived.resume.nextVisibleAction) + '</textarea>' +
                        '</label>' +
                        '<label class="fr1-input-label" for="fr1ResumeRemember">' +
                            '<span>Remember</span>' +
                            '<textarea class="fr1-textarea fr1-textarea--compact" id="fr1ResumeRemember" data-fr1-resume-field="dontForget" maxlength="220" placeholder="Rough is enough when I return.">' + escapeHtml(context.derived.resume.dontForget) + '</textarea>' +
                        '</label>' +
                    '</div>' +
                    '<div class="fr1-inline-note">' +
                        '<span>Mode: ' + escapeHtml(context.derived.resume.roomModeLabel) + '</span>' +
                        '<span>' + escapeHtml(context.derived.resume.emotionalLabel) + '</span>' +
                        '<span>Saved locally</span>' +
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
        actions.completeSoftFinish();
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
