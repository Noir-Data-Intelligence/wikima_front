// Generic REST resource client.
//
// createResource('bank-account') exposes the CRUD surface the app already uses
// (list / filter / get / create / update / delete) mapped to conventional REST:
//   GET    /{path}            -> list(sort, limit)
//   GET    /{path}?<query>    -> filter(query, sort, limit)
//   GET    /{path}/{id}       -> get(id)
//   POST   /{path}            -> create(data)
//   PUT    /{path}/{id}       -> update(id, data)
//   DELETE /{path}/{id}       -> delete(id)
//
// `service` lets a resource live on a dedicated microservice (see config.js).

import { http } from './http';
import { baseUrlFor } from './config';
import { MOCK_MODE, mockResource } from './mock';

export function createResource(path, { service } = {}) {
  // Dev-only: with no backend, return a resource that resolves to empty data.
  if (MOCK_MODE) return mockResource(path);

  const baseUrl = baseUrlFor(service);
  const collection = `/${path}`;
  const item = (id) => `/${path}/${encodeURIComponent(id)}`;

  return {
    path,

    list(sort, limit) {
      const query = {};
      if (sort) query.sort = sort;
      if (limit != null) query.limit = limit;
      return http.get(collection, { query, baseUrl });
    },

    filter(criteria = {}, sort, limit) {
      const query = { ...criteria };
      if (sort) query.sort = sort;
      if (limit != null) query.limit = limit;
      return http.get(collection, { query, baseUrl });
    },

    get(id) {
      return http.get(item(id), { baseUrl });
    },

    create(data) {
      return http.post(collection, data, { baseUrl });
    },

    update(id, data) {
      return http.put(item(id), data, { baseUrl });
    },

    delete(id) {
      return http.del(item(id), { baseUrl });
    },
  };
}

export default createResource;
