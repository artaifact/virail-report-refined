import { generateFullReportPdf } from '../reportPdfService';
import type { FullReportData } from '@/lib/api';

describe('reportPdfService - Score Agentique dans le PDF', () => {
  const mockReportData: FullReportData = {
    report: {
      id: 123,
      url: 'https://peec.ai',
      score_produit_analyse: 68,
      created_at: '2026-05-09T10:00:00Z',
      updated_at: '2026-05-09T12:00:00Z',
    },
    agentic_score: 7,
    analyse_citation: {
      total_citations: 41,
      citations_by_model: {
        'ChatGPT': 18,
        'Perplexity': 12,
        'Claude': 11,
      },
      competitors_frequently_mentioned: [
        { domain: 'notion.so', count: 25 },
        { domain: 'airtable.com', count: 18 },
      ],
    },
    analyses: [],
  } as any;

  let writtenHtml = '';

  beforeEach(() => {
    writtenHtml = '';
    // Mock iframe write to capture generated HTML
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName.toLowerCase() === 'iframe') {
        const mockDoc = {
          open: jest.fn(),
          write: jest.fn((content: string) => {
            writtenHtml = content;
          }),
          close: jest.fn(),
        };
        Object.defineProperty(el, 'contentDocument', {
          get: () => mockDoc,
          configurable: true,
        });
      }
      return el;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders Score Agentique donut gauge alongside Citations and Score GEO in the PDF', async () => {
    await generateFullReportPdf(mockReportData, null, {
      includeCompetition: false,
    });

    expect(writtenHtml).toBeTruthy();

    // Verify presence of Score Agentique wheel & label
    expect(writtenHtml).toContain('Score Agentique');
    expect(writtenHtml).toContain('Éligibilité M2M');

    // Verify value 7 is rendered in the agentic donut
    expect(writtenHtml).toContain('7');

    // Verify Score GEO & Citations are also rendered
    expect(writtenHtml).toContain('Score GEO');
    expect(writtenHtml).toContain('Citations totales');
    expect(writtenHtml).toContain('41');
    expect(writtenHtml).toContain('68');

    // Verify Executive Insights point 3 includes Agentic / M2M
    expect(writtenHtml).toContain('Éligibilité Agentique & M2M');
  });

  it('respects explicitly provided agenticScore option', async () => {
    await generateFullReportPdf(mockReportData, null, {
      includeCompetition: false,
      agenticScore: 88,
    });

    expect(writtenHtml).toContain('88');
    expect(writtenHtml).toContain('Agentic Native');
    expect(writtenHtml).toContain('Architecture conforme');
  });
});
