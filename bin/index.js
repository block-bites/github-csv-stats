#!/usr/bin/env node
const { Octokit } = require("@octokit/rest");
const dotenv = require("dotenv");
const yargs = require("yargs");
const fs = require("fs");

const options = yargs
  .usage(
    "Usage: -r <URLs of all the repositories to analyse. Comma separated.>"
  )
  .option("r", {
    alias: "repo",
    describe: "Repo URL to get Stats",
    type: "string",
    demandOption: true,
  })
  .option("v", {
    alias: "verbose",
    describe: "Show Repo info while processing",
    type: "boolean",
    demandOption: false,
  }).argv;

// Configuration the .env file
dotenv.config();
const token = process.env.TOKEN || "";

//Configure Octokit with token
const octokit = new Octokit({
  auth: token,
});

async function getRepo(ownerRepo) {
  const owner = ownerRepo.split("/")[0];
  const repo = ownerRepo.split("/")[1];
  const [
    responseInfo,
    responseContributors,
    responsePulls,
    responseBranches,
    responseIssueC,
    responsePullC,
  ] = await Promise.all([
    octokit.rest.repos.get({ owner, repo }),
    octokit.rest.repos.listContributors({ owner, repo, per_page: 100 }),
    octokit.rest.pulls.list({ owner, repo, per_page: 100 }),
    octokit.rest.repos.listBranches({ owner, repo, per_page: 100 }),
    octokit.rest.search.issuesAndPullRequests({
      q: 'is:issue+repo:"' + ownerRepo + '"+is:closed',
      per_page: 1,
    }),
    octokit.rest.search.issuesAndPullRequests({
      q: 'is:pr+repo:"' + ownerRepo + '"+is:closed',
      per_page: 1,
    }),
  ]);
  if (
    responseInfo.status === 200 &&
    responseContributors.status === 200 &&
    responsePulls.status === 200 &&
    responseBranches.status === 200 &&
    responseIssueC.status === 200 &&
    responsePullC.status === 200
  ) {
    return [
      responseInfo.data,
      responseContributors.data,
      responsePulls.data,
      responseBranches.data,
      responseIssueC.data,
      responsePullC.data,
    ];
  }
}

//Get args
const repos = options.repo.split(",");

const csv = [
  "name",
  "open_pr",
  "closed_pr",
  "forks",
  "stars",
  "open_issues",
  "closed_issues",
  "language",
  "license",
  "contributors",
  "created",
  "updated",
  "pushed",
].join(",");
const fileName = Date.now().toString() + ".csv";
fs.writeFileSync(fileName, csv);
repos.forEach((repoListed) => {
  const repo = repoListed.split("https://github.com/")[1];
  getRepo(repo).then(
    ([
      repoInfo,
      repoContributors,
      pullsInfo,
      branchesInfo,
      closedIssues,
      closedPulls,
    ]) => {
      if (options.verbose) {
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

        if (repoInfo.license !== null) {
          console.log("License: " + repoInfo.license.name);
        } else {
          console.log("No License");
        }
        console.log("Forks: " + repoInfo.forks);
        console.log("Stars: " + repoInfo.stargazers_count);
        //Separate PR from Issues
        console.log("Open PR: " + pullsInfo.length);
        console.log("Closed PR: " + closedPulls.total_count);
        console.log(
          "Open Issues: " + (repoInfo.open_issues - pullsInfo.length)
        );
        console.log("Closed Issues: " + closedIssues.total_count);
        //Show contributors
        console.log("Contributors: " + repoContributors.length);
        //Show branches
        console.log("Branches: " + branchesInfo.length);
      }
      //create csv
      let licenseName = "No License";
      if (repoInfo.license !== null) {
        licenseName = repoInfo.license.name;
      }
      const row =
        "\r\n" +
        [
          repoInfo.name,
          pullsInfo.length,
          closedPulls.total_count,
          repoInfo.forks,
          repoInfo.stargazers_count,
          repoInfo.open_issues - pullsInfo.length,
          closedIssues.total_count,
          repoInfo.language,
          licenseName,
          repoContributors.length,
          repoInfo.created_at.split("T")[0],
          repoInfo.updated_at.split("T")[0],
          repoInfo.pushed_at.split("T")[0],
        ].join(",");
      fs.appendFileSync(fileName, row);
    }
  );
});
