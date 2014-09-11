/// <reference path='../../third_party/typings/jasmine/jasmine.d.ts' />
/// <reference path='ui.ts' />

// TODO: move model, mockCore, and mockBrowserAction to a file
// where they can be re-used.
var model :UI.Model = {
  networks: {
    'testNetwork': {
      name: 'testNetwork',
      online: true,
      roster: {}
    }
  },
  roster: [],
  description: ''
};

describe('UI.UserInterface', () => {

  var ui :UI.UserInterface;

  beforeEach(() => {
    // Create a fresh UI object before each test.
    var mockCore = jasmine.createSpyObj('core', ['reset', 'onUpdate']);
    var mockBrowserAction = jasmine.createSpyObj('browserAction', ['setIcon']);
    ui = new UI.UserInterface(mockCore, mockBrowserAction);
  });

  describe('syncUser', () => {

    it('Adds users to roster', () => {
      var payload :UI.UserMessage = {
        network: 'testNetwork',
        user: {
          userId: 'testUserId',
          name: 'Alice',
          imageData: 'testImageData',
          isOnline: true
        },
        instances: []
      };
      ui.syncUser(payload);
      var user :UI.User = model.roster[0];
      expect(user).toBeDefined();
      expect(model.networks['testNetwork'].roster['testUserId']).toEqual(user);
    });

    it('Sets correct flags for non-uProxy users', () => {
      var payload :UI.UserMessage = {
        network: 'testNetwork',
        user: {
          userId: 'testUserId',
          name: 'Alice',
          imageData: 'testImageData',
          isOnline: true
        },
        instances: []
      };
      ui.syncUser(payload);
      var user :UI.User = model.networks['testNetwork'].roster['testUserId'];
      expect(user).toBeDefined();
      expect(user.isOnline).toEqual(true);
      expect(user.canUProxy).toEqual(false);
      expect(user.usesMe).toEqual(false);
      expect(user.givesMe).toEqual(false);
    });

    it('Sets correct flags for uProxy users', () => {
      var clientInstance :UI.Instance = {
        instanceId: 'instance1',
        description: 'description1',
        consent: {
          asClient: Consent.ClientState.GRANTED,
          asProxy: Consent.ProxyState.NONE
        },
        access: {asClient: false, asProxy: false},
        isOnline: true
      };
      var serverInstance :UI.Instance = {
        instanceId: 'instance1',
        description: 'description1',
        consent: {
          asClient: Consent.ClientState.NONE,
          asProxy: Consent.ProxyState.GRANTED
        },
        access: {asClient: false, asProxy: false},
        isOnline: true
      };
      var payload :UI.UserMessage = {
        network: 'testNetwork',
        user: {
          userId: 'testUserId',
          name: 'Alice',
          imageData: 'testImageData',
          isOnline: true
        },
        instances: [clientInstance, serverInstance]
      };
      ui.syncUser(payload);
      var user :UI.User = model.networks['testNetwork'].roster['testUserId'];
      expect(user).toBeDefined();
      expect(user.isOnline).toEqual(true);
      expect(user.canUProxy).toEqual(true);
      // usesMe should || all consent.asClient values
      expect(user.usesMe).toEqual(true);
      // usesMe should || all consent.asProxy values
      expect(user.givesMe).toEqual(true);
    });

    it('Updates focusedInstance and currentProxyServer', () => {
      var initialInstance :UI.Instance = {
        instanceId: 'focusedInstance',
        description: 'description1',
        consent: {
          asClient: Consent.ClientState.NONE,
          asProxy: Consent.ProxyState.NONE
        },
        access: {asClient: false, asProxy: false},
        isOnline: true
      };
      var payload :UI.UserMessage = {
        network: 'testNetwork',
        user: {
          userId: 'testUserId',
          name: 'Alice',
          imageData: 'testImageData',
          isOnline: true
        },
        instances: [initialInstance]
      };

      // Initially sync the user and instance
      ui.syncUser(payload);

      // Focus on user and instance
      var user :UI.User = model.networks['testNetwork'].roster['testUserId'];
      ui.focusOnUser(user, initialInstance);
      expect(ui.focusedInstance).toEqual(initialInstance);
      expect(ui.focusedInstance.consent.asClient).toEqual(
          Consent.ClientState.NONE);

      // Set currentProxyServer
      ui.currentProxyServer = {user: user, instance: initialInstance};

      // Update the instance (permissions) and sync again
      var updatedInstance :UI.Instance = {
        instanceId: 'focusedInstance',
        description: 'description1',
        consent: {
          asClient: Consent.ClientState.GRANTED,
          asProxy: Consent.ProxyState.NONE
        },
        access: {
          asClient: false,
          asProxy: false
        },
        isOnline: true
      };
      var payload :UI.UserMessage = {
        network: 'testNetwork',
        user: {
          userId: 'testUserId',
          name: 'Alice',
          imageData: 'testImageData',
          isOnline: true
        },
        instances: [updatedInstance]
      };
      ui.syncUser(payload);

      // Verify that the focusedInstance and currentProxyServer have updated.
      expect(ui.focusedInstance).toEqual(updatedInstance);
      expect(ui.focusedInstance.consent.asClient).toEqual(
          Consent.ClientState.GRANTED);
      expect(ui.currentProxyServer.instance).toEqual(updatedInstance);
      expect(ui.currentProxyServer.instance.consent.asClient).toEqual(
          Consent.ClientState.GRANTED);
    });

  }); // syncUser

  // TODO: more specs

});  // UI.UserInterface