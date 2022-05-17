import * as consts from './FAKE';

/**
 * convert workdata from workservice e.g:
 * http://work-presentation-service.cisterne.svc.cloud.dbc.dk/api/work-presentation?agencyId=190101&profile=default&workId=work-of:870970-basis:38499386
 * to jed data structure
 * @param originalData
 * @returns {{}}
 */
export function workToJed(originalData) {

  //console.log(JSON.stringify(originalData, null, 4));

  const jedData = {};

  jedData.workId = originalData?.work.workId;
  jedData.abstract = [originalData?.work.description];

  jedData.titles = workToJedParseTitle(originalData?.work);
  jedData.creators = workToJedCreators(originalData?.work);

  jedData.materialTypes = workToMaterialTypes(originalData?.work);

  return jedData;
}

function workToMaterialTypes(work) {
  // run through groups to get materialtypes.
  // filter out duplicates
  const jedData = work.groups?.map((group) => {
    return {
      ...consts.FAKE_MATERIALTYPE, ...{specific: group.records[0].types[0]},
    };
  }).
      filter((rec, index, self) => {
        return (self.indexOf(
            self.find((record) => record.specific === rec.specific)) === index)
      })
  return jedData;
}

function workToJedParseTitle(work) {
  return {
    ...consts.FAKE_WORKTITLES, ...{
      'main': [work.title],
      'full': [work.fullTitle],
    },
  };
}

function workToJedCreators(work) {
  const jedData = work.creators.map((creator) => {
    return {
      ...consts.FAKE_PERSON, ...
          {
            'display': creator.value,
            'nameSort': creator.value,
            'roles': [
              {
                ...consts.FAKE_ROLE, ...{functionCode: creator.type},
                ...{
                  'function': {
                    ...consts.FAKE_TRANSLATION, ...{
                      plural: 'fiskene',
                      singular: 'fisk',
                    },
                  },
                },
              }],
          },
    };
  });
  return jedData;
}


