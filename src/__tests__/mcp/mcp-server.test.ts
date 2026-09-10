import {
  handleJsonRpcMessage,
  handleToolCall,
  VIRAILL_TOOLS,
} from '../../../packages/mcp-server/index';

describe('Viraill MCP Server', () => {
  it('exposes all 4 canonical tools in tools/list', async () => {
    const res = await handleJsonRpcMessage({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    });

    expect(res.id).toBe(1);
    expect(res.result.tools).toHaveLength(4);
    const toolNames = res.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain('viraill_audit');
    expect(toolNames).toContain('viraill_get_recommendations');
    expect(toolNames).toContain('viraill_generate_patch');
    expect(toolNames).toContain('viraill_run_journey');
  });

  it('handles initialize handshake', async () => {
    const res = await handleJsonRpcMessage({
      jsonrpc: '2.0',
      id: 2,
      method: 'initialize',
      params: {},
    });

    expect(res.id).toBe(2);
    expect(res.result.serverInfo.name).toBe('viraill-mcp-server');
  });

  it('executes viraill_audit tool', async () => {
    const res = await handleToolCall('viraill_audit', { url: 'https://tally.so' });

    expect(res.domain).toBe('tally.so');
    expect(res.score).toBeGreaterThan(0);
    expect(res.grade).toBeDefined();
    expect(res.pillars.discovery).toBeDefined();
  });

  it('executes viraill_get_recommendations tool', async () => {
    const res = await handleToolCall('viraill_get_recommendations', { url: 'https://tally.so' });

    expect(res.domain).toBe('tally.so');
    expect(res.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(res.recommendations[0].priority).toBe('CRITICAL');
  });

  it('executes viraill_generate_patch tool', async () => {
    const res = await handleToolCall('viraill_generate_patch', { domain: 'tally.so' });

    expect(res.domain).toBe('tally.so');
    expect(res.patch).toContain('diff --git a/public/robots.txt b/public/robots.txt');
    expect(res.patch).toContain('diff --git a/public/llms.txt b/public/llms.txt');
  });

  it('executes viraill_run_journey tool', async () => {
    const res = await handleToolCall('viraill_run_journey', {
      url: 'https://tally.so',
      intent: 'discover',
    });

    expect(res.domain).toBe('tally.so');
    expect(res.success).toBe(true);
    expect(res.verdict).toBe('satisfied');
    expect(res.trajectory.length).toBeGreaterThanOrEqual(3);
  });
});
