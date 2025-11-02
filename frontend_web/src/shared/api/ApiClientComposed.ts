import { BaseApiClient } from "./services/ApiClient";
import { AdminApiClient } from "./services/AdminApiClient";
import { AuthApiClient } from "./services/AuthApiClient";
import { ImageApiClient } from "./services/ImageApiClient";
import { PropertyApiClient } from "./services/PropertyApiClient";
import { UserApiClient } from "./services/UserApiClient";
import { OwnerApiClient } from "./services/OwnerApiClient";
import { JobApiClient } from "./services/JobApiClient";
import { ChangelogApiClient } from "./services/ChangelogApiClient";
import { TransferApiClient } from "./services/TransferApiClient";

export class ApiClientComposed  extends BaseApiClient {
    public auth: AuthApiClient;
    public user: UserApiClient;
    public property: PropertyApiClient;     
    public owner: OwnerApiClient;
    public admin: AdminApiClient
    public job: JobApiClient;
    public changelog: ChangelogApiClient
    public transfer: TransferApiClient;
    public image: ImageApiClient;

    constructor() {
        super();
        this.auth = new AuthApiClient();
        this.user = new UserApiClient();
        this.property = new PropertyApiClient();
        this.owner = new OwnerApiClient();
        this.admin = new AdminApiClient();
        this.job = new JobApiClient();
        this.changelog = new ChangelogApiClient();
        this.transfer = new TransferApiClient();
        this.image = new ImageApiClient();
    }

     async signup(params: any) {
    return this.auth.signup(params);
  }

  async login(params: any) {
    return this.auth.login(params);
  }

  async logout() {
    return this.auth.logout();
  }

  async verifyAuth() {
    return this.auth.verifyAuth();
  }

  async getUserInfoByEmail(email: string) {
    return this.user.getUserInfoByEmail(email);
  }

  async getUserInfoByOwnerId(ownerId: string) {
    return this.user.getUserInfoByOwnerId(ownerId);
  }

  async getOwnerId(userId: string) {
    return this.owner.getOwnerId(userId);
  }

  async checkOwnerExists(email: string) {
    return this.owner.checkOwnerExists(email);
  }

  async ownerOnboardProperty(params: any) {
    return this.owner.ownerOnboardProperty(params);
  }

  async adminOnboardProperty(params: any) {
    return this.admin.adminOnboardProperty(params);
  }

  async getAdminProperties(userId: string, userType: string) {
    return this.admin.getAdminProperties(userId, userType);
  }

  async getAllOwners() {
    return this.admin.getAllOwners();
  }

  async getPropertyList(userId: string) {
    return this.property.getPropertyList(userId);
  }

  async getPropertyOwners(propertyId: string) {
    return this.property.getPropertyOwners(propertyId);
  }

  async getPropertyDetails(propertyId: string) {
    return this.property.getPropertyDetails(propertyId);
  }

  async getAssetTypes() {
    return this.property.getAssetTypes();
  }

  async updateProperty(propertyId: string, updates: any) {
    return this.property.updateProperty(propertyId, updates);
  }

  async updateSpace(spaceId: string, updates: any) {
    return this.property.updateSpace(spaceId, updates);
  }

  async updateAsset(assetId: string, updates: any) {
    return this.property.updateAsset(assetId, updates);
  }

  async updateFeatures(assetId: string, features: Record<string, any>) {
    return this.property.updateFeatures(assetId, features);
  }

  async createSpace(params: any) {
    return this.property.createSpace(params);
  }

  async createAsset(params: any) {
    return this.property.createAsset(params);
  }

  async deleteSpace(spaceId: string) {
    return this.property.deleteSpace(spaceId);
  }

  async deleteAsset(assetId: string) {
    return this.property.deleteAsset(assetId);
  }

  async deleteFeature(assetId: string, featureName: string) {
    return this.property.deleteFeature(assetId, featureName);
  }

  async getPropertyImages(propertyId: string, imageName?: string) {
    return this.image.getPropertyImages(propertyId, imageName);
  }

  async uploadPropertyImage(propertyId: string, file: File, description?: string) {
    return this.image.uploadPropertyImage(propertyId, file, description);
  }

  async deletePropertyImages(signedUrls: string | string[]) {
    return this.image.deletePropertyImages(signedUrls);
  }

  async updatePropertySplashImage(signedUrl: string) {
    return this.image.updatePropertySplashImage(signedUrl);
  }

  async getChangeLogs(propertyIds: string[]) {
    return this.changelog.getChangeLogs(propertyIds);
  }

  async getAssetHistory(assetId: string) {
    return this.changelog.getAssetHistory(assetId);
  }

  async getSpaceHistory(spaceId: string) {
    return this.changelog.getSpaceHistory(spaceId);
  }

  async getPropertyHistory(propertyId: string) {
    return this.changelog.getPropertyHistory(propertyId);
  }

  async createChangeLogEntry(
    assetId: string,
    changeDescription: string,
    action?: 'CREATED' | 'UPDATED' | 'DELETED',
    currentSpecifications?: Record<string, any>
  ) {
    return this.changelog.createChangeLogEntry(assetId, changeDescription, action, currentSpecifications);
  }

  async getTransfersByProperty(propertyId: string) {
    return this.transfer.getTransfersByProperty(propertyId);
  }

  async getTransfersByUser(userId: string) {
    return this.transfer.getTransfersByUser(userId);
  }

  async initiateTransfer(propertyId: string, oldOwnerUserIds: string[], newOwnerUserIds: string[]) {
    return this.transfer.initiateTransfer(propertyId, oldOwnerUserIds, newOwnerUserIds);
  }

  async approveTransfer(transferId: string, ownerId: { ownerId: string }) {
    return this.transfer.approveTransfer(transferId, ownerId);
  }

  async rejectTransfer(transferId: string, ownerId: { ownerId: string }) {
    return this.transfer.rejectTransfer(transferId, ownerId);
  }

  async getOwnerIdByUserId(userId: string) {
    return this.owner.getOwnerIdByUserId(userId);
  }

  async fetchJobs(propertyId: string, expired?: boolean | null, last?: number | null) {
    return this.job.fetchJobs(propertyId, expired, last);
  }

  async fetchJobAssets(jobId: string, withDetails?: boolean) {
    return this.job.fetchJobAssets(jobId, withDetails);
  }

  async createJob(job: any, assetIds: string[]) {
    return this.job.createJob(job, assetIds);
  }

  async updateJob(job: any, assetIds: string[]) {
    return this.job.updateJob(job, assetIds);
  }

  async deleteJob(jobId: string) {
    return this.job.deleteJob(jobId);
  }
}


// Export singleton instance
export const apiClientComposed = new ApiClientComposed();
