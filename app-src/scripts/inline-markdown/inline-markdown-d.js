/**
 * @ngdoc directive
 * @name superProductivity.directive:inlineMarkdown
 * @description
 * # inlineMarkdown
 */

(function() {
  'use strict';

  angular
    .module('superProductivity')
    .directive('inlineMarkdown', inlineMarkdown);

  /* @ngInject */
  function inlineMarkdown() {
    return {
      templateUrl: 'scripts/inline-markdown/inline-markdown-d.html',
      bindToController: true,
      controller: InlineMarkdownCtrl,
      controllerAs: 'vm',
      restrict: 'E',
      scope: {
        ngModel: '=',
        onEditFinished: '&'
      }
    };
  }

  /* @ngInject */
  function InlineMarkdownCtrl($timeout, $element, IS_ELECTRON, $scope) {
    let vm = this;
    let waitForMarkedTimeOut;
    let textareaEl;
    let ngModelCopy;
    let textareaTimeout;
    const wrapperEl = $element.children();

    const keypressHandler = ($event) => {
      if ($event.keyCode === 10 && $event.ctrlKey) {
        vm.untoggleShowEdit();
      }
    };

    function makeLinksWorkForElectron() {
      if (IS_ELECTRON) {
        const shell = require('electron').shell;
        const links = $element.find('a');

        links.on('click', (event) => {
          let url = angular.element(event.target).attr('href');

          if (!/^https?:\/\//i.test(url)) {
            url = 'http://' + url;
          }
          event.preventDefault();
          shell.openExternal(url);
        });
      }
    }

    function stopPropagation(ev) {
      console.log('STOP');

      ev.stopPropagation();
    }

    if (IS_ELECTRON) {
      waitForMarkedTimeOut = $timeout(() => {
        makeLinksWorkForElectron();
      });
    }

    vm.toggleShowEdit = ($event) => {
      // check if anchor link was clicked
      if ($event.target.tagName !== 'A') {
        vm.showEdit = true;
        ngModelCopy = vm.ngModel || '';

        textareaTimeout = $timeout(function() {
          textareaEl = angular.element($element.find('textarea'));
          textareaEl[0].value = ngModelCopy;
          textareaEl[0].focus();
          textareaEl.on('keypress', keypressHandler);

          // prevent keyboard shortcuts from firing when here
          textareaEl.on('keydown', stopPropagation);

          textareaEl.on('$destroy', () => {
            textareaEl.off('keypress', keypressHandler);
            textareaEl.off('keydown', stopPropagation);
          });
        });
      }

      wrapperEl.addClass('is-editing');

    };

    vm.untoggleShowEdit = () => {
      ngModelCopy = textareaEl[0].value;
      vm.showEdit = false;
      makeLinksWorkForElectron();
      vm.resizeToFit();
      const isChanged = (ngModelCopy !== vm.ngModel);

      if (isChanged) {
        vm.ngModel = ngModelCopy;
      }

      if (angular.isFunction(vm.onEditFinished)) {
        vm.onEditFinished({
          newVal: vm.ngModel,
          isChanged: isChanged
        });
      }

      wrapperEl.removeClass('is-editing');
    };

    vm.resizeToFit = () => {
      $timeout(() => {
        const previewEl = angular.element($element.find('marked-preview'));
        const wrapperEl = angular.element($element.find('div')[0]);

        previewEl.css('height', 'auto');
        wrapperEl.css('height', previewEl[0].offsetHeight + 'px');
        previewEl.css('height', '');
      });
    };

    vm.resizeToFit();

    $scope.$on('$destroy', () => {
      if (waitForMarkedTimeOut) {
        $timeout.cancel(waitForMarkedTimeOut);
      }
      if (textareaTimeout) {
        $timeout.cancel(textareaTimeout);
      }
    });
  }

})();
