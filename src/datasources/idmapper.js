import request from 'superagent';
import {cached} from './cache';

export const get = cached(
  async ({pid}) =>
    (
      await request
        .post(
          'http://id-mapper-1-0.mi-prod.svc.cloud.dbc.dk/map/pid-to-workpids'
        )
        .send([pid])
    ).body[pid],
  {stdTTL: 60 * 60 * 24}
);

export default {get};
