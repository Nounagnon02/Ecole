/**
 * WhiteLabelPage — Personnalisation de la marque (Super Admin)
 *
 * Configuration du branding par tenant : logo, couleurs, nom.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Palette, Image, Globe, Monitor, Save,
  Type, Eye, Smartphone,
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';

const PRESET_COLORS = [
  { name: 'Indigo', primary: '#4F46E5', secondary: '#7C3AED' },
  { name: 'Emerald', primary: '#059669', secondary: '#0D9488' },
  { name: 'Rose', primary: '#E11D48', secondary: '#BE185D' },
  { name: 'Amber', primary: '#D97706', secondary: '#B45309' },
  { name: 'Sky', primary: '#0284C7', secondary: '#0369A1' },
  { name: 'Violet', primary: '#7C3AED', secondary: '#6D28D9' },
];

export default function WhiteLabelPage() {
  const [selectedTenant, setSelectedTenant] = useState('1');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [secondaryColor, setSecondaryColor] = useState('#7C3AED');
  const [brandName, setBrandName] = useState('Mon École');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">White-Label</h1>
          <p className="text-sm text-neutral-500 mt-1">Personnalisation de la marque par établissement</p>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" /> Enregistrer
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tenant selector */}
          <Card>
            <Card.Header>
              <Card.Title>Établissement</Card.Title>
              <Card.Description>Sélectionnez l'établissement à personnaliser</Card.Description>
            </Card.Header>
            <Card.Body>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value="1">Groupe Scolaire Les Palmiers</option>
                <option value="2">Collège Privé Saint-Jean</option>
                <option value="3">Lycée Moderne d'Abobo</option>
              </select>
            </Card.Body>
          </Card>

          {/* Brand name */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-neutral-500" />
                <div>
                  <Card.Title>Nom de la marque</Card.Title>
                  <Card.Description>Affiché dans l'en-tête et les communications</Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Nom de l'établissement"
              />
            </Card.Body>
          </Card>

          {/* Colors */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-neutral-500" />
                <div>
                  <Card.Title>Couleurs</Card.Title>
                  <Card.Description>Personnalisez les couleurs principales</Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="flex flex-wrap gap-3 mb-6">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setPrimaryColor(preset.primary);
                      setSecondaryColor(preset.secondary);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400"
                  >
                    <div className="flex -space-x-1">
                      <div className="h-4 w-4 rounded-full border-2 border-white dark:border-neutral-900" style={{ background: preset.primary }} />
                      <div className="h-4 w-4 rounded-full border-2 border-white dark:border-neutral-900" style={{ background: preset.secondary }} />
                    </div>
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">Couleur primaire</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-10 rounded-lg border border-neutral-200 cursor-pointer"
                    />
                    <span className="text-sm font-mono text-neutral-500">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">Couleur secondaire</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-10 rounded-lg border border-neutral-200 cursor-pointer"
                    />
                    <span className="text-sm font-mono text-neutral-500">{secondaryColor}</span>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Logo upload */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-neutral-500" />
                <div>
                  <Card.Title>Logo & Favicon</Card.Title>
                  <Card.Description>Téléchargez le logo et l'icône de l'établissement</Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-2">Logo (PNG, SVG, max 2 Mo)</label>
                  <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <div className="text-center">
                      <Image className="h-8 w-8 text-neutral-300 mx-auto mb-1" />
                      <p className="text-xs text-neutral-400">Cliquez pour uploader</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-2">Favicon (PNG, ICO, max 1 Mo)</label>
                  <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <div className="text-center">
                      <Globe className="h-8 w-8 text-neutral-300 mx-auto mb-1" />
                      <p className="text-xs text-neutral-400">Cliquez pour uploader</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Right column — preview */}
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-neutral-500" />
                <div>
                  <Card.Title>Aperçu</Card.Title>
                  <Card.Description>Rendu en direct</Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Mock preview */}
              <div className="rounded-xl border border-neutral-200 overflow-hidden dark:border-neutral-700">
                <div className="h-2" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} />
                <div className="p-4 bg-white dark:bg-neutral-900">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: primaryColor }}>
                      É
                    </div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{brandName}</span>
                  </div>
                  <div className="h-2 w-3/4 rounded-full bg-neutral-100 mb-2 dark:bg-neutral-800" />
                  <div className="h-2 w-1/2 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-6 w-16 rounded-md" style={{ background: primaryColor }} />
                    <div className="h-6 w-16 rounded-md border border-neutral-200 dark:border-neutral-700" />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <Monitor className="h-4 w-4" />
                  <span>Web</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <Smartphone className="h-4 w-4" />
                  <span>Mobile</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
