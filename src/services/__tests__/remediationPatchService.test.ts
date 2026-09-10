import { generateUnifiedDiff, generateFullRemediationPatch } from '../remediationPatchService';

describe('remediationPatchService', () => {
  it('generates a valid git unified diff header', () => {
    const diff = generateUnifiedDiff({
      path: 'public/llms.txt',
      originalContent: '',
      newContent: '# Test Documentation\n> Endpoint: /api',
    });

    expect(diff).toContain('diff --git a/public/llms.txt b/public/llms.txt');
    expect(diff).toContain('+# Test Documentation');
    expect(diff).toContain('+> Endpoint: /api');
  });

  it('generates a full patch file with metadata and commit info', () => {
    const patch = generateFullRemediationPatch('Tally', [
      {
        path: 'robots.txt',
        originalContent: 'User-agent: *\nDisallow:',
        newContent: 'User-agent: *\nDisallow:\nUser-agent: GPTBot\nAllow: /',
      },
    ]);

    expect(patch).toContain('From: Viraill Remediation Engine');
    expect(patch).toContain('Subject: [PATCH]');
    expect(patch).toContain('robots.txt');
  });
});
