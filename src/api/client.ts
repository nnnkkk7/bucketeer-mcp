import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ListFeaturesRequest,
  ListFeaturesResponse,
  CreateFeatureRequest,
  CreateFeatureResponse,
  GetFeatureRequest,
  GetFeatureResponse,
  UpdateFeatureRequest,
  UpdateFeatureResponse,
  BucketeerError
} from '../types/bucketeer.js';

export class BucketeerClient {
  private client: AxiosInstance;

  constructor(host: string, apiKey: string) {
    this.client = axios.create({
      baseURL: `https://${host}`,
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        throw this.handleError(error);
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      const data = error.response.data as any;
      const bucketeerError: BucketeerError = {
        code: data.code || error.response.status,
        message: data.message || error.message,
        details: data.details
      };

      // Map error codes to user-friendly messages
      switch (bucketeerError.code) {
        case 3:
          throw new Error(`Invalid arguments: ${bucketeerError.message}`);
        case 5:
          throw new Error(`Not found: ${bucketeerError.message}`);
        case 7:
          throw new Error(`Not authorized: ${bucketeerError.message}`);
        case 16:
          throw new Error(`Not authenticated: ${bucketeerError.message}`);
        default:
          throw new Error(bucketeerError.message || 'Unknown error occurred');
      }
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }

  async listFeatures(params: ListFeaturesRequest): Promise<ListFeaturesResponse> {
    const response = await this.client.get<ListFeaturesResponse>('/v1/features', {
      params: {
        environmentId: params.environmentId,
        pageSize: params.pageSize,
        cursor: params.cursor,
        tags: params.tags,
        orderBy: params.orderBy,
        orderDirection: params.orderDirection,
        searchKeyword: params.searchKeyword,
        maintainer: params.maintainer,
        hasExperiment: params.hasExperiment,
        archived: params.archived
      }
    });
    return response.data;
  }

  async createFeature(data: CreateFeatureRequest): Promise<CreateFeatureResponse> {
    // Format the request body according to Bucketeer API spec
    const requestBody = {
      id: data.id,
      name: data.name,
      description: data.description,
      variations: data.variations,
      tags: data.tags || [],
      defaultOnVariationIndex: data.defaultOnVariationIndex,
      defaultOffVariationIndex: data.defaultOffVariationIndex,
      environmentId: data.environmentId
    };

    const response = await this.client.post<CreateFeatureResponse>('/v1/feature', requestBody);
    return response.data;
  }

  async getFeature(params: GetFeatureRequest): Promise<GetFeatureResponse> {
    const response = await this.client.get<GetFeatureResponse>('/v1/feature', {
      params: {
        id: params.id,
        environmentId: params.environmentId,
        featureVersion: params.featureVersion
      }
    });
    return response.data;
  }

  async updateFeature(data: UpdateFeatureRequest): Promise<UpdateFeatureResponse> {
    // For PATCH request, only include fields that are being updated
    const patchData: any = {
      id: data.id,
      environmentId: data.environmentId
    };

    if (data.name !== undefined) patchData.name = data.name;
    if (data.description !== undefined) patchData.description = data.description;
    if (data.tags !== undefined) patchData.tags = data.tags;
    if (data.enabled !== undefined) patchData.enabled = data.enabled;
    if (data.archived !== undefined) patchData.archived = data.archived;

    const response = await this.client.patch<UpdateFeatureResponse>('/v1/feature', patchData);
    return response.data;
  }
}