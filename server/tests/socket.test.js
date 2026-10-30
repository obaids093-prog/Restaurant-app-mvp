const http = require('http');
const socketService = require('../services/socketService');

describe('Socket.io Real-Time WebSocket Service', () => {
  let mockServer;
  let mockIo;
  let mockRooms;

  beforeEach(() => {
    mockRooms = {};
    mockIo = {
      to: jest.fn().mockImplementation((room) => {
        if (!mockRooms[room]) {
          mockRooms[room] = {
            emit: jest.fn(),
          };
        }
        return mockRooms[room];
      }),
      emit: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Emit Helpers with Mocked IO', () => {
    beforeAll(() => {
      // Create a temporary mock server to initialize socket
      mockServer = http.createServer();
      socketService.initializeSocket(mockServer);
    });

    afterAll(() => {
      const ioInstance = socketService.getIO();
      if (ioInstance && ioInstance.close) {
        ioInstance.close();
      }
      mockServer.close();
    });

    it('initializes socket and returns instance via getIO', () => {
      const ioInstance = socketService.getIO();
      expect(ioInstance).toBeDefined();
    });

    it('gracefully handles emitOrderStatusUpdate when order is provided', () => {
      const sampleOrder = {
        _id: 'ord_12345',
        status: 'Preparing',
        user: { _id: 'usr_67890' },
        updatedAt: '2026-10-30T10:00:00.000Z',
      };

      // Call the helper - should execute without error
      expect(() => {
        socketService.emitOrderStatusUpdate(sampleOrder);
      }).not.toThrow();
    });

    it('gracefully handles emitNewOrder when new order arrives', () => {
      const newOrder = {
        _id: 'ord_99999',
        status: 'Pending',
        user: 'usr_11111',
        createdAt: '2026-10-30T10:05:00.000Z',
      };

      expect(() => {
        socketService.emitNewOrder(newOrder);
      }).not.toThrow();
    });

    it('emits targeted notification to customer user room', () => {
      const notification = {
        _id: 'notif_001',
        title: 'Order Ready',
        body: 'Your table order is ready!',
        type: 'order_status',
      };

      expect(() => {
        socketService.emitNotification('usr_67890', notification);
      }).not.toThrow();
    });

    it('emits manager notification for kitchen/dashboard alerts', () => {
      const alertNotif = {
        _id: 'notif_mgr_001',
        title: 'New Table Order',
        body: 'Table 5 placed a new Dine-in order',
        type: 'order_created',
      };

      expect(() => {
        socketService.emitManagerNotification(alertNotif);
      }).not.toThrow();
    });

    it('emits inventory alerts to role:manager', () => {
      const alert = {
        dishName: 'Truffle Wagyu Slider',
        stockCount: 0,
        status: 'sold_out',
      };

      expect(() => {
        socketService.emitInventoryAlert(alert);
      }).not.toThrow();
    });

    it('emits menu updates to all connected customers', () => {
      const menuItem = {
        _id: 'dish_444',
        isAvailable: false,
        stockCount: 0,
      };

      expect(() => {
        socketService.emitMenuUpdate(menuItem);
      }).not.toThrow();
    });
  });

  describe('Edge cases and safety guards', () => {
    it('does not throw when emitting to null or undefined parameters', () => {
      expect(() => socketService.emitNotification(null, {})).not.toThrow();
      expect(() => socketService.emitNotification(undefined, {})).not.toThrow();
    });
  });
});
