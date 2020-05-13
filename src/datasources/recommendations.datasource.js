import request from 'superagent';
import {cached} from './cache';

export const find = cached(
  async ({pid, limit = 10}) => {
    // console.log({pid});
    return (
      await request
        .post(
          'http://recompass-work-1-2.mi-prod.svc.cloud.dbc.dk/recompass-work'
        )
        .send({
          likes: [pid],
          limit
        })
    ).body;
  },
  {stdTTL: 60 * 60 * 24}
);

export default {find};
