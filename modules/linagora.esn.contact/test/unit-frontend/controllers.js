'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contacts Angular module', function() {

  var $rootScope, $controller, $q, scope, bookId = '123456789', contactsService,
      notificationFactory, $location, $route, selectionService, $alert, gracePeriodService;

  beforeEach(function() {
    contactsService = {
      shellToVCARD: function() {
        return scope.contact;
      },
      getCard: function() {
        return $q.when(scope.contact);
      }
    };
    notificationFactory = {
      weakError: function() {},
      weakInfo: function() {}
    };
    $location = {
      path: function() {}
    };
    $route = {
      current: {
        params: {
          bookId: bookId
        }
      }
    };
    selectionService = {
      clear: function() {}
    };
    $alert = {
      alert: function() {}
    };
    gracePeriodService = {
      grace: function() {
        return {
          then: function() {}
        };
      },
      cancel: function() {}
    };

    angular.mock.module('ngRoute');
    angular.mock.module('esn.core');

    module('linagora.esn.contact', function($provide) {
      $provide.value('contactsService', contactsService);
      $provide.value('notificationFactory', notificationFactory);
      $provide.value('$location', $location);
      $provide.value('selectionService', selectionService);
      $provide.value('$route', $route);
      $provide.value('$alert', function(options) { $alert.alert(options); });
      $provide.value('gracePeriodService', gracePeriodService);
    });
  });

  beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _$q_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $q = _$q_;

    scope = $rootScope.$new();
    scope.contact = {};
  }));

  describe('the newContactController', function() {

    beforeEach(function() {
      $controller('newContactController', {
        $scope: scope
      });
    });

    it('should go back to the list of contacts when close is called', function(done) {
      $location.path = function(path) {
        expect(path).to.equal('/contact');
        done();
      };

      scope.close();
    });

    describe('the accept function', function() {

      it('should not call contactsService.create when already calling it', function(done) {
        scope.calling = true;
        contactsService.create = function() {
          return done(new Error('This test should not call contactsService.create'));
        };
        scope.accept();
        done();
      });

      it('should not call contactsService.create when contact is not valid', function(done) {
        contactsService.create = function() {
          return done(new Error('This test should not call contactsService.create'));
        };

        scope.accept();
        done();
      });

      it('should display an error when contact is not valid', function(done) {
        contactsService.create = function() {
          return done(new Error('This test should not call contactsService.create'));
        };
        $alert.alert = function() { done(); };

        scope.accept();
        scope.$digest();
      });

      it('should call contactsService.create with right bookId and contact', function(done) {
        scope.contact = { firstName: 'Foo', lastName: 'Bar' };
        contactsService.create = function(id, contact) {
          expect(id).to.equal(bookId);
          expect(contact).to.deep.equal(scope.contact);

          done();
        };
        scope.accept();
      });

      it('should change page on contactsService.create success', function(done) {
        scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar'};

        $location.path = function(path) {
          expect(path).to.equal('/contact');

          done();
        };

        contactsService.create = function() {
          return $q.when();
        };

        scope.accept();
        scope.$digest();
      });

      it('should not change page if the contact is invalid', function(done) {
        $location.path = function() {
          done('This test should not change the location');
        };

        scope.accept();
        scope.$digest();

        done();
      });

      it('should notify user on contactsService.create failure', function(done) {
        scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar'};

        $location.path = function() {
          done(new Error('This test should not change the location'));
        };

        notificationFactory.weakError = function() {
          done();
        };

        contactsService.create = function() {
          return $q.reject('WTF');
        };

        scope.accept();
        scope.$digest();
      });

      it('should set back the calling flag to false when complete', function(done) {
        scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar'};
        $location.path = function() {};

        contactsService.create = function() {
          return $q.when();
        };

        scope.accept().then(function() {
          expect(scope.calling).to.be.false;

          done();
        });
        scope.$digest();
      });

      it('should grace the request using the default delay on success', function(done) {
        scope.contact = {firstName: 'Foo', lastName: 'Bar'};

        gracePeriodService.grace = function(text, delay) {
          expect(delay).to.not.exist;

          done();
        };

        contactsService.create = function() {
          return $q.when();
        };

        scope.accept();
        scope.$digest();
      });

      it('should delete the contact if the user cancels during the rgace period', function(done) {
        scope.contact = {firstName: 'Foo', lastName: 'Bar'};

        gracePeriodService.grace = function() {
          return $q.reject();
        };
        contactsService.create = function() {
          return $q.when();
        };
        contactsService.remove = function(id, contact) {
          expect(id).to.equal(bookId);
          expect(contact).to.deep.equal(scope.contact);

          done();
        };

        scope.accept();
        scope.$digest();
      });

    });
  });

  describe('The showContactController', function() {

    beforeEach(function() {
      $controller('showContactController', {
        $scope: scope
      });
    });

    it('should go back to the list of contacts when close is called', function(done) {
      $location.path = function(path) {
        expect(path).to.equal('/contact');
        done();
      };

      scope.close();
    });

    it('should display an error if the contact cannot be loaded initially', function(done) {
      contactsService.getCard = function() {
        return $q.reject('WTF');
      };
      $alert.alert = function() { done(); };

      $controller('showContactController', {
        $scope: scope
      });
      scope.$digest();
    });

    describe('The accept function', function() {

      it('should delegate to $scope.modify', function(done) {
        scope.modify = done;

        scope.accept();
      });

      it('should change page on contactsService.modify success', function(done) {
        scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar', displayName: 'Foo Bar'};

        $location.path = function(path) {
          expect(path).to.equal('/contact');

          done();
        };

        contactsService.modify = function() {
          return $q.when(scope.contact);
        };

        scope.accept();
        scope.$digest();
      });

      it('should not change page if the contact is invalid', function(done) {
        $location.path = function() {
          done('This test should not change the location');
        };

        scope.accept();
        scope.$digest();

        done();
      });

    });

    describe('The modify function', function() {

      it('should not call contactsService.modify when already calling it', function(done) {
        scope.calling = true;
        contactsService.modify = function() {
          return done(new Error('This test should not call contactsService.modify'));
        };
        scope.modify();
        done();
      });

      it('should not call contactsService.modify when contact is not valid', function(done) {
        contactsService.modify = function() {
          return done(new Error('This test should not call contactsService.modify'));
        };
        scope.modify();
        done();
      });

      it('should display an error when contact is not valid', function(done) {
        contactsService.create = function() {
          return done(new Error('This test should not call contactsService.create'));
        };
        $alert.alert = function() { done(); };

        scope.modify();
        scope.$digest();
      });

      it('should call contactsService.modify with right bookId and contact', function(done) {
        scope.contact = { id: 1, firstName: 'Foo', lastName: 'Bar' };
        contactsService.modify = function(id, contact) {
          expect(id).to.deep.equal(bookId);
          expect(contact).to.deep.equal(scope.contact);

          done();
        };

        scope.modify();
      });

      it('should notify user on contactsService.modify failure', function(done) {
        scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar'};

        $location.path = function() {
          done(new Error('This test should not change the location !'));
        };
        notificationFactory.weakError = function() {
          done();
        };

        contactsService.modify = function() {
          return $q.reject();
        };

        scope.modify();
        scope.$digest();
      });

      it('should set back the calling flag to false when complete', function(done) {
        scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar'};
        $location.path = function() {};
        contactsService.modify = function() {
          return $q.when(scope.contact);
        };

        scope.modify().then(function() {
          expect(scope.calling).to.be.false;

          done();
        });
        scope.$digest();
      });

    });
  });

  describe('the contactAvatarModalController', function() {

    beforeEach(function() {
      $controller('contactAvatarModalController', {$scope: scope});
    });

    describe('the saveContactAvatar method', function() {
      it('should do nothing if no image is selected', function() {
        selectionService.getImage = function() {
          return false;
        };
        scope.saveContactAvatar();
        expect(scope.contact.photo).to.not.exist;
      });

      it('should add the image as base64 string to the contact and close the modal', function() {
        var blob = 'theblob';
        var imageAsBase64 = 'image';
        var modalHidden = false;

        window.FileReader = function() {
          return {
            readAsDataURL: function(data) {
              expect(data).to.equal(blob);
              this.result = imageAsBase64;
              this.onloadend();
            }
          };
        };

        selectionService.getImage = function() {
          return true;
        };
        selectionService.getBlob = function(mimetype, callback) {
          return callback(blob);
        };

        scope.modal = {
          hide: function() {
            modalHidden = true;
          }
        };

        scope.saveContactAvatar();
        expect(scope.loading).to.be.false;
        expect(modalHidden).to.be.true;
        expect(scope.contact.photo).to.equal(imageAsBase64);
      });
    });

  });

  describe('The contactsListController controller', function() {

    it('should add the contact to the list on delete cancellation', function(done) {
      var contact = {
        lastName: 'Last'
      };

      $controller('contactsListController', {
        $scope: scope,
        contactsService: {
          list: function() {
            return $q.reject('WTF');
          }
        },
        user: {
          _id: '123'
        },
        AlphaCategoryService: function() {
          return {
            addItems: function(data) {
              expect(data).to.deep.equal([contact]);

              done();
            },
            get: function() {}
          };
        }
      });

      $rootScope.$broadcast('contact:cancel:delete', contact);
      $rootScope.$digest();
    });

    describe('The loadContacts function', function() {

      it('should call the contactsService.list fn', function(done) {
        var user = {_id: 123};
        var contactsService = {
          list: function(bookId) {
            expect(bookId).to.equal(user._id);
            done();
          }
        };

        $controller('contactsListController', {
          $scope: scope,
          contactsService: contactsService,
          user: user
        });
        scope.loadContacts();
      });

      it('should display error when contactsService.list fails', function(done) {
        var user = {_id: 123};
        var defer = $q.defer();
        defer.reject();
        var contactsService = {
          list: function() {
            return defer.promise;
          }
        };
        $alert.alert = function(options) {
          expect(options.content).to.match(/Can not get contacts/);

          done();
        };

        $controller('contactsListController', {
          $scope: scope,
          contactsService: contactsService,
          user: user
        });

        scope.loadContacts();
        scope.$digest();
      });
    });

    describe('The openContactCreation function', function() {
      it('should open the contact creation window', function(done) {

        var user = {
          _id: 123
        };

        var location = {
          path: function(url) {
            expect(url).to.equal('/contact/new/' + user._id);
            done();
          }
        };

        $controller('contactsListController', {
          $scope: scope,
          $location: location,
          contactsService: {
            list: function() {
              var defer = $q.defer();
              defer.resolve({});
              return defer.promise;
            }
          },
          user: user
        });

        scope.openContactCreation();
      });
    });
  });

});
