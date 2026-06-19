/**
 * useDesktop – Retourne true si la largeur de fenêtre est >= 768px (mode bureau).
 * Centralise la détection desktop pour éviter la répétition partout.
 */
import { useWindowDimensions } from 'react-native';

export function useDesktop(): boolean {
  const { width } = useWindowDimensions();
  return width >= 768;
}
