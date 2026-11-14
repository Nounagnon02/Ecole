/**
 * Direction graphique : proposition C (décision produit, mission du 14/11/2026).
 *
 * Mêmes jetons que le web (`Ecole_frontend/src/styles/design-tokens.css`) :
 * vert profond, fond papier, accents ocre, typographie Figtree. Le mobile
 * portait encore la charte « Érudit » (terre cuite, Georgia, nom Érudit).
 */
import fs from 'fs';
import path from 'path';
import { light, dark } from '../src/theme/designTokens';
import { fonts } from '../src/theme/typography';

const app = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8')).expo;

describe('proposition C', () => {
  it('reprend les jetons clairs du web', () => {
    expect(light).toMatchObject({
      surface: '#F4F0E8', surfaceRaised: '#FFFDF8', textPrimary: '#17302E', textSecondary: '#56625D',
      border: '#DDD5C5', accent: '#0F5C4A', primary: '#0F5C4A', amber: '#795300', amberSubtle: '#FBE9BD',
      red: '#A63D2A', green: '#246447',
    });
  });

  it('reprend les jetons sombres du web', () => {
    expect(dark).toMatchObject({ surface: '#101E19', surfaceRaised: '#192A23', textPrimary: '#F4F0E8', accent: '#8BD4B5', border: '#3C5145' });
  });

  it('utilise Figtree, fournie avec sa licence', () => {
    expect(fonts.body).toBe('Figtree-Regular');
    expect(fonts.heading).toBe('Figtree-Bold');
    for (const f of ['Figtree-Regular.ttf', 'Figtree-Medium.ttf', 'Figtree-SemiBold.ttf', 'Figtree-Bold.ttf', 'OFL-Figtree.txt']) {
      expect(fs.existsSync(path.join(__dirname, '..', 'assets', 'fonts', f))).toBe(true);
    }
  });

  it('s’appelle École, sur fond papier', () => {
    expect(app.name).toBe('École');
    expect(app.splash.backgroundColor).toBe('#F4F0E8');
  });
});
