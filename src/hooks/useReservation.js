import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../api/client';
import safeStorage from '../utils/safeStorage';
import { mockTables } from '../data/tables';
import { mockReservations } from '../data/reservations';

const RESERVATIONS_STORAGE_KEY = '@aura_reservations_data';

export const TIME_SLOTS = [
  '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

/**
 * Normalizes backend reservation object to UI format
 */
const normalizeReservation = (r) => ({
  ...r,
  id: r._id || r.id,
  _id: r._id || r.id,
  partySize: r.guests !== undefined ? r.guests : r.partySize || 2,
  timeSlot: r.time || r.timeSlot || '19:00',
  tableName: r.table
    ? `Table ${r.table.tableNumber} (${r.table.location || r.table.zone || 'Dining Area'})`
    : r.tableName || 'Reserved Table',
  tableId: r.table?._id || r.table?.id || r.table || r.tableId,
});

/**
 * Question 7: useReservation hook connected to Express & MongoDB backend
 * Encapsulates all business logic for dining table reservations, slot checks,
 * Pakistani phone validation, server sync, and collision handling.
 */
export function useReservation(currentUser) {
  // Get today's date formatted as YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Form & Selection States
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('19:00');
  const [partySize, setPartySize] = useState(2);
  const [tablesList, setTablesList] = useState(mockTables);
  const [selectedTable, setSelectedTable] = useState(null);
  const [contactName, setContactName] = useState(currentUser?.name || 'Zainab Malik');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '0302-8877665');
  const [specialRequests, setSpecialRequests] = useState('');
  const [reservationsList, setReservationsList] = useState(mockReservations.map(normalizeReservation));
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch live tables from backend GET /api/tables
  const loadTables = useCallback(async () => {
    try {
      const data = await apiClient('/api/tables');
      if (Array.isArray(data) && data.length > 0) {
        const normalizedTables = data.map((t) => ({
          ...t,
          id: t._id || t.id,
          _id: t._id || t.id,
        }));
        setTablesList(normalizedTables);
      }
    } catch (e) {
      console.warn('[useReservation] Could not fetch live tables, using fallback:', e.message);
    }
  }, []);

  // 2. Fetch customer's live bookings from backend GET /api/reservations/my
  const loadReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient('/api/reservations/my');
      if (Array.isArray(data)) {
        const normalized = data.map(normalizeReservation);
        setReservationsList(normalized);
        await safeStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(normalized));
      }
    } catch (e) {
      // If offline, restore from AsyncStorage cache
      try {
        const cached = await safeStorage.getItem(RESERVATIONS_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReservationsList(parsed.map(normalizeReservation));
          }
        }
      } catch (cacheErr) {
        console.warn('[useReservation] Cache restore error:', cacheErr.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
    loadReservations();
  }, [loadTables, loadReservations]);

  /**
   * Helper: Check which tables are free for a given date & time slot
   */
  const getAvailableTablesForSlot = useCallback(
    (date, slot, size) => {
      const bookedTableIds = reservationsList
        .filter(
          (r) =>
            r.date === date &&
            r.timeSlot === slot &&
            r.status !== 'Cancelled' &&
            r.status !== 'Declined'
        )
        .map((r) => r.tableId);

      return tablesList.filter(
        (table) => table.seats >= size && !bookedTableIds.includes(table.id) && !bookedTableIds.includes(table._id)
      );
    },
    [reservationsList, tablesList]
  );

  /**
   * Helper: Determine if an hourly slot has any available tables for partySize
   */
  const isSlotAvailable = useCallback(
    (slot) => {
      const freeTables = getAvailableTablesForSlot(selectedDate, slot, partySize);
      return freeTables.length > 0;
    },
    [getAvailableTablesForSlot, selectedDate, partySize]
  );

  /**
   * Automatically select best-fitting table when slot, date, or partySize changes
   */
  useEffect(() => {
    const availableTables = getAvailableTablesForSlot(selectedDate, selectedTimeSlot, partySize);
    if (availableTables.length > 0) {
      const sortedByFit = [...availableTables].sort((a, b) => a.seats - b.seats);
      setSelectedTable(sortedByFit[0]);
    } else {
      setSelectedTable(null);
    }
  }, [selectedDate, selectedTimeSlot, partySize, getAvailableTablesForSlot]);

  /**
   * Comprehensive Form Validation
   */
  const validateReservation = useCallback(() => {
    const errors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(0, 0, 0, 0);

    // 1. Date not in the past
    if (bookingDate < today) {
      errors.date = 'Reservation date cannot be in the past.';
    }

    // 2. Booking at least 1 hour ahead if today
    if (bookingDate.getTime() === today.getTime()) {
      const [slotHours] = selectedTimeSlot.split(':').map(Number);
      const currentHour = new Date().getHours();
      if (slotHours <= currentHour) {
        errors.timeSlot = 'Bookings must be scheduled at least 1 hour in advance.';
      }
    }

    // 3. Party size between 1 and 12
    if (!partySize || partySize < 1 || partySize > 12) {
      errors.partySize = 'Party size must be between 1 and 12 guests.';
    }

    // 4. Pakistani phone format: 03XX-XXXXXXX
    const pakPhoneRegex = /^03\d{2}-\d{7}$/;
    if (!contactPhone.trim()) {
      errors.phone = 'Contact phone number is required.';
    } else if (!pakPhoneRegex.test(contactPhone.trim())) {
      errors.phone = 'Phone must match Pakistani mobile format (03XX-XXXXXXX).';
    }

    // 5. Contact Name
    if (!contactName.trim()) {
      errors.name = 'Contact guest name is required.';
    }

    // 6. Table availability check
    if (!selectedTable) {
      errors.table = `No table available for ${partySize} guests at ${selectedTimeSlot}. Please choose another time.`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [selectedDate, selectedTimeSlot, partySize, contactPhone, contactName, selectedTable]);

  /**
   * Create Reservation action (Question 7 Requirement: POST /api/reservations)
   */
  const createReservation = useCallback(async () => {
    if (!validateReservation()) {
      throw new Error('Please correct the highlighted validation errors.');
    }

    const payload = {
      tableId: selectedTable._id || selectedTable.id,
      date: selectedDate,
      time: selectedTimeSlot,
      guests: Number(partySize),
      specialRequests: specialRequests.trim(),
      customerName: contactName.trim(),
      phone: contactPhone.trim(),
    };

    // Calls backend POST /api/reservations (throws error on 409 Conflict if double booked)
    const serverResult = await apiClient('/api/reservations', {
      method: 'POST',
      body: payload,
    });

    const newReservation = normalizeReservation(serverResult);
    setReservationsList((prev) => [newReservation, ...prev]);

    // Persist cache
    try {
      const currentStored = await safeStorage.getItem(RESERVATIONS_STORAGE_KEY);
      const parsed = currentStored ? JSON.parse(currentStored) : [];
      await safeStorage.setItem(
        RESERVATIONS_STORAGE_KEY,
        JSON.stringify([newReservation, ...parsed])
      );
    } catch (e) {
      // cache write error ignored
    }

    return newReservation;
  }, [
    validateReservation,
    selectedTable,
    selectedDate,
    selectedTimeSlot,
    partySize,
    specialRequests,
    contactName,
    contactPhone,
  ]);

  /**
   * Cancel Reservation action
   */
  const cancelReservation = useCallback(async (reservationId) => {
    try {
      await apiClient(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        body: { status: 'Cancelled' },
      });
    } catch (e) {
      console.warn('[useReservation] Backend cancel sync notice:', e.message);
    }

    setReservationsList((prev) =>
      prev.map((res) =>
        res.id === reservationId || res._id === reservationId
          ? { ...res, status: 'Cancelled' }
          : res
      )
    );
  }, []);

  return {
    // States
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    partySize,
    setPartySize,
    selectedTable,
    setSelectedTable,
    contactName,
    setContactName,
    contactPhone,
    setContactPhone,
    specialRequests,
    setSpecialRequests,
    reservationsList,
    validationErrors,
    availableTablesCount: getAvailableTablesForSlot(selectedDate, selectedTimeSlot, partySize).length,
    isLoading,

    // Actions & Helpers
    isSlotAvailable,
    getAvailableTablesForSlot,
    validateReservation,
    createReservation,
    cancelReservation,
    refetchReservations: loadReservations,
  };
}

export default useReservation;
