/**
 * AdminLocalites — Numéros reçus par localité par jour.
 * Accessible depuis l'onglet Stats du tableau de bord administrateur.
 */
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from 'react-native-ui-datepicker';

import { getLocaliteStats, LocaliteDayStats } from '@/db/api';
import { useSession } from '@/ctx';
import DesktopLayout from '@/components/DesktopLayout';

function formatDayLabel(iso: string): string {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today)     return "Aujourd'hui";
  if (iso === yesterday) return 'Hier';
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

// Palette de couleurs pour les barres
const COLORS = [
  '#2563eb', '#7c3aed', '#0369a1', '#15803d', '#b45309',
  '#b91c1c', '#6b21a8', '#0891b2', '#065f46', '#9a3412',
];

function LocaliteBar({
  entry, max, colorIdx,
}: { entry: { localite: string; count: number }; max: number; colorIdx: number }) {
  const pct   = max > 0 ? entry.count / max : 0;
  const color = COLORS[colorIdx % COLORS.length];
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
          <Text style={{ color: '#0f172a', fontSize: 13, fontWeight: '600', flex: 1 }} numberOfLines={1}>
            {entry.localite}
          </Text>
        </View>
        <View style={{
          backgroundColor: '#eef2f7', borderRadius: 99,
          paddingHorizontal: 9, paddingVertical: 3,
          boxShadow: [
            { offsetX: -2, offsetY: -2, blurRadius: 4, color: 'rgba(255,255,255,0.9)' },
            { offsetX:  2, offsetY:  2, blurRadius: 4, color: 'rgba(180,195,210,0.4)' },
          ],
        } as object}>
          <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            {entry.count}
          </Text>
        </View>
      </View>
      {/* Barre neumorphique */}
      <View style={{
        height: 8, borderRadius: 4, backgroundColor: '#dde4ed',
        boxShadow: [
          { offsetX: -1, offsetY: -1, blurRadius: 3, color: 'rgba(255,255,255,0.85)' },
          { offsetX:  1, offsetY:  1, blurRadius: 3, color: 'rgba(180,195,210,0.5)'  },
        ],
        overflow: 'hidden',
      } as object}>
        <View style={{
          height: '100%', borderRadius: 4,
          width: `${Math.max(pct * 100, pct > 0 ? 4 : 0)}%`,
          backgroundColor: color,
          opacity: 0.85,
        }} />
      </View>
    </View>
  );
}

