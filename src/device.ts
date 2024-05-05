import type createFetchClient from 'openapi-fetch';
import type { paths } from '../types/corellium';

export const createDeviceEndpoints = (
  api: ReturnType<typeof createFetchClient<paths>>
) => ({
  create: async (
    body: paths['/v1/instances']['post']['requestBody']['content']['application/json']
  ) => {
    const response = await api.POST('/v1/instances', {
      body,
    });

    if (response.error) {
      throw new Error(response.error.error);
    }

    return response.data;
  },

  delete: async (instanceId: string) => {
    const response = await api.DELETE('/v1/instances/{instanceId}', {
      params: {
        path: {
          instanceId,
        },
      },
    });

    if (response.error) {
      throw new Error(response.error.error);
    }

    return response.data;
  },

  get: async (instanceId: string) => {
    const response = await api.GET('/v1/instances/{instanceId}', {
      params: {
        path: {
          instanceId,
        },
      },
    });

    if (response.error) {
      throw new Error(response.error.error);
    }

    return response.data;
  },

  list: async () => {
    const response = await api.GET('/v1/instances');

    if (response.error) {
      throw new Error(response.error.error);
    }

    return response.data;
  },

  search: async (name: string) => {
    const response = await api.GET('/v1/instances', {
      params: {
        query: {
          name,
        },
      },
    });

    if (response.error) {
      throw new Error(response.error.error);
    }

    return response.data;
  },

  update: async (
    instanceId: string,
    body: paths['/v1/instances/{instanceId}']['patch']['requestBody']['content']['application/json']
  ) => {
    const response = await api.PATCH('/v1/instances/{instanceId}', {
      params: {
        path: {
          instanceId,
        },
      },
      body,
    });

    if (response.error) {
      throw new Error(response.error.error);
    }

    return response.data;
  },

  start: async (instanceId: string) => {
    const response = await api.POST('/v1/instances/{instanceId}/start', {
      params: {
        path: {
          instanceId,
        },
      },
    });

    if (response.error) {
      throw new Error(response.error.error);
    }

    return response.data;
  },

  stop: async (instanceId: string) => {
    const response = await api.POST('/v1/instances/{instanceId}/stop', {
      params: {
        path: {
          instanceId,
        },
      },
    });

    if (response.error) {
      throw new Error(response.error.error);
    }

    return response.data;
  },

  restart: async (instanceId: string) => {
    const response = await api.POST('/v1/instances/{instanceId}/reboot', {
      params: {
        path: {
          instanceId,
        },
      },
    });

    if (response.error) {
      throw new Error(response.error.error);
    }

    return response.data;
  },

  pause: async (instanceId: string) => {
    const response = await api.POST('/v1/instances/{instanceId}/pause', {
      params: {
        path: {
          instanceId,
        },
      },
    });

    if (response.error) {
      throw new Error(response.error.error);
    }

    return response.data;
  },

  resume: async (instanceId: string) => {
    const response = await api.POST('/v1/instances/{instanceId}/unpause', {
      params: {
        path: {
          instanceId,
        },
      },
    });

    if (response.error) {
      throw new Error(response.error.error);
    }

    return response.data;
  },
});