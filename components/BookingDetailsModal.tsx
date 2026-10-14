import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useReservation } from '../context/ReservationContext';

export const BookingDetailsModal = () => {
  const { isMyBookingsOpen, setIsMyBookingsOpen, bookings, backToSecondDisplay } =
    useReservation();

  return (
    <Modal
      visible={isMyBookingsOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsMyBookingsOpen(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>My Bus Reservations</Text>
              <Text style={styles.modalSub}>
                {bookings.length} confirmed e-ticket{bookings.length === 1 ? '' : 's'} on file
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setIsMyBookingsOpen(false)}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Bookings List */}
          <ScrollView contentContainerStyle={styles.listContainer}>
            {bookings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎟️</Text>
                <Text style={styles.emptyTitle}>No reservations yet</Text>
                <Text style={styles.emptyDesc}>
                  Select any standby or ongoing bus from the Main Menu to book your first trip!
                </Text>
                <TouchableOpacity
                  style={styles.exploreBtn}
                  onPress={() => {
                    setIsMyBookingsOpen(false);
                    backToSecondDisplay();
                  }}
                >
                  <Text style={styles.exploreBtnText}>Go to Main Menu Board</Text>
                </TouchableOpacity>
              </View>
            ) : (
              bookings.map((item) => (
                <View key={item.id} style={styles.ticketCard}>
                  <View style={styles.cardTop}>
                    <View>
                      <Text style={styles.ticketRef}>{item.bookingRef}</Text>
                      <Text style={styles.busModel}>
                        {item.busNumber} • {item.operator}
                      </Text>
                    </View>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={styles.routeRow}>
                    <Text style={styles.stationText}>{item.origin}</Text>
                    <Text style={styles.arrowText}>➔</Text>
                    <Text style={styles.stationText}>{item.destination}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>DEPARTURE TIME</Text>
                      <Text style={styles.metaValueTime}>{item.departureTime}</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>SEATS</Text>
                      <Text style={styles.metaValue}>{item.selectedSeats.join(', ')}</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>AMOUNT</Text>
                      <Text style={styles.metaValuePrice}>₱{item.totalPrice.toFixed(2)}</Text>
                    </View>
                  </View>

                  <View style={styles.bayLocationRow}>
                    <Text style={styles.locationPin}>🛣️</Text>
                    <Text style={styles.locationDetail} numberOfLines={1}>
                      {item.route || `From ${item.origin} -> To ${item.destination}`}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.closeFooterBtn}
              onPress={() => setIsMyBookingsOpen(false)}
            >
              <Text style={styles.closeFooterBtnText}>Close Tickets</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '85%',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  ticketCard: {
    backgroundColor: '#131D31',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ticketRef: {
    fontSize: 15,
    fontWeight: '800',
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  busModel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusPill: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusPillText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 6,
  },
  stationText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  arrowText: {
    color: '#38BDF8',
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValueTime: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  metaValuePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34D399',
  },
  bayLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 8,
  },
  locationPin: {
    fontSize: 12,
  },
  locationDetail: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
  },
  modalFooter: {
    padding: 14,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  closeFooterBtn: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeFooterBtnText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
});