function DayCard({ day }: { day: LocaliteDayStats }) {
  const [expanded, setExpanded] = useState(false);
  const max = day.localites[0]?.count ?? 1;

  return (
    <View style={{
      backgroundColor: '#eef2f7', borderRadius: 20,
      boxShadow: [
        { offsetX: -6, offsetY: -6, blurRadius: 14, color: 'rgba(255,255,255,0.9)' },
        { offsetX:  6, offsetY:  6, blurRadius: 14, color: 'rgba(180,195,210,0.5)' },
      ],
      borderCurve: 'continuous', overflow: 'hidden',
    } as object}>
      {/* En-tête cliquable */}
      <Pressable
        onPress={() => setExpanded(v => !v)}
        style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        {/* Icône jour */}
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: '#eef2f7', alignItems: 'center', justifyContent: 'center',
          boxShadow: [
            { offsetX: -3, offsetY: -3, blurRadius: 7, color: 'rgba(255,255,255,0.9)'  },
            { offsetX:  3, offsetY:  3, blurRadius: 7, color: 'rgba(180,195,210,0.45)' },
          ],
        } as object}>
          <Text style={{ fontSize: 20 }}>📅</Text>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14 }}>
            {formatDayLabel(day.date)}
          </Text>
          <Text style={{ color: '#64748b', fontSize: 11 }}>
            {day.localites.length} localité{day.localites.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{
            backgroundColor: '#1a2b3c', borderRadius: 99,
            paddingHorizontal: 10, paddingVertical: 4,
            boxShadow: [
              { offsetX: -2, offsetY: -2, blurRadius: 4, color: 'rgba(255,255,255,0.3)' },
              { offsetX:  2, offsetY:  2, blurRadius: 4, color: 'rgba(0,0,0,0.35)'      },
            ],
          } as object}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
              {day.total}
            </Text>
          </View>
          <Text style={{ color: '#94a3b8', fontSize: 11 }}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {/* Détail localités */}
      {expanded && (
        <View style={{
          borderTopWidth: 1, borderTopColor: 'rgba(180,195,210,0.4)',
          padding: 16, gap: 12,
        }}>
          {day.localites.map((entry, idx) => (
            <LocaliteBar key={entry.localite} entry={entry} max={max} colorIdx={idx} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function AdminLocalites() {
  const { session } = useSession();
  const [allStats, setAllStats] = useState<LocaliteDayStats[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTmp, setPickerTmp]   = useState<Date>(new Date());

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    const data = await getLocaliteStats(session.access_token);
    setAllStats(data);
    setLoading(false);
  }, [session?.access_token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const displayed = useMemo(() => {
    if (!filterDate) return allStats;
    const sel = filterDate.toISOString().slice(0, 10);
    return allStats.filter(d => d.date === sel);
  }, [allStats, filterDate]);

  const totalNumeros = useMemo(
    () => displayed.reduce((s, d) => s + d.total, 0),
    [displayed]
  );

  const confirmDate = () => { setFilterDate(pickerTmp); setShowPicker(false); };
  const clearDate   = () => { setFilterDate(null); setShowPicker(false); };

  return (
    <DesktopLayout>
    <View style={{ flex: 1, backgroundColor: '#eef2f7' }}>
      <StatusBar style="light" />

      {/* En-tête */}
      <View style={{
        backgroundColor: '#1a2b3c', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
        gap: 12,
        boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 12, color: 'rgba(0,0,0,0.2)' }],
      } as object}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.12)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 18 }}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>
              📍 Numéros par localité
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
              {totalNumeros} numéro{totalNumeros !== 1 ? 's' : ''} · {displayed.length} jour{displayed.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Pressable onPress={load}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>↻</Text>
          </Pressable>
        </View>

        {/* Bouton sélection date */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => { setPickerTmp(filterDate ?? new Date()); setShowPicker(true); }}
            style={{
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: filterDate ? '#3b82f6' : 'rgba(255,255,255,0.12)',
              borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16,
              borderWidth: filterDate ? 1.5 : 0, borderColor: filterDate ? '#60a5fa' : 'transparent',
            }}
          >
            <Text style={{ fontSize: 16 }}>📅</Text>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
              {filterDate
                ? filterDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'Filtrer par date'}
            </Text>
          </Pressable>
          {filterDate && (
            <Pressable
              onPress={clearDate}
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: 14, paddingHorizontal: 14,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>✕ Tout</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Contenu */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <ActivityIndicator size="large" color="#1a2b3c" />
          <Text style={{ color: '#64748b', fontSize: 13 }}>Chargement des statistiques…</Text>
        </View>
      ) : displayed.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 }}>
          <Text style={{ fontSize: 44 }}>📍</Text>
          <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
            Aucune donnée pour cette date
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
            Sélectionnez une autre date ou affichez toutes les données
          </Text>
          {filterDate && (
            <Pressable
              onPress={clearDate}
              style={{
                marginTop: 8, backgroundColor: '#1a2b3c',
                borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Voir toutes les dates</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={d => d.date}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <DayCard day={item} />}
        />
      )}

      {/* Modal sélecteur de date */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowPicker(false)}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={{
              backgroundColor: '#eef2f7', borderRadius: 24, padding: 20,
              width: 340, gap: 16,
              boxShadow: [
                { offsetX: -8, offsetY: -8, blurRadius: 20, color: 'rgba(255,255,255,0.9)'  },
                { offsetX:  8, offsetY:  8, blurRadius: 20, color: 'rgba(180,195,210,0.55)' },
              ],
            } as object}
          >
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, textAlign: 'center' }}>
              📅 Sélectionner une date
            </Text>
            <DateTimePicker
              mode="single"
              date={pickerTmp}
              maxDate={new Date()}
              onChange={({ date }) => { if (date) setPickerTmp(new Date(date as string)); }}
              styles={{
                selected:             { backgroundColor: '#1a2b3c' },
                selected_label:       { color: '#fff', fontWeight: '700' },
                day_label:            { color: '#0f172a' },
                header:               { backgroundColor: '#eef2f7' },
                month_selector_label: { color: '#0f172a', fontWeight: '700' },
                year_selector_label:  { color: '#0f172a', fontWeight: '700' },
                weekday_label:        { color: '#64748b' },
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={clearDate}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
                  backgroundColor: '#eef2f7',
                  boxShadow: [
                    { offsetX: -3, offsetY: -3, blurRadius: 7, color: 'rgba(255,255,255,0.9)'  },
                    { offsetX:  3, offsetY:  3, blurRadius: 7, color: 'rgba(180,195,210,0.45)' },
                  ],
                } as object}
              >
                <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 13 }}>Toutes les dates</Text>
              </Pressable>
              <Pressable
                onPress={confirmDate}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
                  backgroundColor: '#1a2b3c',
                  boxShadow: [
                    { offsetX: -3, offsetY: -3, blurRadius: 7, color: 'rgba(255,255,255,0.3)' },
                    { offsetX:  3, offsetY:  3, blurRadius: 7, color: 'rgba(0,0,0,0.35)'      },
                  ],
                } as object}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Appliquer</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
    </DesktopLayout>
  );
}