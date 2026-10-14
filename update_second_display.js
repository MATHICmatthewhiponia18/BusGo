const fs = require('fs');
const file = 'components/SecondDisplayView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add supabase import
if (!content.includes('supabase')) {
  content = content.replace('import { Bus, BusCategory } from \'../types/bus\';', 'import { Bus, BusCategory } from \'../types/bus\';\nimport { supabase } from \'../lib/supabase\';');
}

// 2. Add useEffect and fetch state
if (!content.includes('const [dbBuses, setDbBuses]')) {
  content = content.replace(
    /const \{ colors \} = useTheme\(\);/,
    `const { colors } = useTheme();\n\n  const [dbBuses, setDbBuses] = React.useState<any[]>([]);\n  const [loading, setLoading] = React.useState(true);\n  const [error, setError] = React.useState<string | null>(null);\n\n  React.useEffect(() => {\n    fetchBuses();\n  }, []);\n\n  const fetchBuses = async () => {\n    try {\n      setLoading(true);\n      setError(null);\n      const { data, error: err } = await supabase.from('busses').select('*');\n      if (err) throw err;\n      setDbBuses(data || []);\n    } catch (err: any) {\n      console.error('Error fetching busses:', err);\n      setError(err.message || 'Failed to fetch buses');\n    } finally {\n      setLoading(false);\n    }\n  };\n`
  );
}

// 3. Update filtering logic to use dbBuses
content = content.replace(/const filteredBuses = buses.filter\(\(bus\) => \{/g, 'const filteredBuses = dbBuses.filter((bus) => {');
content = content.replace(/const standbyCount = buses.filter/g, 'const standbyCount = dbBuses.filter');
content = content.replace(/const ongoingCount = buses.filter/g, 'const ongoingCount = dbBuses.filter');
content = content.replace(/const arrivedCount = buses.filter/g, 'const arrivedCount = dbBuses.filter');
content = content.replace(/bus.category/g, '(bus.status || bus.category)');
content = content.replace(/bus.busNumber/g, '(bus.bus_name || bus.bus_number || \'\')');
content = content.replace(/bus.plateNumber/g, '(bus.plate_number || \'\')');
content = content.replace(/bus.operator/g, '(bus.operator || \'\')');
content = content.replace(/bus.origin/g, '(bus.origin || \'\')');
content = content.replace(/bus.destination/g, '(bus.destination || \'\')');
content = content.replace(/bus.busType/g, '(bus.bus_type || \'\')');

// 4. Update Category pills counts
content = content.replace(/buses\.length/g, 'dbBuses.length');

// 5. Replace List Section with Table
const listSectionRegex = /<View style=\{styles\.listSection\}>[\s\S]*?(?=<\/ScrollView>)/;

const tableReplacement = `
      <View style={styles.listSection}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.listCountText}>
            Showing {filteredBuses.length} of {dbBuses.length} registered vehicles
          </Text>
          <Text style={styles.currencyNote}>* Prices are listed per single trip</Text>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
             <Text style={styles.emptyTitle}>Loading buses...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚠️</Text>
            <Text style={styles.emptyTitle}>Error loading buses</Text>
            <Text style={styles.emptySub}>{error}</Text>
            <TouchableOpacity style={styles.resetFilterBtn} onPress={fetchBuses}>
              <Text style={styles.resetFilterText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredBuses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚌</Text>
            <Text style={styles.emptyTitle}>No matching buses found</Text>
            <Text style={styles.emptySub}>
              Try adjusting your search query or switching to another category.
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              <Text style={styles.resetFilterText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Bus Name</Text>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>Route</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Price</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Schedule Time</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Status</Text>
            </View>
            
            {/* Table Rows */}
            {filteredBuses.map((bus: any, index: number) => (
              <View key={bus.id || index} style={styles.tableRow}>
                <Text style={[styles.tableCellText, { flex: 2, fontWeight: '700', color: '#F8FAFC' }]}>
                  {bus.bus_name || bus.bus_number || 'Unknown'}
                </Text>
                <Text style={[styles.tableCellText, { flex: 3 }]}>
                  {bus.route || (bus.origin ? \`\${bus.origin} ➔ \${bus.destination}\` : 'N/A')}
                </Text>
                <Text style={[styles.tableCellText, { flex: 1.5, color: '#38BDF8', fontWeight: '700' }]}>
                  ₱{Number(bus.price || bus.price_per_trip || 0).toFixed(2)}
                </Text>
                <Text style={[styles.tableCellText, { flex: 2 }]}>
                  {bus.schedule_time || bus.time_formatted || 'N/A'}
                </Text>
                <View style={[{ flex: 2, alignItems: 'flex-start' }]}>
                  {renderCategoryBadge(bus.status || bus.category, bus.status || bus.category_label || 'Unknown')}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    `;

content = content.replace(listSectionRegex, tableReplacement);

// 6. Add Table styles at the end
const stylesAddition = `
  tableContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tableHeaderText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tableCellText: {
    color: '#E2E8F0',
    fontSize: 14,
    paddingRight: 10,
  },
});
`;

content = content.replace(/\}\);\s*$/, stylesAddition);

fs.writeFileSync(file, content);
console.log('SecondDisplayView updated successfully');
