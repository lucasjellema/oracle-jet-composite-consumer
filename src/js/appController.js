/**
 * Copyright (c) 2014, 2017, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your application specific code will go here
 */
define(['ojs/ojcore', 'knockout', 'ojs/ojrouter', 'ojs/ojknockout', 'ojs/ojarraytabledatasource', 'ojs/ojmenu'],
  function (oj, ko) {
    function ControllerViewModel() {
      var self = this;


      // Media queries for repsonsive layouts
      var smQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      self.smScreen = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);

      // Router setup
      self.router = oj.Router.rootInstance;
      self.router.configure({
        'dashboard': { label: 'Dashboard', isDefault: true },
        'country': { label: 'Country' },
        'orders': { label: 'Orders' },
      });
      oj.Router.defaults['urlAdapter'] = new oj.Router.urlParamAdapter();

      // Navigation setup
      var navData = [
        {
          name: 'Home', id: 'dashboard', loggedInOnly: false,
          iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-chart-icon-24'
        },
        {
          name: 'Country', id: 'country',
          iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-fire-icon-24'
        },
        {
          name: 'Browse Orders', id: 'orders', loggedInOnly: true,
          iconClass: 'oj-navigationlist-item-icon demo-icon-font-24 demo-download-icon-24'
        }

      ];
      self.navDataSource = new oj.ArrayTableDataSource(navData, { idAttribute: 'id' });

      // Header
      // Application Name used in Branding Area
      self.appName = ko.observable("Some Application that Consumes JET Composite Components");

      // Footer
      function footerLink(name, id, linkTarget) {
        this.name = name;
        this.linkId = id;
        this.linkTarget = linkTarget;
      }
      self.footerLinks = ko.observableArray([
        new footerLink('GitHub Repo', 'gitHub', 'https://github.com/lucasjellema/soaring-through-the-cloud-native-sequel'),
        new footerLink('Contact Us', 'contactUs', 'http://www.oracle.com/us/corporate/contact/index.html'),
      ]);
    }

    return new ControllerViewModel();
  }
);
