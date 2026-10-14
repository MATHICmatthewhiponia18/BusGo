import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useReservation } from '../context/ReservationContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { mapSupabaseRowToBus } from '../data/mockData';
import {
  computeBusScheduleInfo,
  getManilaSecondsSinceMidnight,
  compareBusRows,
  BusScheduleInfo,
} from '../lib/busSchedule';
import type { BusCategory } from '../types/bus';

// ─── Raw row shape from Supabase ──────────────────────────────────────────────
interface RawBusRow {
  id: number;
  bus_name: string | null;
  route: string | null;
  schedule_time: string | null;
  price: number | null;
  available_seats: number | null;
  created_at: string | null;
}

interface EnrichedBus extends RawBusRow {
  info: BusScheduleInfo;
}

// ─── Section config (order + labels + colours) ────────────────────────────────
const SECTIONS: Array<{
  key: BusCategory;
  title: string;
  emoji: string;
  headerBg: string;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
}> = [
    {
      key: 'standby',
      title: 'Stand By',
      emoji: '🚏',
      headerBg: '#1C1200',
      accentColor: '#F59E0B',
      badgeBg: '#451A03',
      badgeBorder: '#92400E',
      badgeText: '#FCD34D',
      dotColor: '#F59E0B',
    },
    {
      key: 'ongoing',
      title: 'Ongoing',
      emoji: '🚌',
      headerBg: '#001A0E',
      accentColor: '#10B981',
      badgeBg: '#064E3B',
      badgeBorder: '#065F46',
      badgeText: '#6EE7B7',
      dotColor: '#10B981',
    },
    {
      key: 'just_arrived',
      title: 'Just Arrived',
      emoji: '🏁',
      headerBg: '#13004E',
      accentColor: '#A855F7',
      badgeBg: '#3B0764',
      badgeBorder: '#6B21A8',
      badgeText: '#D8B4FE',
      dotColor: '#A855F7',
    },
    {
      key: 'temporarily_closed',
      title: 'Temporarily Closed',
      emoji: '🔒',
      headerBg: '#1A0000',
      accentColor: '#EF4444',
      badgeBg: '#450A0A',
      badgeBorder: '#991B1B',
      badgeText: '#FCA5A5',
      dotColor: '#EF4444',
    },
  ];

// ─── Column widths (px) ───────────────────────────────────────────────────────
const COL_W = {
  id: 48,
  busName: 160,
  route: 220,
  price: 80,
  schedTime: 90,
  countdown: 120,
  status: 140,
  action: 90,
};
const TABLE_TOTAL_W =
  COL_W.id + COL_W.busName + COL_W.route + COL_W.price +
  COL_W.schedTime + COL_W.countdown + COL_W.status + COL_W.action;

