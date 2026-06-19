/**
 * DemandeAppelScreen – Type 1 call request form.
 * 4 mandatory fields:
 *   1. ID photo – front (recto)
 *   2. ID photo – back (verso)
 *   3. Live selfie photo
 *   4. Number to certify
 * Sequential uploads to avoid OOM. Aggressive compression: 900px, 0.55 quality.
 */
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { soumettreDemandeAppel, uploadIdentityPhoto } from '@/db/api';
import DesktopLayout from '@/components/DesktopLayout';

interface PhotoSlot {
  key: 'recto' | 'verso' | 'live';
  label: string;
  icon: string;
  description: string;
  frontCamera?: boolean;
}

const PHOTO_SLOTS: PhotoSlot[] = [
  { key: 'recto', label: "Pièce d'identité – Recto", icon: '🪪', description: "Photographiez le recto de la pièce d'identité (face avant)" },
  { key: 'verso', label: "Pièce d'identité – Verso", icon: '🔄', description: "Photographiez le verso de la pièce d'identité (face arrière)" },
  { key: 'live',  label: "Photo live du client",     icon: '🤳', description: "Selfie du client tenant sa pièce d'identité visible", frontCamera: true },
];

type PhotoState = Record<'recto' | 'verso' | 'live', string | null>;

