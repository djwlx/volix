import type { KomgaOperationInput } from './core/komga.types';
import type { CreateKomgaSdkOptions, KomgaOperationDefinition } from './core/komga.types';
import { createKomgaRequester } from './core/request-komga';
import { komgaOperationDefinitions } from './generated';

type KomgaOperationId = keyof typeof komgaOperationDefinitions;

type KomgaSdkMethods = {
  [K in KomgaOperationId]: (input?: KomgaOperationInput) => Promise<unknown>;
};

const buildOperationMethods = (
  requestKomga: <T = unknown>(definition: KomgaOperationDefinition, input?: KomgaOperationInput) => Promise<T>
) => {
  const entries = Object.entries(komgaOperationDefinitions).map(([operationId, definition]) => [
    operationId,
    (input?: KomgaOperationInput) => requestKomga(definition, input),
  ]);

  return Object.fromEntries(entries) as KomgaSdkMethods;
};

export function createKomgaSdk(options: CreateKomgaSdkOptions) {
  const { requestKomga } = createKomgaRequester(options);
  const methods = buildOperationMethods(requestKomga);

  return {
    requestKomga,
    operationDefinitions: komgaOperationDefinitions,
    callOperation: <T = unknown>(operationId: KomgaOperationId, input?: KomgaOperationInput) =>
      requestKomga<T>(komgaOperationDefinitions[operationId], input),
    ...methods,
  };
}

export type KomgaSdk = ReturnType<typeof createKomgaSdk>;
