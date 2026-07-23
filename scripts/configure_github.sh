#!/usr/bin/env bash
set -euo pipefail

repository="${GITHUB_REPOSITORY:-Asttr0/GemmaPunks}"
owner="${repository%%/*}"
repo_name="${repository##*/}"
project_title="MIZAN Souq — Hackathon MVP"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

gh auth status >/dev/null
gh repo view "$repository" >/dev/null

gh repo edit "$repository" \
  --description "Gemma-powered Darija-first business management and collective procurement for Moroccan microbusinesses." \
  --homepage "https://github.com/${repository}" \
  --enable-issues \
  --enable-projects \
  --enable-squash-merge \
  --delete-branch-on-merge \
  --disable-merge-commit \
  --disable-rebase-merge

while IFS='|' read -r name color description; do
  gh label create "$name" --repo "$repository" --color "$color" \
    --description "$description" --force
done <<'LABELS'
priority:p0|B60205|Required for the live demo
priority:p1|D93F0B|Only after P0 is stable
priority:p2|FBCA04|Post-hackathon
area:frontend|1D76DB|React and product experience
area:backend|0E8A16|FastAPI and business APIs
area:ai|8B5CF6|Gemma providers, prompts, and orchestration
area:data|006B75|Firebase, rules, data model, and seed
area:devops|5319E7|CI, deployment, and repository operations
area:demo|F59E0B|Demo path, reliability, and pitch
type:feature|A2EEEF|New product behavior
type:bug|D73A4A|Something is not working
type:chore|C5DEF5|Maintenance or engineering setup
blocked|000000|Waiting on an explicit dependency
LABELS

if ! gh api "repos/${repository}/milestones" --paginate --jq '.[].title' |
  rg -Fxq "Hackathon MVP"; then
  gh api --method POST "repos/${repository}/milestones" \
    -f title="Hackathon MVP" \
    -f description="P0 delivery for Build with Gemma — July 26, 2026" \
    -f due_on="2026-07-26T22:59:59Z" >/dev/null
fi

while IFS= read -r issue; do
  title="$(jq -r '.title' <<<"$issue")"
  if gh issue list --repo "$repository" --state all --limit 100 \
    --json title --jq '.[].title' | rg -Fxq "$title"; then
    continue
  fi
  body="$(jq -r '.body' <<<"$issue")"
  labels="$(jq -r '.labels | join(",")' <<<"$issue")"
  gh issue create --repo "$repository" --title "$title" --body "$body" \
    --label "$labels" --milestone "Hackathon MVP" >/dev/null
done < <(jq -c '.[]' "$script_dir/github-issues.json")

project_number="$(
  gh project list --owner "$owner" --format json \
    --jq ".projects[] | select(.title == \"$project_title\") | .number" |
    head -n 1
)"
if [[ -z "$project_number" ]]; then
  project_number="$(
    gh project create --owner "$owner" --title "$project_title" \
      --format json --jq '.number'
  )"
  gh project field-create "$project_number" --owner "$owner" \
    --name "Workflow" --data-type "SINGLE_SELECT" \
    --single-select-options "Backlog,Ready,In Progress,In Review,Demo QA,Done" >/dev/null
fi
gh project link "$project_number" --owner "$owner" --repo "$repo_name"

gh issue list --repo "$repository" --state open --limit 100 --json url --jq '.[].url' |
  while IFS= read -r issue_url; do
    gh project item-add "$project_number" --owner "$owner" --url "$issue_url" >/dev/null
  done

gh api --method PUT "repos/${repository}/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  --input "$script_dir/main-protection.json" >/dev/null

echo "Configured https://github.com/${repository}"
echo "Project ${project_number}: ${project_title}"

