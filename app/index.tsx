import React from 'react';
import { View } from 'react-native';
import { ReservationProvider } from '../context/ReservationContext';
import { useReservation } from '../context/ReservationContext';
import { useTheme } from '../context/ThemeContext';
import { AuthView } from '../components/AuthView';
import { SecondDisplayView } from '../components/SecondDisplayView';
import { ConfirmBookingView } from '../components/ConfirmBookingView';
import { DoneView } from '../components/DoneView';
import { MyTicketsView } from '../components/MyTicketsView';
import { Navbar } from '../components/Navbar';

/** Renders the correct view based on the current screen state */
function AppScreens() {
  const { screen } = useReservation();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Navbar is shown on all screens except the login/auth screen */}
      {screen !== 'auth' && <Navbar />}

      {/* Page routing via screen state — buttons inside each component trigger navigation */}
      {screen === 'auth' && <AuthView />}
      {screen === 'second_display' && <SecondDisplayView />}
      {screen === 'confirm_booking' && <ConfirmBookingView />}
      {screen === 'done' && <DoneView />}
      {screen === 'my_tickets' && <MyTicketsView />}
    </View>
  );
}

export default function Page() {
  return (
    <ReservationProvider>
      <AppScreens />
    </ReservationProvider>
  );
}
