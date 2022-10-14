# github-csv-stats
## Generate csv report from github repositories metrics

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
