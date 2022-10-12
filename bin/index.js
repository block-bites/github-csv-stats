const { Octokit } = require("octokit");
const dotenv = require("dotenv");

//Repo to check
const owner = "gitkraken";
const repo = "vscode-gitlens";

// Configuration the .env file
dotenv.config();
const token = process.env.TOKEN || "";

//Configure Octokit with token
const octokit = new Octokit({
  auth: token,
});

async function getRepo() {
  const repoInfo = await octokit.request("GET /repos/{owner}/{repo}", {
    owner: owner,
    repo: repo,
  });
  if (repoInfo.status !== 200) {
    const message = `An error has occured: ${repoInfo.status}`;
    throw new Error(message);
  }
  return repoInfo.data;
}

async function getContributors() {
  const repoContributors = await octokit.request(
    "GET /repos/{owner}/{repo}/stats/contributors",
    {
      owner: owner,
      repo: repo,
    }
  );
  if (repoContributors.status !== 200) {
    const message = `An error has occured: ${repoContributors.status}`;
    throw new Error(message);
  }
  return repoContributors.data;
}

async function getPulls() {
  const pullsInfo = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls?state=open&per_page=100",
    {
      owner: owner,
      repo: repo,
    }
  );
  if (pullsInfo.status !== 200) {
    const message = `An error has occured: ${pullsInfo.status}`;
    throw new Error(message);
  }
  return pullsInfo.data;
}

async function getBranches() {
  const branchesInfo = await octokit.request(
    "GET /repos/{owner}/{repo}/branches?per_page=100",
    {
      owner: owner,
      repo: repo,
    }
  );
  if (branchesInfo.status !== 200) {
    const message = `An error has occured: ${branchesInfo.status}`;
    throw new Error(message);
  }
  return branchesInfo.data;
}

//Number of: pr, forks, stars, closed/open issues, dominant language, license,last commit date
getRepo()
  .then(function (result) {
    console.log("-----General Information-----");
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
    console.log("License: " + result.license.name);
    console.log("Forks: " + result.forks);
    console.log("Stars: " + result.stargazers_count);
    const openIssues = result.open_issues;

    //Separate PR from Issues
    getPulls().then(function (result) {
      console.log("Open PR: " + result.length);
      console.log("Open Issues: " + (openIssues - result.length));
    });
  })
  .catch((error) => {
    console.log(`[FETCHING ERROR]:Not Available: ${error}`);
  });

//Show contributors
getContributors()
  .then((result) => {
    console.log("Contributors: " + result.length);
  })
  .catch((error) => {
    console.log(`[FETCHING ERROR]:Not Available: ${error}`);
  });

//Show branches
getBranches()
  .then((result) => {
    console.log("Branches: " + result.length);
  })
  .catch((error) => {
    console.log(`[FETCHING ERROR]:Not Available: ${error}`);
  });
