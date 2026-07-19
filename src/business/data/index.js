/**
 * 仓储工厂 - 提供 DataRepository 快捷访问
 *
 * 按设计，视图统一使用此工厂获取数据仓储实例。
 * 所有 DataRepository 实例均绑定 business 数据库。
 */
import { DataRepository } from '../../framework/core/DataRepository.js';

/**
 * 获取任意业务表的 DataRepository 实例
 * @param {import('../../framework/lib/api.js').default} api
 * @param {import('../../framework/core/SchemaRegistry.js').SchemaRegistry} schemaRegistry
 * @param {string} tableName
 * @returns {import('../../framework/core/DataRepository.js').DataRepository}
 */
export function repo(api, schemaRegistry, tableName) {
  return DataRepository.for(api, schemaRegistry, 'business', tableName);
}

/** @returns {Promise<import('../../framework/core/DataRepository.js').DataRepository>} */
export function taskRepo(api, schemaRegistry) {
  return repo(api, schemaRegistry, 'tasks');
}

/** @returns {Promise<import('../../framework/core/DataRepository.js').DataRepository>} */
export function assetRepo(api, schemaRegistry) {
  return repo(api, schemaRegistry, 'assets');
}

/** @returns {Promise<import('../../framework/core/DataRepository.js').DataRepository>} */
export function contentRepo(api, schemaRegistry) {
  return repo(api, schemaRegistry, 'contents');
}

/** @returns {Promise<import('../../framework/core/DataRepository.js').DataRepository>} */
export function templateRepo(api, schemaRegistry) {
  return repo(api, schemaRegistry, 'templates');
}

/** @returns {Promise<import('../../framework/core/DataRepository.js').DataRepository>} */
export function packageRepo(api, schemaRegistry) {
  return repo(api, schemaRegistry, 'packages');
}

/** @returns {Promise<import('../../framework/core/DataRepository.js').DataRepository>} */
export function platformRepo(api, schemaRegistry) {
  return repo(api, schemaRegistry, 'platforms');
}

/** @returns {Promise<import('../../framework/core/DataRepository.js').DataRepository>} */
export function scheduleRepo(api, schemaRegistry) {
  return repo(api, schemaRegistry, 'schedules');
}

/** @returns {Promise<import('../../framework/core/DataRepository.js').DataRepository>} */
export function publishLogRepo(api, schemaRegistry) {
  return repo(api, schemaRegistry, 'publish-logs');
}

export default repo;
