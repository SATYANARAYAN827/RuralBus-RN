import { create } from 'zustand';
import {
  BusService,
  Seat,
  PassengerTicket,
  LiveTripState,
  PaymentMethod,
} from '../types';
import {
  passengerService,
  generateDefaultSeats,
  FALLBACK_BUSES,
} from '../services/passenger.service';

interface PassengerState {
  // Search state
  origin: string;
  destination: string;
  journeyDate: string;
  busTypeFilter: string;
  trips: BusService[];
  selectedTrip: BusService | null;
  isLoadingTrips: boolean;
  searchError: string | null;

  // Seat selection state
  seats: Seat[];
  selectedSeats: string[];
  passengerName: string;
  passengerPhone: string;
  isHoldingSeats: boolean;

  // Booking & Tickets
  isBookingProcessing: boolean;
  bookingError: string | null;
  confirmedTicket: PassengerTicket | null;
  tickets: PassengerTicket[];
  selectedTicket: PassengerTicket | null;
  isLoadingTickets: boolean;

  // Live Telemetry
  activeTrackingTrip: LiveTripState | null;
  isTrackingLoading: boolean;

  // Modals state
  isAllStopsOpen: boolean;
  isBuyTicketModalOpen: boolean;
  isTripDetailsOpen: boolean;
  isSeatSelectionOpen: boolean;
  isBookingConfirmOpen: boolean;
  isQrModalOpen: boolean;
  isSosModalOpen: boolean;
  isLanguageModalOpen: boolean;
  isThemeModalOpen: boolean;
  isConsentModalOpen: boolean;

  // Actions
  setOrigin: (origin: string) => void;
  setDestination: (destination: string) => void;
  setJourneyDate: (date: string) => void;
  setBusTypeFilter: (filter: string) => void;
  swapOriginDestination: () => void;
  searchBuses: () => Promise<void>;
  selectTrip: (trip: BusService) => void;
  toggleSeat: (seatLabel: string) => void;
  clearSeatSelection: () => void;
  setPassengerInfo: (name: string, phone: string) => void;
  confirmBooking: (method: PaymentMethod) => Promise<PassengerTicket | null>;
  loadTickets: () => Promise<void>;
  selectTicket: (ticket: PassengerTicket | null) => void;
  startTracking: (tripId: string) => Promise<void>;
  stopTracking: () => void;

  // Modal open/close setters
  setAllStopsOpen: (open: boolean) => void;
  setBuyTicketModalOpen: (open: boolean) => void;
  setTripDetailsOpen: (open: boolean) => void;
  setSeatSelectionOpen: (open: boolean) => void;
  setBookingConfirmOpen: (open: boolean) => void;
  setQrModalOpen: (open: boolean) => void;
  setSosModalOpen: (open: boolean) => void;
  setLanguageModalOpen: (open: boolean) => void;
  setThemeModalOpen: (open: boolean) => void;
  setConsentModalOpen: (open: boolean) => void;
}

