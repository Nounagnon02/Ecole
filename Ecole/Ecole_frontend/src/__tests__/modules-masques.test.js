/**
 * Modules hors plan, masqués (plan de correction, « Hors plan ») : l'assistant
 * IA n'est ni dans les routes, ni dans les menus, ni dans la palette de
 * commandes, pour aucun rôle. Le code de la page reste, pour une reprise.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROTECTED_ROUTES } from '@/features/roles/route-config';
import { getRoleNavigation } from '@/features/roles/navigation-config';
import { ROLES } from '@/shared/types/roles';

const IA = /ai-insights|ai-assistant|ai-report|\/eleve\/tutor/;

describe('assistant IA masqué', () => {
  it('n’a plus de route : l’adresse directe mène à la page introuvable', () => {
    expect(Object.values(PROTECTED_ROUTES).map((r) => r.path).filter((p) => IA.test(p))).toEqual([]);
  });

  it.each(Object.values(ROLES))('n’apparaît pas dans le menu du rôle %s', (role) => {
    expect(getRoleNavigation(role).map((i) => i.path).filter((p) => IA.test(p))).toEqual([]);
  });

  it('n’est pas proposé par la palette de commandes', () => {
    const source = readFileSync(resolve(__dirname, '../shared/components/ui/CommandPalette.jsx'), 'utf8');
    expect(source).not.toMatch(IA);
  });
});
