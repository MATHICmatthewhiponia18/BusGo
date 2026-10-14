import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
} from 'react-native';
import { useReservation } from '../context/ReservationContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '../types/bus';

export const MyTicketsView = () => {
  const {
    user,
    bookings,
    isBookingsLoading,
    bookingsError,
    fetchUserBookings,
    backToSecondDisplay,
    goToScreen,
  } = useReservation();
  const { colors, isDark } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);

  // Fetch logged-in user's tickets on mount
  useEffect(() => {
    if (user?.email) {
      fetchUserBookings(user.email);
    }
  }, [user?.email]);

  const onRefresh = useCallback(async () => {
    if (user?.email) {
      setRefreshing(true);
      await fetchUserBookings(user.email);
      setRefreshing(false);
    }
  }, [user?.email, fetchUserBookings]);

  // CRITICAL RULE: Users must only be able to view their own tickets
  const userTickets = bookings.filter((b) => {
    if (!user) return false;
    const userEmail = (user.email || '').trim().toLowerCase();
    const ticketEmail = (b.passengerEmail || '').trim().toLowerCase();
    if (ticketEmail && userEmail) {
      return ticketEmail === userEmail;
    }
    // Fallback match by passenger name if email was not captured in legacy record
    return b.passengerName === user.name;
  });

  const getStatusColor = (status: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'CONFIRMED':
        return { bg: '#064E3B', border: '#059669', text: '#6EE7B7', dot: '#10B981' };
      case 'BOARDED':
        return { bg: '#1E1B4B', border: '#4338CA', text: '#A5B4FC', dot: '#6366F1' };
      case 'COMPLETED':
        return { bg: '#1E293B', border: '#475569', text: '#CBD5E1', dot: '#94A3B8' };
      case 'CANCELLED':
        return { bg: '#450A0A', border: '#DC2626', text: '#FCA5A5', dot: '#EF4444' };
      default:
        return { bg: '#064E3B', border: '#059669', text: '#6EE7B7', dot: '#10B981' };
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
            colors={['#38BDF8']}
          />
        }
      >
        {/* Navigation & Header */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderLight }]}
            onPress={backToSecondDisplay}
            activeOpacity={0.8}
            accessibilityLabel="Back to Main Menu"
          >
            <Ionicons name="arrow-back" size={18} color="#38BDF8" />
            <Text style={styles.backBtnText}>Back to Main Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.refreshIconBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderLight }]}
            onPress={onRefresh}
            activeOpacity={0.7}
            accessibilityLabel="Refresh tickets from Supabase"
          >
            <Ionicons name="reload" size={16} color="#94A3B8" />
            <Text style={styles.refreshIconText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Screen Title & Info */}
        <View style={styles.titleSection}>
          <View style={styles.titleBadgeRow}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>PASSENGER E-TICKETS</Text>
            </View>
            <View style={styles.userIndicatorPill}>
              <Ionicons name="person-circle-outline" size={14} color="#38BDF8" />
              <Text style={styles.userIndicatorText}>{user?.email}</Text>
            </View>
          </View>
          <Text style={[styles.headingTitle, { color: colors.textPrimary }]}>My Tickets & Bookings</Text>
          <Text style={[styles.headingSub, { color: colors.textSecondary }]}>
            Official reservation records synced with Supabase for {user?.name || 'Passenger'}.
          </Text>
        </View>

        {/* Loading Indicator */}
        {isBookingsLoading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loadingText}>Fetching your tickets from Supabase...</Text>
          </View>
        )}

        {/* Error State */}
        {bookingsError && !isBookingsLoading && (
          <View style={styles.errorBox}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={20} color="#F87171" />
              <Text style={styles.errorTitle}>Supabase Data Note</Text>
            </View>
            <Text style={styles.errorDesc}>{bookingsError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRefresh} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isBookingsLoading && userTickets.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>🎟️</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Tickets Found</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              You don&apos;t have any active bus bookings registered under{' '}
              <Text style={styles.highlightText}>{user?.email}</Text>. Select an ongoing or standby bus from the
              terminal dispatch board to reserve your seat!
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => goToScreen('second_display')}
              activeOpacity={0.85}
            >
              <Text style={styles.browseBtnText}>Browse Available Buses</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Tickets List */}
        {!isBookingsLoading && userTickets.length > 0 && (
          <View style={styles.ticketsList}>
            <View style={styles.listHeaderRow}>
              <Text style={[styles.listCountText, { color: colors.textSecondary }]}>
                Showing <Text style={{ color: '#38BDF8', fontWeight: '800' }}>{userTickets.length}</Text> verified ticket{userTickets.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {userTickets.map((ticket) => {
              const statusTheme = getStatusColor(ticket.status);
              const ticketNum = ticket.ticketNumber || ticket.bookingRef || `BG-${ticket.id}`;
              const busName = ticket.busName || ticket.busNumber || 'Ceres Bus';
              const route = ticket.route || `From ${ticket.origin} -> To ${ticket.destination}`;
              const depTime = ticket.departureTime || '00:00:00';
              const depDate = ticket.departureDate || 'Today';
              const seats = ticket.selectedSeats && ticket.selectedSeats.length > 0
                ? ticket.selectedSeats.join(', ')
                : '1 Seat';
              const fareAmount = ticket.fare ?? ticket.totalPrice ?? ticket.price ?? 0;

              return (
                <View
                  key={ticket.id}
                  style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                >
                  {/* Card Header: Ticket No & Status */}
                  <View style={styles.ticketCardHeader}>
                    <View style={styles.ticketRefCol}>
                      <Text style={styles.ticketRefLabel}>TICKET NUMBER</Text>
                      <Text style={styles.ticketRefValue}>{ticketNum}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusTheme.bg, borderColor: statusTheme.border },
                      ]}
                    >
                      <View style={[styles.statusDot, { backgroundColor: statusTheme.dot }]} />
                      <Text style={[styles.statusBadgeText, { color: statusTheme.text }]}>
                        {ticket.status || 'CONFIRMED'}
                      </Text>
                    </View>
                  </View>

                  {/* Bus Name & Operator */}
                  <View style={styles.busInfoRow}>
                    <View style={styles.busIconBadge}>
                      <Ionicons name="bus" size={18} color="#38BDF8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.busTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {busName}
                      </Text>
                      <Text style={[styles.operatorText, { color: colors.textSecondary }]}>
                        {ticket.operator || 'Ceres Liner'} • {ticket.busType || 'Executive AC'}
                      </Text>
                    </View>
                  </View>

                  {/* Route Banner */}
                  <View style={styles.routeBanner}>
                    <Ionicons name="navigate-circle" size={16} color="#38BDF8" />
                    <Text style={styles.routeBannerText} numberOfLines={2}>
                      {route}
                    </Text>
                  </View>

                  {/* Grid of Key Info */}
                  <View style={styles.detailsGrid}>
                    <View style={styles.gridCell}>
                      <Text style={styles.cellLabel}>DEPARTURE DATE</Text>
                      <Text style={[styles.cellValue, { color: colors.textPrimary }]}>{depDate}</Text>
                    </View>
                    <View style={styles.gridCell}>
                      <Text style={styles.cellLabel}>DEPARTURE TIME</Text>
                      <Text style={[styles.cellValueHighlight, { color: '#FCD34D' }]}>{depTime}</Text>
                    </View>
                    <View style={styles.gridCell}>
                      <Text style={styles.cellLabel}>SEAT NUMBER</Text>
                      <Text style={[styles.cellValue, { color: '#38BDF8', fontWeight: '800' }]}>{seats}</Text>
                    </View>
                    <View style={styles.gridCell}>
                      <Text style={styles.cellLabel}>TOTAL FARE</Text>
                      <Text style={[styles.cellValueFare, { color: '#10B981' }]}>
                        ₱{Number(fareAmount).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Passenger Details */}
                  <View style={styles.passengerSection}>
                    <View style={styles.passengerRow}>
                      <Ionicons name="person" size={14} color="#94A3B8" />
                      <Text style={[styles.passengerName, { color: colors.textPrimary }]}>
                        {ticket.passengerName}
                      </Text>
                    </View>
                    {ticket.passengerPhone ? (
                      <View style={styles.passengerRow}>
                        <Ionicons name="call" size={14} color="#94A3B8" />
                        <Text style={[styles.passengerContact, { color: colors.textSecondary }]}>
                          {ticket.passengerPhone}
                        </Text>
                      </View>
                    ) : null}
                    {ticket.passengerEmail ? (
                      <View style={styles.passengerRow}>
                        <Ionicons name="mail" size={14} color="#94A3B8" />
                        <Text style={[styles.passengerContact, { color: colors.textSecondary }]}>
                          {ticket.passengerEmail}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Action Row */}
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => setSelectedTicket(ticket)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.detailsBtnText}>View Full Boarding Pass</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Ticket Details & Boarding Pass Modal */}
      {selectedTicket && (
        <Modal
          visible={Boolean(selectedTicket)}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedTicket(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: '#0F172A', borderColor: '#1E293B' }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeaderTitle}>Digital Boarding Pass</Text>
                  <Text style={styles.modalHeaderSub}>
                    {selectedTicket.ticketNumber || selectedTicket.bookingRef}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedTicket(null)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                {/* Status & Bus Info */}
                <View style={styles.modalBusRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalBusName}>
                      {selectedTicket.busName || selectedTicket.busNumber}
                    </Text>
                    <Text style={styles.modalRoute}>
                      {selectedTicket.route || `From ${selectedTicket.origin} -> To ${selectedTicket.destination}`}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: '#064E3B', borderColor: '#059669' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#6EE7B7' }]}>
                      {selectedTicket.status || 'CONFIRMED'}
                    </Text>
                  </View>
                </View>

                {/* Perforated separator */}
                <View style={styles.modalDivider}>
                  <View style={styles.dividerDot} />
                  <View style={styles.dividerLine} />
                  <View style={styles.dividerDot} />
                </View>

                {/* Grid Details */}
                <View style={styles.modalGrid}>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalLabel}>DEPARTURE TIME</Text>
                    <Text style={styles.modalValueHighlight}>{selectedTicket.departureTime}</Text>
                  </View>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalLabel}>DATE</Text>
                    <Text style={styles.modalValue}>{selectedTicket.departureDate || 'Today'}</Text>
                  </View>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalLabel}>ALLOCATED SEATS</Text>
                    <Text style={styles.modalValueSeat}>
                      {selectedTicket.selectedSeats.join(', ') || 'Assigned at Gate'}
                    </Text>
                  </View>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalLabel}>TOTAL FARE</Text>
                    <Text style={styles.modalValueFare}>₱{(selectedTicket.totalPrice || 0).toFixed(2)}</Text>
                  </View>
                </View>

                {/* Passenger Record */}
                <View style={styles.modalPassengerBox}>
                  <Text style={styles.modalSectionHeading}>PASSENGER INFORMATION</Text>
                  <Text style={styles.modalPassengerText}>Name: {selectedTicket.passengerName}</Text>
                  {selectedTicket.passengerPhone && (
                    <Text style={styles.modalPassengerText}>Phone: {selectedTicket.passengerPhone}</Text>
                  )}
                  {selectedTicket.passengerEmail && (
                    <Text style={styles.modalPassengerText}>Email: {selectedTicket.passengerEmail}</Text>
                  )}
                  <Text style={styles.modalPassengerText}>Payment: {selectedTicket.paymentMethod?.toUpperCase()}</Text>
                </View>

                {/* Simulated QR Code */}
                <View style={styles.qrCodeBox}>
                  <Ionicons name="qr-code" size={90} color="#F8FAFC" />
                  <Text style={styles.qrCodeRef}>
                    {selectedTicket.bookingRef || selectedTicket.ticketNumber}
                  </Text>
                  <Text style={styles.qrCodeHint}>
                    Present this code at San Carlos Terminal Gate for boarding.
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => setSelectedTicket(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalDoneBtnText}>Close Ticket Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  refreshIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  refreshIconText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  titleSection: {
    marginBottom: 22,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  badgePill: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  userIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0B1120',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  userIndicatorText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  headingTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headingSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#450A0A',
    borderColor: '#991B1B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '700',
  },
  errorDesc: {
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 18,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#7F1D1D',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#FEE2E2',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 480,
    marginBottom: 24,
  },
  highlightText: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ticketsList: {
    gap: 16,
  },
  listHeaderRow: {
    marginBottom: 4,
  },
  listCountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ticketCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 12,
  },
  ticketRefCol: {
    gap: 2,
  },
  ticketRefLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  ticketRefValue: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  busInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  busIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  busTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  operatorText: {
    fontSize: 12,
    marginTop: 2,
  },
  routeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0B1120',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  routeBannerText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#0B1120',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  gridCell: {
    width: '50%',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    gap: 2,
  },
  cellLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cellValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  cellValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cellValueFare: {
    fontSize: 15,
    fontWeight: '800',
  },
  passengerSection: {
    backgroundColor: '#0B1120',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 6,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passengerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  passengerContact: {
    fontSize: 12,
  },
  cardActionRow: {
    marginTop: 4,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    borderRadius: 8,
  },
  detailsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  modalHeaderSub: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 18,
    gap: 16,
  },
  modalBusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  modalBusName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalRoute: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  modalDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0B1120',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#0B1120',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  modalGridItem: {
    width: '50%',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    gap: 2,
  },
  modalLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  modalValueHighlight: {
    color: '#FCD34D',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalValueSeat: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800',
  },
  modalValueFare: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '800',
  },
  modalPassengerBox: {
    backgroundColor: '#0B1120',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  modalSectionHeading: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  modalPassengerText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  qrCodeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1120',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    gap: 8,
  },
  qrCodeRef: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  qrCodeHint: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
  modalFooter: {
    padding: 14,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  modalDoneBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
