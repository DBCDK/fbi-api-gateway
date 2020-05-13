import request from 'superagent';
import {cached} from './cache';
import config from '../config';

const createRequest = pid => `
<mi:moreInfoRequest xmlns:mi="http://oss.dbc.dk/ns/moreinfo">
  <mi:authentication>
      <mi:authenticationUser>${config.datasources.moreinfo.authenticationUser}</mi:authenticationUser>
      <mi:authenticationGroup>${config.datasources.moreinfo.authenticationGroup}</mi:authenticationGroup>
      <mi:authenticationPassword>${config.datasources.moreinfo.authenticationPassword}</mi:authenticationPassword>
  </mi:authentication>
  <mi:identifier>
      <mi:pid>${pid}</mi:pid>
  </mi:identifier>
  <mi:outputType>json</mi:outputType>
</mi:moreInfoRequest>
`;

const get = cached(
  async ({pid}) => {
    // console.log({pid});
    const images = (
      await request
        .post(config.datasources.moreinfo.url)
        .field('xml', createRequest(pid))
    ).body.moreInfoResponse.identifierInformation
      .map(entry => entry.coverImage)
      .filter(entry => entry);

    const res = {};
    images.forEach(entry => {
      entry.forEach(cover => {
        res[cover['@imageSize'].$] = cover.$;
      });
    });
    return res;
  },
  {stdTTL: 60 * 60 * 24}
);

export default {get};
