#!/usr/bin/env node
const { Octokit } = require("octokit");
const dotenv = require("dotenv");
const yargs = require("yargs");
const fs = require("fs");

const options = yargs.usage("Usage: -r <repo URL>").option("r", {
  alias: "repo",
  describe: "Repo URL to get Stats",
  type: "string",
  demandOption: true,
}).argv;

// Configuration the .env file
dotenv.config();
const token = process.env.TOKEN || "";

//Configure Octokit with token
const octokit = new Octokit({
  auth: token,
});

async function getRepo(repo) {
  const [responseInfo, responseContributors, responsePulls, responseBranches] =
    await Promise.all([
      octokit.request("GET /repos/" + repo),
      octokit.request("GET /repos/" + repo + "/stats/contributors"),
      octokit.request("GET /repos/" + repo + "/pulls?state=open&per_page=100"),
      octokit.request("GET /repos/" + repo + "/branches?per_page=100"),
    ]);
  if (
    responseInfo.status === 200 &&
    responseContributors.status === 200 &&
    responsePulls.status === 200 &&
    responseBranches.status === 200
  ) {
    const repoInfo = await responseInfo.data;
    const repoContributors = await responseContributors.data;
    const pullsInfo = await responsePulls.data;
    const branchesInfo = await responseBranches.data;
    return [repoInfo, repoContributors, pullsInfo, branchesInfo];
  }
}

//Get args
const repos = options.repo.split(",");
const csv = [
  "pr",
  "forks",
  "stars",
  "open_issues",
  "language",
  "license",
  "constributors",
  "created",
  "updated",
  "pushed",
].join(",");
fs.writeFileSync(Date.now().toString() + ".csv", csv);
repos.forEach((repoListed) => {
  const repo = repoListed.split("https://github.com/")[1];
  //Number of: pr, forks, stars, closed/open issues, dominant language, license,last commit date
  getRepo(repo)
    .then(([repoInfo, repoContributors, pullsInfo, branchesInfo]) => {
      console.log("Repository: " + repoInfo.name);
      console.log(
        "Created: " +
          repoInfo.created_at.split("T")[0] +
          " at " +
          repoInfo.created_at.split("T")[1].split("Z")[0]
      );
      console.log(
        "Updated: " +
          repoInfo.updated_at.split("T")[0] +
          " at " +
          repoInfo.updated_at.split("T")[1].split("Z")[0]
      );
      console.log(
        "Pushed: " +
          repoInfo.pushed_at.split("T")[0] +
          " at " +
          repoInfo.pushed_at.split("T")[1].split("Z")[0]
      );
      console.log("Dominant Language: " + repoInfo.language);
      let licenseName = "No License";
      if (repoInfo.license !== null) {
        licenseName = repoInfo.license.name;
        console.log("License: " + repoInfo.license.name);
      } else {
        console.log("No License");
      }

      console.log("Forks: " + repoInfo.forks);
      console.log("Stars: " + repoInfo.stargazers_count);

      //Separate PR from Issues

      console.log("Open PR: " + pullsInfo.length);
      console.log("Open Issues: " + (repoInfo.open_issues - pullsInfo.length));
      //Show contributors
      console.log("Contributors: " + repoContributors.length);
      //Show branches
      console.log("Branches: " + branchesInfo.length);

      //create csv
      const row =
        "\r\n" +
        [
          pullsInfo.length,
          repoInfo.forks,
          repoInfo.stargazers_count,
          repoInfo.open_issues - pullsInfo.length,
          repoInfo.language,
          licenseName,
          repoContributors.length,
          repoInfo.created_at.split("T")[0],
          repoInfo.updated_at.split("T")[0],
          repoInfo.pushed_at.split("T")[0],
        ].join(",");
      fs.appendFileSync("demoA.csv", row);
    })

    .catch((error) => {
      console.log("[FETCHING ERROR]:Getting stats from: " + repo + error);
    });
});
