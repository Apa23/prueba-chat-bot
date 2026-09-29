import { describe, it, expect, vi, afterEach } from 'vitest';
import { OllamaLlmAdapter } from '../../src/infrastructure/llm/ollama-adapter.js';

const CONFIG = { baseUrl: 'http://localhost:11434', modelo: 'qwen2.5:7b' };

function mockFetchConContenido(content: string, ok = true, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => ({ message: { content } }),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OllamaLlmAdapter.clasificarIntencion', () => {
  it('should return the parsed intent when the model returns valid schema JSON', async () => {
    // Arrange
    mockFetchConContenido('{"tipo":"solicitar_certificado","certificado":"TRIBUTARIO_PV"}');
    const adapter = new OllamaLlmAdapter(CONFIG);

    // Act
    const intencion = await adapter.clasificarIntencion('certificado tributario');

    // Assert
    expect(intencion).toEqual({ tipo: 'solicitar_certificado', certificado: 'TRIBUTARIO_PV' });
  });

  it('should degrade to desconocida when the model returns non-JSON content', async () => {
    // Arrange
    mockFetchConContenido('esto no es json');
    const adapter = new OllamaLlmAdapter(CONFIG);

    // Act
    const intencion = await adapter.clasificarIntencion('hola');

    // Assert
    expect(intencion).toEqual({ tipo: 'desconocida' });
  });

  it('should degrade to desconocida when JSON is valid but does not match the schema', async () => {
    // Arrange
    mockFetchConContenido('{"tipo":"otra_cosa"}');
    const adapter = new OllamaLlmAdapter(CONFIG);

    // Act
    const intencion = await adapter.clasificarIntencion('algo raro');

    // Assert
    expect(intencion).toEqual({ tipo: 'desconocida' });
  });

  it('should degrade to desconocida when certificate code is invalid', async () => {
    // Arrange
    mockFetchConContenido('{"tipo":"solicitar_certificado","certificado":"INEXISTENTE"}');
    const adapter = new OllamaLlmAdapter(CONFIG);

    // Act
    const intencion = await adapter.clasificarIntencion('certificado raro');

    // Assert
    expect(intencion).toEqual({ tipo: 'desconocida' });
  });

  it('should throw when Ollama responds with a non-ok HTTP status (fallo técnico)', async () => {
    // Arrange
    mockFetchConContenido('', false, 500);
    const adapter = new OllamaLlmAdapter(CONFIG);

    // Act & Assert
    await expect(adapter.clasificarIntencion('hola')).rejects.toThrow('Ollama respondió 500');
  });

  it('should propagate the error when fetch itself rejects (Ollama inalcanzable)', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    const adapter = new OllamaLlmAdapter(CONFIG);

    // Act & Assert
    await expect(adapter.clasificarIntencion('hola')).rejects.toThrow('ECONNREFUSED');
  });
});

describe('OllamaLlmAdapter.redactar', () => {
  it('should return the model content for a redaction request', async () => {
    // Arrange
    mockFetchConContenido('Respuesta redactada.');
    const adapter = new OllamaLlmAdapter(CONFIG);

    // Act
    const texto = await adapter.redactar('Redacta algo', 'contexto');

    // Assert
    expect(texto).toBe('Respuesta redactada.');
  });
});
