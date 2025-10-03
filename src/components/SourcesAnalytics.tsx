import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Download, Globe, Building2, FileText, HelpCircle } from 'lucide-react';

// Données simulées pour le graphique
const chartData = [
  { date: '9 sept.', 'ada.com': 0, 'bcbsal.org': 0, 'frontiersin.org': 0, 'jmir.org': 0, 'nih.gov': 0 },
  { date: '10 sept.', 'ada.com': 0, 'bcbsal.org': 0, 'frontiersin.org': 0, 'jmir.org': 0, 'nih.gov': 2 },
  { date: '11 sept.', 'ada.com': 2, 'bcbsal.org': 1, 'frontiersin.org': 1, 'jmir.org': 1, 'nih.gov': 5 },
  { date: '12 sept.', 'ada.com': 4, 'bcbsal.org': 3, 'frontiersin.org': 3, 'jmir.org': 4, 'nih.gov': 8 },
  { date: '13 sept.', 'ada.com': 6, 'bcbsal.org': 5, 'frontiersin.org': 6, 'jmir.org': 8, 'nih.gov': 12 },
  { date: '14 sept.', 'ada.com': 8, 'bcbsal.org': 7, 'frontiersin.org': 8, 'jmir.org': 12, 'nih.gov': 18 },
  { date: '15 sept.', 'ada.com': 12, 'bcbsal.org': 10, 'frontiersin.org': 12, 'jmir.org': 18, 'nih.gov': 25 },
  { date: '16 sept.', 'ada.com': 14, 'bcbsal.org': 14, 'frontiersin.org': 14, 'jmir.org': 14, 'nih.gov': 29 },
];

// Données pour le tableau
const sourcesData = [
  {
    id: 1,
    name: 'nih.gov',
    type: 'Institutional',
    used: 29,
    avgCitations: 0.8,
    icon: Building2,
    badgeColor: 'bg-meetmind-green-accent text-meetmind-white'
  },
  {
    id: 2,
    name: 'ada.com',
    type: 'Corporate',
    used: 14,
    avgCitations: 1.5,
    icon: Building2,
    badgeColor: 'bg-orange-500 text-meetmind-white'
  },
  {
    id: 3,
    name: 'bcbsal.org',
    type: 'Other',
    used: 14,
    avgCitations: 2.0,
    icon: HelpCircle,
    badgeColor: 'bg-meetmind-medium-gray text-meetmind-white'
  },
  {
    id: 4,
    name: 'frontiersin.org',
    type: 'Editorial',
    used: 14,
    avgCitations: 1.0,
    icon: FileText,
    badgeColor: 'bg-meetmind-soft-blue text-meetmind-white'
  },
  {
    id: 5,
    name: 'jmir.org',
    type: 'Editorial',
    used: 14,
    avgCitations: 4.0,
    icon: FileText,
    badgeColor: 'bg-meetmind-soft-blue text-meetmind-white'
  },
  {
    id: 6,
    name: 'mahalo.health',
    type: 'Corporate',
    used: 14,
    avgCitations: 4.5,
    icon: Building2,
    badgeColor: 'bg-orange-500 text-meetmind-white'
  },
  {
    id: 7,
    name: 'mayoclinic.org',
    type: 'Institutional',
    used: 14,
    avgCitations: 2.0,
    icon: Building2,
    badgeColor: 'bg-meetmind-green-accent text-meetmind-white'
  },
  {
    id: 8,
    name: 'smartclinix.net',
    type: 'Corporate',
    used: 14,
    avgCitations: 0,
    icon: Building2,
    badgeColor: 'bg-orange-500 text-meetmind-white'
  },
];

// Configuration des couleurs pour le graphique (selon la charte Meetmind.ai)
const chartColors = {
  'ada.com': '#1A3AFF',      // primary
  'bcbsal.org': '#FF6B6B',   // rouge
  'frontiersin.org': '#2E4CFF', // soft-blue  
  'jmir.org': '#4CAF50',     // green-accent
  'nih.gov': '#C8C9CC',      // medium-gray
};

