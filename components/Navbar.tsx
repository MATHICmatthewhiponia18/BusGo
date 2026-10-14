import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useReservation } from '../context/ReservationContext';
import { useTheme } from '../context/ThemeContext';

export const Navbar = () => {
  const { user, systemTime, logout, isMyBookingsOpen, setIsMyBookingsOpen, bookings, screen, backToSecondDisplay, goToScreen } = useReservation();
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.brandRow}>
        <TouchableOpacity
          style={styles.logoBtn}
          onPress={() => {
            if (user && screen !== 'second_display') {
              backToSecondDisplay();
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.busIconContainer}>
            <Text style={styles.busIcon}>🚌</Text>
          </View>
          <View>
            <View style={styles.logoTextRow}>
              <Text style={[styles.logoTitle, { color: colors.textPrimary }]}>Bus</Text>
              <Text style={styles.logoHighlight}>Go</Text>
            </View>
            <Text style={[styles.logoTag, { color: colors.textSecondary }]}>BUS TERMINAL</Text>
          </View>
        </TouchableOpacity>

        {/* Live Bus Terminal Clock in HH:MM:SS */}
        <View style={[styles.clockBadge, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderLight }]}>
          <View style={styles.liveIndicator} />
          <Text style={[styles.clockLabel, { color: colors.textSecondary }]}>LIVE TIME:</Text>
          <Text style={[styles.clockValue, { color: colors.accent }]}>{systemTime}</Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        {/* Light / Dark Mode Toggle */}
        <TouchableOpacity
          style={[styles.themeToggle, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderLight }]}
          onPress={toggleTheme}
          activeOpacity={0.75}
        >
          <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
          <Text style={[styles.themeLabel, { color: colors.textSecondary }]}>{isDark ? 'Light' : 'Dark'}</Text>
        </TouchableOpacity>

        {user && (
          <View style={styles.userActions}>
            <TouchableOpacity
              style={[
                styles.ticketsBtn,
                {
                  backgroundColor: screen === 'my_tickets' ? '#0369A1' : colors.surfaceAlt,
                  borderColor: screen === 'my_tickets' ? '#38BDF8' : colors.borderLight,
                },
              ]}
              onPress={() => goToScreen('my_tickets')}
              activeOpacity={0.8}
              accessibilityLabel="View My Tickets"
            >
              <Text style={styles.ticketsBtnIcon}>🎟️</Text>
              <Text
                style={[
                  styles.ticketsBtnText,
                  { color: screen === 'my_tickets' ? '#FFFFFF' : colors.textPrimary },
                ]}
              >
                My Tickets
              </Text>
              {bookings.length > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{bookings.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={[styles.userChip, { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
                {user.name}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={logout}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  logoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  busIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  busIcon: {
    fontSize: 22,
  },
  logoTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoHighlight: {
    fontSize: 20,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: -0.5,
  },
  logoTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  clockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  clockLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clockValue: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeIcon: {
    fontSize: 14,
  },
  themeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ticketsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  ticketsBtnIcon: {
    fontSize: 14,
  },
  ticketsBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeCount: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    maxWidth: 140,
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
});
