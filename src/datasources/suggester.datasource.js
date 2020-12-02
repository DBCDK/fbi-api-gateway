/**
 * @file Get suggestions
 *
 * This is temporary until real suggester is implemented
 */

import metadata from "./creators.json";
import { orderBy } from "lodash";
import simplesearchBatchLoader from "./simplesearch.datasource";
import workBatchLoader from "./work.datasource";

// extract subjects from creators.json
const subjects = {};
Object.values(metadata).forEach(entry => {
  if (typeof entry.about === "string") {
    subjects[entry.about] = true;
  } else if (Array.isArray(entry.about)) {
    entry.about.forEach(subject => {
      subjects[subject] = true;
    });
  }
});

/**
 * gets a string match score
 * @param {string} str
 * @param {string} q
 */
function getScore(str, q) {
  const split = str.split(/\s+/);
  const qLowerCase = q.toLowerCase();
  let score = 0;
  [str, ...split].forEach((substr, index) => {
    const substrLower = substr.toLowerCase();
    if (substrLower.startsWith(qLowerCase)) {
      score += 10;
      if (index === 0) {
        score += 10;
      }
    } else if (substrLower.includes(qLowerCase)) {
      score += 2;
    }
  });
  return score;
}

/**
 * Temporary suggester for creators
 * Need the real deal at some point
 * @param {string} q
 */
function getCreators(q) {
  return Object.values(metadata)
    .map(entry => ({
      value: entry.wellName,
      score: getScore(entry.wellName, q),
      __resolveType: "Creator"
    }))
    .filter(entry => entry.score > 0);
}

/**
 * Temporary suggester for subjects
 * Extract subjects from creators.json
 * @param {string} q
 */
function getSubjects(q) {
  return Object.keys(subjects)
    .map(subject => ({
      value: subject,
      score: getScore(subject, q),
      __resolveType: "Subject"
    }))
    .filter(entry => entry.score > 0);
}

async function getWorks(q) {
  const res = (await simplesearchBatchLoader([{ q }]))[0];
  const ids = res.result
    .map(entry => entry.pids && entry.pids[0])
    .filter(pid => !!pid)
    .map(pid => `work-of:${pid}`);

  const works = (await workBatchLoader(ids)).filter(entry => entry.work.title);
  return works
    .map(entry => ({
      ...entry.work,
      score: getScore(entry.work.title, q),
      __resolveType: "Work"
    }))
    .filter(entry => entry.score > 0);
}

async function getSuggestions({ q }) {
  const creators = getCreators(q);
  const subjects = getSubjects(q);
  const works = await getWorks(q);
  return orderBy([...creators, ...subjects, ...works], "score", "desc").slice(
    0,
    10
  );
}

/**
 * A DataLoader batch function
 *
 * @param {Array.<string>} keys The keys to fetch
 */
export default async function batchLoader(keys) {
  return await Promise.all(keys.map(key => getSuggestions(key)));
}
