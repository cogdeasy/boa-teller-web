(function () {
  'use strict';

  /**
   * <div boa-alert="vm.error" type="danger"></div>
   * Renders a dismissible Bootstrap alert for an API error ({code, message}) or a plain string.
   */
  angular.module('boaTeller.core')
    .directive('boaAlert', boaAlert);

  function boaAlert() {
    return {
      restrict: 'A',
      scope: { boaAlert: '=', type: '@' },
      link: function (scope, element) {
        var $el = $(element);

        scope.$watch('boaAlert', function (value) {
          if (!value) {
            $el.empty().hide();
            return;
          }
          var message = angular.isString(value) ? value : (value.message || 'Unexpected error');
          var code = angular.isObject(value) && value.code ? '<strong>' + value.code + '</strong> ' : '';
          $el.html(
            '<div class="alert alert-' + (scope.type || 'danger') + ' alert-dismissible" role="alert">' +
            '<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            code + message + '</div>'
          ).show();
        });

        $el.on('click', '.close', function () {
          scope.$apply(function () {
            scope.boaAlert = null;
          });
        });
      }
    };
  }
})();
