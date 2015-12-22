'use strict';

// TODO(mkhatib): Seperate these into config/routes.js and
// config/interceptors/httpInterceptors.js and add tests for them.
// TODO(mkhatib): Move the autogenerated appConfig.js to config/constants.js.

angular.module('webClientApp', [
  'ngAnimate',
  'ngCookies',
  'ngLocale',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'AppConfig',
  'truncate',
  'angulartics',
  'angulartics.google.analytics',
  'angularFileUpload',
  'angular-loading-bar',
  'ipCookie',
  'ng-token-auth',
  '720kb.tooltips'
])
  /**
   * Routing.
   */
  .config(['$stateProvider', '$locationProvider', '$urlRouterProvider',
      function ($stateProvider, $locationProvider, $urlRouterProvider) {
    // Set the default route to to to .hot child state
    $urlRouterProvider.when('/', 'articles/hot/');
    $stateProvider
      .state('app', {
        url: '/',
        views: {
          'content': {
            templateUrl: 'views/main.html'
          }
        },
        resolve: {
          articles: function(Article) {
            var order = 'popular';
            // Popular is the default sort for articles
            return Article.query({'order': order}).$promise;
          }
        }
      })
      .state('app.articles', {
        abstract: true,
        url: 'articles/',
        views: {
          'content@': {
            templateUrl: 'views/main.html',
            controller: 'MainCtrl'
          }
        },
        resolve: {
          articles: function(Article) {
            var order = 'popular';
            // Popular is the default sort for articles
            return Article.query({'order': order}).$promise;
          },
          publishers: function(User) {
            return User.query().$promise;
          }
        }
      })
      .state('app.articles.hot', {
        url: 'hot/',
        templateUrl: 'views/partials/_articles_list.html',
        controller: 'MainCtrl'
      })
      .state('app.articles.best', {
        url: 'best/',
        templateUrl: 'views/partials/_articles_list.html',
        controller: 'MainCtrl',
        resolve: {
          articles: function(Article) {
            var order = 'best';
            return Article.query({'order': order}).$promise;
          }
        }
      })
      .state('app.articles.recent', {
        url: 'recent/',
        controller: 'MainCtrl',
        templateUrl: 'views/partials/_articles_list.html',
        resolve: {
          articles: function(Article) {
            var order = 'recents';
            return Article.query({'order': order}).$promise;
          }
        }
      })
      .state('app.articles.show', {
        url: ':articleId/show/',
        views: {
          'content@': {
            templateUrl: 'views/articles/show.html',
            controller: 'ArticleCtrl'
          }
        },
        resolve: {
          article: function(Article, $stateParams, $state) {
            return Article.get({'articleId': $stateParams.articleId}, function(article) {
              return article;
            }, function() {
              $state.go('app');
            });
          }
        }
      })
      .state('app.articles.edit', {
        url: ':articleId/edit/',
        views: {
          'content@': {
            templateUrl: 'views/articles/edit.html',
            controller: 'EditArticleCtrl'
          }
        },
        resolve: {
          user: function($auth, $state) {
            return $auth.validateUser().then(function(user) {
              if(user) {
                console.log('user resolved');
                return user;
              }
            }, function() {
                $state.go('app.login');
            }).$promise;
          },
          article: function(Article, $stateParams, $state, $rootScope) {
            console.log('articleContent resolved');
            return Article.get({'articleId': $stateParams.articleId}, function(article) {
              if (article.body) {
                $state.go('app.articles.show', {articleId: article.id});
              } else if($rootScope.user.id === article.user.id) {
                return article;
              } else {
                $state.go('app.articles.show', {articleId: article.id});
              }
            }).$promise;
          }
        }
      })
      .state('app.articles.new', {
        url: 'new/',
        views: {
          'content@': {}
        },
        resolve: {
          article: function(Article, $state) {
            return Article.save({ article: { published: false } }, function(resource) {
              console.log(resource);
              $state.go('app.articles.edit', { articleId: resource.id });
            }, function(error) {
              console.log(error);
              $state.go('app');
            }).$promise;
          }
        }
      })
      .state('app.login', {
        url: 'login/',
        views: {
        'content@': {
            templateUrl: 'views/login.html',
            controller: 'LoginCtrl'
          }
        },
        resolve: {
          requireNoAuth: function($auth, $state) {
            return $auth.validateUser().then(function(user) {
              if(user) {
                $state.go('app.publishers.profile.published', { userId: user.id});
              }
            }, function() {
              return;
            }).$promise;
          }
        }
      })
      .state('app.publishers', {
        url: 'publishers/',
        views: {
          'content@': {
            templateUrl: 'views/publishers/show.html',
            controller: 'MainCtrl'
          }
        },
        resolve: {
          publishers: function(User) {
            return User.query().$promise;
          }
        }
      })
      .state('app.publishers.profile', {
        abstract: true,
        url: 'profile/:userId/',
        views: {
          'content@': {
            templateUrl: 'views/profiles/show.html',
            controller: 'ProfileCtrl'
          }
        },
        resolve: {
          profile: function(User, $stateParams) {
            return User.get({'userId': $stateParams.userId}).$promise;
          },
          articles: function(UserArticle, $stateParams) {
            return UserArticle.query({'userId': $stateParams.userId}).$promise;
          }
        }
      })
      .state('app.publishers.profile.edit', {
        url: 'edit/',
        views: {
          'content@': {
            templateUrl: 'views/profiles/edit.html',
            controller: 'EditProfileCtrl'
          }
        },
        resolve: {
          canEdit: function($auth, $state, $stateParams) {
            return $auth.validateUser().then(function(user) {
              if(user.id === $stateParams.userId) {
                return;
              } else {
                $state.go('app.publishers.profile.published', {userId: $stateParams.userId});
              }
            }, function() {
              $state.go('app.publishers.profile.published', {userId: $stateParams.userId});
            });
          }
        }
      })
      .state('app.publishers.profile.published', {
        url: 'published/',
        templateUrl: 'views/partials/_articles_list.html'
      })
      .state('app.publishers.profile.drafts', {
        url: 'drafts/',
        templateUrl: 'views/partials/_articles_list.html',
        controller: 'DraftCtrl',
        resolve: {
          drafts: function($auth, $stateParams, UserDraft) {
            return $auth.validateUser().then(function(user) {
              if(user && user.id === parseInt($stateParams.userId)) {
                return UserDraft.query({}).$promise;
              }
            });
          }
        }
      })
      .state('app.publishers.profile.stats', {
        url: 'stats/',
        templateUrl: 'views/profiles/stats.html',
        controller: 'StatCtrl',
        resolve: {
          stats: function($auth, $stateParams, ArticleStats) {
            // ToDo: Add a better way to check if user is logged in
            // Here if rootscope is not set yet, it doesn't work on refresh
            return $auth.validateUser().then(function(user) {
              if(user && user.id === parseInt($stateParams.userId)) {
                return ArticleStats.query({}).$promise;
              }
            });
          }
        }
      })
      .state('app.publishers.profile.recommended', {
        url: 'recommended/',
        templateUrl: 'views/partials/_articles_list.html',
        controller: 'RecommendationCtrl',
        resolve: {
          recommendations: function(UserRecommendation, $stateParams) {
            return UserRecommendation.query({'userId': $stateParams.userId}).$promise;
          }
        }
      })
      .state('app.publishers.profile.discussions', {
        url: 'discussions/',
        templateUrl: 'views/partials/_articles_list.html',
        controller: 'DiscussionCtrl',
        resolve: {
          comments: function(UserComment, $stateParams) {
            return UserComment.query({'userId': $stateParams.userId}).$promise;
          }
        }
      })
      .state('app.categories', {
        url: 'category/:categoryId/',
        views: {
          'content@': {
            templateUrl: 'views/categories/show.html',
            controller: 'CategoryCtrl'
          }
        },
        resolve: {
          category: function(Category, $stateParams, $state) {
            return Category.get({'categoryId': $stateParams.categoryId}, function(category) {
              return category;
            }, function() {
              $state.go('app');
            });
          },
          articles: function(CategoryArticle, $stateParams) {
            return CategoryArticle.query({'categoryId': $stateParams.categoryId}).$promise;
          },
          topics: function(Topic, $stateParams) {
            return Topic.query({'categoryId': $stateParams.categoryId}).$promise;
          }
        }
      })
      .state('app.categories.topic', {
        url: 'topic/:topicId/',
        views: {
          'content@': {
            templateUrl: 'views/topics/show.html',
            controller: 'TopicCtrl'
          }
        },
        resolve: {
          topic: function(Topic, $state, $stateParams) {
            return Topic.get({
                  'categoryId': $stateParams.categoryId,
                  'topicId': $stateParams.topicId
                }, function(topic) {
                  console.log(topic);
                  return topic;
                }, function() {
                  $state.go('app');
                }).$promise;
          },
          articles: function(TopicArticle, $state, $stateParams) {
            return TopicArticle.query({
                    'categoryId': $stateParams.categoryId,
                    'topicId': $stateParams.topicId
                  }, function(articles) {
                    console.log(articles);
                    return articles;
                  }, function() {
                    $state.go('app');
                  }).$promise;
          }
        }
      });

      $urlRouterProvider.otherwise('/');

      // .when('/login/?', {
      //   templateUrl: 'views/login.html',
      //   controller: 'LoginCtrl',
      //   title: 'تسجيل الدخول',
      //   isPublic: true,
      //   resolve: checkAccess
      // })

      // .when('/signup/?', {
      //   templateUrl: 'views/signup.html',
      //   controller: 'SignupCtrl',
      //   title: 'مستخدم جديد',
      //   isPublic: true,
      //   resolve: checkAccess
      // })

      // .when('/articles/new/?', {
      //   templateUrl: 'views/articles/edit.html',
      //   controller: 'NewArticleCtrl',
      //   title: 'مقال جديد',
      //   isPublic: false,
      //   resolve: checkAccess
      // })

      // .when('/articles/:articleId/edit/?', {
      //   templateUrl: 'views/articles/edit.html',
      //   controller: 'EditArticleCtrl',
      //   isPublic: false,
      //   resolve: checkAccess
      // })

      // .when('/articles/:articleId/?', {
      //   templateUrl: 'views/articles/show.html',
      //   controller: 'ArticleCtrl',
      //   isPublic: true,
      //   resolve: checkAccess
      // })

      // .when('/accounts/reset_password/?', {
      //   templateUrl: 'views/accounts/reset_password.html',
      //   controller: 'ResetPasswordController',
      //   isPublic: true,
      //   resolve: checkAccess
      // })

      // .when('/accounts/update_password/?', {
      //   templateUrl: 'views/accounts/update_password.html',
      //   controller: 'UpdatePasswordController',
      //   isPublic: true,
      //   resolve: checkAccess
      // })

      // .when('/profiles/:userId/?', {
      //   templateUrl: 'views/profiles/show.html',
      //   controller: 'ProfileCtrl',
      //   isPublic: true,
      //   resolve: checkAccess
      // })

      // .when('/profiles/:userId/edit/?', {
      //   templateUrl: 'views/profiles/edit.html',
      //   controller: 'EditProfileCtrl',
      //   isPublic: false,
      //   resolve: checkAccess
      // })

      // .when('/categories/:categoryId/?', {
      //   templateUrl: 'views/categories/show.html',
      //   controller: 'CategoryCtrl',
      //   isPublic: true,
      //   resolve: checkAccess
      // })

      // .when('/categories/:categoryId/topics/:topicId/?', {
      //   templateUrl: 'views/topics/show.html',
      //   controller: 'TopicCtrl',
      //   isPublic: true,
      //   resolve: checkAccess
      // })

      // .when('/admin/?', {
      //   templateUrl: 'views/admin/dashboard.html',
      //   isPublic: false,
      //   isAdmin: true,
      //   resolve: checkAccess
      // })

      // .when('/admin/manage/categories/?', {
      //   templateUrl: 'views/admin/manage/categories.html',
      //   controller: 'ManageCategoriesCtrl',
      //   isPublic: false,
      //   isAdmin: true,
      //   resolve: checkAccess
      // })
      // .otherwise({
      //   redirectTo: '/'
      // });
  }])
  .factory('unAuthenticatedInterceptor', ['$location', '$q', '$rootScope',
      function ($location, $q, $rootScope) {
    return {
      'request': function(config) {
        return config;
      },

      'requestError': function(response) {
        console.error(response);
      },

      'response': function(response) {
        return response;
      },

      'responseError': function(response) {
        if (response.status === 401) {
          var previous = $location.path();
          $rootScope.$broadcast('showLoginDialog', {'prev': previous});
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  }])

  /**
   * Sets up authentication for ng-token-auth.
   */
  .config(['$authProvider', 'API_HOST', function($authProvider, API_HOST) {
    $authProvider.configure({
      apiUrl: '//' + API_HOST,
      omniauthWindowType: 'newWindow',
      confirmationSuccessUrl:  '//' + window.location.host + '/login',
      passwordResetSuccessUrl: ('//' + window.location.host +
                                '/accounts/update_password'),
      authProviderPaths: {
        facebook: '/auth/facebook',
        gplus:   '/auth/gplus'
      },
    });
  }])

  /**
   * Intercept every http request and check for 401 Unauthorized
   * error. Clear the current user and redirect to /login page.
   */
  .config(['$httpProvider', '$locationProvider', function ($httpProvider, $locationProvider) {
    $httpProvider.interceptors.push('unAuthenticatedInterceptor');
    $locationProvider.html5Mode(true).hashPrefix('!');
  }])
  /**
   * Allow embedding specific sites.
   */
  .config(['$sceDelegateProvider', function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
      // Allow same origin resource loads.
      'self',
      // Allow loading from YouTube domain.
      'http://www.youtube.com/embed/**',
      'https://www.youtube.com/embed/**'
    ]);
  }])
  /**
   * Disable the spinner for angular-loading-bar.
   */
  .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
  }])
  /**
   * Everytime the route change check if the user need to login.
   */
  .run(['$location', '$rootScope', '$analytics', '$auth', 'LoginService', 'User', 'Category', 'GA_TRACKING_ID',
      function ($location, $rootScope, $analytics, $auth, LoginService, User, Category, GA_TRACKING_ID) {

    // ga is the Google analytics global variable.
    if (window.ga) {
      ga('create', GA_TRACKING_ID);
    }

    $rootScope.linkPrefix = '//' + document.location.host;

    /**
     * Holds data about page-wide attributes. Like pages title.
     */
    $rootScope.page = {
      title: 'منصة النشر العربية',
      description: 'منصة نشر متخصصة باللغة العربية مفتوحة المصدر',
      image: '//' + document.location.host + '/images/manshar@200x200.png'
    };

    /**
     * Load categories once for all application
     */
     $rootScope.categories = Category.query();

    /**
     * Logs the user out.
     */


    /**
     * Shows the login dialog.
     * @param {string} optPrev Optional previous path to go back to after login.
     */
    $rootScope.showLoginDialog = function(optPrev) {
      $rootScope.$broadcast('showLoginDialog', {
        'prev': optPrev
      });
    };

    /**
     * Returns true if the passed user is the same user that is referenced
     * in the resource. This assumes that the resource always have a user
     * property, otherwise it'll return false.
     * @param {Object} user The object representing the user data.
     * @param {Object} resource The object representing the resource (e.g. Article).
     * @returns {boolean} true if the user is the owner of the resource.
     */
    $rootScope.isOwner = function (user, resource) {
      var id = user && parseInt(user.id);
      return (!!user && !!resource && !!resource.user &&
              id === resource.user.id);
    };

    var checkAccess = function(event, next, current) {

      /**
       * First load to the AngularJS the user might have not been loaded
       * so need to call the callback after validateUser promise is resolved.
       */
      var firstLoadCallback = function() {
        if (!LoginService.isAuthorized(next.isPublic, next.isAdmin)) {
          $location.path('/login').search('prev', $location.path());
        }
      };

      // If this is the first load of the site.
      if(!current) {
        $auth.validateUser().then(firstLoadCallback, firstLoadCallback);
      }
      else if(!LoginService.isAuthorized(next.isPublic, next.isAdmin)) {
        event.preventDefault();
        // Show the dialog instead of redirecting for all navigations.
        // Except first time landing on the site on protected page.
        if (current) {
          $rootScope.$broadcast('showLoginDialog', {
            'prev': $location.path()
          });
        }
      }
    };

    /**
     * If the route to be accessed is private make sure the user is authenticated
     * otherwise, broadcast 'showLoginDialog' to show login modal.
     */
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
      checkAccess(event, next, current);
    });

    $rootScope.$on('$routeChangeSuccess', function (event, current) {
      $rootScope.page.title = current.$$route.title || $rootScope.page.title;
      $rootScope.page.url = document.location.href;
    });

    // var getLoggedInUserProfile = function(event, data) {
    //   User.get({'userId': data.id}, function(user) {
    //     // angular.extend($rootScope.user, user);
    //   });
    // };
    // $rootScope.$on('auth:validation-success', getLoggedInUserProfile);
    // $rootScope.$on('auth:login-success', getLoggedInUserProfile);

  }]);