interface SourcesAnalyticsProps {
  className?: string;
}

export default function SourcesAnalytics({ className }: SourcesAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('Domains');

  return (
    <div className={`space-y-section-gap-lg font-sans ${className}`}>
      {/* Header avec onglets */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-heading-lg text-meetmind-dark-gray font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-meetmind-icon-active" />
            Sources
          </h2>
          <div className="flex gap-1">
            <Button
              variant={activeTab === 'Domains' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('Domains')}
              className={`text-label font-medium transition-colors duration-meetmind ${
                activeTab === 'Domains' 
                  ? 'bg-meetmind-primary text-meetmind-white' 
                  : 'text-meetmind-medium-gray hover:text-meetmind-dark-gray'
              }`}
            >
              Domains
            </Button>
            <Button
              variant={activeTab === 'URLs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('URLs')}
              className={`text-label font-medium transition-colors duration-meetmind ${
                activeTab === 'URLs' 
                  ? 'bg-meetmind-primary text-meetmind-white' 
                  : 'text-meetmind-medium-gray hover:text-meetmind-dark-gray'
              }`}
            >
              URLs
            </Button>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-label font-medium bg-meetmind-white border-meetmind-medium-gray/30 text-meetmind-dark-gray hover:bg-meetmind-light-gray transition-colors duration-meetmind"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Graphique principal */}
      <Card className="bg-meetmind-white border-meetmind-medium-gray/20 rounded-meetmind shadow-meetmind-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-heading text-meetmind-dark-gray font-semibold">
            Source Usage by Domain
          </CardTitle>
          
          {/* Légende personnalisée */}
          <div className="flex flex-wrap gap-4 mt-4">
            {Object.entries(chartColors).map(([source, color]) => (
              <div key={source} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-small text-meetmind-medium-gray font-medium">
                  {source}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#C8C9CC" 
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#C8C9CC' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#C8C9CC' }}
                  tickFormatter={(value) => `${value} %`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0C0F1A',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
                
                {Object.entries(chartColors).map(([source, color]) => (
                  <Line
                    key={source}
                    type="monotone"
                    dataKey={source}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#FFFFFF' }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des sources */}
      <Card className="bg-meetmind-white border-meetmind-medium-gray/20 rounded-meetmind shadow-meetmind-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-meetmind-medium-gray/20">
                  <th className="text-left text-small font-medium text-meetmind-medium-gray p-4 w-12">#</th>
                  <th className="text-left text-small font-medium text-meetmind-medium-gray p-4">Source</th>
                  <th className="text-left text-small font-medium text-meetmind-medium-gray p-4">Type</th>
                  <th className="text-right text-small font-medium text-meetmind-medium-gray p-4">Used</th>
                  <th className="text-right text-small font-medium text-meetmind-medium-gray p-4">Avg. Citations</th>
                </tr>
              </thead>
              <tbody>
                {sourcesData.map((source, index) => (
                  <tr 
                    key={source.id}
                    className="border-b border-meetmind-medium-gray/10 hover:bg-meetmind-light-gray/50 transition-colors duration-meetmind"
                  >
                    <td className="p-4 text-small text-meetmind-medium-gray font-medium">
                      {source.id}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-meetmind-light-gray rounded-lg flex items-center justify-center">
                          <source.icon className="w-4 h-4 text-meetmind-icon-active" />
                        </div>
                        <span className="text-label text-meetmind-dark-gray font-medium">
                          {source.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge 
                        className={`text-small font-medium rounded-lg px-3 py-1 ${source.badgeColor}`}
                      >
                        {source.type}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-label text-meetmind-dark-gray font-semibold">
                        {source.used} %
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-label text-meetmind-medium-gray font-medium">
                        {source.avgCitations}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

