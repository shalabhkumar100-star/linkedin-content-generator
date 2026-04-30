import fs from "fs";
import path from "path";
import { runActor } from "./apifyClient.js";
import { scoreJob } from "./scoring/scoreJob.js";
import targets from "../config/targets.json" assert { type: "json" };

const CV_TEXT = "PASTE_YOUR_CV_TEXT_HERE";

// Replace with real Apify actor IDs
const ACTORS = {
  linkedin: "apify/linkedin-jobs-scraper",
  indeed: "apify/indeed-scraper",
  google: "apify/google-jobs-scraper",
};

async function fetchJobs() {
  const queries = targets.roles.slice(0, 3); // limit initial load

  let results = [];

  for (const role of queries) {
    const input = {
      query: role,
      location: targets.location,
      maxItems: 20,
    };

    try {
      const googleJobs = await runActor(ACTORS.google, input);
      const linkedinJobs = await runActor(ACTORS.linkedin, input);
      const indeedJobs = await runActor(ACTORS.indeed, input);

      results.push(...googleJobs, ...linkedinJobs, ...indeedJobs);
    } catch (e) {
      console.error("Error fetching jobs for", role, e.message);
    }
  }

  return results;
}

async function main() {
  const jobs = await fetchJobs();

  const scored = [];

  for (const job of jobs) {
    const score = await scoreJob(job, CV_TEXT);

    if (score >= targets.minScore) {
      scored.push({
        role: job.title || job.position,
        company: job.companyName || job.company,
        posted: job.postedAt || job.date,
        source: job.source || "unknown",
        score,
        link: job.url || job.applyUrl,
      });
    }
  }

  const sorted = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, targets.maxResults);

  const outputPath = path.resolve("job-scraper/output/jobs.json");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2));

  console.table(sorted);
}

main();
