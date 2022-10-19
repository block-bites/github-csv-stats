#!/usr/bin/env node
const { Octokit } = require("@octokit/rest");
const dotenv = require("dotenv");
const yargs = require("yargs");
const fs = require("fs");
const fetch = require("node-fetch");

// Configuration of possible arguments
const options = yargs
  .usage(
    "Usage: \r\n-r <URLs of all the repositories to analyse. Comma separated.> \r\n -f <File with URLs of all the repositories to analyse. Comma separated.>"
  )
  .option("r", {
    alias: "repo",
    describe: "Repo URL to get Stats",
    type: "string",
    demandOption: false,
  })
  .option("f", {
    alias: "repoFile",
    describe: "File name containing  Repo URLs to get Stats",
    type: "string",
    demandOption: false,
  })
  .option("v", {
    alias: "verbose",
    describe: "Show Repo info while processing",
    type: "boolean",
    demandOption: false,
  }).argv;

// Configuration of the .env file
dotenv.config();
const token = process.env.TOKEN || "";
if (token === "") {
  console.log(
    "[INFO] Search done without Github Token. Could be some limitations.\r\n To get better results crete file .env and add Github secret token: TOKEN=ghp_XX... "
  );
}

//Configure Octokit with token
const octokit = new Octokit({
  auth: token,
});

// Fetch info from Github API. Using Octokit to get contributors and GraphQL for all the rest of information
async function getRepo(ownerRepo) {
  const owner = ownerRepo.split("/")[0];
  const repo = ownerRepo.split("/")[1];
  const [responseInfo, responseContributors] = await Promise.all([
    fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        query: `
          query {
            closed_issues:search(query: "repo:${ownerRepo} is:issue is:closed ", type: ISSUE, first: 0) {
              issueCount
            }
            open_issues:search(query: "repo:${ownerRepo} is:issue is:open ", type: ISSUE, first: 0) {
              issueCount
            }
            closed_pr:search(query: "repo:${ownerRepo} is:pr is:closed ", type:ISSUE , first: 0) {
              issueCount
            }
            repo_info:repositoryOwner(login: "${owner}") {
              repository(name: "${repo}") {
                name
                pullRequests(states: OPEN) {
                  totalCount
                }
                forks {
                  totalCount
                }
                stargazers {
                  totalCount
                }
                watchers{
                  totalCount
                }
                refs(refPrefix: "refs/heads/", first: 1) {
                  totalCount
                }
                languages(first:1){
                  nodes{
                    name
                  }
                }
                licenseInfo{
                  name
                }
                createdAt
                updatedAt
                pushedAt
                commits_main:object(expression:"main") {
                  ... on Commit {
                    history {
                      totalCount
                    }
                  }
                }
                commits_master:object(expression:"master") {
                  ... on Commit {
                    history {
                      totalCount
                    }
                  }
                 }
              }
            }
          }  
      `,
      }),
    }),
    octokit.rest.repos.listContributors({ owner, repo, per_page: 100 }),
  ]);
  if (responseInfo.status === 200 && responseContributors.status === 200) {
    const repoInfo = await responseInfo.json();
    return [repoInfo.data, responseContributors.data];
  }
}

//Get args introduced on the terminal
let repos = "";
if (options.repo !== "" && options.repo !== undefined) {
  repos = options.repo.split(",");
} else if (options.repoFile !== "" && options.repoFile !== undefined) {
  var text = fs.readFileSync(options.repoFile, "utf8");
  repos = text
    .toString()
    .split(",")
    .map((item) =>
      item.replace("\r\n", "").replace("\n", "").replace("\r", "").trim()
    );
} else {
  console.log("Needed repo to analyse");
  process.exit();
}

// Create the CSV file and fill the titles
const csv = [
  "name",
  "open_pr",
  "closed_pr",
  "forks",
  "branches",
  "stars",
  "watchers",
  "open_issues",
  "closed_issues",
  "contributors",
  "commits",
  "language",
  "license",
  "created",
  "updated",
  "pushed",
].join(",");
const fileName = Date.now().toString() + ".csv";
fs.writeFileSync(fileName, csv);

//Analyse each repo
repos.forEach((repoListed) => {
  const repo = repoListed.split("https://github.com/")[1];
  getRepo(repo)
    .then(([repoInfo, repoContributors]) => {
      //Parse all data fetched
      const name = repoInfo.repo_info.repository.name;
      const open_pr = repoInfo.repo_info.repository.pullRequests.totalCount;
      const closed_pr = repoInfo.closed_pr.issueCount;
      const forks = repoInfo.repo_info.repository.forks.totalCount;
      const branches = repoInfo.repo_info.repository.refs.totalCount;
      const stars = repoInfo.repo_info.repository.stargazers.totalCount;
      const watchers = repoInfo.repo_info.repository.watchers.totalCount;
      const open_issues = repoInfo.open_issues.issueCount;
      const closed_issues = repoInfo.open_issues.issueCount;
      let commits = 0;
      if (repoInfo.repo_info.repository.commits_main !== null) {
        commits = repoInfo.repo_info.repository.commits_main.history.totalCount;
      } else {
        commits =
          repoInfo.repo_info.repository.commits_master.history.totalCount;
      }
      const contributors = repoContributors.length;
      let language = "Unknown";
      if (repoInfo.repo_info.repository.languages.nodes.length > 0) {
        language = repoInfo.repo_info.repository.languages.nodes[0].name;
      }
      let license = "No License";
      if (repoInfo.repo_info.repository.licenseInfo !== null) {
        license = repoInfo.repo_info.repository.licenseInfo.name;
      }
      const created = repoInfo.repo_info.repository.createdAt.split("T")[0];
      const updated = repoInfo.repo_info.repository.updatedAt.split("T")[0];
      const pushed = repoInfo.repo_info.repository.pushedAt.split("T")[0];

      //Show information on terminal if verbose
      if (options.verbose) {
        console.log("//////////////////////////////////");
        console.log("Repository: " + name);
        console.log(
          "Created: " +
            created +
            " at " +
            repoInfo.repo_info.repository.createdAt.split("T")[1].split("Z")[0]
        );
        console.log(
          "Updated: " +
            updated +
            " at " +
            repoInfo.repo_info.repository.updatedAt.split("T")[1].split("Z")[0]
        );
        console.log(
          "Pushed: " +
            pushed +
            " at " +
            repoInfo.repo_info.repository.pushedAt.split("T")[1].split("Z")[0]
        );
        console.log("Dominant Language: " + language);
        console.log("License: " + license);
        console.log("Forks: " + forks);
        console.log("Stars: " + stars);
        console.log("Watchers: " + watchers);
        console.log("Open PR: " + open_pr);
        console.log("Closed PR: " + closed_pr);
        console.log("Open Issues: " + open_issues);
        console.log("Closed Issues: " + closed_issues);
        console.log("Contributors: " + contributors);
        console.log("Commits: " + commits);
        console.log("Branches: " + branches);
      }

      //Add the information of the repo to the CSV file
      const row =
        "\r\n" +
        [
          name,
          open_pr,
          closed_pr,
          forks,
          branches,
          stars,
          watchers,
          open_issues,
          closed_issues,
          contributors,
          commits,
          language,
          license,
          created,
          updated,
          pushed,
        ].join(",");
      fs.appendFileSync(fileName, row);
    })
    .catch((error) => {
      if (error instanceof TypeError) {
        console.log(
          `[ERROR]: Repo ${repoListed} not analysed -> TypeError: Incorrect Github Repo URL`
        );
      } else {
        console.log(`[ERROR]: Repo ${repoListed} not analysed -> ${error}`);
      }
    });
});
