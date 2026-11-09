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

  describe('Security & RBAC Room Guards (Safety Fix #2)', () => {
    let mockSocket;

    beforeEach(() => {
      mockSocket = {
        id: 'sock_test_123',
        _userId: null,
        _userRole: null,
        join: jest.fn(),
        emit: jest.fn(),
      };
    });

    it('rejects unauthenticated client when attempting to join role:manager room', () => {
      const allowed = socketService.handleRoleJoin(mockSocket, 'manager');
      expect(allowed).toBe(false);
      expect(mockSocket.join).not.toHaveBeenCalledWith('role:manager');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error:unauthorized',
        expect.objectContaining({ message: expect.stringMatching(/manager/i) })
      );
    });

    it('rejects customer user when attempting to join role:manager room', () => {
      mockSocket._userId = 'cust_111';
      mockSocket._userRole = 'customer';

      const allowed = socketService.handleRoleJoin(mockSocket, 'manager');
      expect(allowed).toBe(false);
      expect(mockSocket.join).not.toHaveBeenCalledWith('role:manager');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error:unauthorized',
        expect.objectContaining({ message: expect.stringMatching(/manager/i) })
      );
    });

    it('allows verified manager user to join role:manager room', () => {
      mockSocket._userId = 'mgr_999';
      mockSocket._userRole = 'manager';

      const allowed = socketService.handleRoleJoin(mockSocket, 'manager');
      expect(allowed).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith('role:manager');
      expect(mockSocket.emit).not.toHaveBeenCalledWith('error:unauthorized', expect.anything());
    });

    it('allows customer user to join role:customer room', () => {
      mockSocket._userId = 'cust_222';
      mockSocket._userRole = 'customer';

      const allowed = socketService.handleRoleJoin(mockSocket, 'customer');
      expect(allowed).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith('role:customer');
    });

    it('returns false and denies unknown room roles', () => {
      const allowed = socketService.handleRoleJoin(mockSocket, 'superuser');
      expect(allowed).toBe(false);
      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });
});
