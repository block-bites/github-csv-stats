# github-csv-stats
## Generate csv report from github repositories metrics

The script queries GitHub API for the repository metrics and stats. Currently it will collect the following data (example output):

```
Forks: 2
Stars: 2
Open PR: 0
Closed PR: 5
Open Issues: 0
Closed Issues: 0
Contributors: 2
Branches: 1
Repository: casper_dart_sdk
Created: 2022-03-12 at 15:37:39
Updated: 2022-03-22 at 21:29:50
Pushed: 2022-06-26 at 12:01:49
Dominant Language: Dart
License: Apache License 2.0
```

## Installation 

### JS dependencies
`npm install`

### Add Github access token
https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token

Select repo scope while creating a token to access private repositories.

Create `.env` file in the repository directory with the following contents:

TOKEN=ghp_.....

## Running

`node . -r <repo URLs. Comma separated>`

or

`node . -f <filename with repo URL. Comma separated>`



---

*Proudly created by [BlockBites](https://blockbit.es)!*