export default function DemandeAppelScreen() {
  const [photos, setPhotos]                 = useState<PhotoState>({ recto: null, verso: null, live: null });
  const [numeroACertifier, setNumeroACertifier] = useState('');
  const [uploading, setUploading]           = useState(false);
  const [uploadStep, setUploadStep]         = useState('');
  const [success, setSuccess]               = useState(false);
  const [error, setError]                   = useState('');

  // Aggressive compression: 900px max, 0.55 quality → file < 500 KB guaranteed
  const compressPhoto = async (uri: string): Promise<string> => {
    const result = await manipulateAsync(uri, [{ resize: { width: 900 } }], { compress: 0.55, format: SaveFormat.JPEG });
    return result.uri;
  };

  const pickPhoto = async (slot: PhotoSlot) => {
    setError('');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError("L'accès à la caméra est requis pour photographier les pièces d'identité."); return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      cameraType: slot.frontCamera ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
    });
    if (!result.canceled && result.assets[0]) {
      const compressed = await compressPhoto(result.assets[0].uri);
      setPhotos(prev => ({ ...prev, [slot.key]: compressed }));
    }
  };

  const filledCount = [photos.recto, photos.verso, photos.live, numeroACertifier.trim() || null].filter(Boolean).length;
  const allFilled   = filledCount === 4;

  const handleSubmit = async () => {
    if (!photos.recto || !photos.verso || !photos.live) { setError("Veuillez fournir les 3 photos de pièce d'identité."); return; }
    if (!numeroACertifier.trim()) { setError('Veuillez saisir le numéro à certifier.'); return; }
    setUploading(true); setError('');
    try {
      // Sequential uploads to avoid OOM (ArrayBuffers are freed between uploads)
      setUploadStep('Envoi recto (1/3)…');
      const rectoUrl = await uploadIdentityPhoto(photos.recto, 'recto.jpg');
      setUploadStep('Envoi verso (2/3)…');
      const versoUrl = await uploadIdentityPhoto(photos.verso, 'verso.jpg');
      setUploadStep('Envoi selfie (3/3)…');
      const liveUrl  = await uploadIdentityPhoto(photos.live, 'live.jpg');
      setUploadStep('Finalisation…');
      await soumettreDemandeAppel(rectoUrl, versoUrl, liveUrl, numeroACertifier.trim());
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('exceeded') || msg.includes('too large') || msg.includes('413')) {
        setError("Photo trop volumineuse. Réessayez — la compression sera appliquée automatiquement.");
      } else if (msg.includes('memory') || msg.includes('heap')) {
        setError("Mémoire insuffisante. Fermez d'autres applications et réessayez.");
      } else {
        setError(msg || "Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
      }
    } finally { setUploading(false); setUploadStep(''); }
  };

  if (success) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <StatusBar style="dark" />
        <View className="items-center gap-4">
          <View className="w-24 h-24 rounded-full bg-accent/10 items-center justify-center">
            <Text className="text-5xl">✅</Text>
          </View>
          <Text className="text-foreground text-2xl font-bold text-center">Demande envoyée !</Text>
          <Text className="text-muted-foreground text-center text-base" style={{ lineHeight: 24 }}>
            Votre demande d'appel a bien été transmise. Un agent vous contactera dans les meilleurs délais.
          </Text>
          <Pressable onPress={() => router.back()} className="mt-4 bg-primary rounded-2xl px-8 py-4 w-full items-center"
            style={{ borderCurve: 'continuous' } as object}>
            <Text className="text-primary-foreground font-semibold text-base">Retour à l'accueil</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <DesktopLayout>
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-5">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center rounded-full bg-primary-foreground/20">
            <Text className="text-primary-foreground text-lg font-bold">‹</Text>
          </Pressable>
          <View className="flex-1">
            <Text className="text-primary-foreground text-xl font-bold">Demander un appel</Text>
            <Text className="text-primary-foreground text-sm opacity-70">4 champs obligatoires</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerClassName="px-4 py-5 gap-4 pb-10"
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Instructions */}
          <View className="bg-card rounded-2xl p-4 flex-row gap-3"
            style={{ boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 3, color: 'rgba(0,0,0,0.06)' }], borderCurve: 'continuous' } as object}>
            <Text className="text-2xl">ℹ️</Text>
            <View className="flex-1">
              <Text className="text-foreground font-semibold text-sm mb-1">Comment procéder ?</Text>
              <Text className="text-muted-foreground text-xs" style={{ lineHeight: 18 }}>
                Remplissez les 4 champs : recto et verso de la pièce d'identité, selfie live du client et numéro à certifier.
              </Text>
            </View>
          </View>

          {/* Number field – Étape 1 */}
          <View className="bg-card rounded-2xl p-4"
            style={{ boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 3, color: 'rgba(0,0,0,0.06)' }], borderCurve: 'continuous' } as object}>
            <View className="flex-row items-center gap-3 mb-3">
              <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center"><Text className="text-lg">🔢</Text></View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 flex-wrap">
                  <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                    <Text className="text-primary-foreground text-xs font-bold">1</Text>
                  </View>
                  <Text className="text-foreground font-semibold text-sm">Numéro à certifier</Text>
                  <View className="bg-destructive/10 rounded-full px-1.5 py-0.5">
                    <Text className="text-destructive text-xs font-medium">Obligatoire</Text>
                  </View>
                </View>
                <Text className="text-muted-foreground text-xs mt-0.5">Saisissez le numéro qui doit être certifié</Text>
              </View>
            </View>
            <TextInput className="bg-secondary rounded-xl px-4 py-3.5 text-foreground text-base"
              style={{ borderCurve: 'continuous' } as object}
              placeholder="Ex : 0612345678" placeholderTextColor="#94a3b8"
              value={numeroACertifier} onChangeText={(t) => { setNumeroACertifier(t); setError(''); }}
              autoCapitalize="none" returnKeyType="done" />
          </View>

          {/* Photo slots – Étapes 2, 3, 4 */}
          {PHOTO_SLOTS.map((slot, index) => (
            <View key={slot.key} className="bg-card rounded-2xl overflow-hidden"
              style={{ boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 3, color: 'rgba(0,0,0,0.06)' }], borderCurve: 'continuous' } as object}>
              <View className="px-4 pt-4 pb-3 flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="text-lg">{slot.icon}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 flex-wrap">
                    <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                      <Text className="text-primary-foreground text-xs font-bold">{index + 2}</Text>
                    </View>
                    <Text className="text-foreground font-semibold text-sm">{slot.label}</Text>
                    <View className="bg-destructive/10 rounded-full px-1.5 py-0.5">
                      <Text className="text-destructive text-xs font-medium">Obligatoire</Text>
                    </View>
                  </View>
                  <Text className="text-muted-foreground text-xs mt-0.5">{slot.description}</Text>
                </View>
              </View>

              {photos[slot.key] ? (
                <View>
                  <Image source={{ uri: photos[slot.key]! }} style={{ width: '100%', height: 200 }} contentFit="cover" />
                  <View className="px-4 py-3 flex-row gap-2">
                    <View className="flex-1 flex-row items-center gap-1.5">
                      <Text className="text-accent text-sm">✓</Text>
                      <Text className="text-accent text-sm font-medium">Photo ajoutée</Text>
                    </View>
                    <Pressable onPress={() => pickPhoto(slot)} className="bg-secondary rounded-xl px-3 py-2" style={{ borderCurve: 'continuous' } as object}>
                      <Text className="text-foreground text-xs font-medium">Reprendre</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable onPress={() => pickPhoto(slot)}
                  className="mx-4 mb-4 border-2 border-dashed border-border rounded-xl items-center justify-center py-8 gap-2"
                  style={{ borderCurve: 'continuous' } as object}>
                  <Text className="text-3xl opacity-50">📷</Text>
                  <Text className="text-muted-foreground text-sm font-medium">Appuyez pour photographier</Text>
                  <Text className="text-muted-foreground text-xs opacity-70">
                    {slot.frontCamera ? 'Caméra frontale' : 'Caméra arrière recommandée'}
                  </Text>
                </Pressable>
              )}
            </View>
          ))}

          {/* Progress bar */}
          <View className="bg-card rounded-2xl p-4 gap-2"
            style={{ boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 3, color: 'rgba(0,0,0,0.06)' }], borderCurve: 'continuous' } as object}>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-muted-foreground text-sm">Progression</Text>
              <Text className="text-muted-foreground text-sm font-medium">{filledCount}/4</Text>
            </View>
            <View className="flex-row gap-1.5">
              {([photos.recto, photos.verso, photos.live, numeroACertifier.trim() || null] as (string | null)[]).map((v, i) => (
                <View key={i} className="flex-1 h-2 rounded-full" style={{ backgroundColor: v ? '#10b981' : '#e2e8f0' }} />
              ))}
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View className="bg-destructive/10 rounded-xl px-4 py-3 flex-row gap-2 items-center" style={{ borderCurve: 'continuous' } as object}>
              <Text className="text-destructive text-base">⚠️</Text>
              <Text className="text-destructive text-sm flex-1">{error}</Text>
            </View>
          ) : null}

          {/* Submit button */}
          <Pressable onPress={handleSubmit} disabled={!allFilled || uploading}
            className="rounded-2xl py-4 items-center justify-center flex-row gap-3"
            style={{
              backgroundColor: allFilled && !uploading ? '#1a2b3c' : '#94a3b8',
              borderCurve: 'continuous',
              boxShadow: allFilled && !uploading ? [{ offsetX: 0, offsetY: 4, blurRadius: 16, color: 'rgba(26,43,60,0.3)' }] : [],
            } as object}>
            {uploading ? (
              <><ActivityIndicator color="#fff" size="small" /><Text className="text-white font-semibold text-base">{uploadStep || 'Envoi en cours…'}</Text></>
            ) : (
              <><Text className="text-white text-xl">📤</Text><Text className="text-white font-semibold text-base">Envoyer la demande</Text></>
            )}
          </Pressable>

          {!allFilled && (
            <Text className="text-muted-foreground text-xs text-center">
              Renseignez les 4 champs obligatoires pour activer l'envoi
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
    </DesktopLayout>
  );
}