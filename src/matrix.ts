import type createFetchClient from 'openapi-fetch';
import type { components, paths } from '../types/corellium';
import { createAppEndpoints } from './app';
import { createDeviceEndpoints } from './device';
import type { PatchedInstanceInputProperties } from './device';
/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable no-await-in-loop */
/* eslint-disable unicorn/no-await-expression-member */
import { createImageEndpoints } from './image';
import { wait } from './lib/wait';

export const createMatrixEndpoints = (
  api: ReturnType<typeof createFetchClient<paths>>,
  instanceId: string,
  baseUrl: string
  // eslint-disable-next-line @typescript-eslint/max-params
) => {
  const imageEndpoints = createImageEndpoints(api);
  const appEndpoints = createAppEndpoints(api, instanceId);
  const deviceEndpoints = createDeviceEndpoints(api, instanceId, baseUrl);

  const startMonitoring = async (assessmentId: string) => {
    const response = await api.POST(
      '/v1/services/matrix/{instanceId}/assessments/{assessmentId}/start',
      {
        params: {
          path: {
            instanceId,
            assessmentId,
          },
        },
      }
    );

    if (response.error) {
      throw new Error(response.error.error ?? response.response.statusText);
    }

    return response.data;
  };

  const stopMonitoring = async (assessmentId: string) => {
    const response = await api.POST(
      '/v1/services/matrix/{instanceId}/assessments/{assessmentId}/stop',
      {
        params: {
          path: {
            instanceId,
            assessmentId,
          },
        },
      }
    );

    if (response.error) {
      throw new Error(response.error.error ?? response.response.statusText);
    }

    return response.data;
  };

  const runChecks = async (assessmentId: string) => {
    const response = await api.POST(
      '/v1/services/matrix/{instanceId}/assessments/{assessmentId}/test',
      {
        params: {
          path: {
            instanceId,
            assessmentId,
          },
        },
      }
    );

    if (response.error) {
      throw new Error(response.error.error ?? response.response.statusText);
    }

    return response.data;
  };

  const createAssessment = async (
    body: components['schemas']['CreateAssessmentDto']
  ) => {
    const response = await api.POST(
      '/v1/services/matrix/{instanceId}/assessments',
      {
        params: {
          path: {
            instanceId,
          },
        },
        body,
      }
    );

    if (response.error) {
      throw new Error(response.error.error ?? response.response.statusText);
    }

    return response.data;
  };

  const getAssessment = async (assessmentId: string) => {
    const response = await api.GET(
      '/v1/services/matrix/{instanceId}/assessments/{assessmentId}',
      {
        params: {
          path: {
            instanceId,
            assessmentId,
          },
        },
      }
    );

    if (response.error) {
      throw new Error(response.error.error ?? response.response.statusText);
    }

    // Patch status to be more specific
    return {
      ...response.data,
      status: response.data.status as
        | 'complete'
        | 'failed'
        | 'generatingReport'
        | 'monitoring'
        | 'new'
        | 'readyForTesting'
        | 'startingMonitoring'
        | 'stoppingMonitoring'
        | 'testing',
    };
  };

  return {
    /**
     * Run a MATRIX assessment.
     * @param body The request body.
     * @param body.bundleId The bundle ID of the assessment to run.
     * @param body.input The input to provide to the assessment.
     * @param body.keywords The keywords to provide to the assessment.
     * @returns The response data.
     * @throws {Error} The error message.
     * @example const response = await corellium.device('123').matrix.run({ bundleId: 'com.corellium.cafe' });
     */
    run: async (body: {
      bundleId: components['schemas']['CreateAssessmentDto']['bundleId'];
      input?: PatchedInstanceInputProperties;
      keywords?: string[];
    }) => {
      // eslint-disable-next-line @typescript-eslint/init-declarations
      let wordlistId: string | undefined;
      const instance = await deviceEndpoints.get();

      if (instance.state !== 'on') {
        throw new Error('Device must be online to run MATRIX assessment');
      }

      await appEndpoints.run(body.bundleId);

      if (body.keywords) {
        const fileContent = new Blob(body.keywords, { type: 'text/plain' });
        const fileName = 'keywords.txt';
        const file = new File([fileContent], fileName, {
          type: 'text/plain',
          lastModified: Date.now(),
        });

        const newKeywords = await imageEndpoints.create({
          type: 'extension',
          encoding: 'plain',
          name: 'keywords.txt',
          project: instance.project,
          instance: instance.id,
          file,
        });

        wordlistId = newKeywords.id ?? undefined;
      }

      const assessment = await createAssessment({
        bundleId: body.bundleId,
        wordlistId,
        instanceId,
      });

      if (!assessment.id) {
        throw new Error('Assessment ID not returned from API');
      }

      while (true) {
        const { status } = await getAssessment(assessment.id);

        if (status === 'new') {
          break;
        }

        if (status === 'failed') {
          throw new Error('Assessment failed to start');
        }

        await wait(5000);
      }

      await startMonitoring(assessment.id);

      while (true) {
        const { status } = await getAssessment(assessment.id);

        if (status === 'monitoring') {
          break;
        }

        if (status === 'failed') {
          throw new Error('Monitoring failed to start');
        }

        await wait(5000);
      }

      if (body.input) {
        const { eta } = await deviceEndpoints.input(body.input);

        if (eta) {
          await wait(eta);
        }
      }

      await stopMonitoring(assessment.id);

      while (true) {
        const { status } = await getAssessment(assessment.id);

        if (status === 'readyForTesting') {
          break;
        }

        if (status === 'failed') {
          throw new Error('Monitoring failed to stop');
        }

        await wait(5000);
      }

      await runChecks(assessment.id);

      while (true) {
        const { status } = await getAssessment(assessment.id);

        if (status === 'complete') {
          break;
        }

        if (status === 'failed') {
          throw new Error('Checks failed to complete');
        }

        await wait(5000);
      }

      return getAssessment(assessment.id);
    },

    assessment: {
      /**
       * Get a MATRIX assessment.
       * @returns The response data.
       * @throws {Error} The error message.
       * @example const response = await corellium.device('123').matrix.assessment.get('456');
       */
      get: async (assessmentId: string) => getAssessment(assessmentId),

      /**
       * List MATRIX assessments.
       * @returns The response data.
       * @throws {Error} The error message.
       * @example const response = await corellium.device('123').matrix.assessment.list();
       */
      list: async () => {
        const response = await api.GET(
          '/v1/services/matrix/{instanceId}/instances/{instanceId}/assessments',
          {
            params: {
              path: {
                instanceId,
              },
            },
          }
        );

        if (response.error) {
          throw new Error(response.error.error ?? response.response.statusText);
        }

        return response.data;
      },

      /**
       * Delete a MATRIX assessment.
       * @returns The response data.
       * @throws {Error} The error message.
       * @example const response = await corellium.device('123').matrix.assessment.delete('456');
       */
      delete: async (assessmentId: string) => {
        const response = await api.DELETE(
          '/v1/services/matrix/{instanceId}/assessments/{assessmentId}',
          {
            params: {
              path: {
                instanceId,
                assessmentId,
              },
            },
          }
        );

        if (response.error) {
          throw new Error(response.error.error ?? response.response.statusText);
        }

        return response.data;
      },

      /**
       * Download a MATRIX assessment.
       * @param assessmentId The assessment ID.
       * @param format The format to download the assessment in.
       * @returns The response data.
       * @throws {Error} The error message.
       * @example const response = await corellium.device('123').matrix.assessment.download('456', 'html');
       */
      download: async (
        assessmentId: string,
        format: 'html' | 'json' = 'json'
      ) => {
        const response = await api.GET(
          '/v1/services/matrix/{instanceId}/assessments/{assessmentId}/download',
          {
            params: {
              path: {
                instanceId,
                assessmentId,
              },
              query: {
                format,
              },
            },
          }
        );

        if (response.error) {
          throw new Error(response.error.error ?? response.response.statusText);
        }

        if (format === 'json') {
          return JSON.parse(
            response.data
          ) as components['schemas']['Assessment'];
        }

        return response.data;
      },
    },
  };
};
