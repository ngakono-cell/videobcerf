/**
 * SuperviseurDossiers — Dossier complet des demandes avec images et actions.
 * Accessible depuis le tableau de bord superviseur.
 * Affichage groupé par date avec sélecteur de date neumorphique.
 */
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from 'react-native-ui-datepicker';

import { getDossiers, DossierItem } from '@/db/api';
import { useSession } from '@/ctx';
import DesktopLayout from '@/components/DesktopLayout';

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  traite:     { label: 'Accepté',    color: '#15803d', bg: '#f0fdf4', icon: '✅' },
  refuse:     { label: 'Rejeté',     color: '#b91c1c', bg: '#fef2f2', icon: '❌' },
  inchange:   { label: 'Inchangé',   color: '#92400e', bg: '#fefce8', icon: '🔄' },
  en_attente: { label: 'En attente', color: '#1d4ed8', bg: '#eff6ff', icon: '⏳' },
  echoue:     { label: 'Échoué',     color: '#6b21a8', bg: '#fdf4ff', icon: '⚠️' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function PhotoThumb({ url, label }: { url: string | null; label: string }) {
  const [full, setFull] = useState(false);
  if (!url) return (
    <View style={{
      flex: 1, aspectRatio: 1, borderRadius: 12, backgroundColor: '#f1f5f9',
      alignItems: 'center', justifyContent: 'center', gap: 4,
      boxShadow: [
        { offsetX: -3, offsetY: -3, blurRadius: 7, color: 'rgba(255,255,255,0.85)' },
        { offsetX:  3, offsetY:  3, blurRadius: 7, color: 'rgba(180,195,210,0.4)'  },
      ],
    } as object}>
      <Text style={{ fontSize: 20 }}>🖼️</Text>
      <Text style={{ color: '#94a3b8', fontSize: 10, textAlign: 'center' }}>{label}{'\n'}absente</Text>
    </View>
  );

  return (
    <>
      <Pressable
        onPress={() => setFull(true)}
        style={{
          flex: 1, aspectRatio: 1, borderRadius: 12, overflow: 'hidden',
          boxShadow: [
            { offsetX: -3, offsetY: -3, blurRadius: 7, color: 'rgba(255,255,255,0.85)' },
            { offsetX:  3, offsetY:  3, blurRadius: 7, color: 'rgba(180,195,210,0.4)'  },
          ],
        } as object}
      >
        <Image source={{ uri: url }} style={{ flex: 1 }} contentFit="cover" />
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 4, alignItems: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{label}</Text>
        </View>
      </Pressable>

      {/* Visionneuse plein écran */}
      {full && (
        <Pressable
          onPress={() => setFull(false)}
          style={{
            position: 'absolute', top: -200, left: -200,
            width: 800, height: 1200,
            backgroundColor: 'rgba(0,0,0,0.85)',
            alignItems: 'center', justifyContent: 'center', zIndex: 99,
          }}
        >
          <Image source={{ uri: url }} style={{ width: 300, height: 300, borderRadius: 16 }} contentFit="contain" />
          <Text style={{ color: '#fff', marginTop: 12, fontSize: 13 }}>Appuyez pour fermer</Text>
        </Pressable>
      )}
    </>
  );
}

function DossierCard({ item }: { item: DossierItem }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUT_CONFIG[item.statut] ?? { label: item.statut, color: '#64748b', bg: '#f8fafc', icon: '❓' };

  return (
    <View style={{
      backgroundColor: '#eef2f7', borderRadius: 18, overflow: 'hidden',
      boxShadow: [
        { offsetX: -5, offsetY: -5, blurRadius: 12, color: 'rgba(255,255,255,0.9)' },
        { offsetX:  5, offsetY:  5, blurRadius: 12, color: 'rgba(180,195,210,0.45)' },
      ],
      borderCurve: 'continuous',
    } as object}>
      {/* En-tête cliquable */}
      <Pressable
        onPress={() => setExpanded(v => !v)}
        style={{ padding: 14, gap: 8 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center',
            boxShadow: [
              { offsetX: -2, offsetY: -2, blurRadius: 5, color: 'rgba(255,255,255,0.9)' },
              { offsetX:  2, offsetY:  2, blurRadius: 5, color: 'rgba(180,195,210,0.4)' },
            ],
          } as object}>
            <Text style={{ fontSize: 18 }}>{cfg.icon}</Text>
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14 }}>
              📞 {item.numero_a_certifier}
            </Text>
            <Text style={{ color: '#64748b', fontSize: 11 }}>
              {item.demandeur_nom} · {formatDate(item.created_at)}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={{
              backgroundColor: cfg.bg, borderRadius: 99,
              paddingHorizontal: 9, paddingVertical: 4,
              boxShadow: [
                { offsetX: -2, offsetY: -2, blurRadius: 4, color: 'rgba(255,255,255,0.85)' },
                { offsetX:  2, offsetY:  2, blurRadius: 4, color: 'rgba(180,195,210,0.35)'  },
              ],
            } as object}>
              <Text style={{ color: cfg.color, fontSize: 11, fontWeight: '700' }}>{cfg.label}</Text>
            </View>
            <Text style={{ color: '#94a3b8', fontSize: 11 }}>{expanded ? '▲' : '▼'}</Text>
          </View>
        </View>
      </Pressable>

      {/* Détails dépliés */}
      {expanded && (
        <View style={{
          borderTopWidth: 1, borderTopColor: 'rgba(180,195,210,0.4)',
          padding: 14, gap: 12,
        }}>
          {/* Photos */}
          <View>
            <Text style={{ color: '#475569', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
              📷 Pièces d'identité reçues
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PhotoThumb url={item.photo_recto_url} label="Recto" />
              <PhotoThumb url={item.photo_verso_url} label="Verso" />
              <PhotoThumb url={item.photo_live_url}  label="Live"  />
            </View>
          </View>

          {/* Infos */}
          <View style={{
            backgroundColor: '#f0f4f8', borderRadius: 12, padding: 12, gap: 6,
            boxShadow: [
              { offsetX: -2, offsetY: -2, blurRadius: 5, color: 'rgba(255,255,255,0.85)' },
              { offsetX:  2, offsetY:  2, blurRadius: 5, color: 'rgba(180,195,210,0.3)'  },
            ],
          } as object}>
            <Text style={{ color: '#475569', fontSize: 12 }}>
              <Text style={{ fontWeight: '700' }}>Agent : </Text>{item.agent_nom}
            </Text>
            <Text style={{ color: '#475569', fontSize: 12 }}>
              <Text style={{ fontWeight: '700' }}>Demandeur : </Text>{item.demandeur_nom}
            </Text>
            {item.traite_at && (
              <Text style={{ color: '#475569', fontSize: 12 }}>
                <Text style={{ fontWeight: '700' }}>Traité le : </Text>{formatDate(item.traite_at)}
              </Text>
            )}
          </View>

          {/* Action effectuée */}
          <View style={{
            backgroundColor: cfg.bg, borderRadius: 12, padding: 12,
            borderLeftWidth: 3, borderLeftColor: cfg.color,
            boxShadow: [
              { offsetX: -2, offsetY: -2, blurRadius: 5, color: 'rgba(255,255,255,0.85)' },
              { offsetX:  2, offsetY:  2, blurRadius: 5, color: 'rgba(180,195,210,0.3)'  },
            ],
          } as object}>
            <Text style={{ color: cfg.color, fontWeight: '700', fontSize: 12, marginBottom: 2 }}>
              {cfg.icon} Action : {cfg.label}
            </Text>
            {item.raison_rejet ? (
              <Text style={{ color: cfg.color, fontSize: 12 }}>
                <Text style={{ fontWeight: '600' }}>Motif : </Text>{item.raison_rejet}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

export default function SuperviseurDossiers() {
  const { session } = useSession();
  const [dossiers, setDossiers]       = useState<DossierItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatut, setFilterStatut] = useState<string | null>(null);
  // Filtre date : null = toutes les dates
  const [filterDate, setFilterDate]   = useState<Date | null>(null);
  const [showPicker, setShowPicker]   = useState(false);
  // Valeur temporaire pendant la sélection
  const [pickerTmp, setPickerTmp]     = useState<Date>(new Date());

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    const data = await getDossiers(session.access_token);
    setDossiers(data);
    setLoading(false);
  }, [session?.access_token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Filtre + regroupement par date ─────────────────────────────────────────
  const grouped = useMemo(() => {
    let list = dossiers;

    if (search.trim()) {
      const lq = search.toLowerCase();
      list = list.filter(d =>
        d.numero_a_certifier.toLowerCase().includes(lq) ||
        d.demandeur_nom.toLowerCase().includes(lq) ||
        d.agent_nom.toLowerCase().includes(lq)
      );
    }
    if (filterStatut) list = list.filter(d => d.statut === filterStatut);
    if (filterDate) {
      const sel = filterDate.toISOString().slice(0, 10);
      list = list.filter(d => d.created_at.slice(0, 10) === sel);
    }

    // Grouper par jour (created_at)
    const map: Record<string, DossierItem[]> = {};
    for (const d of list) {
      const key = d.created_at.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(d);
    }
    // Trier les jours du plus récent au plus ancien
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items }));
  }, [dossiers, search, filterStatut, filterDate]);

  const totalFiltered = grouped.reduce((acc, g) => acc + g.items.length, 0);

  const handleStatut = (s: string) => setFilterStatut(prev => prev === s ? null : s);
  const confirmDate  = () => { setFilterDate(pickerTmp); setShowPicker(false); };
  const clearDate    = () => { setFilterDate(null); setShowPicker(false); };

  const formatDayLabel = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    const today    = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (iso === today)     return "Aujourd'hui";
    if (iso === yesterday) return 'Hier';
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  const statuts = ['traite', 'refuse', 'inchange', 'en_attente'];

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
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>📁 Dossiers des demandes</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
              {totalFiltered} dossier{totalFiltered !== 1 ? 's' : ''} affiché{totalFiltered !== 1 ? 's' : ''}
            </Text>
          </View>
          <Pressable onPress={load}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>↻</Text>
          </Pressable>
        </View>

        {/* Ligne recherche + sélecteur date */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
            paddingHorizontal: 12, paddingVertical: 8,
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, color: '#fff', fontSize: 13 }}
              placeholder="Numéro ou nom…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Bouton sélection de date */}
          <Pressable
            onPress={() => { setPickerTmp(filterDate ?? new Date()); setShowPicker(true); }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: filterDate ? '#3b82f6' : 'rgba(255,255,255,0.1)',
              borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
              borderWidth: filterDate ? 1.5 : 0, borderColor: filterDate ? '#60a5fa' : 'transparent',
            }}
          >
            <Text style={{ fontSize: 14 }}>📅</Text>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
              {filterDate
                ? filterDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                : 'Date'}
            </Text>
            {filterDate && (
              <Pressable onPress={clearDate} hitSlop={8}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '700' }}>✕</Text>
              </Pressable>
            )}
          </Pressable>
        </View>

        {/* Filtres statut */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 2 }}>
            {statuts.map(s => {
              const cfg = STATUT_CONFIG[s];
              const active = filterStatut === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => handleStatut(s)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    backgroundColor: active ? cfg.bg : 'rgba(255,255,255,0.1)',
                    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5,
                    borderWidth: active ? 1.5 : 0, borderColor: active ? cfg.color : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 11 }}>{cfg.icon}</Text>
                  <Text style={{ color: active ? cfg.color : 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' }}>
                    {cfg.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Contenu */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <ActivityIndicator size="large" color="#1a2b3c" />
          <Text style={{ color: '#64748b', fontSize: 13 }}>Chargement des dossiers…</Text>
        </View>
      ) : grouped.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text style={{ fontSize: 40 }}>📂</Text>
          <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '600' }}>Aucun dossier trouvé</Text>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>Modifiez vos filtres ou la date sélectionnée</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={g => g.date}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <View style={{ gap: 10 }}>
              {/* En-tête de groupe date */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  backgroundColor: '#eef2f7', borderRadius: 99,
                  paddingHorizontal: 12, paddingVertical: 5,
                  boxShadow: [
                    { offsetX: -3, offsetY: -3, blurRadius: 7, color: 'rgba(255,255,255,0.9)' },
                    { offsetX:  3, offsetY:  3, blurRadius: 7, color: 'rgba(180,195,210,0.45)' },
                  ],
                } as object}>
                  <Text style={{ color: '#1a2b3c', fontWeight: '800', fontSize: 13 }}>
                    📅 {formatDayLabel(group.date)}
                  </Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(180,195,210,0.5)' }} />
                <View style={{
                  backgroundColor: '#1a2b3c', borderRadius: 99,
                  paddingHorizontal: 8, paddingVertical: 3,
                }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                    {group.items.length}
                  </Text>
                </View>
              </View>

              {/* Cartes du groupe */}
              {group.items.map((item, idx) => (
                <View key={item.id}>
                  <DossierCard item={item} />
                  {idx < group.items.length - 1 && <View style={{ height: 10 }} />}
                </View>
              ))}
            </View>
          )}
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
                selected:       { backgroundColor: '#1a2b3c' },
                selected_label: { color: '#fff', fontWeight: '700' },
                day_label:      { color: '#0f172a' },
                header:         { backgroundColor: '#eef2f7' },
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
                    { offsetX: -3, offsetY: -3, blurRadius: 7, color: 'rgba(255,255,255,0.9)' },
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
                    { offsetX:  3, offsetY:  3, blurRadius: 7, color: 'rgba(0,0,0,0.35)' },
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