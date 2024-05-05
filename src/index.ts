/* eslint-disable new-cap, @typescript-eslint/member-ordering */

import createFetchClient from 'openapi-fetch';
import { createDeviceEndpoints } from './device';
import { createCoreTraceEndpoints } from './coretrace';
import type { paths } from '../types/corellium';

type CorelliumOptions = {
  accessToken: string;
  endpoint?: string;
};

class Corellium {
  private accessToken: string;
  private endpoint = 'https://app.corellium.com/';
  private api: ReturnType<typeof createFetchClient<paths>> | null = null;

  public constructor(options: CorelliumOptions) {
    this.accessToken = options.accessToken;

    if (options.endpoint) {
      this.endpoint = options.endpoint;
    }

    this.api = createFetchClient<paths>({
      baseUrl: this.endpoint,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }

  public coretrace = this.api ? createCoreTraceEndpoints(this.api) : null;
  public device = this.api ? createDeviceEndpoints(this.api) : null;
}

export default Corellium;
