import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useReservation } from '../context/ReservationContext';
import { useTheme } from '../context/ThemeContext';

export const ConfirmBookingView = () => {
  const {
    selectedBus,
    selectedSeats,
    toggleSeat,
    confirmBooking,
    backToSecondDisplay,
    user,
  } = useReservation();
  const { colors } = useTheme();

  const [passengerName, setPassengerName] = useState(user?.name || '');
  const [passengerPhone, setPassengerPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card' | 'cash'>('wallet');

  // Promo code feature
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState('');

  if (!selectedBus) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No bus selected for booking.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={backToSecondDisplay}>
          <Text style={styles.backBtnText}>➔ Return to Main Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const baseFare = (selectedBus.price ?? selectedBus.pricePerTrip) * selectedSeats.length;
  const terminalFee = selectedSeats.length > 0 ? 2.5 : 0;
  const finalTotal = Math.max(0, baseFare + terminalFee - discountAmount);

  const applyPromo = () => {
    setPromoError('');
    setPromoMessage('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'BUSGO10' || code === 'SAVE10') {
      const discount = 5.0;
      setDiscountAmount(discount);
      setPromoMessage('Promo code applied: ₱5.00 discount!');
    } else if (code === 'BUSGOVIP') {
      const discount = baseFare * 0.2;
      setDiscountAmount(discount);
      setPromoMessage('VIP Promo applied: 20% discount off base fare!');
    } else {
      setPromoError('Invalid promo code. Try "BUSGO10"');
    }
  };

  const handleConfirm = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least 1 seat to confirm your reservation.');
      return;
    }
    if (!passengerName.trim()) {
      alert('Please provide passenger name.');
      return;
    }
    confirmBooking(passengerName, passengerPhone, paymentMethod, discountAmount);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      {/* Top Navigation Row */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.backToBoardBtn}
          onPress={backToSecondDisplay}
          activeOpacity={0.8}
        >
          <Text style={styles.backToBoardText}>❮ Back to Main Menu</Text>
        </TouchableOpacity>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepIndicatorText}>Step 2 of 3: Confirm Booking</Text>
        </View>
      </View>

      <Text style={styles.pageTitle}>Confirm Your Bus Reservation</Text>
      <Text style={styles.pageSubtitle}>
        Review trip schedule, select your preferred seats, and finalize payment.
      </Text>

      {/* Selected Bus Overview Card */}
      <View style={styles.busSummaryCard}>
        <View style={styles.busSummaryTop}>
          <View>
            <View style={styles.busNumberRow}>
              <Text style={styles.busNumberText}>{selectedBus.busNumber}</Text>
              <View style={styles.busTypeTag}>
                <Text style={styles.busTypeTagText}>{selectedBus.busType}</Text>
              </View>
            </View>
            <Text style={styles.operatorText}>{selectedBus.operator}</Text>
          </View>

          <View style={styles.pricePerTripBadge}>
            <Text style={styles.priceBadgeLabel}>FARE PER TRIP</Text>
            <Text style={styles.priceBadgeValue}>
              {selectedBus.currency}
              {(selectedBus.price ?? selectedBus.pricePerTrip).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Route Row: "From _ -> To _" */}
        <View style={styles.routeRow}>
          <View style={styles.routeCol}>
            <Text style={styles.routeHeader}>ROUTE (FROM ➔ TO)</Text>
            <Text style={styles.routePoint}>
              {selectedBus.route || `From ${selectedBus.origin} -> To ${selectedBus.destination}`}
            </Text>
          </View>
        </View>

        {/* Matched Metrics Summary: Time & Available Seats (Departure location removed) */}
        <View style={styles.metricsSummaryRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>⏱️ SCHEDULED TIME (HH:MM:SS)</Text>
            <Text style={styles.metricValueTime}>{selectedBus.timeFormatted}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>💺 AVAILABLE SEATS</Text>
            <Text style={styles.metricValue}>
              {selectedBus.available_seats ?? selectedBus.availableSeats} of {selectedBus.total_seats ?? selectedBus.totalSeats} Available
            </Text>
          </View>
        </View>
      </View>

      {/* Main Layout: Seat Map & Passenger Details */}
      <View style={styles.twoColumnGrid}>
        {/* Column 1: Interactive Seat Map */}
        <View style={styles.seatSectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Cabin Seats</Text>
            <Text style={styles.sectionSubtitle}>
              {selectedSeats.length > 0
                ? `${selectedSeats.length} seat(s) selected: ${selectedSeats.join(', ')}`
                : 'Tap to choose your seats (up to 6 seats)'}
            </Text>
          </View>

          {/* Seat Legend */}
          <View style={styles.seatLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.seatSample, styles.seatAvailable]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.seatSample, styles.seatSelected]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.seatSample, styles.seatBooked]} />
              <Text style={styles.legendText}>Booked</Text>
            </View>
          </View>

          {/* Cabin Visual Grid */}
          <View style={styles.cabinContainer}>
            {/* Front of Bus & Driver Wheel */}
            <View style={styles.cabinFront}>
              <View style={styles.driverSeat}>
                <Text style={styles.driverIcon}>🧑‍✈️</Text>
                <Text style={styles.driverLabel}>DRIVER</Text>
              </View>
              <View style={styles.cabinDoor}>
                <Text style={styles.doorText}>DOOR 🚪</Text>
              </View>
            </View>

            {/* Rows of 4 seats: A, B (Aisle) C, D */}
            <View style={styles.seatsGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((rowNum) => {
                const seatA = selectedBus.seats.find((s) => s.row === rowNum && s.col === 'A');
                const seatB = selectedBus.seats.find((s) => s.row === rowNum && s.col === 'B');
                const seatC = selectedBus.seats.find((s) => s.row === rowNum && s.col === 'C');
                const seatD = selectedBus.seats.find((s) => s.row === rowNum && s.col === 'D');

                const renderSeatBtn = (seat?: typeof seatA) => {
                  if (!seat) return <View style={styles.seatEmptyPlaceholder} />;
                  const isSelected = selectedSeats.includes(seat.id);
                  const isBooked = seat.isBooked;

                  return (
                    <TouchableOpacity
                      key={seat.id}
                      style={[
                        styles.seatBtn,
                        isSelected && styles.seatBtnSelected,
                        isBooked && styles.seatBtnBooked,
                      ]}
                      onPress={() => !isBooked && toggleSeat(seat.id)}
                      disabled={isBooked}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.seatBtnText,
                          isSelected && styles.seatBtnTextSelected,
                          isBooked && styles.seatBtnTextBooked,
                        ]}
                      >
                        {seat.id}
                      </Text>
                    </TouchableOpacity>
                  );
                };

                return (
                  <View key={rowNum} style={styles.seatRow}>
                    <View style={styles.pairLeft}>
                      {renderSeatBtn(seatA)}
                      {renderSeatBtn(seatB)}
                    </View>

                    {/* Aisle */}
                    <View style={styles.aisleCol}>
                      <Text style={styles.aisleText}>{rowNum}</Text>
                    </View>

                    <View style={styles.pairRight}>
                      {renderSeatBtn(seatC)}
                      {renderSeatBtn(seatD)}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Column 2: Passenger Details & Fare Calculation */}
        <View style={styles.formSectionCol}>
          {/* Passenger Details */}
          <View style={styles.passengerCard}>
            <Text style={styles.sectionTitle}>Passenger Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PRIMARY PASSENGER NAME</Text>
              <TextInput
                style={styles.input}
                value={passengerName}
                onChangeText={setPassengerName}
                placeholder="Full Legal Name"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONTACT PHONE NUMBER</Text>
              <TextInput
                style={styles.input}
                value={passengerPhone}
                onChangeText={setPassengerPhone}
                placeholder="+63 9XX XXX XXXX"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Payment Method Selector */}
          <View style={styles.paymentCard}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>

            <View style={styles.paymentMethodsRow}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'wallet' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('wallet')}
                activeOpacity={0.8}
              >
                <Text style={styles.paymentIcon}>📱</Text>
                <Text style={styles.paymentName}>Digital Wallet</Text>
                <Text style={styles.paymentSub}>Apple Pay / GCash / PayPal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'card' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('card')}
                activeOpacity={0.8}
              >
                <Text style={styles.paymentIcon}>💳</Text>
                <Text style={styles.paymentName}>Debit / Credit Card</Text>
                <Text style={styles.paymentSub}>Visa / Mastercard / Amex</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'cash' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('cash')}
                activeOpacity={0.8}
              >
                <Text style={styles.paymentIcon}>💵</Text>
                <Text style={styles.paymentName}>Bus Terminal Counter</Text>
                <Text style={styles.paymentSub}>Cash at Gate Before Boarding</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Promo Code Input */}
          <View style={styles.promoCard}>
            <Text style={styles.inputLabel}>PROMO CODE</Text>
            <View style={styles.promoInputRow}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter coupon (e.g. BUSGO10)"
                placeholderTextColor="#64748B"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.applyPromoBtn}
                onPress={applyPromo}
                activeOpacity={0.8}
              >
                <Text style={styles.applyPromoBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
            {promoMessage ? (
              <Text style={styles.promoSuccessText}>✅ {promoMessage}</Text>
            ) : null}
            {promoError ? (
              <Text style={styles.promoErrorText}>⚠️ {promoError}</Text>
            ) : null}
          </View>

          {/* Price Calculation Summary */}
          <View style={styles.priceBreakdownCard}>
            <Text style={styles.sectionTitle}>Fare Breakdown</Text>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                Base Trip Fare ({selectedSeats.length} seat(s) × {selectedBus.currency}
                {selectedBus.pricePerTrip.toFixed(2)})
              </Text>
              <Text style={styles.breakdownValue}>
                {selectedBus.currency}
                {baseFare.toFixed(2)}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Bus Terminal Facility &amp; Travel Insurance</Text>
              <Text style={styles.breakdownValue}>
                {selectedBus.currency}
                {terminalFee.toFixed(2)}
              </Text>
            </View>

            {discountAmount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabelDiscount}>Promo Code Discount</Text>
                <Text style={styles.breakdownValueDiscount}>
                  -{selectedBus.currency}
                  {discountAmount.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>TOTAL TRIP AMOUNT</Text>
                <Text style={styles.totalSub}>Taxes &amp; Bus Terminal boarding pass included</Text>
              </View>
              <Text style={styles.totalAmount}>
                {selectedBus.currency}
                {finalTotal.toFixed(2)}
              </Text>
            </View>

            {/* Confirmation CTA */}
            <TouchableOpacity
              style={[
                styles.confirmBookingBtn,
                selectedSeats.length === 0 && styles.confirmBookingBtnDisabled,
              ]}
              onPress={handleConfirm}
              disabled={selectedSeats.length === 0}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBookingBtnText}>
                {selectedSeats.length > 0
                  ? `Confirm Booking & Reserve (${selectedSeats.length} Seat${
                      selectedSeats.length > 1 ? 's' : ''
                    })`
                  : 'Select at least 1 seat above'}
              </Text>
              {selectedSeats.length > 0 && (
                <Text style={styles.confirmBookingBtnSub}>
                  Total: {selectedBus.currency}
                  {finalTotal.toFixed(2)} via{' '}
                  {paymentMethod === 'wallet'
                    ? 'Digital Wallet'
                    : paymentMethod === 'card'
                    ? 'Card'
                    : 'Bus Terminal Cash'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
    paddingBottom: 40,
    maxWidth: 1100,
    marginHorizontal: 'auto',
    width: '100%',
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
  backBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  backToBoardBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backToBoardText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  stepIndicator: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepIndicatorText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 18,
  },
  busSummaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  busSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  busNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  busNumberText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  busTypeTag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  busTypeTagText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  operatorText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  pricePerTripBadge: {
    backgroundColor: '#0F233A',
    borderColor: '#1D4ED8',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'flex-end',
  },
  priceBadgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.5,
  },
  priceBadgeValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#93C5FD',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131D31',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  routeCol: {
    flex: 1,
  },
  routeHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  routePoint: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  routeArrow: {
    color: '#38BDF8',
    fontSize: 16,
    paddingHorizontal: 12,
  },
  metricsSummaryRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metricItem: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#131D31',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  metricValueTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 18,
    flexWrap: 'wrap',
  },
  seatSectionCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 18,
  },
  formSectionCol: {
    flex: 1.2,
    minWidth: 320,
    gap: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  seatLegend: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seatSample: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  seatAvailable: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
  },
  seatSelected: {
    backgroundColor: '#3B82F6',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  seatBooked: {
    backgroundColor: '#7F1D1D',
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  cabinContainer: {
    backgroundColor: '#131D31',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cabinFront: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 10,
    marginBottom: 12,
  },
  driverSeat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  driverIcon: {
    fontSize: 14,
  },
  driverLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  cabinDoor: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  doorText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  seatsGrid: {
    gap: 8,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pairLeft: {
    flexDirection: 'row',
    gap: 6,
  },
  pairRight: {
    flexDirection: 'row',
    gap: 6,
  },
  aisleCol: {
    width: 24,
    alignItems: 'center',
  },
  aisleText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },
  seatBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatBtnSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#93C5FD',
  },
  seatBtnBooked: {
    backgroundColor: '#450A0A',
    borderColor: '#7F1D1D',
  },
  seatEmptyPlaceholder: {
    width: 36,
    height: 36,
  },
  seatBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  seatBtnTextSelected: {
    color: '#FFFFFF',
  },
  seatBtnTextBooked: {
    color: '#EF4444',
  },
  passengerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
  },
  paymentCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    gap: 12,
  },
  paymentMethodsRow: {
    gap: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  paymentOptionActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E2A4A',
  },
  paymentIcon: {
    fontSize: 18,
  },
  paymentName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  paymentSub: {
    color: '#64748B',
    fontSize: 11,
    marginLeft: 'auto',
  },
  promoCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    gap: 8,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13,
  },
  applyPromoBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyPromoBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  promoSuccessText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
  },
  promoErrorText: {
    color: '#F87171',
    fontSize: 11,
  },
  priceBreakdownCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 18,
    gap: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  breakdownValue: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownLabelDiscount: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownValueDiscount: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  totalSub: {
    fontSize: 10,
    color: '#64748B',
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#38BDF8',
  },
  confirmBookingBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  confirmBookingBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
  },
  confirmBookingBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  confirmBookingBtnSub: {
    color: '#D1FAE5',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
});
