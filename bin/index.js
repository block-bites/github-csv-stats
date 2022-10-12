#!/usr/bin/env node
const { Octokit } = require("octokit");
const dotenv = require("dotenv");
const yargs = require("yargs");

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
  const repoInfo = await octokit.request("GET /repos/" + repo);
  if (repoInfo.status !== 200) {
    const message = `An error has occured: ${repoInfo.status}`;
    throw new Error(message);
  }
  return repoInfo.data;
}

async function getContributors(repo) {
  const repoContributors = await octokit.request(
    "GET /repos/" + repo + "/stats/contributors"
  );
  if (repoContributors.status !== 200) {
    const message = `An error has occured: ${repoContributors.status}`;
    throw new Error(message);
  }
  return repoContributors.data;
}

async function getPulls(repo) {
  const pullsInfo = await octokit.request(
    "GET /repos/" + repo + "/pulls?state=open&per_page=100"
  );
  if (pullsInfo.status !== 200) {
    const message = `An error has occured: ${pullsInfo.status}`;
    throw new Error(message);
  }
  return pullsInfo.data;
}

async function getBranches(repo) {
  const branchesInfo = await octokit.request(
    "GET /repos/" + repo + "/branches?per_page=100"
  );
  if (branchesInfo.status !== 200) {
    const message = `An error has occured: ${branchesInfo.status}`;
    throw new Error(message);
  }
  return branchesInfo.data;
}

//Get args
const repos = options.repo.split(",");
repos.forEach((repoListed) => {
  const repo = repoListed.split("https://github.com/")[1];
  //Number of: pr, forks, stars, closed/open issues, dominant language, license,last commit date
  getRepo(repo)
    .then(function (result) {
      console.log("Repository: " + result.name);
      console.log(
        "Created: " +
          result.created_at.split("T")[0] +
          " at " +
          result.created_at.split("T")[1].split("Z")[0]
      );
      console.log(
        "Updated: " +
          result.updated_at.split("T")[0] +
          " at " +
          result.updated_at.split("T")[1].split("Z")[0]
      );
      console.log(
        "Pushed: " +
          result.pushed_at.split("T")[0] +
          " at " +
          result.pushed_at.split("T")[1].split("Z")[0]
      );
      console.log("Dominant Language: " + result.language);
      if (result.license !== null) {
        console.log("License: " + result.license.name);
      } else {
        console.log("No License");
      }

      console.log("Forks: " + result.forks);
      console.log("Stars: " + result.stargazers_count);
      const openIssues = result.open_issues;

      //Separate PR from Issues
      getPulls(repo).then(function (result) {
        console.log("Open PR: " + result.length);
        console.log("Open Issues: " + (openIssues - result.length));
      });
    })
    .catch((error) => {
      console.log(`[FETCHING ERROR]:Not Available: ${error}`);
    });

  //Show contributors
  getContributors(repo)
    .then((result) => {
      console.log("Contributors: " + result.length);
    })
    .catch((error) => {
      console.log(`[FETCHING ERROR]:Not Available: ${error}`);
    });

  //Show branches
  getBranches(repo)
    .then((result) => {
      console.log("Branches: " + result.length);
    })
    .catch((error) => {
      console.log(`[FETCHING ERROR]:Not Available: ${error}`);
    });
});
