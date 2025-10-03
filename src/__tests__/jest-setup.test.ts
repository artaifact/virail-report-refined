// Test pour vérifier que Jest est correctement configuré
describe('Jest Configuration Test', () => {
  it('should run basic JavaScript tests', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('test');
    await expect(promise).resolves.toBe('test');
  });

  it('should handle mocks and spies', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle arrays and objects', () => {
    const array = [1, 2, 3];
    const object = { name: 'test', value: 42 };
    
    expect(array).toHaveLength(3);
    expect(array).toContain(2);
    expect(object).toHaveProperty('name', 'test');
    expect(object).toEqual({ name: 'test', value: 42 });
  });

  it('should handle exceptions', () => {
    const throwError = () => {
      throw new Error('Test error');
    };
    
    expect(throwError).toThrow('Test error');
  });

  it('should handle timers', (done) => {
    setTimeout(() => {
      expect(true).toBe(true);
      done();
    }, 100);
  });

  it('should handle promises with async/await', async () => {
    const asyncFunction = async () => {
      return new Promise(resolve => {
        setTimeout(() => resolve('async result'), 50);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe('async result');
  });
});
