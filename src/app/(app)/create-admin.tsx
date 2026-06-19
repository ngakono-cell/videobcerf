/**
 * CreateAdminScreen – Écran admin pour créer un nouveau compte administrateur.
 */
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { supabase } from '@/client/supabase';
import { useSession } from '@/ctx';
import DesktopLayout from '@/components/DesktopLayout';

export default function CreateAdminScreen() {
  const { session } = useSession();
  const [nom, setNom]             = useState('');
  const [prenom, setPrenom]       = useState('');
  const [username, setUsername]   = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const handleCreate = async () => {
    if (!nom.trim() || !prenom.trim() || !username.trim() || !telephone.trim() || !password.trim()) {
      setError('Tous les champs sont obligatoires.'); return;
    }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError("L'identifiant ne peut contenir que des lettres, chiffres et tirets bas."); return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const { error: fnError } = await supabase.functions.invoke('create-admin', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { nom: nom.trim(), prenom: prenom.trim(), username: username.trim(), telephone: telephone.trim(), password },
      });
      if (fnError) {
        const msg = await (fnError as { context?: { text?: () => Promise<string> } })?.context?.text?.();
        const parsed = msg ? JSON.parse(msg) : null;
        setError(parsed?.error || 'Échec de la création du compte.'); return;
      }
      setSuccess(`Compte administrateur "${username}" créé avec succès.`);
      setNom(''); setPrenom(''); setUsername(''); setTelephone(''); setPassword('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur inattendue est survenue.');
    } finally { setLoading(false); }
  };

  const inputCls = 'bg-background border border-border rounded-xl px-4 py-3.5 text-foreground';
  const labelCls = 'text-sm font-medium text-foreground mb-1.5';

  return (
    <DesktopLayout>
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
      <StatusBar style="light" />
      {/* En-tête */}
      <View className="bg-primary px-6 pt-14 pb-5">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="w-8 h-8 items-center justify-center">
            <Text className="text-primary-foreground text-xl">‹</Text>
          </Pressable>
          <View>
            <Text className="text-primary-foreground text-xl font-bold">Créer un administrateur</Text>
            <Text className="text-primary-foreground text-sm opacity-70">Nouveau compte Admin</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerClassName="px-4 py-5 pb-10" keyboardShouldPersistTaps="handled">
        <View className="bg-card rounded-2xl p-4 gap-4"
          style={{ boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 3, color: 'rgba(0,0,0,0.06)' }], borderCurve: 'continuous' } as object}>

          {[
            { label: 'Nom',         value: nom,       setter: setNom,       placeholder: 'Dupont',       cap: 'words' as const,   kbd: 'default' as const },
            { label: 'Prénom',      value: prenom,    setter: setPrenom,    placeholder: 'Marie',        cap: 'words' as const,   kbd: 'default' as const },
            { label: 'Identifiant', value: username,  setter: setUsername,  placeholder: 'admin_dupont', cap: 'none' as const,    kbd: 'default' as const },
            { label: 'Téléphone',   value: telephone, setter: setTelephone, placeholder: '06XXXXXXXX',   cap: 'none' as const,    kbd: 'phone-pad' as const },
          ].map(({ label, value, setter, placeholder, cap, kbd }) => (
            <View key={label}>
              <Text className={labelCls}>{label}</Text>
              <TextInput className={inputCls} style={{ borderCurve: 'continuous' } as object}
                placeholder={placeholder} placeholderTextColor="#94a3b8"
                value={value} onChangeText={setter} autoCapitalize={cap} autoCorrect={false} keyboardType={kbd} />
            </View>
          ))}

          <View>
            <Text className={labelCls}>Mot de passe</Text>
            <View className="bg-background border border-border rounded-xl flex-row items-center" style={{ borderCurve: 'continuous' } as object}>
              <TextInput className="flex-1 px-4 py-3.5 text-foreground"
                placeholder="Minimum 6 caractères" placeholderTextColor="#94a3b8"
                value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
                returnKeyType="done" onSubmitEditing={handleCreate} />
              <Pressable onPress={() => setShowPassword(v => !v)} className="pr-4">
                <Text className="text-muted-foreground text-sm">{showPassword ? 'Masquer' : 'Afficher'}</Text>
              </Pressable>
            </View>
          </View>

          {error   ? <Text className="text-destructive text-sm">{error}</Text>   : null}
          {success ? <Text className="text-sm font-medium" style={{ color: '#15803d' }}>{success}</Text> : null}

          <Pressable onPress={handleCreate} disabled={loading} className="bg-primary rounded-xl py-4 items-center"
            style={{ borderCurve: 'continuous', opacity: loading ? 0.7 : 1 } as object}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text className="text-primary-foreground font-semibold text-base">Créer le compte administrateur</Text>
            )}
          </Pressable>
        </View>

        <View className="bg-secondary rounded-2xl p-4 mt-4" style={{ borderCurve: 'continuous' } as object}>
          <Text className="text-foreground font-semibold text-sm mb-1">ℹ️ Note</Text>
          <Text className="text-muted-foreground text-xs" style={{ lineHeight: 18 }}>
            Les comptes administrateurs ont accès à l'ensemble des fonctionnalités de gestion :
            tableau de bord, supervision, gestion des utilisateurs et des demandes.
            Communiquez les identifiants de manière sécurisée.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </DesktopLayout>
  );
}