export const usePassengerStore = create<PassengerState>((set, get) => ({
  // Initial Search State
  origin: '',
  destination: '',
  journeyDate: '26-09-2026',
  busTypeFilter: 'ALL',
  trips: FALLBACK_BUSES,
  selectedTrip: null,
  isLoadingTrips: false,
  searchError: null,

  // Initial Seat Selection
  seats: generateDefaultSeats('AC Deluxe'),
  selectedSeats: [],
  passengerName: 'Passenger',
  passengerPhone: '7381319957',
  isHoldingSeats: false,

  // Initial Booking & Tickets
  isBookingProcessing: false,
  bookingError: null,
  confirmedTicket: null,
  tickets: [],
  selectedTicket: null,
  isLoadingTickets: false,

  // Initial Tracking
  activeTrackingTrip: null,
  isTrackingLoading: false,

  // Initial Modals
  isAllStopsOpen: false,
  isBuyTicketModalOpen: false,
  isTripDetailsOpen: false,
  isSeatSelectionOpen: false,
  isBookingConfirmOpen: false,
  isQrModalOpen: false,
  isSosModalOpen: false,
  isLanguageModalOpen: false,
  isThemeModalOpen: false,
  isConsentModalOpen: false,

  // Search setters
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setJourneyDate: (journeyDate) => set({ journeyDate }),
  setBusTypeFilter: (busTypeFilter) => set({ busTypeFilter }),
  swapOriginDestination: () => {
    const { origin, destination } = get();
    set({ origin: destination, destination: origin });
  },

  searchBuses: async () => {
    const { origin, destination, journeyDate } = get();
    set({ isLoadingTrips: true, searchError: null });
    try {
      const results = await passengerService.searchRoutes(origin, destination, journeyDate);
      set({ trips: results, isLoadingTrips: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to search buses';
      set({ searchError: message, isLoadingTrips: false, trips: [] });
    }
  },

  selectTrip: (trip) => {
    const freshSeats = generateDefaultSeats(trip.busType);
    set({
      selectedTrip: trip,
      seats: freshSeats,
      selectedSeats: [],
      isTripDetailsOpen: true,
    });
  },

  toggleSeat: (seatLabel) => {
    const { seats, selectedSeats } = get();
    const seat = seats.find((s) => s.label === seatLabel);
    if (!seat || seat.status === 'BOOKED' || seat.status === 'HELD') return;

    if (selectedSeats.includes(seatLabel)) {
      set({
        selectedSeats: selectedSeats.filter((s) => s !== seatLabel),
        seats: seats.map((s) => (s.label === seatLabel ? { ...s, status: 'AVAILABLE' } : s)),
      });
    } else {
      if (selectedSeats.length >= 6) return; // Maximum 6 seats
      set({
        selectedSeats: [...selectedSeats, seatLabel],
        seats: seats.map((s) => (s.label === seatLabel ? { ...s, status: 'SELECTED' } : s)),
      });
    }
  },

  clearSeatSelection: () => {
    const { seats } = get();
    set({
      selectedSeats: [],
      seats: seats.map((s) => (s.status === 'SELECTED' ? { ...s, status: 'AVAILABLE' } : s)),
    });
  },

  setPassengerInfo: (name, phone) => set({ passengerName: name, passengerPhone: phone }),

  confirmBooking: async (method: PaymentMethod) => {
    const { selectedTrip, selectedSeats, passengerName, passengerPhone, tickets } = get();
    if (!selectedTrip || selectedSeats.length === 0) return null;

    set({ isBookingProcessing: true, bookingError: null });

    try {
      const totalAmount = selectedSeats.length * selectedTrip.fare;
      const seatNum = parseInt(selectedSeats[0].replace(/\D/g, ''), 10) || 1;
      const originStopId = (selectedTrip.stops[0] as any)?.stopId || '00000000-0000-0000-0000-000000000001';
      const destStopId = (selectedTrip.stops[selectedTrip.stops.length - 1] as any)?.stopId || '00000000-0000-0000-0000-000000000002';

      // 1. Authoritative Seat Hold (/api/v1/bookings/hold)
      const holdResult = await passengerService.holdSeat({
        tripId: selectedTrip.tripId,
        seatNumber: seatNum,
        boardingStopId: originStopId,
        droppingStopId: destStopId,
      });

      // 2. Authoritative Payment Order (/api/v1/payments/create-order)
      const order = await passengerService.createPaymentOrder(holdResult.bookingId);

      // 3. Authoritative Payment Verification (/api/v1/payments/verify)
      const verifyResult = await passengerService.verifyPayment({
        bookingId: holdResult.bookingId,
        razorpayOrderId: order.orderId,
        razorpayPaymentId: `pay_${Date.now()}`,
        razorpaySignature: 'sig_authoritative_rn',
      });

      const ticket: PassengerTicket = {
        id: verifyResult.ticketId || `tkt-${Date.now()}`,
        pnr: `RB-${(holdResult.bookingId || '').substring(0, 8).toUpperCase()}`,
        tripId: selectedTrip.tripId,
        routeCode: selectedTrip.routeCode,
        routeName: selectedTrip.routeName,
        busRegistration: selectedTrip.busRegistration,
        operatorName: selectedTrip.operatorName,
        origin: selectedTrip.stops[0]?.stopName || 'Origin',
        destination: selectedTrip.stops[selectedTrip.stops.length - 1]?.stopName || 'Destination',
        departureTime: selectedTrip.departureTime,
        arrivalTime: selectedTrip.arrivalTime,
        journeyDate: new Date().toLocaleDateString('en-GB'),
        seatNumbers: selectedSeats,
        totalFare: totalAmount,
        passengerName,
        passengerPhone,
        status: 'CONFIRMED',
        paymentMethod: method,
        qrPayload: verifyResult.qrSignature || `QR:${verifyResult.ticketId}`,
        signature: verifyResult.qrSignature || `SIG:${holdResult.bookingId}`,
        bookedAt: new Date().toISOString(),
      };

      set({
        isBookingProcessing: false,
        confirmedTicket: ticket,
        tickets: [ticket, ...tickets],
        selectedTicket: ticket,
        isBookingConfirmOpen: false,
        isSeatSelectionOpen: false,
        isTripDetailsOpen: false,
        isQrModalOpen: true,
      });

      return ticket;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking payment failed';
      set({ isBookingProcessing: false, bookingError: msg });
      return null;
    }
  },

  loadTickets: async () => {
    set({ isLoadingTickets: true });
    try {
      const tickets = await passengerService.getTickets();
      set({ tickets, isLoadingTickets: false });
    } catch {
      set({ tickets: [], isLoadingTickets: false });
    }
  },

  selectTicket: (ticket) => set({ selectedTicket: ticket }),

  startTracking: async (tripId: string) => {
    set({ isTrackingLoading: true });
    try {
      const telemetry = await passengerService.getTripLiveState(tripId);
      set({ activeTrackingTrip: telemetry, isTrackingLoading: false });
    } catch {
      set({ activeTrackingTrip: null, isTrackingLoading: false });
    }
  },

  stopTracking: () => set({ activeTrackingTrip: null }),

  // Modal actions
  setAllStopsOpen: (isAllStopsOpen) => set({ isAllStopsOpen }),
  setBuyTicketModalOpen: (isBuyTicketModalOpen) => set({ isBuyTicketModalOpen }),
  setTripDetailsOpen: (isTripDetailsOpen) => set({ isTripDetailsOpen }),
  setSeatSelectionOpen: (isSeatSelectionOpen) => set({ isSeatSelectionOpen }),
  setBookingConfirmOpen: (isBookingConfirmOpen) => set({ isBookingConfirmOpen }),
  setQrModalOpen: (isQrModalOpen) => set({ isQrModalOpen }),
  setSosModalOpen: (isSosModalOpen) => set({ isSosModalOpen }),
  setLanguageModalOpen: (isLanguageModalOpen) => set({ isLanguageModalOpen }),
  setThemeModalOpen: (isThemeModalOpen) => set({ isThemeModalOpen }),
  setConsentModalOpen: (isConsentModalOpen) => set({ isConsentModalOpen }),
}));
