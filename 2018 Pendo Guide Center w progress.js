(function (dom, launcher) {
    var openClass = '_pendo-launcher-accordion-open_';
    var emptyClass = '_pendo-launcher-whatsnew-empty_';
    var displayingClass = '_pendo-launcher-search-displaying_';
    var guideStatus = launcher.guideStatus;
    launcher.guideStatus = function (guide) {
        if (pendo._.isFunction(this.getOnboardingState)) {
            return this.getOnboardingState(guide);
        } else {
            return guideStatus(guide);
        }
    };

    launcher.formatDate = formatDate;
    launcher.after('update', updateBadge);
    launcher.after('update', updateEmptyState);
    launcher.after('updateLauncherContent', backToSearchResults);

    dom('._pendo-launcher_').on('click', '._pendo-launcher-accordion_ > button', function (e) {
        var accordion = dom(eventTarget(e)).closest('._pendo-launcher-accordion_');
        // Note: if you have nested accordions and resuse the '_pendo-launcher-accordion-open_'
        // class it will close all open nested accordions as well
        var openAccordion = dom('._pendo-launcher_ .' + openClass);

        dom('._pendo-launcher_ ._pendo-launcher-guide-listing_').css({ height: 0 });

        if (openAccordion && (openAccordion[0] !== accordion[0])) {
            openAccordion.toggleClass(openClass);
        }

        accordion.toggleClass(openClass);

        if (accordion.hasClass(openClass)) {
            var used = pendo.dom('._pendo-launcher-header_').height() + pendo.dom('._pendo-launcher-body_').height();
            var launcherContent = pendo.dom('._pendo-launcher-content_');
            var launcherContentStyle = dom.getComputedStyle(launcherContent[0]);
            if (launcherContentStyle && launcherContentStyle.borderTopWidth) {
                var borderTopWidth = parseInt(launcherContentStyle.borderTopWidth.replace(/\D+/g, ''), 10);
                if (!isNaN(borderTopWidth)) {
                    used += borderTopWidth; // Offset by the content's top border
                }
            }
            var newHeight = launcherContent.height() - used;
            accordion.find('._pendo-launcher-guide-listing_').css({ height: newHeight });
        }
    }).on('click', '._pendo-launcher-clear-search_', function () {
        launcher.data.search.clear();
    }).on('click', '._pendo-launcher-search-results_ ._pendo-launcher-whatsnew-item_', function (e) {
        var item = dom(eventTarget(e)).closest('._pendo-launcher-item_');
        var id = item.attr('id');
        var step = findStepByGuideId(id);
        if (!step) return;
        dom('._pendo-launcher-search-results_').addClass(displayingClass);
        dom('._pendo-launcher-search-display_ h4').html(launcher.data.whatsnew.title + ' > ' + step.guide.name);
        dom('<div class="_pendo-launcher-item_" id="launcher-' + id + '" data-id="' + id + '"></div>')
            .appendTo('._pendo-launcher-search-display_');
        step.guideElement.remove();
        step.guide.addToLauncher();
        highlightTermsInGuideContent(step.guideElement[0]);
    }).on('click', '._pendo-launcher-search-results_ ._pendo-launcher-search-return_', function () {
        var placeholder = dom('._pendo-launcher-search-display_').find('[data-id]');
        backToSearchResults();
        var step = findStepByGuideId(placeholder.attr('data-id'));
        if (!step) return;
        placeholder.remove();
        step.guideElement.html('').remove(); // Force to re-render, since we highlighted stuff
        step.render();
        step.guide.addToLauncher();
    });

    function eventTarget (e) {
        return e && e.target || e.srcElement;
    }

    function backToSearchResults () {
        dom('._pendo-launcher-search-results_').removeClass(displayingClass);
    }

    function highlightTermsInGuideContent (guideElement) {
        if (!guideElement || !launcher.data.search || !launcher.data.search.text) return;
        var regex = new RegExp(launcher.data.search.text, 'gi');
        guideElement.innerHTML = guideElement.innerHTML.replace(regex, function (match) {
            return '<span class="_pendo-launcher-search-highlight_">' + match + '</span>';
        });
    }

    function findStepByGuideId (guideId) {
        var guide = pendo.findGuideById(guideId);
        return guide && guide.steps[0];
    }

    function updateEmptyState () {
        var whatsnewAccordion = dom('._pendo-launcher-whatsnew_');
        var count = pendo._.size(launcher.data.whatsnew.guides);
        if (count) {
            whatsnewAccordion.removeClass(emptyClass);
        } else {
            whatsnewAccordion.addClass(emptyClass);
        }
    }

    function updateBadge () {
        var count = launcher.data.whatsnew.unseenCount;
        var badge = dom('._pendo-launcher-whatsnew_ ._pendo-launcher-whatsnew-count_');
        var visible = 'visible';
        if (count) {
            badge.addClass(visible);
        } else {
            badge.removeClass(visible);
        }
        badge.html(count);
    }

    function formatDate (date) {
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (!date) {
            return;
        }
        if (!pendo._.isDate(date)) {
            date = new Date(date);
        }

        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();

        return months[month] + ' ' + day + ', ' + year;
    }
}(pendo.dom, pendo.guideWidget));



// handles the percentage fill and ticking counter for large bottom percetage bar for onboarding module
// assumes the following html structure (adjust classes as needed)

// <div class='_pendo-launcher-onboarding-progress_'>
//     <div class='_pendo-progress-area-inner_'>
//         <div class='_pendo-progress-bar-outer_'>
//             <div class='_pendo-progress-bar-inner_'>
//             </div>
//         </div>
//     </div>
//     <label class='_pendo-onboarding-progress_'>
//         <span class="percent-complete"></span>% Complete
//     </label>
// </div>


function updateOverallProgressUI() {
    var percentComplete = pendo.guideWidget.onboarding.percentComplete;
    dom('._pendo-progress-bar-inner_').css('width: ' + percentComplete + '%');
    dom('span.percent-complete').html(percentComplete);
    $('span.percent-complete').each(function() {
        $(this).prop('Counter', 0).animate({
            Counter: $(this).text()
        }, {
            duration: 2000,
            delay: 600,
            easing: 'swing',
            step: function(now) {
                $(this).text(Math.ceil(now));
            }
        });
    });
}