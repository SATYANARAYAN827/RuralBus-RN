import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigationStore } from '../../navigation/navigation.store';
import { useAuthStore } from '../../stores/auth.store';
import { usePassengerStore } from '../../stores/passenger.store';
import { PassengerHomeScreen } from './PassengerHomeScreen';
import { RouteSearchScreen } from './RouteSearchScreen';
import { TripResultsScreen } from './TripResultsScreen';
import { TripDetailsModal } from './TripDetailsModal';
import { SeatSelectionModal } from './SeatSelectionModal';
import { BookingConfirmationModal } from './BookingConfirmationModal';
import { TicketWalletScreen } from './TicketWalletScreen';
import { QrTicketModal } from './QrTicketModal';
import { LiveTripTrackingScreen } from './LiveTripTrackingScreen';
import { PassengerProfileScreen } from './PassengerProfileScreen';

// Modals
import { AllStopsModal } from './modals/AllStopsModal';
import { BuyTicketModal } from './modals/BuyTicketModal';
import { SosEmergencyModal } from './modals/SosEmergencyModal';
import { LanguageModal } from './modals/LanguageModal';
import { ThemeModal } from './modals/ThemeModal';
import { ConsentModal } from './modals/ConsentModal';
import { BusService } from '../../types';

export const PassengerApp: React.FC = () => {
  const { activeTab, setActiveTab, openLogoutModal } = useNavigationStore();
  const authStore = useAuthStore();
  const {
    isAllStopsOpen,
    setAllStopsOpen,
    isBuyTicketModalOpen,
    setBuyTicketModalOpen,
    isTripDetailsOpen,
    setTripDetailsOpen,
    isSeatSelectionOpen,
    setSeatSelectionOpen,
    isBookingConfirmOpen,
    setBookingConfirmOpen,
    isQrModalOpen,
    setQrModalOpen,
    isSosModalOpen,
    setSosModalOpen,
    isLanguageModalOpen,
    setLanguageModalOpen,
    isThemeModalOpen,
    setThemeModalOpen,
    isConsentModalOpen,
    setConsentModalOpen,
    selectedTicket,
    selectTicket,
    selectTrip,
  } = usePassengerStore();

  // Sub-navigation state
  const [isInSearchResults, setIsInSearchResults] = useState(false);
  const [activeTrackingTripId, setActiveTrackingTripId] = useState<string | null>(null);

  const handleLogout = () => {
    openLogoutModal();
  };

  const handleOpenLiveTrack = (tripId: string) => {
    setActiveTrackingTripId(tripId);
  };

  const handleSelectTripToBook = (trip: BusService) => {
    selectTrip(trip);
    setTripDetailsOpen(true);
  };

  // If live trip tracking is active in full view
  if (activeTrackingTripId) {
    return (
      <View style={styles.container}>
        <LiveTripTrackingScreen
          tripId={activeTrackingTripId}
          onBack={() => setActiveTrackingTripId(null)}
          onOpenSos={() => setSosModalOpen(true)}
        />
        <SosEmergencyModal
          isOpen={isSosModalOpen}
          onClose={() => setSosModalOpen(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab 1: HOME */}
      {activeTab === 'HOME' && (
        <PassengerHomeScreen
          onNavigateToFindBus={() => {
            setIsInSearchResults(true);
            setActiveTab('FIND_BUS');
          }}
          onNavigateToTickets={() => setActiveTab('TICKETS')}
          onOpenLiveTrack={handleOpenLiveTrack}
        />
      )}

      {/* Tab 2: FIND_BUS (Search Form or Results) */}
      {activeTab === 'FIND_BUS' && (
        isInSearchResults ? (
          <TripResultsScreen
            onBackToSearch={() => setIsInSearchResults(false)}
            onSelectTripToBook={handleSelectTripToBook}
            onOpenLiveTrack={handleOpenLiveTrack}
          />
        ) : (
          <RouteSearchScreen
            onSearchComplete={() => setIsInSearchResults(true)}
          />
        )
      )}

      {/* Tab 3: TICKETS (Digital Ticket Wallet) */}
      {activeTab === 'TICKETS' && (
        <TicketWalletScreen
          onOpenQrModal={(ticket) => {
            selectTicket(ticket);
            setQrModalOpen(true);
          }}
          onOpenLiveTrack={handleOpenLiveTrack}
          onGoToSearch={() => {
            setIsInSearchResults(false);
            setActiveTab('FIND_BUS');
          }}
        />
      )}

      {/* Tab 4: PROFILE */}
      {activeTab === 'PROFILE' && (
        <PassengerProfileScreen
          onLogout={handleLogout}
          onOpenStopsModal={() => setAllStopsOpen(true)}
          onOpenLanguageModal={() => setLanguageModalOpen(true)}
          onOpenThemeModal={() => setThemeModalOpen(true)}
          onOpenSosModal={() => setSosModalOpen(true)}
          onOpenConsentModal={() => setConsentModalOpen(true)}
        />
      )}

      {/* Modals */}
      <AllStopsModal
        isOpen={isAllStopsOpen}
        onClose={() => setAllStopsOpen(false)}
      />

      <BuyTicketModal
        isOpen={isBuyTicketModalOpen}
        onClose={() => setBuyTicketModalOpen(false)}
        onTicketGenerated={() => {
          setActiveTab('TICKETS');
        }}
      />

      <TripDetailsModal
        isOpen={isTripDetailsOpen}
        onClose={() => setTripDetailsOpen(false)}
        onProceedToSeats={() => setSeatSelectionOpen(true)}
      />

      <SeatSelectionModal
        isOpen={isSeatSelectionOpen}
        onClose={() => setSeatSelectionOpen(false)}
        onProceedToBooking={() => setBookingConfirmOpen(true)}
      />

      <BookingConfirmationModal
        isOpen={isBookingConfirmOpen}
        onClose={() => setBookingConfirmOpen(false)}
        onBookingSuccess={() => {
          // Success opens QR ticket modal
          setQrModalOpen(true);
        }}
      />

      <QrTicketModal
        isOpen={isQrModalOpen}
        onClose={() => setQrModalOpen(false)}
        ticket={selectedTicket}
        onTrackTrip={handleOpenLiveTrack}
      />

      <SosEmergencyModal
        isOpen={isSosModalOpen}
        onClose={() => setSosModalOpen(false)}
      />

      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setLanguageModalOpen(false)}
      />

      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />

      <ConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setConsentModalOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