// ─── Component ────────────────────────────────────────────────────────────────
export const SecondDisplayView = () => {
  const {
    systemTime,
    searchQuery,
    setSearchQuery,
    user,
    selectBusForBooking,
  } = useReservation();
  const { colors } = useTheme();

  const [rawBuses, setRawBuses] = useState<RawBusRow[]>([]);
  const [enriched, setEnriched] = useState<EnrichedBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Reset each section to its first 10 buses when the search changes.

  const screenWidth = Dimensions.get('window').width;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBuses = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase.from('busses').select('*');
      if (error) throw error;
      setRawBuses((data as RawBusRow[]) ?? []);
    } catch (err: any) {
      setFetchError(err?.message ?? 'Failed to load buses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBuses(); }, [fetchBuses]);

  // ── Re-enrich every second ─────────────────────────────────────────────────
  const enrich = useCallback(() => {
    const nowSecs = getManilaSecondsSinceMidnight();
    const result: EnrichedBus[] = rawBuses.map(row => ({
      ...row,
      info: computeBusScheduleInfo(row.schedule_time, row.route, nowSecs),
    }));
    result.sort((a, b) => compareBusRows(a, b, nowSecs));
    setEnriched(result);
  }, [rawBuses]);

  useEffect(() => { enrich(); }, [enrich]);
  useEffect(() => {
    const t = setInterval(enrich, 1000);
    return () => clearInterval(t);
  }, [enrich]);

  // ── Filtered buses per section ─────────────────────────────────────────────
  const q = searchQuery.toLowerCase().trim();
  const filtered = enriched.filter(bus => {
    if (!q) return true;
    return (
      (bus.bus_name ?? '').toLowerCase().includes(q) ||
      (bus.route ?? '').toLowerCase().includes(q) ||
      String(bus.id).includes(q)
    );
  });

  const bySection = (key: BusCategory) =>
    filtered.filter(b => b.info.category === key);

  // ── Book handler ───────────────────────────────────────────────────────────
  const handleBook = (bus: EnrichedBus) => {
    const mapped = mapSupabaseRowToBus({
      id: bus.id,
      bus_name: bus.bus_name,
      route: bus.route,
      schedule_time: bus.schedule_time,
      price: bus.price,
      available_seats: bus.available_seats,
    });
    selectBusForBooking(mapped);
  };

  // ── Section counts ─────────────────────────────────────────────────────────
  const counts: Record<BusCategory, number> = {
    standby: enriched.filter(b => b.info.category === 'standby').length,
    ongoing: enriched.filter(b => b.info.category === 'ongoing').length,
    just_arrived: enriched.filter(b => b.info.category === 'just_arrived').length,
    temporarily_closed: enriched.filter(b => b.info.category === 'temporarily_closed').length,
  };

  // ── Table renderer ─────────────────────────────────────────────────────────
  const renderSection = (
    sec: typeof SECTIONS[0],
    buses: EnrichedBus[]
  ) => {
    return (
      <View key={sec.key} style={styles.sectionContainer}>
        {/* Section heading */}
        <View style={[styles.sectionHeading, { borderLeftColor: sec.accentColor }]}>
          <Text style={[styles.sectionTitle, { color: sec.accentColor }]}>
            {sec.emoji}  {sec.title}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: sec.badgeBg, borderColor: sec.badgeBorder }]}>
            <Text style={[styles.countBadgeText, { color: sec.badgeText }]}>
              {counts[sec.key]} bus{counts[sec.key] !== 1 ? 'es' : ''}
            </Text>
          </View>
        </View>

        {/* Horizontal scroll wrapper */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={styles.hScroll}
          contentContainerStyle={{ minWidth: Math.max(TABLE_TOTAL_W, screenWidth - 32) }}
        >
          <View style={styles.tableCard}>
            {/* Header row */}
            <View style={[styles.tableHeaderRow, { backgroundColor: sec.headerBg }]}>
              <Text style={[styles.th, { width: COL_W.id }]}>#</Text>
              <Text style={[styles.th, { width: COL_W.busName }]}>Bus Name</Text>
              <Text style={[styles.th, { width: COL_W.route }]}>Route</Text>
              <Text style={[styles.th, { width: COL_W.price }]}>Fare</Text>
              <Text style={[styles.th, { width: COL_W.schedTime }]}>Departs</Text>
              <Text style={[styles.th, { width: COL_W.countdown }]}>Countdown</Text>
              <Text style={[styles.th, { width: COL_W.status }]}>Status</Text>
              <Text style={[styles.th, { width: COL_W.action }]}> </Text>
            </View>

            {/* Body */}
            {buses.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyRowText}>
                  {q ? 'No buses match your search.' : `No ${sec.title.toLowerCase()} buses right now.`}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.verticalTableScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                {buses.map((bus, idx) => {
                  const isLast = idx === buses.length - 1;
                  const isEven = idx % 2 === 0;
                  return (
                    <View
                      key={bus.id}
                      style={[
                        styles.tableRow,
                        isEven ? styles.tableRowEven : styles.tableRowOdd,
                        isLast && styles.tableRowLast,
                      ]}
                    >
                      <Text style={[styles.td, styles.tdMuted, { width: COL_W.id }]}>
                        {bus.id}
                      </Text>
                      <Text style={[styles.td, styles.tdBold, { width: COL_W.busName }]} numberOfLines={2}>
                        {bus.bus_name ?? `Bus #${bus.id}`}
                      </Text>
                      <Text style={[styles.td, styles.tdRoute, { width: COL_W.route }]} numberOfLines={2}>
                        {bus.route ?? '—'}
                      </Text>
                      <Text style={[styles.td, styles.tdPrice, { width: COL_W.price }]}>
                        ₱{Number(bus.price ?? 0).toFixed(0)}
                      </Text>
                      <Text style={[styles.td, styles.tdMono, { width: COL_W.schedTime }]}>
                        {(bus.schedule_time ?? 'N/A').slice(0, 5)}
                      </Text>
                      <Text
                        style={[
                          styles.td,
                          { width: COL_W.countdown },
                          sec.key === 'standby' ? styles.tdCountdownStandby :
                            sec.key === 'ongoing' ? styles.tdCountdownOngoing :
                              styles.tdMuted,
                        ]}
                      >
                        {bus.info.countdownLabel}
                      </Text>
                      <View style={{ width: COL_W.status, justifyContent: 'center' }}>
                        <View style={[styles.statusBadge, { backgroundColor: sec.badgeBg, borderColor: sec.badgeBorder }]}>
                          <View style={[styles.statusDot, { backgroundColor: sec.dotColor }]} />
                          <Text style={[styles.statusBadgeText, { color: sec.badgeText }]} numberOfLines={1}>
                            {bus.info.categoryLabel}
                          </Text>
                        </View>
                      </View>
                      <View style={{ width: COL_W.action, alignItems: 'center', justifyContent: 'center' }}>
                        <TouchableOpacity
                          style={[
                            styles.bookBtn,
                            sec.key === 'temporarily_closed' && styles.bookBtnDisabled,
                          ]}
                          onPress={() => handleBook(bus)}
                          activeOpacity={sec.key === 'temporarily_closed' ? 1 : 0.8}
                          disabled={sec.key === 'temporarily_closed'}
                        >
                          <Text style={styles.bookBtnText}>
                            {sec.key === 'temporarily_closed' ? 'Closed' : 'Book'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchBuses(true)}
          tintColor="#38BDF8"
          colors={['#38BDF8']}
        />
      }
    >
      {/* ── Page Header ── */}
      <View style={styles.pageHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.headerBadgeRow}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>MAIN MENU</Text>
            </View>
            <Text style={styles.greetingText}>Welcome, {user?.name ?? 'Passenger'}</Text>
          </View>
          <Text style={styles.pageTitle}>Live Bus Dispatch Board</Text>
          <Text style={styles.pageSubtitle}>
            Statuses update automatically · Philippine Standard Time
          </Text>
        </View>

        <View style={styles.clockBox}>
          <View style={styles.clockPulseRow}>
            <View style={styles.clockPulse} />
            <Text style={styles.clockLabel}>PST (ASIA/MANILA)</Text>
          </View>
          <Text style={styles.clockValue}>{systemTime}</Text>
          <Text style={styles.clockSub}>Auto-updating</Text>
        </View>
      </View>

      {/* ── Status Rules Legend ── */}
      <View style={styles.rulesCard}>
        <Text style={styles.rulesTitle}>STATUS RULES</Text>
        <View style={styles.rulesGrid}>
          <View style={styles.ruleItem}>
            <View style={[styles.ruleDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.ruleText}><Text style={styles.ruleBold}>Stand By</Text> — departure upcoming</Text>
          </View>
          <View style={styles.ruleItem}>
            <View style={[styles.ruleDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.ruleText}><Text style={styles.ruleBold}>Ongoing</Text> — 0–90 min after dep.</Text>
          </View>
          <View style={styles.ruleItem}>
            <View style={[styles.ruleDot, { backgroundColor: '#A855F7' }]} />
            <Text style={styles.ruleText}><Text style={styles.ruleBold}>Just Arrived</Text> — 90–180 min after dep.</Text>
          </View>
          <View style={styles.ruleItem}>
            <View style={[styles.ruleDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.ruleText}><Text style={styles.ruleBold}>Temp. Closed</Text> — 3+ hrs after dep.</Text>
          </View>
        </View>
      </View>

      {/* ── Loading / error states ── */}
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color="#38BDF8" />
          <Text style={styles.stateText}>Loading bus schedule…</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateIcon}>⚠️</Text>
          <Text style={styles.stateTitle}>Failed to load buses</Text>
          <Text style={styles.stateText}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchBuses()}>
            <Text style={styles.retryText}>↺ Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Four tables ── */
        SECTIONS.map(sec => renderSection(sec, bySection(sec.key)))
      )}
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 56 },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  headerLeft: { flex: 1, minWidth: 200 },
  headerBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  headerBadge: { backgroundColor: '#3B82F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  headerBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  greetingText: { color: '#94A3B8', fontSize: 13 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.4, marginBottom: 3 },
  pageSubtitle: { fontSize: 13, color: '#64748B' },

  clockBox: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    minWidth: 180,
  },
  clockPulseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  clockPulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  clockLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.8 },
  clockValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  clockSub: { fontSize: 10, color: '#475569', marginTop: 2 },

  // Rules legend
  rulesCard: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  rulesTitle: { color: '#475569', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  rulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ruleItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 180 },
  ruleDot: { width: 8, height: 8, borderRadius: 4 },
  ruleText: { color: '#94A3B8', fontSize: 12 },
  ruleBold: { fontWeight: '700', color: '#CBD5E1' },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 14, padding: 0 },
  clearBtn: { padding: 4 },
  clearBtnText: { color: '#94A3B8', fontSize: 14, fontWeight: '700' },

  // State boxes
  stateBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 36,
    alignItems: 'center',
    marginBottom: 20,
  },
  stateIcon: { fontSize: 40, marginBottom: 10 },
  stateTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 6 },
  stateText: { color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 8 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  retryText: { color: '#38BDF8', fontWeight: '600', fontSize: 13 },

  // Section
  sectionContainer: { marginBottom: 24 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  countBadgeText: { fontSize: 12, fontWeight: '700' },

  // Horizontal scroll
  hScroll: { borderRadius: 12, overflow: 'hidden' },
  // Show a maximum of 10 bus rows within the visible table viewport at a time; scroll vertically for additional rows
  verticalTableScroll: { maxHeight: 520 },

  // Table
  tableCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  th: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    paddingRight: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tableRowEven: { backgroundColor: '#0B1120' },
  tableRowOdd: { backgroundColor: '#0F172A' },
  tableRowLast: { borderBottomWidth: 0 },

  // Cells
  td: { paddingRight: 8, color: '#E2E8F0', fontSize: 14 },
  tdBold: { fontWeight: '700', color: '#F1F5F9' },
  tdMuted: { color: '#64748B', fontSize: 13 },
  tdRoute: { color: '#CBD5E1', fontSize: 13 },
  tdPrice: { color: '#38BDF8', fontWeight: '800', fontSize: 15 },
  tdMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  tdCountdownStandby: { color: '#FCD34D', fontWeight: '600', fontSize: 13 },
  tdCountdownOngoing: { color: '#6EE7B7', fontWeight: '600', fontSize: 13 },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    gap: 5,
    alignSelf: 'flex-start',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Book button
  bookBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  bookBtnDisabled: {
    backgroundColor: '#1E293B',
    shadowOpacity: 0,
    elevation: 0,
  },
  bookBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },

  // Empty row
  emptyRow: { padding: 28, alignItems: 'center' },
  emptyRowText: { color: '#475569', fontSize: 14 },
});
