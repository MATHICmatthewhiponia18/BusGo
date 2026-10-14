import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useReservation } from '../context/ReservationContext';
import { useTheme } from '../context/ThemeContext';

export const DoneView = () => {
  const { currentBooking, backToSecondDisplay, setIsMyBookingsOpen, goToScreen } = useReservation();
  const { colors } = useTheme();

  if (!currentBooking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No active booking found.</Text>
        <TouchableOpacity style={styles.backActionBtn} onPress={backToSecondDisplay}>
          <Text style={styles.backActionBtnText}>➔ Return to Main Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.doneWrapper}>
        {/* Celebration Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIconBadge}>
            <Text style={styles.successIcon}>🎉</Text>
          </View>
          <Text style={styles.successTitle}>Booking Confirmed & Done!</Text>
          <Text style={styles.successSubtitle}>
            Your digital boarding pass has been issued. Show this when boarding at the gate.
          </Text>
        </View>

        {/* E-Ticket Card */}
        <View style={styles.ticketCard}>
          {/* Ticket Header */}
          <View style={styles.ticketTop}>
            <View>
              <Text style={styles.ticketBrand}>BUSGO OFFICIAL E-BOARDING PASS</Text>
              <Text style={styles.bookingRefText}>{currentBooking.bookingRef}</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>{currentBooking.status}</Text>
            </View>
          </View>

          {/* Route Section: "From _ -> To _" */}
          <View style={styles.ticketRouteSection}>
            <View style={styles.routeCol}>
              <Text style={styles.routeLabel}>FROM</Text>
              <Text style={styles.stationName}>{currentBooking.origin}</Text>
            </View>

            <View style={styles.routeIconCol}>
              <Text style={styles.busTripIcon}>🚌</Text>
              <Text style={styles.tripTypeLabel}>DIRECT</Text>
            </View>

            <View style={styles.routeCol}>
              <Text style={styles.routeLabel}>TO</Text>
              <Text style={styles.stationName}>{currentBooking.destination}</Text>
            </View>
          </View>
          <View style={styles.ticketRouteBanner}>
            <Text style={styles.ticketRouteBannerText}>
              ROUTE: {currentBooking.route || `From ${currentBooking.origin} -> To ${currentBooking.destination}`}
            </Text>
          </View>

          {/* Ticket Perforated Divider */}
          <View style={styles.perforatedLineContainer}>
            <View style={styles.circleNotchLeft} />
            <View style={styles.dashedDivider} />
            <View style={styles.circleNotchRight} />
          </View>

          {/* Key Booking Details Grid: Location, Time (HH:MM:SS), Seats, Price */}
          <View style={styles.ticketDetailsGrid}>
            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>⏱️ DEPARTURE TIME</Text>
              <Text style={styles.timeValueHHMMSS}>{currentBooking.departureTime}</Text>
              <Text style={styles.detailSub}>Hours:Mins:Secs</Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>💺 ALLOCATED SEATS</Text>
              <Text style={styles.seatsValue}>
                {currentBooking.selectedSeats.join(', ')}
              </Text>
              <Text style={styles.detailSub}>
                {currentBooking.selectedSeats.length} Reserved Passenger(s)
              </Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>🚍 BUS & OPERATOR</Text>
              <Text style={styles.busInfoValue}>
                {currentBooking.busNumber} • {currentBooking.busType}
              </Text>
              <Text style={styles.detailSub}>{currentBooking.operator}</Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>👤 PASSENGER</Text>
              <Text style={styles.passengerValue}>{currentBooking.passengerName}</Text>
              <Text style={styles.detailSub}>{currentBooking.passengerPhone}</Text>
            </View>
          </View>

          {/* Payment & Price Row */}
          <View style={styles.paymentSummaryRow}>
            <View>
              <Text style={styles.paidLabel}>TOTAL FARE PAID</Text>
              <Text style={styles.paidMethod}>
                via {currentBooking.paymentMethod.toUpperCase()} (Authorized)
              </Text>
            </View>
            <Text style={styles.totalPriceValue}>
              ₱{currentBooking.totalPrice.toFixed(2)}
            </Text>
          </View>

          {/* Simulated QR Code Graphic */}
          <View style={styles.qrSection}>
            <View style={styles.qrBox}>
              {/* Geometric pattern simulating high-tech QR */}
              <View style={styles.qrRow}>
                <View style={styles.qrCornerBlock} />
                <View style={styles.qrBarCenter} />
                <View style={styles.qrCornerBlock} />
              </View>
              <View style={styles.qrRow}>
                <View style={styles.qrDot} />
                <View style={styles.qrCenterCore} />
                <View style={styles.qrDot} />
              </View>
              <View style={styles.qrRow}>
                <View style={styles.qrCornerBlock} />
                <View style={styles.qrBarCenter} />
                <View style={styles.qrCornerBlock} />
              </View>
            </View>
            <View style={styles.qrInstructions}>
              <Text style={styles.qrCodeText}>{currentBooking.bookingRef}</Text>
              <Text style={styles.qrHint}>
                Scan at gate turnstile or show to bus conductor for rapid boarding.
              </Text>
            </View>
          </View>
        </View>

        {/* PRIMARY ACTION: Return to Main Menu as requested */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.primaryBackBtn}
            onPress={backToSecondDisplay}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBackBtnText}>
              ➔ Back to Main Menu
            </Text>
            <Text style={styles.primaryBackBtnSub}>
              Return to Bus Dispatch Board
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => goToScreen('my_tickets')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>🎟️ View in My Tickets List</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneWrapper: {
    width: '100%',
    maxWidth: 620,
    gap: 20,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0B1120',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
  },
  backActionBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backActionBtnText: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  successIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  successIcon: {
    fontSize: 28,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 18,
  },
  ticketCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  ticketBrand: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  bookingRefText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusBadgeText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ticketRouteBanner: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  ticketRouteBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ticketRouteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#131D31',
  },
  routeCol: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stationName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  gateDetail: {
    fontSize: 11,
    color: '#94A3B8',
  },
  routeIconCol: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  busTripIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tripTypeLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  perforatedLineContainer: {
    position: 'relative',
    height: 24,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    marginHorizontal: 20,
  },
  circleNotchLeft: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0B1120',
  },
  circleNotchRight: {
    position: 'absolute',
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0B1120',
  },
  ticketDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  detailBox: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#131D31',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  detailBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timeValueHHMMSS: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  seatsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  busInfoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  passengerValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  detailSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#131D31',
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  paidLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  paidMethod: {
    fontSize: 11,
    color: '#64748B',
  },
  totalPriceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#34D399',
  },
  qrSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  qrBox: {
    width: 72,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 6,
    justifyContent: 'space-between',
  },
  qrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrCornerBlock: {
    width: 16,
    height: 16,
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },
  qrBarCenter: {
    width: 14,
    height: 6,
    backgroundColor: '#0F172A',
  },
  qrDot: {
    width: 6,
    height: 6,
    backgroundColor: '#0F172A',
  },
  qrCenterCore: {
    width: 14,
    height: 14,
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },
  qrInstructions: {
    flex: 1,
  },
  qrCodeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  qrHint: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  actionButtonsContainer: {
    gap: 10,
  },
  primaryBackBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBackBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  primaryBackBtnSub: {
    color: '#DBEAFE',
    fontSize: 11,
    marginTop: 2,
  },
  secondaryBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
});
